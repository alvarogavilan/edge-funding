import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as L from '../identity/identity-lock.js';

const manifest = () => readFile(new URL('../identity/identity-lock.json', import.meta.url), 'utf8').then(JSON.parse);
const master = new Blob([new Uint8Array([1, 2, 3, 4, 5])], { type: 'image/jpeg' });
const other = new Blob([new Uint8Array([9, 9, 9])], { type: 'image/jpeg' });
const sealed = async () => L.applySeal(await manifest(), await L.buildSeal(master, { width: 1080, height: 1350, source: 'prueba' }));

test('el manifiesto publicado es íntegro y está en REFERENCIA_AUSENTE (no se declara verificado sin maestro)', async () => {
  const lock = await manifest();
  assert.deepEqual(await L.validateLock(lock), []);
  assert.equal(lock.identity_id, 'LIORA-VALE-0001');
  assert.equal(lock.status, L.REF.AUSENTE);
  assert.equal(lock.master, null);
  assert.equal(L.referenceState(lock, null).state, L.REF.AUSENTE);
});

test('el manifiesto no contiene imágenes ni datos de imagen', async () => {
  const raw = await readFile(new URL('../identity/identity-lock.json', import.meta.url), 'utf8');
  assert.doesNotMatch(raw, /data:image|base64/i);
});

test('sellar fija la huella y la procedencia; el sello no incluye la imagen', async () => {
  const seal = await L.buildSeal(master, { width: 1080, height: 1350, source: 'prueba' });
  assert.equal(seal.sha256, await L.sha256Hex(master));
  assert.equal(Object.values(seal).some(v => typeof v === 'string' && v.length > 200), false);
  const lock = await sealed();
  assert.deepEqual(await L.validateLock(lock), []);
  assert.equal(lock.status, L.REF.VERIFICADA);
  assert.equal(lock.master.provenance.source, 'prueba');
  assert.equal(L.referenceState(lock, seal.sha256).state, L.REF.VERIFICADA);
});

test('sustitución: otro archivo no puede ser oficial ni resellar la identidad', async () => {
  const lock = await sealed();
  const sha = await L.sha256Hex(other);
  assert.equal(L.referenceState(lock, sha).state, L.REF.SUSTITUCION);
  assert.equal(L.canBecomeOfficial(lock, sha), false);
  assert.equal(L.canBecomeOfficial(lock, lock.master.sha256), true);
  await assert.rejects(L.applySeal(lock, await L.buildSeal(other, { source: 'x' })), /sustitución bloqueada/);
  await assert.rejects(L.applySeal(lock, { format: 'liora-identity-seal-v1', identity_id: 'OTRA-0001' }), /no válido/);
});

test('manipulación: cambiar la huella o el identificador sin sello rompe la integridad', async () => {
  const lock = await sealed();
  const t1 = structuredClone(lock); t1.master.sha256 = 'a'.repeat(64);
  assert.match((await L.validateLock(t1)).join(), /lock_sha256 no coincide/);
  const t2 = structuredClone(lock); t2.identity_id = 'LIORA-VALE-0002';
  assert.match((await L.validateLock(t2)).join(), /lock_sha256 no coincide/);
  const t3 = await manifest(); t3.status = L.REF.VERIFICADA;
  assert.match((await L.validateLock(t3)).join(), /REFERENCIA_AUSENTE/);
});

test('derivados: solo cuentan los generados desde el maestro sellado', async () => {
  const lock = await sealed();
  lock.derivatives = [{ sha256: 'b'.repeat(64), master_sha256: lock.master.sha256, state: L.RENDER.APROBADO }];
  assert.deepEqual(await L.validateLock(lock), []);
  lock.derivatives.push({ sha256: 'c'.repeat(64), master_sha256: 'd'.repeat(64), state: L.RENDER.APROBADO });
  assert.match((await L.validateLock(lock)).join(), /otra referencia/);
  lock.derivatives = [{ sha256: 'e'.repeat(64), master_sha256: lock.master.sha256, state: 'PUBLICADO' }];
  assert.match((await L.validateLock(lock)).join(), /estado inválido/);
});

