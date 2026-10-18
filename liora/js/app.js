// Liora Studio · controlador de la interfaz.
import * as db from './db.js';
import * as P from './pipeline.js';
import * as face from './face.js';
import { analyzeClip } from './qc.js';
import * as media from './media.js';
import * as be from './backend.js';
import * as C from './content.js';
import { buildEclipseInstrumental, ECLIPSE_TITLE } from './music-original.js';

const $ = id => document.getElementById(id);
const S = P.STATUS;

// Construcción segura del DOM: el texto del usuario nunca se interpreta como HTML.
function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'checked' || k === 'disabled' || k === 'value') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) el.append(k instanceof Node ? k : String(k));
  return el;
}

let toastTimer;
function toast(msg, ms = 3500) {
  const t = $('toast'); t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.add('hidden'), ms);
}

const fmtUsd = n => (n == null ? '—' : n.toFixed(2) + ' USD');
const verdictLabel = { pass: 'OK', review: 'REVISAR', fail: 'FALLA', unavailable: 'N/D' };
const pill = (v, txt) => h('span', { class: 'pill v-' + v }, txt || verdictLabel[v] || v);
const statusPill = st => h('span', { class: 'pill st-' + st }, st);
const urls = new Map();
function blobUrl(key, blob) { if (urls.has(key)) URL.revokeObjectURL(urls.get(key)); const u = URL.createObjectURL(blob); urls.set(key, u); return u; }

/* ------------------------------------------------------------------ estado */
const state = { refs: [], project: null, projects: [], cfg: null, verify: null, faceStatus: 'bajo demanda', polling: new Set() };

async function saveProject() { await db.put('projects', state.project.id, state.project); }

/* ------------------------------------------------------------------ navegación */
document.querySelectorAll('nav button').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('nav button').forEach(z => z.classList.toggle('on', z === b));
  document.querySelectorAll('.tab').forEach(z => z.classList.toggle('hidden', z.id !== b.dataset.t));
  try { localStorage.setItem('liora_tab', b.dataset.t); } catch { /* */ }
  if (state.project) ({ montaje: renderMontage, audio: renderAudio, motores: renderModels, produccion: renderProject })[b.dataset.t]?.();
  window.scrollTo({ top: 0 });
}));

function renderStatusLine() {
  const usable = usableRefs();
  const official = state.refs.find(r => r.official);
  const items = [
    official ? (official.descriptor ? pill('pass', 'Identidad fijada') : pill('review', 'Oficial sin analizar')) : pill('fail', 'Sin foto oficial'),
    pill(usable.length > 1 ? 'pass' : 'info', usable.length + ' referencias válidas'),
    pill(be.hasAccessKey() && state.cfg ? 'pass' : 'info', state.cfg ? (state.cfg.allowPaid ? 'Backend: gasto AUTORIZADO' : 'Backend: sin gasto') : 'Backend sin conectar'),
    pill(face.engineReady() ? 'pass' : 'info', 'Motor facial: ' + (face.engineReady() ? 'listo' : state.faceStatus))
  ];
  $('statusline').replaceChildren(...items);
}

/* ------------------------------------------------------------------ 1 · identidad */
const ANGLE_LABEL = { oficial: 'Fotografía oficial', frontal: 'Frontal', 'tres-cuartos-izq': '3/4 izquierda', 'tres-cuartos-der': '3/4 derecha', 'perfil-izq': 'Perfil izq.', 'perfil-der': 'Perfil der.', sonrisa: 'Sonrisa', cantando: 'Cantando', manos: 'Manos / plano medio' };

function usableRefs() { return state.refs.filter(r => r.descriptor && (r.official || r.accepted)); }
function refDescriptors() { return usableRefs().map(r => r.descriptor); }

async function loadRefs() { state.refs = (await db.all('refs')).sort((a, b) => (b.official - a.official) || a.addedAt.localeCompare(b.addedAt)); }

async function analyzeRef(ref) {
  const img = await face.blobToImage(ref.blob);
  const res = await face.analyzeFace(face.drawToCanvas(img, 1280), { inputSize: 512 });
  ref.analyzedAt = new Date().toISOString();
  if (!res) { ref.descriptor = null; ref.faceNote = 'No se detecta un rostro claro.'; return ref; }
  ref.descriptor = res.descriptor; ref.faceScore = +res.score.toFixed(3); ref.faceCount = res.faces;
  ref.faceNote = res.faces > 1 ? 'Hay ' + res.faces + ' caras: se usa la más grande.' : '';
  return ref;
}

function evaluateAngle(ref) {
  const official = state.refs.find(r => r.official && r.descriptor);
  if (ref.official) { ref.accepted = !!ref.descriptor; return; }
  if (!official || !ref.descriptor) { ref.accepted = false; ref.distanceToOfficial = null; return; }
  const d = face.distance(ref.descriptor, official.descriptor);
  ref.distanceToOfficial = +d.toFixed(3);
  // Los perfiles puros dan distancias mayores; se exige igualmente ≤ 0.55 para no contaminar la identidad.
  ref.accepted = d <= P.IDENTITY.doubtful;
}

async function ensureEngine() {
  if (face.engineReady()) return true;
  try {
    await face.loadFaceEngine(s => { state.faceStatus = s; renderStatusLine(); toast(s); });
    renderStatusLine();
    return true;
  } catch (e) {
    state.faceStatus = 'error: ' + e.message; renderStatusLine();
    toast('No se pudo cargar el motor facial: ' + e.message, 6000);
    return false;
  }
}

async function addRef(file, angle) {
  if (!file) return;
  const isOfficial = angle === 'oficial';
  const current = state.refs.find(r => r.official);
  const lock = await db.get('kv', 'identity_lock');
  if (isOfficial && current && lock) {
    const ok = prompt('La identidad oficial está bloqueada. Escribe CAMBIAR IDENTIDAD para sustituir la fotografía oficial (todas las escenas se tendrán que revalidar):');
    if (ok !== 'CAMBIAR IDENTIDAD') { toast('Fotografía oficial conservada.'); return; }
  }
  const ref = { id: db.uid('ref'), kind: isOfficial ? 'master' : 'angle', angle, blob: file, name: file.name, addedAt: new Date().toISOString(), official: isOfficial, descriptor: null };
  if (await ensureEngine()) { toast('Analizando rostro…'); await analyzeRef(ref); }
  if (isOfficial) {
    if (!ref.descriptor && !confirm('No se detecta un rostro claro en esta imagen. ¿Guardarla igualmente como oficial? (no se podrá comparar)')) return;
    if (current) { current.official = false; current.kind = 'angle'; current.angle = 'frontal'; current.replacedAt = new Date().toISOString(); await db.put('refs', current.id, current); }
    await db.put('kv', 'identity_lock', true);
  }
  await db.put('refs', ref.id, ref);
  await loadRefs();
  for (const r of state.refs) { evaluateAngle(r); await db.put('refs', r.id, r); }
  renderIdentity();
  const saved = state.refs.find(r => r.id === ref.id);
  toast(saved.official ? 'Fotografía oficial fijada y bloqueada.' : saved.accepted ? 'Referencia aceptada: es la misma persona.' : 'Referencia RECHAZADA: no coincide con la fotografía oficial.', 5000);
}

