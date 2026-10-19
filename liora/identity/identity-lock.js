// LIORA IDENTITY LOCK · lógica común (navegador y Node 22). Sin imágenes: solo huellas y estados.
// La fotografía maestra es privada y vive en el iPhone; aquí solo se guarda su SHA-256 una vez sellada.

export const REF = Object.freeze({ AUSENTE: 'REFERENCIA_AUSENTE', VERIFICADA: 'REFERENCIA_VERIFICADA', SUSTITUCION: 'SUSTITUCION_BLOQUEADA', PENDIENTE_SELLO: 'PENDIENTE_DE_SELLAR' });
export const RENDER = Object.freeze({ PENDIENTE: 'RENDER_PENDIENTE', APROBADO: 'RENDER_APROBADO', RECHAZADO: 'RENDER_RECHAZADO' });
// Umbrales del descriptor facial (los mismos que el control de calidad del Studio).
export const STRONG = 0.45, DOUBTFUL = 0.55;
// Control fotograma a fotograma: no basta con que el primer fotograma se parezca.
export const FRAME = Object.freeze({ coverage: 0.8, maxRun: 2, span: 0.9, hardMargin: 0.1 });

export async function sha256Hex(data) {
  const buf = data instanceof ArrayBuffer ? data : (data.arrayBuffer ? await data.arrayBuffer() : data);
  const d = await globalThis.crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// JSON canónico (claves ordenadas) de la parte que no puede cambiar sin un nuevo sello.
export function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  return JSON.stringify(value ?? null);
}

export async function lockDigest(lock) {
  return sha256Hex(new TextEncoder().encode(canonical({ identity_id: lock.identity_id, master: lock.master })).buffer);
}

// Comprueba estructura e integridad del manifiesto. Devuelve lista de problemas (vacía = íntegro).
export async function validateLock(lock) {
  const p = [];
  if (lock?.format !== 'liora-identity-lock-v1') p.push('formato desconocido');
  if (!/^LIORA-VALE-\d{4}$/.test(lock?.identity_id || '')) p.push('identificador permanente inválido');
  if (lock?.master) {
    if (!/^[0-9a-f]{64}$/.test(lock.master.sha256 || '')) p.push('SHA-256 del maestro inválido');
    if (!lock.master.provenance?.source) p.push('falta la procedencia del maestro');
    if (lock.lock_sha256 !== await lockDigest(lock)) p.push('lock_sha256 no coincide: el maestro o el identificador se han modificado sin un sello nuevo');
    const hist = lock.history || [];
    if (!hist.length) p.push('falta el historial de versiones');
    hist.forEach((e, i) => { if (e.version !== i + 1) p.push(`historial: versión ${i + 1} fuera de orden`); });
    if (hist.length && hist.at(-1).lock_sha256 !== lock.lock_sha256) p.push('historial: la última versión no corresponde al candado actual');
    if (lock.master.passport_sha256 != null && !/^[0-9a-f]{64}$/.test(lock.master.passport_sha256)) p.push('huella del pasaporte inválida');
  } else if (lock?.status !== REF.AUSENTE) p.push('sin maestro el estado solo puede ser REFERENCIA_AUSENTE');
  for (const d of lock?.derivatives || []) {
    if (!Object.values(RENDER).includes(d.state)) p.push(`derivado ${d.sha256?.slice(0, 12)}: estado inválido`);
    if (lock.master && d.master_sha256 !== lock.master.sha256) p.push(`derivado ${d.sha256?.slice(0, 12)}: procede de otra referencia`);
  }
  return p;
}

// Estado de la referencia en este dispositivo comparando el maestro local con el sellado.
export function referenceState(lock, localSha) {
  if (!lock?.master) return localSha ? { state: REF.PENDIENTE_SELLO, reason: 'Hay foto oficial local, pero el candado aún no tiene su huella sellada.' }
    : { state: REF.AUSENTE, reason: 'No hay fotografía maestra sellada ni local.' };
  if (!localSha) return { state: REF.AUSENTE, reason: 'La identidad está sellada, pero este dispositivo no tiene el archivo maestro.' };
  if (localSha === lock.master.sha256) return { state: REF.VERIFICADA, reason: 'El archivo local coincide con la huella sellada.' };
  return { state: REF.SUSTITUCION, reason: 'El archivo local NO es el maestro sellado: sustitución bloqueada.' };
}

// Una foto solo puede convertirse en oficial si no hay sello o si es exactamente el archivo sellado.
export function canBecomeOfficial(lock, sha) {
  return !lock?.master || lock.master.sha256 === sha;
}

