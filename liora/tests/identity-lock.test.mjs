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
  assert.equal(L.renderVerdict(lock, { master_sha256: m, identity_distance: 0.3, human_approved: false }).state, L.RENDER.PENDIENTE);
  assert.equal(L.renderVerdict(lock, { master_sha256: m, identity_distance: 0.3, human_approved: true }).state, L.RENDER.APROBADO);
  assert.equal(L.renderVerdict(lock, { master_sha256: m, identity_distance: 0.5, human_approved: true }).state, L.RENDER.APROBADO);
});

test('lockDigest es estable frente al orden de las claves', async () => {
  const lock = await sealed();
  const reordered = { ...lock, master: Object.fromEntries(Object.entries(lock.master).reverse()) };
  assert.equal(await L.lockDigest(reordered), lock.lock_sha256);
});