function renderIdentity() {
  const official = state.refs.find(r => r.official);
  const usable = usableRefs();
  const sum = $('identitySummary');
  if (!official) sum.replaceChildren('Falta la fotografía oficial. Súbela con el tipo «Fotografía oficial». Es el primer paso obligatorio.');
  else sum.replaceChildren(
    h('b', {}, official.descriptor ? 'Identidad oficial fijada y bloqueada. ' : 'Fotografía oficial guardada sin rostro analizado. '),
    `${usable.length} referencias válidas para comparar. `,
    usable.length < 3 ? 'Recomendado: añade 3/4 izquierda, 3/4 derecha y «cantando» generadas a partir de la oficial y aceptadas por el comparador.' : 'Biblioteca suficiente para el control de identidad.'
  );
  $('refGrid').replaceChildren(...state.refs.map(r => {
    const verdict = r.official ? (r.descriptor ? pill('pass', 'OFICIAL') : pill('review', 'OFICIAL · sin rostro')) :
      !r.descriptor ? pill('fail', 'Sin rostro') : r.accepted ? pill('pass', 'Aceptada') : pill('fail', 'Rechazada');
    return h('div', { class: 'ref' + (r.official ? ' official' : '') },
      h('img', { src: blobUrl('ref' + r.id, r.blob), alt: ANGLE_LABEL[r.angle] || r.angle }),
      h('b', {}, ANGLE_LABEL[r.angle] || r.angle), verdict,
      r.distanceToOfficial != null ? h('div', { class: 'sub' }, 'Distancia a oficial: ' + r.distanceToOfficial) : null,
      r.faceNote ? h('div', { class: 'sub' }, r.faceNote) : null,
      r.official ? null : h('button', { class: 'alt', style: 'margin-top:6px;padding:6px 10px;min-height:34px;font-size:12px', onclick: async () => {
        if (!confirm('¿Eliminar esta referencia?')) return;
        await db.del('refs', r.id); await loadRefs(); renderIdentity();
      } }, 'Eliminar'),
      r.official && !r.descriptor ? h('button', { class: 'alt', style: 'margin-top:6px;font-size:12px', onclick: async () => {
        if (!(await ensureEngine())) return;
        await analyzeRef(r); await db.put('refs', r.id, r); await loadRefs();
        for (const x of state.refs) { evaluateAngle(x); await db.put('refs', x.id, x); }
        renderIdentity();
      } }, 'Analizar rostro') : null
    );
  }));
  renderStatusLine();
}

$('refFile').addEventListener('change', async e => { const f = e.target.files[0]; e.target.value = ''; try { await addRef(f, $('refAngle').value); } catch (err) { toast('Error: ' + err.message, 6000); } });

$('compareFile').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f) return;
  const out = $('compareResult');
  if (!refDescriptors().length) { out.replaceChildren(h('p', { class: 'warn' }, 'Primero fija la fotografía oficial con rostro detectado.')); return; }
  if (!(await ensureEngine())) return;
  out.replaceChildren(h('p', { class: 'sub' }, 'Comparando…'));
  const img = await face.blobToImage(f);
  const res = await face.analyzeFace(face.drawToCanvas(img, 1280), { inputSize: 512 });
  if (!res) { out.replaceChildren(h('p', { class: 'bad' }, 'No se detecta ningún rostro.')); return; }
  const d = face.identityDistance(res.descriptor, refDescriptors());
  const v = d <= P.IDENTITY.strong ? 'pass' : d <= P.IDENTITY.doubtful ? 'review' : 'fail';
  out.replaceChildren(h('p', {}, pill(v, v === 'pass' ? 'MISMA PERSONA' : v === 'review' ? 'DUDOSO' : 'PERSONA DISTINTA'), ` Distancia ${d.toFixed(3)} (≤0,45 misma · 0,45–0,55 dudoso · >0,55 distinta)`));
});

async function loadIdentityText() {
  const t = await db.get('kv', 'identity_text');
  const legacy = (await db.get('kv', 'legacy_snapshot'))?.rules;
  $('identityText').value = t?.identity || 'a woman in her mid-twenties with dark brown wavy shoulder-length hair, hazel-green eyes, light natural freckles across the nose and cheeks, natural full lips, real human skin texture with visible pores' + (legacy?.rules ? '. ' + legacy.rules : '');
  $('settingText').value = t?.setting || 'a softly lit home makeup vanity with a round mirror light, warm white key light from the front, cream-colored wall, makeup brushes in a glass holder on the left, she wears a black satin robe';
}
$('saveIdentityText').onclick = async () => { await db.put('kv', 'identity_text', { identity: $('identityText').value.trim(), setting: $('settingText').value.trim() }); toast('Rasgos guardados.'); };

$('exportIdentity').onclick = async () => {
  const pack = { format: 'liora-identity-v1', exportedAt: new Date().toISOString(), text: await db.get('kv', 'identity_text'), refs: [] };
  for (const r of state.refs) pack.refs.push({ ...r, blob: await media.blobToDataUrl(r.blob) });
  await media.shareOrDownload(new Blob([JSON.stringify(pack)], { type: 'application/json' }), 'liora-identidad-' + new Date().toISOString().slice(0, 10) + '.json');
};
$('importIdentity').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f) return;
  try {
    const pack = JSON.parse(await f.text());
    if (pack.format !== 'liora-identity-v1') throw new Error('Archivo no reconocido');
    if (state.refs.some(r => r.official) && !confirm('Ya hay una identidad oficial. ¿Sustituir todas las referencias por las del paquete?')) return;
    for (const r of state.refs) await db.del('refs', r.id);
    for (const r of pack.refs) { const blob = await (await fetch(r.blob)).blob(); await db.put('refs', r.id, { ...r, blob }); }
    if (pack.text) await db.put('kv', 'identity_text', pack.text);
    await db.put('kv', 'identity_lock', true);
    await loadRefs(); await loadIdentityText(); renderIdentity(); toast('Identidad importada.');
  } catch (err) { toast('Importación fallida: ' + err.message, 6000); }
});

/* ------------------------------------------------------------------ 2 · producción */
let selectedScene = 0;

// Base musical interna: se guarda automáticamente en el almacenamiento local del iPhone.
// No necesita subir archivos, descargar MP3 ni conectar un proveedor de pago.
async function ensureOriginalMusic(project) {
  if (!/eclipse/i.test(project.title || '') || project.audio?.blobKey) return;
  try {
    const blob = await buildEclipseInstrumental();
    const key = db.uid('song');
    await db.put('blobs', key, blob);
    project.audio = {
      blobKey: key, name: ECLIPSE_TITLE + '.wav', duration: 28, offset: 0,
      license: { type: 'original', holder: 'Liora Studio · composición instrumental generada en la app',
        ok: true, at: new Date().toISOString() },
      lyrics: ''
    };
    await db.put('projects', project.id, project);
    toast('Instrumental original vinculada automáticamente al proyecto.', 5500);
  } catch (e) {
    toast('No se pudo preparar la música automática: ' + e.message, 6500);
  }
}

async function loadProjects() {
  state.projects = (await db.all('projects')).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (!state.projects.length) {
    const legacy = (await db.get('kv', 'legacy_snapshot'))?.project;
    const p = P.newProject({
      title: legacy?.title || 'La Reina del Eclipse',
      character: 'reina de fantasía oscura',
      concept: legacy?.concept || 'Liora canta una melodía ORIGINAL mientras se transforma paso a paso en una reina de fantasía oscura: ojos ahumados azul noche y detalles plateados.'
    });
    p.id = db.uid('proj');
    await db.put('projects', p.id, p);
    state.projects = [p];
  }
  const last = await db.get('kv', 'current_project');
  state.project = state.projects.find(p => p.id === last) || state.projects[0];
  await ensureOriginalMusic(state.project);
}

function renderProject() {
  const p = state.project;
  $('projectSelect').replaceChildren(...state.projects.map(x => h('option', { value: x.id, selected: x.id === p.id }, x.title)));
  $('pTitle').value = p.title; $('pCharacter').value = p.character || ''; $('pConcept').value = p.concept;
  const s = P.summarizeProject(p);
  $('projectSummary').replaceChildren(`Duración prevista ${s.totalSeconds} s · ` + Object.entries(s.counts).filter(([, n]) => n).map(([k, n]) => `${k}: ${n}`).join(' · '));
  renderSceneList(); renderSceneDetail();
}