// series: [[t, distancia | null], …] con TODOS los fotogramas muestreados (null = sin rostro de Liora).
export function frameContinuity(series, { duration = null, tolerance = 0 } = {}) {
  if (!series?.length) return { ok: false, problems: ['Sin fotogramas medidos.'] };
  const lim = DOUBTFUL + tolerance, problems = [];
  const measured = series.filter(([, d]) => typeof d === 'number');
  const coverage = measured.length / series.length;
  if (coverage < FRAME.coverage) problems.push(`Rostro de Liora solo en el ${Math.round(coverage * 100)} % de los fotogramas (mínimo ${FRAME.coverage * 100} %).`);
  const span = series.at(-1)[0] - series[0][0];
  if (duration && span < FRAME.span * duration - 0.5) problems.push(`La medición cubre ${span.toFixed(1)} s de ${duration.toFixed(1)} s: hay que medir toda la escena.`);
  let run = 0, worstRun = 0, worstAt = null, max = 0, maxAt = null;
  for (const [t, d] of series) {
    if (typeof d !== 'number') continue;
    if (d > max) { max = d; maxAt = t; }
    if (d > lim) { run++; if (run > worstRun) { worstRun = run; worstAt = t; } } else run = 0;
  }
  if (worstRun >= FRAME.maxRun) problems.push(`${worstRun} fotogramas seguidos con otro rostro (hasta ${worstAt} s).`);
  if (max > lim + FRAME.hardMargin) problems.push(`Fotograma con rostro claramente distinto en ${maxAt} s (distancia ${max.toFixed(3)}).`);
  return { ok: !problems.length, problems, coverage: +coverage.toFixed(3), worstRun, max: +max.toFixed(3), sampled: series.length };
}

// Clasifica un render derivado: nunca se aprueba sin referencia verificada, control de todos los fotogramas y revisión humana.
export function renderVerdict(lock, { master_sha256, identity_distance, human_approved, frames }) {
  if (!lock?.master) return { state: RENDER.PENDIENTE, reason: 'Referencia ausente: ningún render puede aprobarse.' };
  if (master_sha256 !== lock.master.sha256) return { state: RENDER.RECHAZADO, reason: 'Generado desde otra referencia.' };
  if (typeof identity_distance !== 'number' || !(identity_distance >= 0)) return { state: RENDER.PENDIENTE, reason: 'Falta la medición facial.' };
  if (identity_distance > DOUBTFUL) return { state: RENDER.RECHAZADO, reason: `Rostro distinto (distancia ${identity_distance.toFixed(3)}).` };
  if (!frames) return { state: RENDER.PENDIENTE, reason: 'Falta el control fotograma a fotograma.' };
  if (!frames.ok) return { state: RENDER.RECHAZADO, reason: frames.problems.join(' ') };
  if (!human_approved) return { state: RENDER.PENDIENTE, reason: 'Falta la revisión visual humana.' };
  return { state: RENDER.APROBADO, reason: identity_distance <= STRONG ? 'Misma identidad.' : 'Identidad dudosa aprobada con revisión humana.' };
}

// Sello de una sola vez generado en el iPhone desde el maestro privado (no incluye la imagen).
export async function buildSeal(blob, { width, height, source }) {
  return { format: 'liora-identity-seal-v1', identity_id: 'LIORA-VALE-0001', sha256: await sha256Hex(blob), bytes: blob.size, mime: blob.type || null,
    width, height, source, sealed_at: new Date().toISOString() };
}

// Aplica un sello a un candado vacío (lo usa el mantenedor al recibir el sello; rechaza sustituciones).
export async function applySeal(lock, seal) {
  if (seal?.format !== 'liora-identity-seal-v1' || seal.identity_id !== lock.identity_id) throw new Error('Sello no válido para esta identidad');
  if (lock.master && lock.master.sha256 !== seal.sha256) throw new Error('La identidad ya está sellada con otro archivo: sustitución bloqueada');
  const next = { ...lock, status: REF.VERIFICADA,
    master: { sha256: seal.sha256, bytes: seal.bytes, mime: seal.mime, width: seal.width, height: seal.height, sealed_at: seal.sealed_at,
      provenance: { source: seal.source, method: 'Liora Studio · Sellar identidad oficial (archivo privado, no publicado)' } } };
  return withVersion(next, 'SELLO_MAESTRO');
}

async function withVersion(next, event, extra = {}) {
  next.lock_sha256 = await lockDigest(next);
  next.history = [...(next.history || []), { version: (next.history?.length || 0) + 1, event, at: new Date().toISOString(), lock_sha256: next.lock_sha256, ...extra }];
  return next;
}

// Vincula el pasaporte biométrico (privado) al maestro: el candado solo guarda su huella.
export async function attachPassport(lock, passport, passportSha) {
  if (!lock?.master) throw new Error('Primero hay que sellar el maestro');
  if (passport?.format !== 'liora-identity-passport-v1' || passport.master_sha256 !== lock.master.sha256) throw new Error('El pasaporte no se ha obtenido del maestro sellado');
  if (!/^[0-9a-f]{64}$/.test(passportSha || '')) throw new Error('Huella del pasaporte inválida');
  const event = lock.master.passport_sha256 ? 'PASAPORTE_REVISADO' : 'PASAPORTE';
  return withVersion({ ...lock, master: { ...lock.master, passport_sha256: passportSha } }, event);
}

// Registra un derivado autorizado (escena aprobada). Rechaza derivados de otra referencia o sin aprobar.
export function registerDerivative(lock, d) {
  if (!lock?.master || d.master_sha256 !== lock.master.sha256) throw new Error('Derivado de otra referencia: no se registra');
  if (d.state !== RENDER.APROBADO) throw new Error('Solo se registran como autorizados los renders aprobados');
  if (!/^[0-9a-f]{64}$/.test(d.sha256 || '')) throw new Error('Huella del derivado inválida');
  if ((lock.derivatives || []).some(x => x.sha256 === d.sha256)) return lock;
  return { ...lock, derivatives: [...(lock.derivatives || []), d] };
}
