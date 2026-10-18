import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/worker.js';

const W = worker._internals;
const env = (over = {}) => {
  const kv = new Map();
  return { LIORA_ACCESS_KEY: 'k'.repeat(30), FAL_KEY: 'fal-secret', ALLOW_PAID: 'false', MAX_USD_PER_JOB: '3', MAX_USD_TOTAL: '25', ALLOWED_ORIGIN: 'https://alvarogavilan.github.io',
    LIORA_KV: { get: async k => kv.get(k) ?? null, put: async (k, v) => { kv.set(k, v); } }, _kv: kv, ...over };
};
const req = (path, { method = 'GET', key = 'k'.repeat(30), body } = {}) => new Request('https://w.example' + path, {
  method, headers: { Origin: 'https://alvarogavilan.github.io', ...(key ? { Authorization: 'Bearer ' + key } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });

const OPENAPI = endpoint => ({ paths: { ['/' + endpoint]: { post: { requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/In' } } } } } } },
  components: { schemas: { In: { required: ['prompt', 'image_url'], properties: { prompt: { type: 'string' }, image_url: { type: 'string' }, duration: { enum: ['4s', '6s', '8s'] }, aspect_ratio: { enum: ['16:9', '9:16'] }, resolution: { enum: ['720p', '1080p'] }, generate_audio: { type: 'boolean' } } } } } });

let calls = [];
function mockFetch(handler) { calls = []; globalThis.fetch = async (u, o = {}) => { calls.push({ u: String(u), o }); return handler(String(u), o); }; }
const jres = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

test('health sin autenticación, resto con clave', async () => {
  assert.equal((await worker.fetch(req('/health', { key: null }), env())).status, 200);
  assert.equal((await worker.fetch(req('/config', { key: null }), env())).status, 401);
  assert.equal((await worker.fetch(req('/config', { key: 'mala'.repeat(8) }), env())).status, 401);
  const r = await worker.fetch(req('/config'), env());
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.equal(d.allowPaid, false);
  assert.ok(!JSON.stringify(d).includes('fal-secret'), 'la clave del proveedor nunca sale del Worker');
});

test('bloqueo tras 10 intentos fallidos', async () => {
  const e = env();
  for (let i = 0; i < 10; i++) await worker.fetch(req('/config', { key: 'x'.repeat(30) }), e);
  assert.equal((await worker.fetch(req('/config'), e)).status, 429);
});

test('clave de acceso corta = servicio no configurado', async () => {
  assert.equal((await worker.fetch(req('/config', { key: 'abc' }), env({ LIORA_ACCESS_KEY: 'abc' }))).status, 503);
});

test('sin ALLOW_PAID no se llama al proveedor', async () => {
  mockFetch(u => jres({}, 404));
  const r = await worker.fetch(req('/jobs', { method: 'POST', body: { model: 'veo31-i2v', inputs: { prompt: 'p', startImage: 'data:image/jpeg;base64,AAAA', seconds: 5 }, confirmUsd: 99 } }), env());
  assert.equal(r.status, 402);
  assert.equal(calls.filter(c => c.u.includes('queue.fal.run')).length, 0);
});

test('exige confirmar el coste y respeta topes', async () => {
  mockFetch(u => jres({}, 404));
  const e = env({ ALLOW_PAID: 'true' });
  const body = { model: 'veo31-i2v', inputs: { prompt: 'p', startImage: 'data:image/jpeg;base64,AAAA', seconds: 5 }, confirmUsd: 0.5 };
  let r = await worker.fetch(req('/jobs', { method: 'POST', body }), e);
  assert.equal(r.status, 409);
  assert.equal((await r.json()).estimate.usd, 1.6);
  r = await worker.fetch(req('/jobs', { method: 'POST', body: { ...body, inputs: { ...body.inputs, seconds: 8, generateAudio: true }, confirmUsd: 10 } }), env({ ALLOW_PAID: 'true', MAX_USD_PER_JOB: '2' }));
  assert.equal(r.status, 402);
});

test('envío real a la cola de fal con esquema verificado y registro de gasto', async () => {
  const e = env({ ALLOW_PAID: 'true' });
  mockFetch((u, o) => {
    if (u.startsWith('https://fal.ai/api/openapi')) return jres(OPENAPI('fal-ai/veo3.1/image-to-video'));
    if (u.startsWith('https://api.fal.ai/v1/models/pricing')) return jres({}, 403);
    if (u === 'https://queue.fal.run/fal-ai/veo3.1/image-to-video') {
      assert.equal(o.headers.Authorization, 'Key fal-secret');
      const p = JSON.parse(o.body);
      assert.equal(p.image_url, 'data:image/jpeg;base64,AAAA');
      assert.equal(p.duration, '8s'); assert.equal(p.aspect_ratio, '9:16'); assert.equal(p.generate_audio, false);
      assert.ok(!('negative_prompt' in p), 'campo opcional no admitido se elimina');
      return jres({ request_id: 'req-12345678', status_url: 'https://queue.fal.run/fal-ai/veo3.1/requests/req-12345678/status', response_url: 'https://queue.fal.run/fal-ai/veo3.1/requests/req-12345678' });
    }
    if (u.endsWith('/status')) return jres({ status: 'COMPLETED' });
    if (u.endsWith('req-12345678')) return jres({ video: { url: 'https://v3.fal.media/files/x.mp4' } });
    return jres({}, 404);
  });
  const r = await worker.fetch(req('/jobs', { method: 'POST', body: { model: 'veo31-i2v', inputs: { prompt: 'p', negativePrompt: 'n', startImage: 'data:image/jpeg;base64,AAAA', seconds: 5 }, confirmUsd: 1.6 } }), e);
  assert.equal(r.status, 200, await r.clone().text());
  assert.equal(e._kv.get('spent_usd'), '1.6');
  const s = await worker.fetch(req('/jobs/req-12345678'), e);
  const d = await s.json();
  assert.equal(d.status, 'COMPLETED'); assert.equal(d.videoUrl, 'https://v3.fal.media/files/x.mp4');
});

test('esquema incompatible: 422 sin cobrar', async () => {
  const e = env({ ALLOW_PAID: 'true' });
  mockFetch(u => u.startsWith('https://fal.ai/api/openapi') ? jres(OPENAPI('fal-ai/kling-video/v3/pro/image-to-video')) : jres({}, 403));
  const r = await worker.fetch(req('/jobs', { method: 'POST', body: { model: 'kling3-pro-i2v', inputs: { prompt: 'p', startImage: 'data:image/jpeg;base64,AAAA', seconds: 5 }, confirmUsd: 5 } }), e);
  assert.equal(r.status, 422);
  assert.equal(calls.filter(c => c.u.includes('queue.fal.run')).length, 0);
  assert.equal(e._kv.get('spent_usd'), undefined);
});

test('proxy de medios solo para hosts de fal', async () => {
  mockFetch(() => new Response('video', { headers: { 'Content-Type': 'video/mp4' } }));
  assert.equal((await worker.fetch(req('/media?url=' + encodeURIComponent('https://evil.example/x.mp4')), env())).status, 400);
  const r = await worker.fetch(req('/media?url=' + encodeURIComponent('https://v3.fal.media/files/x.mp4')), env());
  assert.equal(r.status, 200);
});

test('validación de entradas', () => {
  assert.deepEqual(W.validateInputs({ startImage: 'data:image/png;base64,AA' }), []);
  assert.equal(W.validateInputs({ startImage: 'javascript:alert(1)' }).length, 1);
  assert.equal(W.validateInputs({ seconds: 99 }).length, 1);
  assert.equal(W.pickDuration({ durations: [5, 10] }, 6), 10);
  assert.equal(W.pickDuration({ durations: [4, 6, 8] }, 12), 8);
});

test('CORS solo para el origen permitido', async () => {
  const r = await worker.fetch(new Request('https://w.example/health', { headers: { Origin: 'https://otro.example' } }), env());
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), 'https://alvarogavilan.github.io');
});