$('projectSelect').onchange = async () => { state.project = state.projects.find(p => p.id === $('projectSelect').value); await db.put('kv', 'current_project', state.project.id); await ensureOriginalMusic(state.project); selectedScene = 0; renderAll(); };
$('newProject').onclick = async () => {
  const title = prompt('Título del nuevo proyecto:'); if (!title) return;
  const p = P.newProject({ title, character: '', concept: '' }); p.id = db.uid('proj');
  await db.put('projects', p.id, p); state.projects.unshift(p); state.project = p; await db.put('kv', 'current_project', p.id); await ensureOriginalMusic(p); selectedScene = 0; renderAll();
};
$('saveProjectBtn').onclick = async () => {
  Object.assign(state.project, { title: $('pTitle').value.trim(), character: $('pCharacter').value.trim(), concept: $('pConcept').value.trim() });
  await saveProject(); renderProject(); toast('Proyecto guardado en este iPhone.');
};

function renderSceneList() {
  $('sceneList').replaceChildren(...state.project.scenes.map((sc, i) => h('button', { class: 'scene' + (i === selectedScene ? ' sel' : ''), onclick: () => { selectedScene = i; renderSceneList(); renderSceneDetail(); $('sceneDetail').scrollIntoView({ behavior: 'smooth' }); } },
    h('span', {}, `${i + 1}. ${sc.name}`, h('small', {}, `${sc.seconds} s · intentos: ${sc.attempts.length}` + (sc.auto ? ' · QC ' + verdictLabel[sc.auto.verdict] : ''))),
    statusPill(sc.status))));
}

function identityText() { return $('identityText').value.trim(); }
function settingText() { return $('settingText').value.trim(); }

function scenePrompt(i) {
  const p = state.project, sc = p.scenes[i];
  return sc.prompt || P.buildPrompt({ identityText: identityText(), setting: settingText(), scene: sc, previous: p.scenes.slice(0, i), singing: true });
}

function modelsFor(sc) { return (state.cfg?.models || []); }

function renderAutoReport(a) {
  if (!a) return h('p', { class: 'sub' }, 'Control automático aún no ejecutado.');
  const row = (name, x) => x ? h('tr', {}, h('td', {}, name), h('td', {}, pill(x.verdict)), h('td', {}, x.reason || (x.issues || []).join(', ') || (x.defects?.length ? x.defects.map(d => `${d.t}s ${d.type}`).slice(0, 8).join(', ') : 'Sin defectos'))) : null;
  return h('div', {},
    h('p', {}, 'Veredicto automático: ', pill(a.verdict), ` · ${a.width}×${a.height} · ${a.duration?.toFixed(1)} s · ${a.sampled} fotogramas`),
    h('div', { class: 'scroll-x' }, h('table', {}, h('tbody', {},
      row('Identidad', a.identity), row('Continuidad', a.continuity), row('Fotogramas', a.frames),
      row('Maquillaje', a.makeup), row('Labios ↔ voz', a.lips), row('Formato', a.format)))),
    a.identity?.series?.length ? h('p', { class: 'sub' }, 'Distancia por segundo: ' + a.identity.series.map(([t, d]) => `${t.toFixed(1)}s ${d}`).join(' · ')) : null,
    h('p', { class: 'sub' }, 'Manos y herramientas no se evalúan automáticamente de forma fiable: revisión humana obligatoria.'));
}

async function sceneClipBlob(sc) { return sc.currentClip ? await db.get('blobs', sc.currentClip.blobKey) : null; }

async function renderSceneDetail() {
  const p = state.project, i = selectedScene, sc = p.scenes[i];
  const box = $('sceneDetail');
  const gen = P.canGenerate(p, i);
  const models = modelsFor(sc);
  const clip = await sceneClipBlob(sc);
  const prevName = i > 0 ? p.scenes[i - 1].name : null;
  const frames = sc.frames || {};
  const firstB = frames.first ? await db.get('blobs', frames.first) : null;
  const lastB = frames.last ? await db.get('blobs', frames.last) : null;

  const promptArea = h('textarea', { style: 'min-height:160px' }); promptArea.value = scenePrompt(i);
  const modelSel = h('select', {}, models.length ? models.map(m => h('option', { value: m.id }, `${m.label} · ${fmtUsd(P.estimateCost(m, sc.seconds, false))}`)) : h('option', { value: '' }, 'Conecta el backend en «Motores»'));
  if (sc.lastModel) modelSel.value = sc.lastModel;
  const audioChk = h('input', { type: 'checkbox' });
  const sourceSel = h('select', {}, ['Generado en la web/app del proveedor', 'Grabación real autorizada', 'Otro'].map(x => h('option', {}, x)));
  const uploader = h('input', { type: 'file', accept: 'video/*' });
  uploader.addEventListener('change', async e => { const f = e.target.files[0]; e.target.value = ''; if (f) await attachClip(i, f, { source: 'manual: ' + sourceSel.value, name: f.name }); });

  const checks = P.MANUAL_CHECKS.map(c => {
    const cb = h('input', { type: 'checkbox', checked: !!sc.manual[c.key], onchange: async () => { sc.manual[c.key] = cb.checked; await saveProject(); } });
    return h('label', { class: 'check' }, cb, c.label);
  });
  const stage = P.STAGES[i];
  const reviewer = h('input', { placeholder: 'Nombre o iniciales', value: sc.reviewer || '' });
  const note = h('textarea', { placeholder: 'Segundo, defecto observado, motivo de aprobación o rechazo…' }); note.value = sc.reviewNote || '';
  reviewer.onchange = async () => { sc.reviewer = reviewer.value; await saveProject(); };
  note.onchange = async () => { sc.reviewNote = note.value; await saveProject(); };
  const qcLog = h('div', { class: 'sub' });

  box.replaceChildren(
    h('h2', {}, `${i + 1}. ${sc.name} `, statusPill(sc.status)),
    h('p', { class: 'sub' }, `Duración objetivo ${sc.seconds} s · herramientas: ${sc.tool}` + (sc.audioRange ? ` · canción ${sc.audioRange[0]}–${sc.audioRange[1]} s` : '')),
    sc.lastError ? h('p', { class: 'note bad' }, 'Último error: ' + sc.lastError) : null,
    sc.job && sc.status === S.GENERANDO ? h('p', { class: 'note' }, `Generando con ${sc.job.model} · trabajo ${sc.job.id} · coste estimado ${fmtUsd(sc.job.estimate?.usd)} · ${sc.job.lastStatus || 'en cola'}`) : null,

    h('h3', {}, 'Punto de partida'),
    i === 0 ? h('p', { class: 'sub' }, 'La fotografía oficial de Liora.') : h('p', { class: 'sub' }, `Último fotograma aprobado de «${prevName}».`),
    !gen.ok ? h('p', { class: 'note warn' }, gen.reason) : null,

    h('h3', {}, 'Generar con un proveedor'),
    h('label', {}, 'Prompt (editable)', promptArea),
    h('div', { class: 'row' },
      h('button', { class: 'alt', onclick: async () => { sc.prompt = promptArea.value; await saveProject(); toast('Prompt guardado.'); } }, 'Guardar prompt'),
      h('button', { class: 'alt', onclick: async () => { sc.prompt = null; await saveProject(); renderSceneDetail(); } }, 'Restaurar automático')),
    h('label', {}, 'Modelo', modelSel),
    h('label', { class: 'check' }, audioChk, 'Audio nativo del modelo (más caro; si se usa la canción del proyecto, déjalo desactivado)'),
    h('button', { disabled: !gen.ok || !models.length || sc.status === S.GENERANDO, onclick: () => generateScene(i, modelSel.value, promptArea.value, audioChk.checked) }, sc.attempts.length ? 'Regenerar escena' : 'Generar escena'),
    !state.cfg ? h('p', { class: 'sub' }, 'Sin backend conectado no se envía nada a ningún proveedor.') : null,

    h('h3', {}, 'O subir un clip generado fuera de la app'),
    h('label', {}, 'Origen', sourceSel), uploader,

    clip ? h('div', {},
      h('h3', {}, 'Clip actual · ' + (sc.currentClip.source || '')),
      h('video', { src: blobUrl('clip' + i, clip), controls: true, playsinline: true }),
      firstB && lastB ? h('div', { class: 'thumbs', style: 'margin-top:8px' }, h('img', { src: blobUrl('f1' + i, firstB), alt: 'Primer fotograma' }), h('img', { src: blobUrl('fl' + i, lastB), alt: 'Último fotograma' })) : null,
      h('div', { class: 'row', style: 'margin-top:8px' },
        h('button', { class: 'alt', onclick: () => runQc(i, qcLog) }, sc.auto ? 'Repetir control automático' : 'Ejecutar control automático'),
        h('button', { class: 'alt', onclick: () => media.shareOrDownload(clip, `liora-${p.title}-${i + 1}-${sc.key}.${media.extOf(clip)}`) }, 'Guardar clip')),
      qcLog
    ) : null,
    h('h3', {}, 'Control automático'),
    renderAutoReport(sc.auto),

    h('h3', {}, 'Revisión humana obligatoria'),
    h('p', { class: 'sub' }, 'Específico de esta etapa: ' + stage.checks.join(' · ')),
    ...checks,
    h('label', {}, 'Revisado por', reviewer),
    h('label', {}, 'Notas de revisión', note),
    h('div', { class: 'row' },
      h('button', { disabled: sc.status !== S.REVISION, onclick: () => approveScene(i) }, 'Aprobar'),
      h('button', { class: 'danger', disabled: sc.status !== S.REVISION, onclick: () => rejectScene(i) }, 'Rechazar'),
      [S.APROBADO, S.EXPORTADO].includes(sc.status) ? h('button', { class: 'alt', onclick: () => reopenScene(i) }, 'Reabrir revisión') : null),
    h('div', { id: 'gateMsg' }),

    sc.attempts.length ? h('div', {}, h('h3', {}, 'Historial de intentos'), h('div', { class: 'scroll-x' }, h('table', {},
      h('thead', {}, h('tr', {}, h('th', {}, '#'), h('th', {}, 'Origen'), h('th', {}, 'Fecha'), h('th', {}, 'QC'), h('th', {}, 'Resultado'))),
      h('tbody', {}, sc.attempts.map((a, n) => h('tr', {}, h('td', {}, n + 1), h('td', {}, a.source), h('td', {}, a.createdAt.slice(0, 16).replace('T', ' ')), h('td', {}, a.qc ? pill(a.qc) : '—'), h('td', {}, a.outcome || (a.blobKey === sc.currentClip?.blobKey ? 'actual' : '—')))))))) : null,
    h('details', {}, h('summary', { class: 'sub' }, 'Historial de estados'), h('div', { class: 'log' }, sc.history.map(x => `${x.at.slice(0, 19).replace('T', ' ')}  ${x.to}  ${x.note || ''}`).join('\n')))
  );
}

