// Ejecuta worker/worker.js en Node con un fal.ai SIMULADO, solo para pruebas locales de integración.
// Uso: CLIP=/ruta/clip.mp4 node tests/mock-backend.mjs   (puerto 8787)
import http from 'node:http';
import { readFileSync } from 'node:fs';
import worker from '../worker/worker.js';

const CLIP = readFileSync(process.env.CLIP);
const kv = new Map();
const env = { LIORA_ACCESS_KEY: 'clave-de-prueba-local-123456789', FAL_KEY: 'fal-simulada', ALLOW_PAID: 'true', MAX_USD_PER_JOB: '3', MAX_USD_TOTAL: '25',
  ALLOWED_ORIGIN: 'http://127.0.0.1:8765', LIORA_KV: { get: async k => kv.get(k) ?? null, put: async (k, v) => { kv.set(k, v); } } };
const submitted = [];
let polls = 0;
const realFetch = globalThis.fetch;
globalThis.fetch = async (u, o = {}) => {
  u = String(u);
  const j = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });
  if (u.startsWith('https://fal.ai/api/openapi')) {
    const ep = decodeURIComponent(u.split('endpoint_id=')[1]);
    const m = worker._internals.MODELS.find(x => x.endpoint === ep);
    const props = {}; for (const k of [...Object.values(m.map), ...Object.keys(m.fixed)]) props[k] = { type: 'string' };
    return j({ paths: { ['/' + ep]: { post: { requestBody: { content: { 'application/json': { schema: { properties: props, required: [] } } } } } } } });
  }
  if (u.startsWith('https://api.fal.ai/')) return j({}, 403);
  if (u.startsWith('https://queue.fal.run/') && o.method === 'POST') {
    const id = 'req-' + (submitted.length + 1).toString().padStart(8, '0');
    submitted.push({ endpoint: u, payloadKeys: Object.keys(JSON.parse(o.body)) });
    console.log('[fal simulado] envío', u, submitted.at(-1).payloadKeys.join(','));
    return j({ request_id: id, status_url: `https://queue.fal.run/x/requests/${id}/status`, response_url: `https://queue.fal.run/x/requests/${id}` });
  }
  if (u.endsWith('/status')) return j({ status: ++polls % 2 ? 'IN_QUEUE' : 'COMPLETED', queue_position: 0 });
  if (u.startsWith('https://queue.fal.run/x/requests/')) return j({ video: { url: 'https://v3.fal.media/files/prueba.mp4' } });
  if (u === 'https://v3.fal.media/files/prueba.mp4') return new Response(CLIP, { headers: { 'Content-Type': 'video/mp4' } });
  return realFetch(u, o);
};

http.createServer(async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c);
  const r = await worker.fetch(new Request('http://127.0.0.1:8787' + req.url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : Buffer.concat(chunks) }), env);
  res.writeHead(r.status, Object.fromEntries(r.headers));
  res.end(Buffer.from(await r.arrayBuffer()));
}).listen(8787, () => console.log('Worker local en http://127.0.0.1:8787 (fal SIMULADO)'));
