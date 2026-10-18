/* Liora Studio · backend privado (Cloudflare Worker, módulo ES, un solo archivo).

   Función: custodiar las claves de los proveedores de vídeo y aplicar el control de gasto.
   La interfaz pública (GitHub Pages) nunca ve FAL_KEY. El navegador solo envía la clave de
   acceso de Liora, que vive en memoria (no en localStorage) y se compara aquí en tiempo constante.

   Proveedor: fal.ai (una sola clave y saldo prepago → Veo 3.1, Kling 3.0, Seedance 2.0,
   OmniHuman 1.5, Sync Lipsync 2 Pro). Saldo prepago en fal = tope duro de gasto adicional.

   Variables / secretos (Cloudflare → Workers → Settings → Variables):
     FAL_KEY            secreto  · clave de fal.ai
     LIORA_ACCESS_KEY   secreto  · frase larga que escribirás en el iPhone (mín. 24 caracteres)
     ALLOW_PAID         "false"  · cambiar a "true" SOLO cuando autorices gastar
     MAX_USD_PER_JOB    "3"      · tope por petición
     MAX_USD_TOTAL      "25"     · tope acumulado (estimado) registrado en KV
     ALLOWED_ORIGIN     "https://alvarogavilan.github.io"
   KV namespace binding: LIORA_KV
*/

const VERSION = '1.0.0';
const FAL_QUEUE = 'https://queue.fal.run';
const FAL_OPENAPI = 'https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=';
const FAL_PRICING = 'https://api.fal.ai/v1/models/pricing?endpoint_id=';
const MEDIA_HOSTS = [/\.fal\.media$/, /^fal\.media$/, /\.fal\.run$/, /\.fal\.ai$/, /storage\.googleapis\.com$/];

// Precios: búsqueda pública del 18-oct-2026 (páginas de fal y agregadores). El endpoint de
// precios de fal (con tu clave) sustituye estas cifras cuando responde; si no, se usan estas.
const MODELS = [
  { id: 'veo31-i2v', label: 'Google Veo 3.1 · imagen→vídeo', endpoint: 'fal-ai/veo3.1/image-to-video', role: 'visual',
    usdPerSecond: 0.20, usdPerSecondAudio: 0.40, durations: [8], durationFormat: 's',
    map: { prompt: 'prompt', startImage: 'image_url', duration: 'duration', generateAudio: 'generate_audio', negativePrompt: 'negative_prompt' },
    fixed: { aspect_ratio: '9:16', resolution: '1080p' },
    notes: 'Mejor fotorrealismo y audio nativo. En Veo, 1080p exige tomas de 8 s. Parte del último fotograma aprobado.' },
  { id: 'veo31-fast-i2v', label: 'Google Veo 3.1 Fast · imagen→vídeo', endpoint: 'fal-ai/veo3.1/fast/image-to-video', role: 'visual',
    usdPerSecond: 0.10, usdPerSecondAudio: 0.15, durations: [4, 6, 8], durationFormat: 's',
    map: { prompt: 'prompt', startImage: 'image_url', duration: 'duration', generateAudio: 'generate_audio', negativePrompt: 'negative_prompt' },
    fixed: { aspect_ratio: '9:16', resolution: '720p' },
    notes: 'Para pruebas baratas de movimiento y manos antes de la toma definitiva.' },
  { id: 'veo31-ref', label: 'Google Veo 3.1 · referencias de identidad', endpoint: 'fal-ai/veo3.1/reference-to-video', role: 'visual',
    usdPerSecond: 0.20, usdPerSecondAudio: 0.40, durations: [8], durationFormat: 's',
    map: { prompt: 'prompt', refImages: 'image_urls', duration: 'duration', generateAudio: 'generate_audio' },
    fixed: { resolution: '1080p' },
    notes: 'Usa varias referencias maestras (ángulos). No acepta fotograma inicial: peor continuidad entre etapas.' },
  { id: 'kling3-pro-i2v', label: 'Kling 3.0 Pro · imagen→vídeo', endpoint: 'fal-ai/kling-video/v3/pro/image-to-video', role: 'visual',
    usdPerSecond: 0.112, usdPerSecondAudio: 0.168, durations: [5, 10], durationFormat: 'int-string',
    map: { prompt: 'prompt', startImage: 'start_image_url', duration: 'duration', generateAudio: 'generate_audio', negativePrompt: 'negative_prompt' },
    fixed: {},
    notes: 'Buena física de manos/objetos y precio contenido. 5 o 10 s.' },
  { id: 'seedance2-ref', label: 'Seedance 2.0 · referencias + audio', endpoint: 'bytedance/seedance-2.0/reference-to-video', role: 'visual+audio',
    usdPerSecond: 0.3034, usdPerSecondAudio: 0.3034, durations: [5, 10], durationFormat: 'int-string',
    map: { prompt: 'prompt', refImages: 'image_urls', duration: 'duration' },
    fixed: { resolution: '720p', aspect_ratio: '9:16' },
    notes: 'Hasta 9 imágenes de referencia; cita @Image1 en el prompt. Esquema pendiente de verificación con tu clave.' },
  { id: 'omnihuman15', label: 'OmniHuman 1.5 · imagen + canción → vídeo cantando', endpoint: 'fal-ai/bytedance/omnihuman/v1.5', role: 'singing',
    usdPerSecond: 0.16, usdPerSecondAudio: 0.16, durations: null, durationFromAudio: true,
    map: { prompt: 'prompt', startImage: 'image_url', audio: 'audio_url' },
    fixed: { resolution: '1080p' },
    notes: 'Movido por el audio: canto, respiración y gesto. Audio < 30 s a 1080p. Interacción con brochas más limitada.' },
  { id: 'sync-lipsync2-pro', label: 'Sync Lipsync 2 Pro · labios sobre clip aprobado', endpoint: 'fal-ai/sync-lipsync/v2/pro', role: 'lipsync',
    usdPerSecond: 0.094, usdPerSecondAudio: 0.094, durations: null, durationFromAudio: true,
    map: { video: 'video_url', audio: 'audio_url' },
    fixed: { sync_mode: 'cut_off' },
    notes: 'Conserva manos y maquillaje del clip y solo rehace la boca. Verificar en canto con brocha delante de la cara.' }
];