async function attachClip(i, blob, { source, name, jobId }) {
  const p = state.project, sc = p.scenes[i];
  if (sc.status === S.GENERANDO && !jobId) { toast('Esta escena tiene una generación en curso.'); return; }
  if ([S.APROBADO, S.EXPORTADO].includes(sc.status)) { toast('Reabre la revisión antes de sustituir un clip aprobado.'); return; }
  const key = db.uid('clip');
  await db.put('blobs', key, blob);
  sc.currentClip = { blobKey: key, source, name: name || '', jobId: jobId || null, createdAt: new Date().toISOString() };
  sc.attempts.push({ blobKey: key, source, createdAt: sc.currentClip.createdAt, jobId: jobId || null, qc: null, outcome: null });
  sc.auto = null; sc.manual = {}; sc.frames = null; sc.lastError = null;
  if (sc.status !== S.REVISION) P.transition(sc, S.REVISION, source);
  else sc.history.push({ at: new Date().toISOString(), to: S.REVISION, note: 'clip sustituido: ' + source });
  await saveProject();
  renderSceneList(); await renderSceneDetail();
  await runQc(i, null);
}

async function runQc(i, logEl) {
  const p = state.project, sc = p.scenes[i];
  const blob = await sceneClipBlob(sc); if (!blob) return;
  const log = m => { if (logEl) logEl.textContent = m; else toast(m, 1500); };
  try {
    const prev = i > 0 ? p.scenes[i - 1] : null;
    const { report, firstFrame, lastFrame } = await analyzeClip(blob, {
      refDescriptors: refDescriptors(), stageIndex: i, focus: P.STAGES[i].focus,
      prevLastDescriptor: prev?.auto?.lastDescriptor || null, onProgress: log
    });
    const fk = db.uid('frame'), lk = db.uid('frame');
    await db.put('blobs', fk, firstFrame); await db.put('blobs', lk, lastFrame);
    sc.frames = { first: fk, last: lk };
    sc.auto = report;
    const att = sc.attempts.find(a => a.blobKey === sc.currentClip.blobKey); if (att) att.qc = report.verdict;
    await saveProject();
    toast(report.identity?.verdict === 'fail' ? 'Identidad inconsistente: rechaza y regenera esta escena.' : 'Control automático: ' + verdictLabel[report.verdict], 5000);
  } catch (e) { toast('Error en el control: ' + e.message, 6000); }
  renderSceneList(); renderSceneDetail();
}

async function approveScene(i) {
  const sc = state.project.scenes[i];
  const gate = P.approvalGate(state.project, i);
  if (!gate.ok) { $('gateMsg').replaceChildren(h('div', { class: 'note bad' }, h('b', {}, 'No se puede aprobar:'), h('ul', {}, gate.problems.map(x => h('li', {}, x))))); return; }
  P.transition(sc, S.APROBADO, `revisado por ${sc.reviewer}`);
  const att = sc.attempts.find(a => a.blobKey === sc.currentClip.blobKey); if (att) att.outcome = 'aprobado';
  await saveProject(); renderProject(); renderMontage(); toast('Escena aprobada. Su último fotograma es el punto de partida de la siguiente.');
}

async function rejectScene(i) {
  const sc = state.project.scenes[i];
  const reason = prompt('Motivo del rechazo (se guarda en el historial):', sc.auto?.identity?.verdict === 'fail' ? 'Identidad inconsistente' : '');
  if (reason == null) return;
  P.transition(sc, S.RECHAZADO, reason);
  const att = sc.attempts.find(a => a.blobKey === sc.currentClip?.blobKey); if (att) att.outcome = 'rechazado: ' + reason;
  await saveProject(); renderProject();
}

async function reopenScene(i) {
  const p = state.project;
  const later = p.scenes.slice(i + 1).filter(s => [S.APROBADO, S.EXPORTADO].includes(s.status));
  if (!confirm(later.length ? `Las etapas posteriores aprobadas (${later.map(s => s.name).join(', ')}) parten de este clip. Si lo cambias deberás revalidarlas. ¿Reabrir?` : '¿Reabrir la revisión de esta escena?')) return;
  P.transition(p.scenes[i], S.REVISION, 'reabierta');
  await saveProject(); renderProject();
}

async function startImageFor(i) {
  if (i === 0) {
    const off = state.refs.find(r => r.official);
    if (!off) throw new Error('Falta la fotografía oficial.');
    return media.blobToDataUrl(await media.compressImage(off.blob, 1536));
  }
  const prev = state.project.scenes[i - 1];
  const b = prev.frames?.last && await db.get('blobs', prev.frames.last);
  if (!b) throw new Error('La etapa anterior no tiene último fotograma: ejecuta su control automático.');
  return media.blobToDataUrl(b);
}

async function stageAudio(i) {
  const p = state.project;
  if (!p.audio?.blobKey) return null;
  if (!p.audio.license?.ok) throw new Error('Confirma la licencia de la canción en «Canción y voz» antes de enviarla a un proveedor.');
  const blob = await db.get('blobs', p.audio.blobKey);
  const buf = await media.decodeAudio(blob);
  const [a, b] = p.scenes[i].audioRange || media.stageRanges(p.scenes, p.audio.offset || 0)[i];
  return { dataUrl: await media.blobToDataUrl(media.sliceToWav(buf, a, b)), seconds: b - a };
}

