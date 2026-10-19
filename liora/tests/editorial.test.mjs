import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { decide, ED } from '../js/editorial.js';
import { REF, RENDER } from '../identity/identity-lock.js';

const M = 'a'.repeat(64), F = 'f'.repeat(64);
const scene = (o = {}) => ({ kind: 'liora', mime: 'video/mp4', width: 1080, height: 1920, duration: 4.5, sha_expected: F, sha_actual: F,
  identity: { master_sha256: M, states: [RENDER.APROBADO] }, review: null, ...o });
const ok = { lockState: REF.VERIFICADA, lockSha: M };

test('teaser del catálogo: RESERVADO — NO PUBLICAR, y su huella coincide con el archivo real', async () => {
  const cat = JSON.parse(await readFile(new URL('../lanzamiento/catalogo.json', import.meta.url), 'utf8'));
  const t = cat.items.find(i => i.file === 'teaser-reina-del-eclipse.mp4');
  const sha = createHash('sha256').update(await readFile(new URL('../lanzamiento/' + t.file, import.meta.url))).digest('hex');
  assert.equal(sha, t.sha256);
  const d = decide({ ...t, sha_expected: t.sha256, sha_actual: sha, review: { by: 'X', at: '2026-10-19T00:00', sha256: sha } }, ok);
  assert.equal(d.state, ED.NO);
  assert.match(d.reason, /RESERVADO — NO PUBLICAR POR AHORA/);
});

test('escena de Liora: NO PUBLICAR sin referencia verificada, de otra referencia o sin RENDER APROBADO', () => {
  assert.equal(decide(scene(), { lockState: REF.AUSENTE }).state, ED.NO);
  assert.equal(decide(scene(), { lockState: REF.PENDIENTE_SELLO, lockSha: null }).state, ED.NO);
  assert.match(decide(scene({ identity: { master_sha256: 'b'.repeat(64), states: [RENDER.APROBADO] } }), ok).reason, /otra referencia/);
  assert.match(decide(scene({ identity: { master_sha256: M, states: [RENDER.APROBADO, undefined] } }), ok).reason, /RENDER APROBADO/);
});

test('formato y huella: NO PUBLICAR si no es MP4 vertical, dura < 3 s o el archivo cambió', () => {
  assert.match(decide(scene({ mime: 'video/webm' }), ok).reason, /MP4/);
  assert.match(decide(scene({ width: 1920, height: 1080 }), ok).reason, /vertical/);
  assert.match(decide(scene({ duration: 2 }), ok).reason, /3 s/);
  assert.match(decide(scene({ sha_actual: 'c'.repeat(64) }), ok).reason, /alterado/);
  assert.match(decide(scene({ sha_actual: null }), ok).reason, /no disponible/);
});

test('REVISAR hasta la revisión editorial de ESE archivo; luego APTO PARA PUBLICAR (publicación manual)', () => {
  assert.equal(decide(scene(), ok).state, ED.REVISAR);
  assert.equal(decide(scene({ review: { by: 'AG', at: '2026-10-19T18:00:00Z', sha256: 'd'.repeat(64) } }), ok).state, ED.REVISAR);
  const d = decide(scene({ review: { by: 'AG', at: '2026-10-19T18:00:00Z', sha256: F } }), ok);
  assert.equal(d.state, ED.APTO);
  assert.match(d.reason, /manual/);
});