/* ---------- utilidades ---------- */
function cors(env, req) {
  const origin = req.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGIN || 'https://alvarogavilan.github.io').split(',').map(s => s.trim());
  return {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization,Content-Type',
    'Access-Control-Max-Age': '600',
    'Vary': 'Origin'
  };
}

function json(data, status, h) {
  return new Response(JSON.stringify(data), { status, headers: { ...h, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
}

async function sha256(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return new Uint8Array(d);
}

async function safeEqual(a, b) {
  const [x, y] = await Promise.all([sha256(a || ''), sha256(b || '')]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

async function authorize(req, env) {
  const ip = req.headers.get('CF-Connecting-IP') || 'local';
  const failKey = 'fail:' + ip;
  const fails = Number(await env.LIORA_KV?.get(failKey) || 0);
  if (fails >= 10) return { ok: false, status: 429, error: 'Demasiados intentos. Espera 15 minutos.' };
  if (!env.LIORA_ACCESS_KEY || env.LIORA_ACCESS_KEY.length < 24) return { ok: false, status: 503, error: 'LIORA_ACCESS_KEY no configurada (mínimo 24 caracteres).' };
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (await safeEqual(token, env.LIORA_ACCESS_KEY)) return { ok: true };
  await env.LIORA_KV?.put(failKey, String(fails + 1), { expirationTtl: 900 });
  return { ok: false, status: 401, error: 'Clave de acceso incorrecta.' };
}

function num(v, d) { const n = Number(v); return Number.isFinite(n) ? n : d; }

function limits(env) {
  return { allowPaid: env.ALLOW_PAID === 'true', perJob: num(env.MAX_USD_PER_JOB, 3), total: num(env.MAX_USD_TOTAL, 25) };
}

async function spent(env) { return num(await env.LIORA_KV?.get('spent_usd'), 0); }

function pickDuration(model, seconds) {
  if (!model.durations) return null;
  return model.durations.find(d => d >= seconds) ?? model.durations[model.durations.length - 1];
}

function formatDuration(model, d) {
  if (d == null) return undefined;
  return model.durationFormat === 's' ? d + 's' : String(d);
}

function estimateUsd(model, { seconds, generateAudio, audioSeconds }, livePrice) {
  const billed = model.durationFromAudio ? Math.ceil(audioSeconds || seconds || 0) : pickDuration(model, seconds || 0);
  let rate = generateAudio ? model.usdPerSecondAudio : model.usdPerSecond;
  let source = 'tabla documentada (18-oct-2026)';
  if (livePrice && livePrice.unit && /second/i.test(livePrice.unit) && !generateAudio) { rate = livePrice.unit_price; source = 'precio en vivo de fal'; }
  return { usd: Math.round(rate * billed * 100) / 100, billedSeconds: billed, rate, source };
}

function buildPayload(model, inputs) {
  const p = { ...model.fixed };
  const m = model.map;
  if (m.prompt && inputs.prompt) p[m.prompt] = String(inputs.prompt).slice(0, 4000);
  if (m.negativePrompt && inputs.negativePrompt) p[m.negativePrompt] = String(inputs.negativePrompt).slice(0, 1500);
  if (m.startImage) { if (!inputs.startImage) throw new Error('Falta la imagen inicial.'); p[m.startImage] = inputs.startImage; }
  if (m.refImages) {
    const refs = (inputs.refImages || []).slice(0, 9);
    if (!refs.length) throw new Error('Faltan imágenes de referencia.');
    p[m.refImages] = refs;
  }
  if (m.audio) { if (!inputs.audio) throw new Error('Falta el audio de la etapa.'); p[m.audio] = inputs.audio; }
  if (m.video) { if (!inputs.video) throw new Error('Falta el vídeo de entrada.'); p[m.video] = inputs.video; }
  if (m.duration && model.durations) p[m.duration] = formatDuration(model, pickDuration(model, inputs.seconds || 0));
  if (m.generateAudio) p[m.generateAudio] = !!inputs.generateAudio;
  return p;
}

function optionalFields(model) {
  return [model.map.negativePrompt, model.map.generateAudio].filter(Boolean);
}

function isDataOrHttps(v) { return typeof v === 'string' && (/^data:(image|audio|video)\/[\w.+-]+;base64,/.test(v) || /^https:\/\//.test(v)); }

function validateInputs(inputs) {
  const errs = [];
  for (const k of ['startImage', 'audio', 'video']) if (inputs[k] != null && !isDataOrHttps(inputs[k])) errs.push(k + ' debe ser data: o https:');
  if (inputs.refImages != null && (!Array.isArray(inputs.refImages) || !inputs.refImages.every(isDataOrHttps))) errs.push('refImages inválidas');
  if (inputs.seconds != null && !(inputs.seconds > 0 && inputs.seconds <= 30)) errs.push('seconds fuera de rango');
  return errs;
}

/* ---------- esquema real del modelo (OpenAPI público de fal) ---------- */
const schemaCache = new Map();

function extractInputSchema(openapi, endpoint) {
  const paths = openapi?.paths || {};
  const key = Object.keys(paths).find(k => k.replace(/^\//, '') === endpoint && paths[k].post) ||
    Object.keys(paths).find(k => paths[k].post && k.includes(endpoint) && !k.includes('/requests/'));
  const post = key && paths[key].post;
  let schema = post?.requestBody?.content?.['application/json']?.schema;
  const resolve = s => {
    if (s?.$ref) return openapi.components?.schemas?.[s.$ref.split('/').pop()];
    return s;
  };
  schema = resolve(schema);
  if (!schema) return null;
  const props = {};
  for (const [k, v] of Object.entries(schema.properties || {})) {
    const r = resolve(v) || v;
    const enums = r.enum || (r.anyOf || r.oneOf || r.allOf || []).flatMap(x => (resolve(x) || x).enum || []);
    props[k] = { type: r.type || null, enum: enums.length ? enums : null };
  }
  return { properties: props, required: schema.required || [] };
}

// optional: campos que se eliminan (con aviso) si el modelo no los admite, p. ej. negative_prompt.
function checkPayloadAgainstSchema(payload, schema, optional = []) {
  const errs = [];
  for (const [k, v] of Object.entries(payload)) {
    const p = schema.properties[k];
    if (!p && optional.includes(k)) { delete payload[k]; continue; }
    if (!p) { errs.push(`El modelo no acepta el campo «${k}»`); continue; }
    if (p.enum && !p.enum.includes(v)) errs.push(`«${k}» = ${JSON.stringify(v)} no está entre ${JSON.stringify(p.enum)}`);
  }
  for (const r of schema.required) if (!(r in payload)) errs.push(`Falta el campo obligatorio «${r}»`);
  return errs;
}

async function getSchema(endpoint) {
  if (schemaCache.has(endpoint)) return schemaCache.get(endpoint);
  const r = await fetch(FAL_OPENAPI + encodeURIComponent(endpoint), { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`fal no publica esquema para ${endpoint} (HTTP ${r.status})`);
  const s = extractInputSchema(await r.json(), endpoint);
  if (!s) throw new Error('Esquema no interpretable para ' + endpoint);
  schemaCache.set(endpoint, s);
  return s;
}

async function livePrices(env, endpoints) {
  if (!env.FAL_KEY) return {};
  try {
    const r = await fetch(FAL_PRICING + endpoints.map(encodeURIComponent).join(','), { headers: { Authorization: 'Key ' + env.FAL_KEY } });
    if (!r.ok) return {};
    const d = await r.json();
    const out = {};
    for (const p of d.prices || d.items || []) out[p.endpoint_id] = p;
    return out;
  } catch { return {}; }
}

/* ---------- rutas ---------- */
async function route(req, env) {
  const url = new URL(req.url);
  const h = cors(env, req);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
  if (url.pathname === '/health') return json({ ok: true, service: 'liora-backend', version: VERSION }, 200, h);

  const auth = await authorize(req, env);
  if (!auth.ok) return json({ error: auth.error }, auth.status, h);
  const lim = limits(env);

  if (url.pathname === '/config' && req.method === 'GET') {
    return json({
      version: VERSION, falConfigured: !!env.FAL_KEY, allowPaid: lim.allowPaid,
      budget: { perJobUsd: lim.perJob, totalUsd: lim.total, spentUsd: await spent(env) },
      models: MODELS.map(({ map, fixed, ...m }) => m)
    }, 200, h);
  }

  if (url.pathname === '/models/verify' && req.method === 'GET') {
    const prices = await livePrices(env, MODELS.map(m => m.endpoint));
    const out = [];
    for (const m of MODELS) {
      const row = { id: m.id, endpoint: m.endpoint, livePrice: prices[m.endpoint] || null };
      try {
        const s = await getSchema(m.endpoint);
        const probe = buildPayload(m, { prompt: 'x', negativePrompt: m.map.negativePrompt ? 'x' : undefined, startImage: 'https://example.com/a.jpg', refImages: ['https://example.com/a.jpg'], audio: 'https://example.com/a.wav', video: 'https://example.com/a.mp4', seconds: m.durations?.[0] || 5, generateAudio: false });
        row.schemaErrors = checkPayloadAgainstSchema(probe, s, optionalFields(m));
        row.dropped = optionalFields(m).filter(k => !(k in s.properties));
        row.fields = Object.keys(s.properties);
        row.ok = row.schemaErrors.length === 0;
      } catch (e) { row.ok = false; row.schemaErrors = [e.message]; }
      out.push(row);
    }
    return json({ checkedAt: new Date().toISOString(), models: out }, 200, h);
  }

  if (url.pathname === '/jobs' && req.method === 'POST') {
    if (!env.FAL_KEY) return json({ error: 'FAL_KEY no configurada en el Worker.' }, 503, h);
    let body;
    try { body = await req.json(); } catch { return json({ error: 'JSON inválido' }, 400, h); }
    const model = MODELS.find(m => m.id === body.model);
    if (!model) return json({ error: 'Modelo no permitido' }, 400, h);
    const inputs = body.inputs || {};
    const errs = validateInputs(inputs);
    if (errs.length) return json({ error: errs.join('; ') }, 400, h);
    const prices = await livePrices(env, [model.endpoint]);
    const est = estimateUsd(model, inputs, prices[model.endpoint]);
    if (!lim.allowPaid) return json({ error: 'Gasto no autorizado: ALLOW_PAID está en "false" en el Worker.', estimate: est }, 402, h);
    if (!(num(body.confirmUsd, -1) >= est.usd)) return json({ error: `Confirma el coste estimado (${est.usd} USD).`, estimate: est }, 409, h);
    if (est.usd > lim.perJob) return json({ error: `Supera el tope por petición (${lim.perJob} USD).`, estimate: est }, 402, h);
    const already = await spent(env);
    if (already + est.usd > lim.total) return json({ error: `Supera el tope acumulado (${already}/${lim.total} USD).`, estimate: est }, 402, h);
    let payload;
    try {
      payload = buildPayload(model, inputs);
      const schemaErrs = checkPayloadAgainstSchema(payload, await getSchema(model.endpoint), optionalFields(model));
      if (schemaErrs.length) return json({ error: 'La petición no encaja con el esquema actual del modelo (no se ha cobrado nada): ' + schemaErrs.join('; ') }, 422, h);
    } catch (e) { return json({ error: e.message }, 400, h); }
    const r = await fetch(`${FAL_QUEUE}/${model.endpoint}`, {
      method: 'POST', headers: { Authorization: 'Key ' + env.FAL_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.request_id) return json({ error: 'fal rechazó la petición', status: r.status, detail: data.detail || data }, 502, h);
    await env.LIORA_KV?.put('spent_usd', String(Math.round((already + est.usd) * 100) / 100));
    const job = { id: data.request_id, model: model.id, endpoint: model.endpoint, statusUrl: data.status_url, responseUrl: data.response_url, estimate: est, createdAt: new Date().toISOString() };
    await env.LIORA_KV?.put('job:' + job.id, JSON.stringify(job), { expirationTtl: 60 * 60 * 24 * 30 });
    return json({ job }, 200, h);
  }

  const jm = url.pathname.match(/^\/jobs\/([\w-]{8,80})$/);
  if (jm && req.method === 'GET') {
    const job = JSON.parse(await env.LIORA_KV?.get('job:' + jm[1]) || 'null');
    if (!job) return json({ error: 'Trabajo desconocido' }, 404, h);
    const auth2 = { Authorization: 'Key ' + env.FAL_KEY };
    const s = await fetch(job.statusUrl || `${FAL_QUEUE}/${job.endpoint}/requests/${job.id}/status`, { headers: auth2 });
    const st = await s.json().catch(() => ({}));
    if (st.status !== 'COMPLETED') return json({ status: st.status || 'UNKNOWN', queuePosition: st.queue_position ?? null }, 200, h);
    const rr = await fetch(job.responseUrl || `${FAL_QUEUE}/${job.endpoint}/requests/${job.id}`, { headers: auth2 });
    const result = await rr.json().catch(() => ({}));
    if (!rr.ok) return json({ status: 'FAILED', error: result.detail || 'Error del proveedor' }, 200, h);
    const videoUrl = result.video?.url || result.videos?.[0]?.url || null;
    return json({ status: videoUrl ? 'COMPLETED' : 'FAILED', videoUrl, seed: result.seed ?? null, error: videoUrl ? null : 'Respuesta sin vídeo' }, 200, h);
  }

  if (url.pathname === '/media' && req.method === 'GET') {
    let target;
    try { target = new URL(url.searchParams.get('url')); } catch { return json({ error: 'URL inválida' }, 400, h); }
    if (target.protocol !== 'https:' || !MEDIA_HOSTS.some(rx => rx.test(target.hostname))) return json({ error: 'Host no permitido' }, 400, h);
    const r = await fetch(target.href);
    if (!r.ok) return json({ error: 'No se pudo descargar el vídeo', status: r.status }, 502, h);
    return new Response(r.body, { status: 200, headers: { ...h, 'Content-Type': r.headers.get('Content-Type') || 'video/mp4', 'Cache-Control': 'no-store' } });
  }

  return json({ error: 'Ruta no encontrada' }, 404, h);
}

export default {
  async fetch(req, env) {
    try { return await route(req, env); }
    catch (e) { return json({ error: 'Error interno: ' + (e?.message || e) }, 500, cors(env, req)); }
  },
  _internals: { MODELS, optionalFields, safeEqual, pickDuration, formatDuration, estimateUsd, buildPayload, validateInputs, extractInputSchema, checkPayloadAgainstSchema }
};