async function generateScene(i, modelId, promptText, generateAudio) {
  const p = state.project, sc = p.scenes[i];
  const model = state.cfg?.models.find(m => m.id === modelId);
  if (!model) return toast('Elige un modelo (conecta el backend).');
  if (!be.hasAccessKey()) return toast('Introduce la clave de acceso en «Motores».');
  if (i === 0 && !state.refs.find(r => r.official)) return toast('Primero fija la fotografía oficial.');
  try {
    sc.prompt = promptText;
    const inputs = { prompt: promptText, negativePrompt: P.NEGATIVE_PROMPT, seconds: sc.seconds, generateAudio };
    const needs = { startImage: /i2v|omnihuman/.test(model.id), refImages: /ref/.test(model.id), audio: /omnihuman|lipsync/.test(model.id), video: /lipsync/.test(model.id) };
    toast('Preparando entradas…');
    if (needs.startImage) inputs.startImage = await startImageFor(i);
    if (needs.refImages) {
      inputs.refImages = [];
      for (const r of usableRefs().slice(0, 4)) inputs.refImages.push(await media.blobToDataUrl(await media.compressImage(r.blob, 1024)));
      if (i > 0) inputs.refImages.unshift(await startImageFor(i));
    }
    if (needs.audio) {
      const a = await stageAudio(i);
      if (!a) throw new Error('Este modelo necesita la canción del proyecto (pestaña «Canción y voz»).');
      inputs.audio = a.dataUrl; inputs.audioSeconds = a.seconds;
    }
    if (needs.video) {
      const v = await sceneClipBlob(sc);
      if (!v) throw new Error('Lipsync necesita un clip visual ya generado en esta escena.');
      inputs.video = await media.blobToDataUrl(v);
    }
    const seconds = model.durationFromAudio ? Math.ceil(inputs.audioSeconds || sc.seconds) : (model.durations?.find(d => d >= sc.seconds) ?? model.durations?.at(-1) ?? sc.seconds);
    const est = P.estimateCost(model, seconds, generateAudio);
    if (!confirm(`Generar «${sc.name}» con ${model.label}.\nCoste estimado: ${fmtUsd(est)} (${seconds} s facturados).\nEl cargo real lo hace fal.ai sobre tu saldo prepago. ¿Autorizas este gasto?`)) return;
    let res;
    try { res = await be.submitJob(model.id, inputs, est); }
    catch (e) {
      if (e.status === 409 && e.data?.estimate && confirm(`El backend estima ${fmtUsd(e.data.estimate.usd)} (${e.data.estimate.source}). ¿Autorizas ese importe?`)) res = await be.submitJob(model.id, inputs, e.data.estimate.usd);
      else throw e;
    }
    sc.job = { id: res.job.id, model: model.id, estimate: res.job.estimate, submittedAt: new Date().toISOString() };
    sc.lastModel = model.id; sc.lastError = null;
    P.transition(sc, S.GENERANDO, `${model.id} · ${fmtUsd(res.job.estimate?.usd)}`);
    await saveProject(); renderProject();
    pollJob(i);
  } catch (e) {
    sc.lastError = e.message; await saveProject(); renderSceneDetail();
    toast('No se generó: ' + e.message, 7000);
  }
}

async function pollJob(i) {
  const p = state.project, sc = p.scenes[i];
  const key = p.id + ':' + i;
  if (!sc.job || state.polling.has(key) || !be.hasAccessKey()) return;
  state.polling.add(key);
  try {
    for (;;) {
      const st = await be.jobStatus(sc.job.id);
      sc.job.lastStatus = st.status + (st.queuePosition != null ? ' · posición ' + st.queuePosition : '');
      if (st.status === 'COMPLETED') {
        toast('Vídeo generado. Descargando…');
        const blob = await be.fetchResultVideo(st.videoUrl);
        const job = sc.job; sc.job = null;
        await attachClip(i, blob, { source: 'fal: ' + job.model, name: job.id + '.mp4', jobId: job.id });
        return;
      }
      if (st.status === 'FAILED' || st.status === 'UNKNOWN') {
        sc.lastError = st.error || 'El proveedor no devolvió vídeo.'; sc.job = null;
        P.transition(sc, S.PENDIENTE, 'fallo de generación: ' + sc.lastError);
        await saveProject(); renderProject(); return;
      }
      if (selectedScene === i) renderSceneDetail();
      await new Promise(r => setTimeout(r, 10000));
    }
  } catch (e) { toast('Consulta del trabajo interrumpida: ' + e.message + '. Se reanudará al reconectar.', 6000); }
  finally { state.polling.delete(key); }
}

function resumePolling() { state.project.scenes.forEach((sc, i) => { if (sc.status === S.GENERANDO && sc.job) pollJob(i); }); }

/* ------------------------------------------------------------------ 3 · canción y voz */
async function renderAudio() {
  const p = state.project, a = p.audio;
  if (a?.blobKey) {
    const b = await db.get('blobs', a.blobKey);
    if (b) { $('songPlayer').src = blobUrl('song', b); $('songPlayer').classList.remove('hidden'); }
    $('songInfo').textContent = `${a.name} · ${a.duration ? a.duration.toFixed(1) + ' s' : ''}`;
  } else { $('songPlayer').classList.add('hidden'); $('songInfo').textContent = 'Sin canción cargada.'; }
  $('licType').value = a?.license?.type || ''; $('licHolder').value = a?.license?.holder || ''; $('licOk').checked = !!a?.license?.ok;
  $('songOffset').value = a?.offset ?? 0; $('lyrics').value = a?.lyrics || '';
  const ranges = media.stageRanges(p.scenes, a?.offset || 0);
  const total = ranges.at(-1)[1];
  const warn = a?.duration && total > a.duration ? h('p', { class: 'warn' }, `Las etapas suman hasta ${total} s y la canción dura ${a.duration.toFixed(1)} s.`) : null;
  $('rangesTable').replaceChildren(h('h3', {}, 'Tramo de la canción por etapa'), warn || '', h('table', {}, h('tbody', {}, p.scenes.map((sc, i) => {
    const r = sc.audioRange || ranges[i];
    const inA = h('input', { type: 'number', step: '0.1', value: r[0], style: 'margin:0;padding:6px' });
    const inB = h('input', { type: 'number', step: '0.1', value: r[1], style: 'margin:0;padding:6px' });
    const save = async () => { sc.audioRange = [+inA.value, +inB.value]; await saveProject(); };
    inA.onchange = save; inB.onchange = save;
    return h('tr', {}, h('td', {}, `${i + 1}. ${sc.name}`), h('td', {}, inA), h('td', {}, inB));
  }))));
  const v = p.voice || await db.get('kv', 'voice');
  $('voiceMethod').value = v?.method || ''; $('voiceId').value = v?.id || '';
  if (v?.sampleKey) { const s = await db.get('blobs', v.sampleKey); if (s) { $('voicePlayer').src = blobUrl('voice', s); $('voicePlayer').classList.remove('hidden'); } }
}

$('songFile').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const buf = await media.decodeAudio(f);
    const key = db.uid('song'); await db.put('blobs', key, f);
    state.project.audio = { ...(state.project.audio || {}), blobKey: key, name: f.name, duration: buf.duration, license: { ...(state.project.audio?.license || {}), ok: false } };
    state.project.scenes.forEach(s => { s.audioRange = null; });
    await saveProject(); renderAudio(); toast('Canción cargada. Confirma su licencia.');
  } catch (err) { toast('No se pudo leer el audio: ' + err.message, 6000); }
});
$('saveSong').onclick = async () => {
  const p = state.project;
  if (!p.audio) { toast('Primero carga la canción.'); return; }
  if ($('licOk').checked && !$('licType').value) { toast('Indica el origen de la canción.'); return; }
  p.audio.license = { type: $('licType').value, holder: $('licHolder').value.trim(), ok: $('licOk').checked && !!$('licType').value, at: new Date().toISOString() };
  p.audio.offset = Math.max(0, +$('songOffset').value || 0);
  p.audio.lyrics = $('lyrics').value;
  await saveProject(); renderAudio(); toast('Canción y licencia guardadas.');
};
$('voiceSample').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  const key = db.uid('voice'); await db.put('blobs', key, f);
  const v = (await db.get('kv', 'voice')) || {}; v.sampleKey = key; await db.put('kv', 'voice', v); renderAudio();
});
$('saveVoice').onclick = async () => {
  const v = (await db.get('kv', 'voice')) || {};
  Object.assign(v, { method: $('voiceMethod').value, id: $('voiceId').value.trim(), at: new Date().toISOString() });
  await db.put('kv', 'voice', v); state.project.voice = v; await saveProject(); toast('Voz oficial guardada (común a todos los proyectos).');
};

