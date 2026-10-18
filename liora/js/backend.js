// Liora Studio · cliente del backend privado (Cloudflare Worker).
// La URL del Worker no es secreta y se recuerda; la clave de acceso SOLO vive en memoria
// (se pierde al cerrar la pestaña; el llavero de iCloud puede rellenarla en el formulario).
let accessKey = null;

export function backendUrl() {
  try { return localStorage.getItem('liora_backend_url') || ''; } catch { return ''; }
}

export function setBackendUrl(u) {
  const clean = (u || '').trim().replace(/\/+$/, '');
  if (clean && !/^https:\/\//.test(clean) && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(clean)) throw new Error('La URL del backend debe empezar por https://');
  try { localStorage.setItem('liora_backend_url', clean); } catch { /* modo privado */ }
}

export function setAccessKey(k) { accessKey = k || null; }
export function hasAccessKey() { return !!accessKey; }

async function call(path, opts = {}) {
  const base = backendUrl();
  if (!base) throw new Error('Backend sin configurar.');
  const headers = { ...(opts.headers || {}) };
  if (accessKey) headers.Authorization = 'Bearer ' + accessKey;
  if (opts.body && typeof opts.body !== 'string') { headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(opts.body); }
  const r = await fetch(base + path, { ...opts, headers });
  if (opts.raw) { if (!r.ok) throw new Error('HTTP ' + r.status); return r; }
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(data.error || 'HTTP ' + r.status); e.status = r.status; e.data = data; throw e; }
  return data;
}

export const health = () => call('/health');
export const config = () => call('/config');
export const verifyModels = () => call('/models/verify');
export const submitJob = (model, inputs, confirmUsd) => call('/jobs', { method: 'POST', body: { model, inputs, confirmUsd } });
export const jobStatus = id => call('/jobs/' + encodeURIComponent(id));

export async function fetchResultVideo(videoUrl) {
  const r = await call('/media?url=' + encodeURIComponent(videoUrl), { raw: true });
  return await r.blob();
}