test('veredicto de render: pendiente sin referencia, rechazado con otra cara u otra referencia, aprobado solo con revisión humana', async () => {
  const empty = await manifest();
  assert.equal(L.renderVerdict(empty, { master_sha256: 'x', identity_distance: 0.2, human_approved: true }).state, L.RENDER.PENDIENTE);
  const lock = await sealed();
  const m = lock.master.sha256;
  assert.equal(L.renderVerdict(lock, { master_sha256: 'f'.repeat(64), identity_distance: 0.2, human_approved: true }).state, L.RENDER.RECHAZADO);
  assert.equal(L.renderVerdict(lock, { master_sha256: m, identity_distance: 0.7, human_approved: true }).state, L.RENDER.RECHAZADO);
  assert.equal(L.renderVerdict(lock, { master_sha256: m, identity_distance: null, human_approved: true }).state, L.RENDER.PENDIENTE);
  const frames = L.frameContinuity(Array.from({ length: 20 }, (_, i) => [i * 0.25, 0.3]), { duration: 5 });
  assert.equal(L.renderVerdict(lock, { master_sha256: m, identity_distance: 0.3, human_approved: true }).state, L.RENDER.PENDIENTE, 'sin control fotograma a fotograma');
  assert.equal(L.renderVerdict(lock, { master_sha256: m, identity_distance: 0.3, human_approved: false, frames }).state, L.RENDER.PENDIENTE);
  assert.equal(L.renderVerdict(lock, { master_sha256: m, identity_distance: 0.3, human_approved: true, frames }).state, L.RENDER.APROBADO);
  assert.equal(L.renderVerdict(lock, { master_sha256: m, identity_distance: 0.5, human_approved: true, frames }).state, L.RENDER.APROBADO);
  const bad = L.frameContinuity([[0, 0.3], [1, 0.62], [2, 0.63], [3, 0.3], [4, 0.3]], { duration: 4 });
  assert.equal(L.renderVerdict(lock, { master_sha256: m, identity_distance: 0.3, human_approved: true, frames: bad }).state, L.RENDER.RECHAZADO);
});

test('lockDigest es estable frente al orden de las claves', async () => {
  const lock = await sealed();
  const reordered = { ...lock, master: Object.fromEntries(Object.entries(lock.master).reverse()) };
  assert.equal(await L.lockDigest(reordered), lock.lock_sha256);
});

test('fotograma a fotograma: no basta con el primer fotograma ni con la mediana', () => {
  const ok = Array.from({ length: 40 }, (_, i) => [i * 0.125, 0.25 + (i % 3) * 0.02]);
  assert.equal(L.frameContinuity(ok, { duration: 5 }).ok, true);
  // solo se midió el principio de la escena
  assert.match(L.frameContinuity(ok.slice(0, 8), { duration: 5 }).problems.join(), /toda la escena/);
  // mediana buena, pero dos fotogramas seguidos con otra persona
  const swap = ok.map(([t, d], i) => [t, i === 20 || i === 21 ? 0.6 : d]);
  assert.match(L.frameContinuity(swap, { duration: 5 }).problems.join(), /2 fotogramas seguidos/);
  // un único fotograma claramente distinto
  const flash = ok.map(([t, d], i) => [t, i === 30 ? 0.7 : d]);
  assert.match(L.frameContinuity(flash, { duration: 5 }).problems.join(), /claramente distinto/);
  // el rostro desaparece en buena parte de la escena
  const gone = ok.map(([t, d], i) => [t, i % 3 === 0 ? null : d]);
  assert.match(L.frameContinuity(gone, { duration: 5 }).problems.join(), /mínimo 80/);
  // tolerancia de maquillaje en las etapas finales
  const makeup = ok.map(([t]) => [t, 0.58]);
  assert.equal(L.frameContinuity(makeup, { duration: 5 }).ok, false);
  assert.equal(L.frameContinuity(makeup, { duration: 5, tolerance: 0.05 }).ok, true);
});

test('historial de versiones: el sello crea la versión 1 y el pasaporte la 2; manipularlo rompe la integridad', async () => {
  const lock = await sealed();
  assert.deepEqual(lock.history.map(e => [e.version, e.event]), [[1, 'SELLO_MAESTRO']]);
  const pp = { format: 'liora-identity-passport-v1', master_sha256: lock.master.sha256 };
  const v2 = await L.attachPassport(lock, pp, 'a'.repeat(64));
  assert.deepEqual(v2.history.map(e => e.event), ['SELLO_MAESTRO', 'PASAPORTE']);
  assert.deepEqual(await L.validateLock(v2), []);
  assert.notEqual(v2.lock_sha256, lock.lock_sha256);
  await assert.rejects(L.attachPassport(lock, { ...pp, master_sha256: 'b'.repeat(64) }, 'a'.repeat(64)), /maestro sellado/);
  await assert.rejects(L.attachPassport(await manifest(), pp, 'a'.repeat(64)), /sellar el maestro/);
  const cut = structuredClone(v2); cut.history.pop();
  assert.match((await L.validateLock(cut)).join(), /última versión/);
  const noHist = structuredClone(lock); noHist.history = [];
  assert.match((await L.validateLock(noHist)).join(), /historial/);
});

test('derivados autorizados: solo renders aprobados del maestro sellado, sin duplicados', async () => {
  const lock = await sealed();
  const d = { sha256: 'c'.repeat(64), master_sha256: lock.master.sha256, state: L.RENDER.APROBADO, kind: 'escena', stage: 'inicial' };
  const l2 = L.registerDerivative(lock, d);
  assert.equal(l2.derivatives.length, 1);
  assert.equal(L.registerDerivative(l2, d).derivatives.length, 1);
  assert.throws(() => L.registerDerivative(lock, { ...d, master_sha256: 'd'.repeat(64) }), /otra referencia/);
  assert.throws(() => L.registerDerivative(lock, { ...d, state: L.RENDER.PENDIENTE }), /aprobados/);
  assert.deepEqual(await L.validateLock(l2), []);
});