/* ------------------------------------------------------------------ 4 · montaje y exportación */
const FINAL_CHECKS = ['He visto el máster completo con sonido de principio a fin', 'Es la misma Liora en todo el vídeo', 'La transformación se entiende paso a paso (8 etapas)', 'Labios y canto sincronizados en todo el vídeo', 'Canción con licencia confirmada para Instagram y TikTok', 'Sin marcas de agua, logos ni texto de otras plataformas', 'Se marcará como contenido generado con IA en ambas redes'];

async function currentExport() { const e = state.project.exports.at(-1); return e || null; }

async function renderMontage() {
  const p = state.project;
  const ready = P.projectReadyForMaster(p);
  $('masterGate').replaceChildren(ready.ok ? h('p', { class: 'note ok' }, 'Las 8 escenas están aprobadas.') : h('p', { class: 'note warn' }, 'Faltan por aprobar: ' + ready.missing.join(', ')));
  $('renderMaster').disabled = !ready.ok;
  const ex = await currentExport();
  const masterBlob = ex?.masterKey ? await db.get('blobs', ex.masterKey) : null;
  $('masterPreview').classList.toggle('hidden', !masterBlob);
  if (masterBlob) $('masterPreview').src = blobUrl('master', masterBlob);
  $('validateSection').classList.toggle('hidden', !masterBlob);
  $('deliverSection').classList.toggle('hidden', !(masterBlob && ex.validated));
  if (masterBlob) {
    $('finalChecks').replaceChildren(...FINAL_CHECKS.map((c, n) => h('label', { class: 'check' }, h('input', { type: 'checkbox', class: 'fc', checked: !!ex.validated }), c)));
    $('finalReviewer').value = ex.validatedBy || '';
    $('validateMsg').replaceChildren(ex.validated ? h('p', { class: 'note ok' }, `Validado por ${ex.validatedBy} el ${ex.validatedAt.slice(0, 16).replace('T', ' ')}`) : '');
    if (/webm/.test(masterBlob.type)) $('validateMsg').append(h('p', { class: 'note warn' }, 'Este navegador ha grabado WebM. Para Instagram/TikTok monta el máster desde Safari en iPhone (MP4).'));
  }
  if (masterBlob && ex.validated) {
    $('coverTime').max = String(Math.max(1, (ex.duration || 30) - 0.1));
    if (!ex.coverTime) $('coverTime').value = String(Math.max(0, (ex.duration || 30) - 3));
    else $('coverTime').value = ex.coverTime;
    $('capIg').value = ex.captions?.instagram ?? C.caption(p, 'instagram');
    $('capTt').value = ex.captions?.tiktok ?? C.caption(p, 'tiktok');
    if (ex.covers) {
      const v = await db.get('blobs', ex.covers.vertical), g = await db.get('blobs', ex.covers.grid34);
      $('coverPreview').replaceChildren(h('img', { src: blobUrl('cv', v), alt: 'Portada 9:16' }), h('img', { src: blobUrl('cg', g), alt: 'Portada 3:4', style: 'aspect-ratio:3/4' }));
    }
    $('platformRules').replaceChildren(h('b', {}, 'Instagram'), h('ul', {}, C.PLATFORM_RULES.instagram.map(x => h('li', {}, x))), h('b', {}, 'TikTok'), h('ul', {}, C.PLATFORM_RULES.tiktok.map(x => h('li', {}, x))));
  }
}

$('renderMaster').onclick = async () => {
  const p = state.project;
  if (!P.projectReadyForMaster(p).ok) return;
  const btn = $('renderMaster'); btn.disabled = true;
  try {
    const clips = [];
    for (const sc of p.scenes) clips.push(await sceneClipBlob(sc));
    let audio = 'clips', offset = 0;
    if ($('masterAudio').value === 'song') {
      if (!p.audio?.blobKey || !p.audio.license?.ok) throw new Error('Para usar la canción completa, cárgala y confirma su licencia.');
      audio = await db.get('blobs', p.audio.blobKey); offset = p.scenes[0].audioRange?.[0] ?? p.audio.offset ?? 0;
    }
    const blob = await media.renderVertical(clips, { audio, audioOffset: offset, onProgress: m => { $('renderLog').textContent = m; } });
    const key = db.uid('master'); await db.put('blobs', key, blob);
    const v = document.createElement('video'); v.src = URL.createObjectURL(blob);
    const duration = await new Promise(r => { v.onloadedmetadata = () => r(Number.isFinite(v.duration) ? v.duration : p.scenes.reduce((a, s) => a + s.seconds, 0)); v.onerror = () => r(null); });
    p.exports.push({ id: db.uid('exp'), createdAt: new Date().toISOString(), masterKey: key, mime: blob.type, size: blob.size, duration, audio: audio === 'clips' ? 'clips' : 'canción', validated: false });
    await saveProject();
    $('renderLog').textContent = `Máster listo: ${(blob.size / 1e6).toFixed(1)} MB · ${blob.type}`;
  } catch (e) { $('renderLog').textContent = 'Error: ' + e.message; }
  btn.disabled = false; renderMontage();
};

$('validateMaster').onclick = async () => {
  const ex = await currentExport(); if (!ex) return;
  const all = [...document.querySelectorAll('.fc')].every(x => x.checked);
  const who = $('finalReviewer').value.trim();
  if (!all || !who) { $('validateMsg').replaceChildren(h('p', { class: 'note bad' }, 'Marca todos los controles e indica quién valida.')); return; }
  Object.assign(ex, { validated: true, validatedBy: who, validatedAt: new Date().toISOString() });
  for (const sc of state.project.scenes) if (sc.status === S.APROBADO) P.transition(sc, S.EXPORTADO, 'incluida en máster ' + ex.id);
  await saveProject(); renderMontage(); renderSceneList(); toast('Máster validado. Ya puedes preparar los entregables.');
};

$('coverTime').oninput = () => { $('coverInfo').textContent = (+$('coverTime').value).toFixed(1) + ' s'; };
$('makeCovers').onclick = async () => {
  const ex = await currentExport(); const blob = await db.get('blobs', ex.masterKey);
  const c = await media.makeCovers(blob, +$('coverTime').value);
  const kv = db.uid('cover'), kg = db.uid('cover');
  await db.put('blobs', kv, c.vertical); await db.put('blobs', kg, c.grid34);
  ex.covers = { vertical: kv, grid34: kg }; ex.coverTime = +$('coverTime').value;
  await saveProject(); renderMontage();
};
async function saveCaptions(ex) { ex.captions = { instagram: $('capIg').value, tiktok: $('capTt').value }; await saveProject(); }
const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
async function deliver(kind) {
  const ex = await currentExport(); if (!ex?.validated) return;
  await saveCaptions(ex);
  const base = `liora-${slug(state.project.title)}-${ex.createdAt.slice(0, 10)}`;
  const master = await db.get('blobs', ex.masterKey);
  const ext = media.extOf(master);
  if (kind === 'master') await media.shareOrDownload(master, `${base}-master.${ext}`);
  if (kind === 'ig') await media.shareOrDownload(master, `${base}-instagram.${ext}`);
  if (kind === 'tt') await media.shareOrDownload(master, `${base}-tiktok.${ext}`);
  if (kind === 'cover') {
    if (!ex.covers) return toast('Genera primero las portadas.');
    await media.shareOrDownload(await db.get('blobs', ex.covers.vertical), `${base}-portada-9x16.jpg`);
    await media.shareOrDownload(await db.get('blobs', ex.covers.grid34), `${base}-portada-3x4.jpg`);
  }
  if (kind === 'text') {
    const txt = `INSTAGRAM\n\n${ex.captions.instagram}\n\n---\nTIKTOK\n\n${ex.captions.tiktok}\n\nPortada: segundo ${ex.coverTime ?? '—'}\n`;
    await media.shareOrDownload(new Blob([txt], { type: 'text/plain' }), `${base}-textos.txt`);
  }
  (ex.delivered ||= []).push({ kind, at: new Date().toISOString() }); await saveProject();
}
$('dlMaster').onclick = () => deliver('master');
$('dlIg').onclick = () => deliver('ig');
$('dlTt').onclick = () => deliver('tt');
$('dlCover').onclick = () => deliver('cover');
$('dlText').onclick = () => deliver('text');

