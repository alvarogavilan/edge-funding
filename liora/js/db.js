// Liora Studio · almacenamiento local (IndexedDB) del iPhone.
// Base propia «liora_studio». El panel principal (index.html) usa «liora_assets» v1 con el almacén
// "files"/"master": aquí solo se LEE, sin cambiar su versión, para que ambas páginas convivan.
const DB_NAME = 'liora_studio';
const DB_VERSION = 1;
const LEGACY_DB = 'liora_assets';
export const STORES = ['refs', 'projects', 'blobs', 'trends', 'posts', 'kv'];

let dbPromise = null;

export function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('Cierra otras pestañas de Liora Studio y recarga.'));
  });
  return dbPromise;
}

function run(store, mode, fn) {
  return openDb().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const os = tx.objectStore(store);
    let result;
    const req = fn(os);
    if (req) req.onsuccess = () => { result = req.result; };
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Transacción cancelada (¿almacenamiento lleno?)'));
  }));
}

export const get = (store, key) => run(store, 'readonly', os => os.get(key));
export const put = (store, key, value) => run(store, 'readwrite', os => os.put(value, key));
export const del = (store, key) => run(store, 'readwrite', os => os.delete(key));
export const keys = store => run(store, 'readonly', os => os.getAllKeys());
export const all = store => run(store, 'readonly', os => os.getAll());

export function uid(prefix = 'id') {
  const r = crypto.getRandomValues(new Uint32Array(2));
  return prefix + '_' + Date.now().toString(36) + r[0].toString(36) + r[1].toString(36);
}

// Abre «liora_assets» sin versión (no la actualiza). Si no existe, aborta la creación para no dejar
// una base vacía que rompería el panel principal.
function readLegacyMaster() {
  return new Promise(resolve => {
    let req;
    try { req = indexedDB.open(LEGACY_DB); } catch { resolve(null); return; }
    req.onupgradeneeded = () => { req.transaction.abort(); };
    req.onerror = () => resolve(null);
    req.onsuccess = () => {
      const ldb = req.result;
      if (!ldb.objectStoreNames.contains('files')) { ldb.close(); resolve(null); return; }
      const g = ldb.transaction('files', 'readonly').objectStore('files').get('master');
      g.onsuccess = () => { ldb.close(); resolve(g.result instanceof Blob ? g.result : null); };
      g.onerror = () => { ldb.close(); resolve(null); };
    };
  });
}

// Migra los datos de la versión anterior sin borrarlos (localStorage + files/master).
export async function migrateLegacy() {
  const report = [];
  // La foto maestra se importa siempre que el estudio no tenga ninguna referencia todavía.
  const legacyMaster = await readLegacyMaster();
  if (legacyMaster instanceof Blob) {
    const existing = await all('refs');
    // Una referencia secundaria no debe bloquear la recuperación del avatar maestro.
    // Nunca reemplazamos una fotografía que ya esté marcada como oficial.
    if (!existing.some(ref => ref.official)) {
      const id = uid('ref');
      await put('refs', id, {
        id, kind: 'master', angle: 'frontal', blob: legacyMaster,
        name: legacyMaster.name || 'retrato-maestro', addedAt: new Date().toISOString(),
        descriptor: null, official: true, source: 'importada del panel principal (liora_assets/master)'
      });
      report.push('Retrato maestro del panel principal importado como referencia oficial (el original no se modifica).');
    }
  }
  if (await get('kv', 'migrated_v2')) return report;
  const read = k => { try { return JSON.parse(localStorage.getItem('liora_' + k)); } catch { return null; } };
  const trends = read('trends');
  if (Array.isArray(trends)) {
    for (const t of trends) {
      const id = uid('trend');
      await put('trends', id, { id, url: t.url, notes: t.note || '', createdAt: new Date().toISOString(), metrics: null, legacy: true });
    }
    if (trends.length) report.push(trends.length + ' referencias de tendencias migradas (métricas sin verificar).');
  }
  const project = read('project');
  const rules = read('rules');
  const review = read('review');
  await put('kv', 'legacy_snapshot', { project, rules, review, at: new Date().toISOString() });
  await put('kv', 'migrated_v2', true);
  return report;
}

export async function storageEstimate() {
  try {
    const persisted = navigator.storage?.persisted ? await navigator.storage.persisted() : false;
    const est = navigator.storage?.estimate ? await navigator.storage.estimate() : null;
    return { persisted, usage: est?.usage ?? null, quota: est?.quota ?? null };
  } catch { return { persisted: false, usage: null, quota: null }; }
}

export async function requestPersistence() {
  try { return navigator.storage?.persist ? await navigator.storage.persist() : false; } catch { return false; }
}
