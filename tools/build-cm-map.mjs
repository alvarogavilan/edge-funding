// Genera vault-cm-map.js: carta del catálogo (id TCGdex) → producto de Cardmarket (idProduct), con avisos de calidad.
// Ejecutar a mano (no es un workflow): node tools/build-cm-map.mjs
// Fuentes públicas (GitHub, CORS abierto): ZyzyThePizi/pokemon-price-data
//   - catalog/v2/cards-en.json: cartas de TCGdex con el idProduct de Cardmarket por variante (h, n, r…)
//   - prices/products.json: productos de Cardmarket (id, nombre, expansión)
// Avisos (f, máscara de bits):
//   1 = colisión: otra carta del MISMO set apunta al mismo producto (TCGdex lo ha asignado mal a una de las dos)
//   2 = el nombre del producto no coincide con el de la carta
//   4 = hay otra versión con el mismo nombre cuyo precio de tendencia es > 2,5 veces mayor o menor: la asignación es
//       arriesgada (caso Umbreon Aquapolis H29: TCGdex apunta al producto de 98 € y el correcto es el de 748 €)
// c = otros productos con el mismo nombre en la misma expansión (versiones candidatas para resolver con una 2.ª fuente)
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
const B = 'https://raw.githubusercontent.com/ZyzyThePizi/pokemon-price-data/main/';
const get = async p => { const r = await fetch(B + p); if (!r.ok) throw new Error(p + ' HTTP ' + r.status); return r.json(); };
const ctx = { window: {} }; vm.createContext(ctx); vm.runInContext(readFileSync(new URL('../vault-universe.js', import.meta.url), 'utf8'), ctx);
const U = ctx.window.CV_UNIVERSE.cards;
const [cat, prod, latest] = await Promise.all([get('catalog/v2/cards-en.json'), get('prices/products.json'), get('prices/latest.json')]);
const TI = latest.fields.indexOf('trend'), trendOf = new Map(latest.rows.map(r => [r[0], r[TI]]));
const norm = s => String(s).split(' [')[0].replace(/\(.*?\)/g, ' ').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const P = new Map(prod.rows.map(r => [r[0], { id: r[0], name: r[1], exp: r[2], base: norm(r[1]) }]));
const byExpName = new Map();
for (const p of P.values()) { const k = p.exp + '|' + p.base; if (!byExpName.has(k)) byExpName.set(k, []); byExpName.get(k).push(p.id); }
const rows = new Map(cat.rows.map(r => [r[0], r]));
const pick = r => { const v = r[12] || []; return (v.find(x => x[0] === 'h' && x[1]) || v.find(x => x[0] === 'n' && x[1]) || v.find(x => x[1]))?.[1] ?? null; };
const setOf = id => id.slice(0, id.lastIndexOf('-'));
const usersBySetProd = new Map();
for (const r of cat.rows) { const id = pick(r); if (!id) continue; const k = setOf(r[0]) + '|' + id; usersBySetProd.set(k, (usersBySetProd.get(k) || 0) + 1); }
const out = {}; const stats = { universe: U.length, mapped: 0, sinProducto: 0, colision: 0, nombre: 0, versionArriesgada: 0, conCandidatas: 0 };
for (const u of U) {
  const r = rows.get(u[0]); const id = r && pick(r); const p = id && P.get(id);
  if (!p) { stats.sinProducto++; continue; }
  let f = 0;
  if ((usersBySetProd.get(setOf(u[0]) + '|' + id) || 0) > 1) f |= 1;
  const cn = norm(u[1]);
  if (!(p.base.startsWith(cn.slice(0, 6)) || cn.startsWith(p.base.slice(0, 6)))) f |= 2;
  const cands = (byExpName.get(p.exp + '|' + p.base) || []).filter(x => x !== id);
  const t0 = trendOf.get(id);
  if (cands.some(x => { const t = trendOf.get(x); return t > 0 && t0 > 0 && (t / t0 > 2.5 || t0 / t > 2.5); })) f |= 4;
  out[u[0]] = cands.length ? [id, f, ...cands] : [id, f];
  stats.mapped++; if (f & 1) stats.colision++; if (f & 2) stats.nombre++; if (f & 4) stats.versionArriesgada++; if (cands.length) stats.conCandidatas++;
}
const header = '/* Card Vault V116 · catálogo → producto de Cardmarket. Generado el ' + new Date().toISOString().slice(0, 10) +
  ' con tools/build-cm-map.mjs a partir de ZyzyThePizi/pokemon-price-data (TCGdex + productos de Cardmarket).\n' +
  '   Formato: id TCGdex → [idProduct, avisos, ...otras versiones con el mismo nombre en la expansión]. Avisos: 1 colisión, 2 nombre distinto, 4 versión arriesgada (otra versión con precio muy distinto).\n' +
  '   ' + JSON.stringify(stats) + ' */\n';
writeFileSync(new URL('../vault-cm-map.js', import.meta.url), header + 'window.CV_CM_MAP=' + JSON.stringify(out) + ';\n');
console.log(stats);
