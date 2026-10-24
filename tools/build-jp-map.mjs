// Genera vault-jp-map.js: cartas JAPONESAS con producto propio en Cardmarket (expansiones japonesas = producto distinto
// del inglés, así que su «desde», tendencia y medias de venta son de cartas japonesas).
// Ejecutar a mano (no es un workflow): node tools/build-jp-map.mjs   ·   sin red: ZZ_DIR=carpeta node tools/build-jp-map.mjs
// Fuentes públicas (GitHub): ZyzyThePizi/pokemon-price-data
//   - catalog/pokellector_jp.json: cartas japonesas (Pokellector) con cmProductId cuando se conoce
//   - prices/products.json: productos de Cardmarket (id, nombre, expansión) · prices/latest.json: guía de precios
// Se DESCARTAN las cartas cuyo producto de Cardmarket tiene otro nombre (Pokellector se equivoca en algunas).
// Versiones: en una expansión japonesa varias cartas comparten nombre (normal, AR, SAR…). Cardmarket numera sus productos
// en el orden de la colección, así que si el set de Pokellector tiene tantas cartas con ese nombre como productos hay,
// y la posición del número coincide con la del idProduct, la versión queda comprobada por orden (f = 8).
// f = 16: ampliación por nombre/orden (ver abajo).
// f = 4: hay otra versión con precio > 2,5 veces mayor o menor y el orden no lo confirma (versión arriesgada).
import { readFileSync, writeFileSync } from 'node:fs';
const B = 'https://raw.githubusercontent.com/ZyzyThePizi/pokemon-price-data/main/', D = process.env.ZZ_DIR;
const LOCAL = { 'catalog/pokellector_jp.json': 'pk_jp.json', 'prices/products.json': 'products.json', 'prices/latest.json': 'latest.json' };
const get = async p => { if (D) return JSON.parse(readFileSync(D + '/' + LOCAL[p], 'utf8')); const r = await fetch(B + p); if (!r.ok) throw new Error(p + ' HTTP ' + r.status); return r.json(); };
const [jp, prod, latest] = await Promise.all([get('catalog/pokellector_jp.json'), get('prices/products.json'), get('prices/latest.json')]);
const TI = latest.fields.indexOf('trend'), trendOf = new Map(latest.rows.map(r => [r[0], r[TI]]));
const norm = s => String(s).split(' [')[0].replace(/\(.*?\)/g, ' ').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const P = new Map(prod.rows.map(r => [r[0], { id: r[0], name: r[1], exp: r[2], base: norm(r[1]) }]));
const byExpName = new Map();
for (const p of P.values()) { const k = p.exp + '|' + p.base; if (!byExpName.has(k)) byExpName.set(k, []); byExpName.get(k).push(p.id); }
const sets = new Map(jp.sets.map(s => [s[0], s]));
const numKey = n => { const m = String(n).match(/\d+/); return m ? Number(m[0]) : 1e9; };
const out = []; const stats = { conProducto: 0, nombreDistinto: 0, sinProductoEnGuia: 0, incluidas: 0, ordenComprobado: 0, versionArriesgada: 0 };
for (const [slug, cards] of Object.entries(jp.cards)) {
  const s = sets.get(slug); if (!s) continue;
  const sameName = new Map(); for (const c of cards) { const k = norm(c[1]); if (!sameName.has(k)) sameName.set(k, []); sameName.get(k).push(c[0]); }
  for (const [number, name, image, pid] of cards) {
    if (pid == null) continue; stats.conProducto++;
    const p = P.get(pid); if (!p) { stats.sinProductoEnGuia++; continue; }
    if (p.base !== norm(name) && !p.base.includes(norm(name))) { stats.nombreDistinto++; continue; }
    const t = trendOf.get(pid), sib = (byExpName.get(p.exp + '|' + p.base) || []).filter(x => x !== pid);
    let f = 0;
    if (sib.length) {
      const nums = (sameName.get(norm(name)) || []).slice().sort((a, b) => numKey(a) - numKey(b)), ids = [pid, ...sib].sort((a, b) => a - b);
      if (nums.length === ids.length && nums.indexOf(number) === ids.indexOf(pid)) { f = 8; stats.ordenComprobado++; }
      else if (sib.some(x => { const u = trendOf.get(x); return t > 0 && u > 0 && (u / t > 2.5 || t / u > 2.5); })) { f = 4; stats.versionArriesgada++; }
    }
    out.push([pid, name, s[2], s[3], number, image || '', f]); stats.incluidas++;
  }
}

// Ampliación: en las expansiones japonesas ya identificadas (por una carta con idProduct), el resto de cartas del set de
// Pokellector se empareja con los productos de esa expansión por nombre; si hay varias versiones, por orden de numeración
// (mismo número de cartas que de productos). f = 16: emparejada por nombre/orden dentro de la expansión (sin id directo).
const have = new Set(out.map(r => r[0])), expOfSet = new Map();
for (const [slug, cards] of Object.entries(jp.cards)) for (const c of cards) if (c[3] != null && P.get(c[3])) { expOfSet.set(slug, P.get(c[3]).exp); break; }
const setsOfExp = new Map(); for (const [slug, e] of expOfSet) { if (!setsOfExp.has(e)) setsOfExp.set(e, []); setsOfExp.get(e).push(slug); }
stats.ampliadas = 0; stats.ampliacionAmbigua = 0;
for (const [e, slugs] of setsOfExp) {
  if (slugs.length !== 1) continue; /* expansión de Cardmarket que agrupa varios sets japoneses: no se adivina */
  const slug = slugs[0], s = sets.get(slug), cards = jp.cards[slug], byName = new Map();
  for (const c of cards) { const k = norm(c[1]); if (!byName.has(k)) byName.set(k, []); byName.get(k).push(c); }
  for (const [k, cs] of byName) {
    const ids = (byName.size && prod.rows.filter(r => r[2] === e && r[3] === 51 && norm(r[1]) === k).map(r => r[0]).sort((a, b) => a - b)) || [];
    if (!ids.length) continue;
    if (ids.length !== cs.length) { stats.ampliacionAmbigua += cs.length; continue; }
    const sorted = cs.slice().sort((a, b) => numKey(a[0]) - numKey(b[0]));
    sorted.forEach((c, i) => { const pid = ids[i]; if (have.has(pid) || c[3] != null) return; have.add(pid);
      out.push([pid, c[1], s[2], s[3], c[0], c[2] || '', 16]); stats.ampliadas++; });
  }
}
const js = '/* Generado por tools/build-jp-map.mjs el ' + new Date().toISOString().slice(0, 10) + ' · ' + JSON.stringify(stats) + ' */\n' +
  'window.CV_JP_MAP=' + JSON.stringify({ imageBase: jp.imageBase, fields: ['idProduct', 'name', 'set', 'setCode', 'number', 'image', 'flags'], cards: out }) + ';\n';
writeFileSync(new URL('../vault-jp-map.js', import.meta.url), js);
console.log(stats);