/* ------------------------------------------------------------------ 5 · publicaciones */
async function renderPubs() {
  const pubs = (await db.all('posts')).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  $('pubList').replaceChildren(...pubs.map(pb => {
    const a = h('a', { target: '_blank', rel: 'noopener noreferrer' }, pb.platform === 'instagram' ? 'Instagram ↗' : 'TikTok ↗');
    try { const u = new URL(pb.url); if (u.protocol === 'https:') a.href = u.href; } catch { /* */ }
    const m = pb.metrics;
    return h('div', { class: 'card' }, h('div', { class: 'row' }, a, h('span', { class: 'sub' }, (pb.date || '').replace('T', ' ') + ' · ' + (pb.project || '') + ' · ' + (pb.file || ''))),
      h('p', { class: 'sub' }, m ? `Métricas verificadas el ${m.at.slice(0, 10)}: ${m.views ?? '—'} vistas · ${m.likes ?? '—'} me gusta · ${m.comments ?? '—'} comentarios · ${m.shares ?? '—'} compartidos` : 'Sin métricas registradas.'),
      h('button', { class: 'alt', onclick: async () => {
        const read = l => { const v = prompt(l + ' (vacío = sin dato)'); return v === null || v.trim() === '' ? null : Math.max(0, parseInt(v, 10)) || 0; };
        const views = read('Vistas comprobadas hoy en la app'); const likes = read('Me gusta'); const comments = read('Comentarios'); const shares = read('Compartidos');
        pb.metrics = { views, likes, comments, shares, at: new Date().toISOString() }; await db.put('posts', pb.id, pb); renderPubs();
      } }, 'Actualizar métricas'));
  }));
}
$('addPub').onclick = async () => {
  const url = $('pubUrl').value.trim();
  if (!/^https:\/\/(www\.)?(instagram\.com|tiktok\.com|vm\.tiktok\.com)\//i.test(url)) { toast('URL de Instagram o TikTok no válida.'); return; }
  const id = db.uid('post');
  await db.put('posts', id, { id, platform: $('pubPlatform').value, url, date: $('pubDate').value || new Date().toISOString().slice(0, 16), file: $('pubFile').value.trim(), project: state.project.title, metrics: null });
  $('pubUrl').value = ''; $('pubFile').value = ''; renderPubs(); toast('Publicación registrada.');
};

/* ------------------------------------------------------------------ 6 · tendencias */
$('trHook').replaceChildren(h('option', { value: '' }, '—'), ...C.HOOK_TYPES.map(x => h('option', {}, x)));
$('trMusic').replaceChildren(h('option', { value: '' }, '—'), ...C.MUSIC_STYLES.map(x => h('option', {}, x)));
const numOrNull = id => { const v = $(id).value.trim(); return v === '' ? null : Number(v); };

async function renderTrends() {
  const trends = (await db.all('trends')).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pt = C.trendPatterns(trends);
  $('patterns').replaceChildren(pt.total ? h('dl', { class: 'kv' },
    h('dt', {}, 'Referencias'), h('dd', {}, `${pt.total} (${pt.verifiedCount} con métricas verificadas)`),
    h('dt', {}, 'Duración mediana'), h('dd', {}, pt.medianDuration != null ? pt.medianDuration + ' s' : 'sin datos'),
    h('dt', {}, 'Revelación mediana'), h('dd', {}, pt.medianRevealRatio != null ? Math.round(pt.medianRevealRatio * 100) + ' % del vídeo' : 'sin datos'),
    h('dt', {}, 'Cortes medianos'), h('dd', {}, pt.medianCuts ?? 'sin datos'),
    h('dt', {}, 'Aperturas'), h('dd', {}, pt.hooks.map(([k, n]) => `${k} (${n})`).join(', ') || 'sin datos'),
    h('dt', {}, 'Música'), h('dd', {}, pt.music.map(([k, n]) => `${k} (${n})`).join(', ') || 'sin datos'),
    h('dt', {}, 'Interacción mediana'), h('dd', {}, pt.medianEngagement != null ? (pt.medianEngagement * 100).toFixed(1) + ' % (solo verificadas)' : 'sin métricas verificadas')
  ) : h('p', { class: 'sub' }, 'Aún no hay referencias. No se muestran cifras inventadas.'));
  $('trendList').replaceChildren(...trends.map(t => {
    const a = h('a', { target: '_blank', rel: 'noopener noreferrer' }, 'Abrir referencia ↗');
    try { const u = new URL(t.url); if (u.protocol === 'https:') a.href = u.href; } catch { /* */ }
    const m = C.verifiedMetrics(t);
    return h('div', { class: 'card' }, a,
      h('p', { class: 'sub' }, [t.duration ? t.duration + ' s' : null, t.revealAt != null ? 'revelación ' + t.revealAt + ' s' : null, t.cuts != null ? t.cuts + ' cortes' : null, t.hook, t.music].filter(Boolean).join(' · ') || 'Sin estructura registrada'),
      h('p', { class: 'sub' }, m ? `Verificado ${m.verifiedAt.slice(0, 10)}: ${m.views ?? '—'} vistas · ${m.likes ?? '—'} me gusta · ${m.comments ?? '—'} com. · ${m.shares ?? '—'} comp.` : 'Métricas sin verificar (no cuentan).'),
      t.notes ? h('p', {}, t.notes) : null,
      h('button', { class: 'alt', onclick: async () => { if (confirm('¿Eliminar referencia?')) { await db.del('trends', t.id); renderTrends(); } } }, 'Eliminar'));
  }));
}
$('addTrend').onclick = async () => {
  const url = $('trUrl').value.trim();
  try { if (new URL(url).protocol !== 'https:') throw 0; } catch { toast('Escribe una URL https válida.'); return; }
  const verified = $('trVerified').checked;
  const metrics = { views: numOrNull('trViews'), likes: numOrNull('trLikes'), comments: numOrNull('trComments'), shares: numOrNull('trShares'), saves: numOrNull('trSaves') };
  const hasMetrics = Object.values(metrics).some(v => v != null);
  if (hasMetrics && !verified && !confirm('Las métricas no están marcadas como verificadas: se guardarán pero no contarán. ¿Continuar?')) return;
  const id = db.uid('trend');
  await db.put('trends', id, { id, url, duration: numOrNull('trDur'), revealAt: numOrNull('trReveal'), cuts: numOrNull('trCuts'), hook: $('trHook').value || null, music: $('trMusic').value || null, notes: $('trNotes').value.trim(), createdAt: new Date().toISOString(),
    metrics: hasMetrics ? { ...metrics, verified, verifiedAt: verified ? new Date().toISOString() : null, source: 'comprobado manualmente en la publicación' } : null });
  for (const k of ['trUrl', 'trDur', 'trReveal', 'trCuts', 'trNotes', 'trViews', 'trLikes', 'trComments', 'trShares', 'trSaves']) $(k).value = '';
  $('trVerified').checked = false;
  renderTrends(); toast('Referencia guardada.');
};
$('genConcept').onclick = async () => {
  const trends = await db.all('trends');
  const c = C.originalConcept(trends, state.projects.map(p => p.title));
  $('conceptOut').replaceChildren(h('div', { class: 'card' }, h('b', {}, c.title), h('p', {}, c.concept),
    h('p', { class: 'sub' }, `Duración objetivo ${c.targetSeconds} s · revelación ≈ ${c.revealAt} s · apertura: ${c.hook} · música: ${c.music}`),
    h('p', { class: 'sub' }, c.basis),
    h('button', { onclick: async () => {
      const p = P.newProject({ title: c.title, character: c.concept.match(/en (.+?)\. Paleta/)?.[1] || '', concept: c.concept }); p.id = db.uid('proj');
      await db.put('projects', p.id, p); state.projects.unshift(p); state.project = p; await db.put('kv', 'current_project', p.id); await ensureOriginalMusic(p); renderAll(); toast('Proyecto creado.');
    } }, 'Crear proyecto con este concepto')));
};

/* ------------------------------------------------------------------ 7 · motores */
function renderModels() {
  const cfg = state.cfg;
  if (!cfg) { $('modelTable').replaceChildren(h('p', { class: 'sub' }, 'Conecta el backend para ver los modelos configurados. Evaluación completa en la documentación enlazada abajo.')); $('costCalc').replaceChildren(h('p', { class: 'sub' }, 'Disponible al conectar el backend.')); return; }
  const ver = new Map((state.verify?.models || []).map(m => [m.id, m]));
  $('modelTable').replaceChildren(h('table', {},
    h('thead', {}, h('tr', {}, h('th', {}, 'Modelo'), h('th', {}, 'USD/s'), h('th', {}, 'Esquema'), h('th', {}, 'Notas'))),
    h('tbody', {}, cfg.models.map(m => {
      const v = ver.get(m.id);
      return h('tr', {}, h('td', {}, m.label, h('div', { class: 'sub' }, m.endpoint)),
        h('td', {}, `${m.usdPerSecond}${m.usdPerSecondAudio !== m.usdPerSecond ? ' / ' + m.usdPerSecondAudio + ' con audio' : ''}`, v?.livePrice ? h('div', { class: 'sub' }, `fal: ${v.livePrice.unit_price} ${v.livePrice.currency}/${v.livePrice.unit}`) : null),
        h('td', {}, v ? (v.ok ? pill('pass', 'verificado') : h('span', {}, pill('fail', 'no encaja'), h('div', { class: 'sub' }, v.schemaErrors.join('; ')))) : pill('info', 'sin verificar')),
        h('td', { class: 'sub' }, m.notes));
    }))));
  const total = state.project.scenes.reduce((a, s) => a + s.seconds, 0);
  const find = id => cfg.models.find(m => m.id === id);
  const routes = [
    ['A · Veo 3.1 (visual) + Sync Lipsync 2 Pro (canto)', [['veo31-i2v', 8], ['sync-lipsync2-pro', null]]],
    ['B · Kling 3.0 Pro (visual) + Sync Lipsync 2 Pro', [['kling3-pro-i2v', 5], ['sync-lipsync2-pro', null]]],
    ['C · OmniHuman 1.5 (canto directo desde imagen)', [['omnihuman15', null]]],
    ['Prueba mínima · 1 escena Veo 3.1 Fast + lipsync', 'test']
  ];
  $('costCalc').replaceChildren(h('p', { class: 'sub' }, `Vídeo de ${total} s en 8 escenas. Incluye una regeneración media por escena (×1,5). Estimación, no factura.`), h('table', {}, h('tbody', {}, routes.map(([name, parts]) => {
    let usd = 0;
    if (parts === 'test') usd = (P.estimateCost(find('veo31-fast-i2v'), 8, false) || 0) + (P.estimateCost(find('sync-lipsync2-pro'), 8, false) || 0);
    else for (const sc of state.project.scenes) for (const [id, minDur] of parts) { const m = find(id); if (!m) continue; const secs = minDur ? (m.durations.find(d => d >= sc.seconds) ?? m.durations.at(-1)) : sc.seconds; usd += (P.estimateCost(m, secs, false) || 0) * 1.5; }
    return h('tr', {}, h('td', {}, name), h('td', {}, fmtUsd(usd)));
  }))));
}

async function connectBackend() {
  $('beStatus').replaceChildren(h('p', { class: 'sub' }, 'Conectando…'));
  try {
    await be.health();
    state.cfg = await be.config();
    $('beStatus').replaceChildren(h('div', { class: 'note ' + (state.cfg.allowPaid ? 'warn' : 'ok') },
      `Conectado · Worker v${state.cfg.version} · fal ${state.cfg.falConfigured ? 'configurado' : 'SIN CLAVE'} · gasto ${state.cfg.allowPaid ? 'AUTORIZADO' : 'bloqueado (ALLOW_PAID=false)'} · gastado (estimado) ${fmtUsd(state.cfg.budget.spentUsd)} de ${fmtUsd(state.cfg.budget.totalUsd)} · máx. por petición ${fmtUsd(state.cfg.budget.perJobUsd)}`));
    resumePolling();
  } catch (e) {
    state.cfg = null;
    $('beStatus').replaceChildren(h('div', { class: 'note bad' }, 'Sin conexión: ' + e.message));
  }
  renderModels(); renderStatusLine(); renderSceneDetail();
}

$('backendForm').addEventListener('submit', async e => {
  e.preventDefault();
  try { be.setBackendUrl($('beUrl').value); } catch (err) { toast(err.message); return; }
  be.setAccessKey($('beKey').value);
  await connectBackend();
});
$('verifyModels').onclick = async () => {
  if (!state.cfg) return toast('Conecta primero el backend.');
  try { toast('Consultando esquemas y precios en fal…'); state.verify = await be.verifyModels(); renderModels(); toast('Verificación completada (sin coste).'); }
  catch (e) { toast('Verificación fallida: ' + e.message, 6000); }
};
$('copyWorker').onclick = async () => {
  try {
    const code = await (await fetch('worker/worker.js', { cache: 'no-store' })).text();
    await navigator.clipboard.writeText(code); toast('Código del Worker copiado. Pégalo en el editor de Cloudflare.');
  } catch (e) { toast('No se pudo copiar: ' + e.message); }
};

async function renderStorage() {
  const s = await db.storageEstimate();
  $('storageInfo').textContent = `Persistente: ${s.persisted ? 'sí' : 'no (Safari puede borrar datos si no usas la app en semanas)'} · usado ${s.usage != null ? (s.usage / 1e6).toFixed(1) + ' MB' : '—'} de ${s.quota != null ? (s.quota / 1e6).toFixed(0) + ' MB' : '—'}`;
}
$('persistBtn').onclick = async () => { const ok = await db.requestPersistence(); toast(ok ? 'Almacenamiento persistente concedido.' : 'Safari no lo ha concedido. Añade la app a la pantalla de inicio y vuelve a intentarlo.'); renderStorage(); };

/* ------------------------------------------------------------------ arranque */
function renderAll() { renderProject(); renderAudio(); renderMontage(); renderModels(); renderStatusLine(); }

async function boot() {
  try {
    const migrated = await db.migrateLegacy();
    if (migrated?.length) toast(migrated.join(' '), 6000);
  } catch (e) { toast('Migración: ' + e.message, 6000); }
  await loadRefs();
  for (const r of state.refs) evaluateAngle(r);
  await loadIdentityText();
  await loadProjects();
  renderIdentity(); renderAll(); renderTrends(); renderPubs(); renderStorage();
  $('beUrl').value = be.backendUrl();
  try { const t = localStorage.getItem('liora_tab'); if (t) document.querySelector(`nav button[data-t="${t}"]`)?.click(); } catch { /* */ }
  // Si hay una oficial sin descriptor (p. ej. migrada), analizarla en cuanto cargue el motor.
  const off = state.refs.find(r => r.official && !r.descriptor);
  if (off && await ensureEngine()) {
    await analyzeRef(off); await db.put('refs', off.id, off); await loadRefs();
    for (const r of state.refs) { evaluateAngle(r); await db.put('refs', r.id, r); }
    renderIdentity();
  }
}
boot();
window.__liora = { state, db, P };
