// Liora Studio · almacenamiento local (IndexedDB) del iPhone.
// Versión 1 (app anterior) solo tenía el almacén "files" con la clave "master".
// La versión 2 conserva "files" intacto y añade los almacenes de producción.
const DB_NAME = 'liora_assets';
const DB_VERSION = 2;
export const STORES = ['files', 'refs', 'projects', 'blobs', 'trends', 'posts', 'kv'];

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

// Migra los datos de la versión anterior sin borrarlos (localStorage + files/master).
export async function migrateLegacy() {
  if (await get('kv', 'migrated_v2')) return null;
  const report = [];
  const legacyMaster = await get('files', 'master');
  if (legacyMaster instanceof Blob) {
    const existing = await all('refs');
    if (!existing.length) {
      const id = uid('ref');
      await put('refs', id, {
        id, kind: 'master', angle: 'frontal', blob: legacyMaster,
        name: legacyMaster.name || 'retrato-maestro', addedAt: new Date().toISOString(),
        descriptor: null, official: true, source: 'migrada de la versión anterior'
      });
      report.push('Retrato maestro anterior conservado como referencia oficial.');
    }
  }
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
