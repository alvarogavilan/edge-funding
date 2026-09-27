/* Card Vault · Market Collector · Cloudflare Worker (módulo ES, un solo archivo)
   Históricos diarios propios + ofertas ejecutables + verificación de certificados.

   Fuentes (todas legítimas, sin scraping):
   - TCGdex  (api.tcgdex.net)  → Pokémon: agregados Cardmarket (EUR) y TCGplayer (USD). Son REFERENCIAS AGREGADAS, no ventas.
   - Lorcast (api.lorcast.com) → Lorcana: precio TCGplayer (USD) normal / foil. Referencia agregada.
   - CardTrader API v2 (token del usuario) → ofertas REALES ejecutables (precio, condición, idioma, vendedor,
     CardTrader Zero), incluidas cartas japonesas y producto sellado. Historial de ASKS (no ventas).
   - PSA Public API (token del usuario, 100 llamadas/día) → verificación de certificados.
   - Frankfurter (tipos BCE) → conversión USD→EUR.
   Cardmarket y eBay NO se consultan: Cardmarket solo como enlace de búsqueda, eBay excluido.

   Plan gratuito: cron cada 2 min, lotes pequeños (≤ BATCH subpeticiones), presupuesto diario de escrituras D1. */

const VERSION = "1.0.1";
const TCGDEX = "https://api.tcgdex.net/v2/en";
const LORCAST = "https://api.lorcast.com/v0";
const CT = "https://api.cardtrader.com/api/v2";
const PSA = "https://api.psacard.com/publicapi";
const FX = "https://api.frankfurter.app/latest?from=USD&to=EUR";
const WRITE_BUDGET = 70000; // margen PRIME bajo D1 Free (100.000 filas/día); nunca intenta apurar el límite

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS products(id TEXT PRIMARY KEY, universe TEXT, source TEXT, ext_id TEXT, name TEXT, set_id TEXT, set_name TEXT, number TEXT, rarity TEXT, image TEXT, tcgplayer_id INTEGER, url TEXT, updated_at TEXT)`,
  `CREATE INDEX IF NOT EXISTS products_name ON products(universe, name)`,
  `CREATE INDEX IF NOT EXISTS products_number ON products(universe, number)`,
  `CREATE TABLE IF NOT EXISTS prices(product_id TEXT, day TEXT, cm_trend REAL, cm_avg REAL, cm_low REAL, cm_avg1 REAL, cm_avg7 REAL, cm_avg30 REAL, cm_trend_holo REAL, cm_avg30_holo REAL, tp_market REAL, tp_low REAL, tp_market_foil REAL, fx_usd_eur REAL, src_updated TEXT, PRIMARY KEY(product_id, day))`,
  `CREATE TABLE IF NOT EXISTS offers(product_id TEXT, day TEXT, fetched_at TEXT, blueprint_id INTEGER, lang TEXT, condition TEXT, finish TEXT, price REAL, currency TEXT, price_eur REAL, seller TEXT, country TEXT, zero INTEGER, qty INTEGER, graded INTEGER, url TEXT)`,
  `CREATE INDEX IF NOT EXISTS offers_pd ON offers(product_id, day)`,
  `CREATE TABLE IF NOT EXISTS offer_stats(product_id TEXT, day TEXT, n_listings INTEGER, n_nm INTEGER, min_nm_eur REAL, median_nm_eur REAL, zero_min_eur REAL, units INTEGER, PRIMARY KEY(product_id, day))`,
  `CREATE TABLE IF NOT EXISTS tracked(product_id TEXT PRIMARY KEY, label TEXT, universe TEXT, lang TEXT, condition TEXT, priority INTEGER, blueprint_id INTEGER, blueprint_confirmed INTEGER, added_at TEXT, last_offers_day TEXT)`,
  `CREATE TABLE IF NOT EXISTS ct_expansions(id INTEGER PRIMARY KEY, game_id INTEGER, code TEXT, name TEXT, synced_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS ct_blueprints(id INTEGER PRIMARY KEY, game_id INTEGER, expansion_id INTEGER, expansion_name TEXT, name TEXT, version TEXT, number TEXT, category_id INTEGER, tcgplayer_id INTEGER, cardmarket_ids TEXT, image TEXT)`,
  `CREATE INDEX IF NOT EXISTS ct_bp_name ON ct_blueprints(game_id, name)`,
  `CREATE INDEX IF NOT EXISTS ct_bp_tcgp ON ct_blueprints(tcgplayer_id)`,
  `CREATE TABLE IF NOT EXISTS kv(k TEXT PRIMARY KEY, v TEXT)`,
  `CREATE TABLE IF NOT EXISTS fx(day TEXT PRIMARY KEY, usd_eur REAL)`,
  `CREATE TABLE IF NOT EXISTS certs(cert TEXT PRIMARY KEY, fetched_at TEXT, json TEXT)`,
  `CREATE TABLE IF NOT EXISTS runs(id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT, phase TEXT, n INTEGER, ms INTEGER, error TEXT)`
];

let schemaReady = false;
async function ensureSchema(env) {
  if (schemaReady) return;
  await env.DB.batch(SCHEMA.map(s => env.DB.prepare(s)));
  schemaReady = true;
}

/* ---------- utilidades ---------- */
const day = (d = new Date()) => d.toISOString().slice(0, 10);
const num = v => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : null; };
const norm = v => String(v ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const numKey = v => { const m = String(v ?? "").match(/[A-Za-z]*\d+/); return m ? m[0].replace(/^0+(?=\d)/, "").toLowerCase() : ""; };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function kvGet(env, k, def = null) { const r = await env.DB.prepare("SELECT v FROM kv WHERE k=?").bind(k).first(); if (!r) return def; try { return JSON.parse(r.v); } catch { return def; } }
async function kvSet(env, k, v) { await env.DB.prepare("INSERT INTO kv(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v").bind(k, JSON.stringify(v)).run(); }
async function addWrites(env, n) { const k = "writes:" + day(); const c = (await kvGet(env, k, 0)) + n; await kvSet(env, k, c); return c; }
async function writesToday(env) { return await kvGet(env, "writes:" + day(), 0); }

async function getJSON(url, headers = {}) {
  const r = await fetch(url, { headers: { "accept": "application/json", "user-agent": "CardVault-Collector/" + VERSION, ...headers } });
  if (r.status === 429) throw new Error("429 " + url);
  if (!r.ok) throw new Error(r.status + " " + url);
  return r.json();
}
const ctHeaders = env => ({ authorization: "Bearer " + env.CARDTRADER_TOKEN });
const asArray = x => Array.isArray(x) ? x : Array.isArray(x?.array) ? x.array : Array.isArray(x?.results) ? x.results : Array.isArray(x?.data) ? x.data : [];

/* ---------- FX ---------- */
async function fxToday(env) {
  const d = day();
  const r = await env.DB.prepare("SELECT usd_eur FROM fx WHERE day<=? ORDER BY day DESC LIMIT 1").bind(d).first();
  return r ? r.usd_eur : null;
}
async function phaseFx(env) {
  const d = day();
  const have = await env.DB.prepare("SELECT 1 FROM fx WHERE day=?").bind(d).first();
  if (have) return 0;
  const j = await getJSON(FX);
  const rate = num(j?.rates?.EUR);
  if (!rate) throw new Error("FX sin EUR");
  await env.DB.prepare("INSERT OR REPLACE INTO fx(day,usd_eur) VALUES(?,?)").bind(d, rate).run();
  await addWrites(env, 1);
  return 1;
}

/* ---------- Pokémon · catálogo (semanal) ---------- */
async function phasePokemonCatalog(env, budget) {
  let st = await kvGet(env, "pkm:catalog", null);
  const week = day().slice(0, 8) + String(Math.floor(new Date().getUTCDate() / 7));
  if (st && st.done && st.week === week) return 0;
  if (!st || st.week !== week) {
    const sets = asArray(await getJSON(TCGDEX + "/sets")).map(s => s.id).filter(Boolean);
    st = { week, sets, i: 0, done: false };
    budget--;
  }
  let n = 0;
  while (budget > 0 && st.i < st.sets.length) {
    const s = await getJSON(TCGDEX + "/sets/" + encodeURIComponent(st.sets[st.i]));
    const now = new Date().toISOString();
    const stmts = (s.cards || []).map(c => env.DB.prepare(
      `INSERT INTO products(id,universe,source,ext_id,name,set_id,set_name,number,rarity,image,tcgplayer_id,url,updated_at)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET name=excluded.name,set_name=excluded.set_name,number=excluded.number,image=excluded.image,updated_at=excluded.updated_at`
    ).bind("pkm:" + c.id, "pokemon", "tcgdex", c.id, c.name || "", s.id, s.name || "", String(c.localId ?? ""), "", c.image ? c.image + "/low.webp" : "", null, "", now));
    if (stmts.length) { await env.DB.batch(stmts); await addWrites(env, stmts.length); n += stmts.length; }
    st.i++; budget--;
  }
  if (st.i >= st.sets.length) st.done = true;
  await kvSet(env, "pkm:catalog", st);
  return n;
}

/* ---------- Pokémon · precios diarios (prioridad: seguidos) ---------- */
function pokemonPriceRow(id, c, fx) {
  const cm = c?.pricing?.cardmarket || {}, tp = c?.pricing?.tcgplayer || {};
  const tpVariants = Object.entries(tp).filter(([k, v]) => v && typeof v === "object");
  const normal = tpVariants.find(([k]) => k === "normal")?.[1] || tpVariants.find(([k]) => !/reverse|foil|holo/i.test(k))?.[1] || null;
  const foil = tpVariants.find(([k]) => /holo|foil|reverse/i.test(k))?.[1] || null;
  return [id, day(), num(cm.trend), num(cm.avg), num(cm.low), num(cm.avg1), num(cm.avg7), num(cm.avg30), num(cm["trend-holo"]), num(cm["avg30-holo"]),
    num(normal?.marketPrice), num(normal?.lowPrice), num(foil?.marketPrice), fx, cm.updated || tp.updated || null];
}
const PRICE_SQL = `INSERT OR REPLACE INTO prices(product_id,day,cm_trend,cm_avg,cm_low,cm_avg1,cm_avg7,cm_avg30,cm_trend_holo,cm_avg30_holo,tp_market,tp_low,tp_market_foil,fx_usd_eur,src_updated) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

async function phasePokemonPrices(env, budget) {
  const d = day();
  const tracked = await env.DB.prepare(
    `SELECT t.product_id id, p.ext_id ext FROM tracked t JOIN products p ON p.id=t.product_id
     WHERE t.universe='pokemon' AND p.source='tcgdex' AND NOT EXISTS(SELECT 1 FROM prices x WHERE x.product_id=t.product_id AND x.day=?)
     ORDER BY t.priority DESC LIMIT ?`).bind(d, budget).all();
  let rows = tracked.results || [];
  if (rows.length < budget && (await writesToday(env)) < WRITE_BUDGET) {
    const cur = await kvGet(env, "pkm:cursor:" + d, "");
    const more = await env.DB.prepare(
      `SELECT id, ext_id ext FROM products WHERE universe='pokemon' AND source='tcgdex' AND id>? ORDER BY id LIMIT ?`).bind(cur, budget - rows.length).all();
    const extra = more.results || [];
    if (extra.length) await kvSet(env, "pkm:cursor:" + d, extra[extra.length - 1].id);
    rows = rows.concat(extra);
  }
  if (!rows.length) return 0;
  const fx = await fxToday(env);
  const stmts = [];
  for (const r of rows) {
    try {
      const c = await getJSON(TCGDEX + "/cards/" + encodeURIComponent(r.ext));
      if (!c?.pricing) continue;
      const row = pokemonPriceRow(r.id, c, fx);
      if (row.slice(2, 13).some(v => v != null)) stmts.push(env.DB.prepare(PRICE_SQL).bind(...row));
      if (c.rarity) stmts.push(env.DB.prepare("UPDATE products SET rarity=? WHERE id=? AND (rarity IS NULL OR rarity='')").bind(c.rarity, r.id));
    } catch (e) { if (String(e.message).startsWith("429")) break; }
  }
  if (stmts.length) { await env.DB.batch(stmts); await addWrites(env, stmts.length); }
  return stmts.length;
}

/* ---------- Lorcana · catálogo + precios diarios ---------- */
async function phaseLorcana(env, budget) {
  const d = day();
  let st = await kvGet(env, "lor:daily", null);
  if (st && st.day === d && st.done) return 0;
  if (!st || st.day !== d) {
    const sets = asArray(await getJSON(LORCAST + "/sets")).map(s => ({ id: s.id, code: s.code, name: s.name }));
    st = { day: d, sets, i: 0, done: false }; budget--;
  }
  const fx = await fxToday(env);
  let n = 0;
  while (budget > 0 && st.i < st.sets.length) {
    const s = st.sets[st.i];
    const cards = asArray(await getJSON(LORCAST + "/sets/" + encodeURIComponent(s.id) + "/cards"));
    const now = new Date().toISOString(), stmts = [];
    for (const c of cards) {
      const id = "lor:" + c.id;
      stmts.push(env.DB.prepare(
        `INSERT INTO products(id,universe,source,ext_id,name,set_id,set_name,number,rarity,image,tcgplayer_id,url,updated_at)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET tcgplayer_id=excluded.tcgplayer_id,updated_at=excluded.updated_at`
      ).bind(id, "lorcana", "lorcast", c.id, [c.name, c.version].filter(Boolean).join(" - "), s.code || s.id, s.name || "", String(c.collector_number ?? ""), c.rarity || "",
        c.image_uris?.digital?.small || "", c.tcgplayer_id || null, c.purchase_uris?.tcgplayer || "", now));
      const usd = num(c.prices?.usd), foil = num(c.prices?.usd_foil);
      if (usd || foil) stmts.push(env.DB.prepare(PRICE_SQL).bind(id, d, null, null, null, null, null, null, null, null, usd, null, foil, fx, null));
    }
    if (stmts.length) { await env.DB.batch(stmts); await addWrites(env, stmts.length); n += stmts.length; }
    st.i++; budget--;
    await sleep(80);
  }
  if (st.i >= st.sets.length) st.done = true;
  await kvSet(env, "lor:daily", st);
  return n;
}

/* ---------- CardTrader · expansiones + blueprints (semanal, requiere token) ---------- */
async function ctGames(env) {
  let g = await kvGet(env, "ct:games", null);
  if (g && g.at === day()) return g;
  const games = asArray(await getJSON(CT + "/games", ctHeaders(env)));
  const find = re => games.find(x => re.test(String(x.name || x.display_name || "")))?.id || null;
  g = { at: day(), pokemon: find(/pok[eé]mon/i), lorcana: find(/lorcana/i) };
  await kvSet(env, "ct:games", g);
  return g;
}
async function phaseCtBlueprints(env, budget) {
  if (!env.CARDTRADER_TOKEN) return 0;
  if ((await writesToday(env)) > WRITE_BUDGET * 0.6) return 0;
  const week = day().slice(0, 8) + String(Math.floor(new Date().getUTCDate() / 7));
  let st = await kvGet(env, "ct:bp", null);
  if (st && st.done && st.week === week) return 0;
  if (!st || st.week !== week) {
    const g = await ctGames(env); budget--;
    const exps = asArray(await getJSON(CT + "/expansions", ctHeaders(env))).filter(e => [g.pokemon, g.lorcana].includes(e.game_id)); budget--;
    const stmts = exps.map(e => env.DB.prepare("INSERT INTO ct_expansions(id,game_id,code,name,synced_at) VALUES(?,?,?,?,NULL) ON CONFLICT(id) DO UPDATE SET name=excluded.name,code=excluded.code").bind(e.id, e.game_id, e.code || "", e.name || ""));
    for (let i = 0; i < stmts.length; i += 100) await env.DB.batch(stmts.slice(i, i + 100));
    await addWrites(env, stmts.length);
    const pending = await env.DB.prepare("SELECT id FROM ct_expansions WHERE synced_at IS NULL ORDER BY id DESC").all();
    st = { week, exps: (pending.results || []).map(r => r.id), i: 0, done: false };
  }
  let n = 0;
  while (budget > 0 && st.i < st.exps.length) {
    const expId = st.exps[st.i];
    const exp = await env.DB.prepare("SELECT name FROM ct_expansions WHERE id=?").bind(expId).first();
    const bps = asArray(await getJSON(CT + "/blueprints/export?expansion_id=" + expId, ctHeaders(env)));
    const stmts = bps.map(b => {
      const fp = b.fixed_properties || {};
      const number = fp.collector_number || fp.pokemon_number || fp.lorcana_number || fp.number || "";
      return env.DB.prepare(`INSERT INTO ct_blueprints(id,game_id,expansion_id,expansion_name,name,version,number,category_id,tcgplayer_id,cardmarket_ids,image)
        VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET number=excluded.number,tcgplayer_id=excluded.tcgplayer_id`)
        .bind(b.id, b.game_id || null, expId, exp?.name || "", b.name || "", b.version || "", String(number), b.category_id || null,
          b.tcg_player_id || null, JSON.stringify(b.card_market_ids || []), b.image_url || b.image?.url || "");
    });
    for (let i = 0; i < stmts.length; i += 100) await env.DB.batch(stmts.slice(i, i + 100));
    await env.DB.prepare("UPDATE ct_expansions SET synced_at=? WHERE id=?").bind(new Date().toISOString(), expId).run();
    await addWrites(env, stmts.length + 1); n += stmts.length;
    st.i++; budget--;
    await sleep(120);
  }
  if (st.i >= st.exps.length) st.done = true;
  await kvSet(env, "ct:bp", st);
  return n;
}

/* ---------- CardTrader · ofertas de lo seguido (diario) ---------- */
function parseProps(p = {}) {
  let lang = "", condition = "", finish = [];
  for (const [k, v] of Object.entries(p || {})) {
    if (/language$/i.test(k)) lang = String(v || "");
    else if (k === "condition") condition = String(v || "");
    else if (/foil|reverse|holo|first_edition|edition/i.test(k) && v === true) finish.push(k.replace(/^(pokemon|lorcana)_/, ""));
  }
  return { lang, condition, finish: finish.join(",") };
}
const NM = /near mint|mint/i;
async function phaseOffers(env, budget) {
  if (!env.CARDTRADER_TOKEN) return 0;
  const d = day();
  const rows = (await env.DB.prepare(
    `SELECT product_id, blueprint_id, lang FROM tracked WHERE blueprint_id IS NOT NULL AND blueprint_confirmed=1 AND (last_offers_day IS NULL OR last_offers_day<>?) ORDER BY priority DESC LIMIT ?`
  ).bind(d, Math.min(budget, 8)).all()).results || [];
  if (!rows.length) return 0;
  const fx = await fxToday(env);
  let n = 0;
  for (const t of rows) {
    let list;
    try {
      const j = await getJSON(CT + "/marketplace/products?blueprint_id=" + t.blueprint_id, ctHeaders(env));
      list = Array.isArray(j) ? j : (j[String(t.blueprint_id)] || asArray(j));
    } catch (e) { if (String(e.message).startsWith("429")) break; continue; }
    const now = new Date().toISOString(), offers = [];
    for (const p of list || []) {
      if (p.on_vacation) continue;
      const pr = parseProps(p.properties_hash), cur = p.price?.currency || "EUR", price = (p.price?.cents ?? 0) / 100;
      if (!(price > 0)) continue;
      const eur = cur === "EUR" ? price : cur === "USD" && fx ? price * fx : null;
      offers.push({ lang: pr.lang, condition: pr.condition, finish: pr.finish, price, cur, eur, seller: p.user?.username || "", country: p.user?.country_code || "",
        zero: p.user?.can_sell_via_hub ? 1 : 0, qty: p.quantity || 1, graded: p.graded ? 1 : 0 });
    }
    const wantLang = String(t.lang || "").toLowerCase();
    const pool = wantLang ? offers.filter(o => !o.lang || o.lang.toLowerCase() === wantLang) : offers;
    const nm = pool.filter(o => NM.test(o.condition) && !o.graded && o.eur != null).sort((a, b) => a.eur - b.eur);
    const best = [...nm.slice(0, 5), ...pool.filter(o => o.zero && o.eur != null).sort((a, b) => a.eur - b.eur).slice(0, 2), ...pool.filter(o => o.graded && o.eur != null).sort((a, b) => a.eur - b.eur).slice(0, 2)];
    const seen = new Set(), keep = best.filter(o => { const k = o.seller + o.price + o.condition + o.lang; if (seen.has(k)) return false; seen.add(k); return true; });
    const url = "https://www.cardtrader.com/cards/" + t.blueprint_id;
    const stmts = [env.DB.prepare("DELETE FROM offers WHERE product_id=? AND day=?").bind(t.product_id, d)];
    for (const o of keep) stmts.push(env.DB.prepare(`INSERT INTO offers(product_id,day,fetched_at,blueprint_id,lang,condition,finish,price,currency,price_eur,seller,country,zero,qty,graded,url) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(t.product_id, d, now, t.blueprint_id, o.lang, o.condition, o.finish, o.price, o.cur, o.eur, o.seller, o.country, o.zero, o.qty, o.graded, url));
    const med = nm.length ? nm[Math.floor(nm.length / 2)].eur : null;
    const zmin = pool.filter(o => o.zero && NM.test(o.condition) && o.eur != null).sort((a, b) => a.eur - b.eur)[0]?.eur ?? null;
    stmts.push(env.DB.prepare("INSERT OR REPLACE INTO offer_stats(product_id,day,n_listings,n_nm,min_nm_eur,median_nm_eur,zero_min_eur,units) VALUES(?,?,?,?,?,?,?,?)")
      .bind(t.product_id, d, pool.length, nm.length, nm[0]?.eur ?? null, med, zmin, pool.reduce((a, o) => a + (o.qty || 1), 0)));
    stmts.push(env.DB.prepare("UPDATE tracked SET last_offers_day=? WHERE product_id=?").bind(d, t.product_id));
    await env.DB.batch(stmts); await addWrites(env, stmts.length); n += keep.length;
    await sleep(120);
  }
  return n;
}

/* ---------- orquestación ---------- */
async function logRun(env, phase, n, ms, error = null) {
  await env.DB.batch([
    env.DB.prepare("INSERT INTO runs(at,phase,n,ms,error) VALUES(?,?,?,?,?)").bind(new Date().toISOString(), phase, n, ms, error),
    env.DB.prepare("DELETE FROM runs WHERE id < (SELECT MAX(id)-500 FROM runs)")
  ]);
}
const PHASES = { fx: phaseFx, offers: phaseOffers, lorcana: phaseLorcana, pokemonCatalog: phasePokemonCatalog, pokemonPrices: phasePokemonPrices, ctBlueprints: phaseCtBlueprints };
async function tick(env, only = null) {
  await ensureSchema(env);
  const budget = Math.max(5, Math.min(45, Number(env.BATCH) || 30));
  const order = only ? [only] : ["fx", "offers", "lorcana", "pokemonCatalog", "pokemonPrices", "ctBlueprints"];
  const out = [];
  for (const name of order) {
    const t0 = Date.now();
    try {
      const n = await PHASES[name](env, name === "fx" ? 1 : budget);
      out.push({ phase: name, n });
      if (n) await logRun(env, name, n, Date.now() - t0);
      if (n && !only) break; // una fase con trabajo por ejecución: respeta límites del plan gratuito
    } catch (e) {
      out.push({ phase: name, error: String(e.message || e) });
      await logRun(env, name, 0, Date.now() - t0, String(e.message || e).slice(0, 300));
      if (!only) break;
    }
  }
  return out;
}

/* ---------- señales sobre histórico propio ---------- */
function pct(sorted, p) { if (!sorted.length) return null; const i = (sorted.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i); return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo); }
function rankOf(sorted, v) { if (!sorted.length || v == null) return null; let below = 0; for (const x of sorted) if (x < v) below++; return Math.round(below / sorted.length * 100); }
function seriesValue(r) {
  if (r.cm_trend) return { v: r.cm_trend, basis: "cardmarket-trend" };
  if (r.cm_avg30) return { v: r.cm_avg30, basis: "cardmarket-avg30" };
  if (r.tp_market && r.fx_usd_eur) return { v: r.tp_market * r.fx_usd_eur, basis: "tcgplayer-market-eur" };
  if (r.tp_market_foil && r.fx_usd_eur) return { v: r.tp_market_foil * r.fx_usd_eur, basis: "tcgplayer-foil-eur" };
  return null;
}
function signalsFrom(points, asks = []) {
  const pts = points.filter(p => p.v > 0).sort((a, b) => a.day.localeCompare(b.day));
  const n = pts.length, last = pts[n - 1] || null;
  const within = days => { if (!last) return []; const from = new Date(Date.parse(last.day) - days * 864e5).toISOString().slice(0, 10); return pts.filter(p => p.day >= from).map(p => p.v); };
  const at = days => { if (!last) return null; const target = new Date(Date.parse(last.day) - days * 864e5).toISOString().slice(0, 10); const c = pts.filter(p => p.day <= target).pop(); return c ? c.v : null; };
  const ch = days => { const b = at(days); return b && last ? (last.v - b) / b * 100 : null; };
  const w90 = within(90).sort((a, b) => a - b), w180 = within(180).sort((a, b) => a - b), w365 = within(365).sort((a, b) => a - b);
  const w30 = within(30), mean30 = w30.length ? w30.reduce((a, b) => a + b, 0) / w30.length : null;
  const sd30 = w30.length > 1 ? Math.sqrt(w30.reduce((a, b) => a + (b - mean30) ** 2, 0) / (w30.length - 1)) : null;
  let peak = 0, dd = 0; for (const v of within(90)) { peak = Math.max(peak, v); dd = Math.min(dd, (v - peak) / peak); }
  const win = w180.length >= 60 ? w180 : w90, rank = rankOf(win, last?.v ?? null);
  let zone = "INSUFICIENTE";
  if (n >= 30 && rank != null) zone = rank <= 20 ? "BAJA" : rank >= 80 ? "ALTA" : "MEDIA";
  const ask = asks.filter(a => a.min_nm_eur > 0).sort((a, b) => a.day.localeCompare(b.day)).pop() || null;
  return {
    points: n, firstDay: pts[0]?.day || null, lastDay: last?.day || null, last: last?.v ?? null, basis: last?.basis || null,
    change7: ch(7), change30: ch(30), change90: ch(90), change365: ch(365),
    p20_90: pct(w90, .2), p50_90: pct(w90, .5), p80_90: pct(w90, .8), min365: w365[0] ?? null, max365: w365[w365.length - 1] ?? null,
    rank, rankWindow: w180.length >= 60 ? 180 : 90, zone, volatility30: mean30 && sd30 != null ? sd30 / mean30 * 100 : null, drawdown90: dd * 100,
    askMinNm: ask?.min_nm_eur ?? null, askMedianNm: ask?.median_nm_eur ?? null, askZeroMin: ask?.zero_min_eur ?? null, askDay: ask?.day ?? null, askListings: ask?.n_listings ?? null,
    note: "Referencia agregada (Cardmarket/TCGplayer) y asks de CardTrader. No son ventas cerradas."
  };
}
async function loadSeries(env, id, days = 400) {
  const from = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
  const rows = (await env.DB.prepare("SELECT * FROM prices WHERE product_id=? AND day>=? ORDER BY day").bind(id, from).all()).results || [];
  const pts = rows.map(r => { const s = seriesValue(r); return s ? { day: r.day, v: Math.round(s.v * 100) / 100, basis: s.basis } : null; }).filter(Boolean);
  const asks = (await env.DB.prepare("SELECT day,min_nm_eur,median_nm_eur,zero_min_eur,n_listings,n_nm FROM offer_stats WHERE product_id=? AND day>=? ORDER BY day").bind(id, from).all()).results || [];
  if (!pts.length && asks.length) for (const a of asks) if (a.min_nm_eur > 0) pts.push({ day: a.day, v: a.min_nm_eur, basis: "cardtrader-min-ask-nm" });
  return { rows, pts, asks };
}

/* ---------- HTTP ---------- */
function cors(env, req) {
  const origin = req.headers.get("origin") || "";
  const allowed = String(env.ALLOWED_ORIGIN || "https://alvarogavilan.github.io").split(",").map(s => s.trim());
  return { "access-control-allow-origin": allowed.includes(origin) ? origin : allowed[0], "access-control-allow-headers": "content-type,x-cv-key", "access-control-allow-methods": "GET,POST,OPTIONS", "vary": "origin" };
}
const json = (data, status, h) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...h } });

async function handle(req, env) {
  const url = new URL(req.url), h = cors(env, req), p = url.pathname;
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  if (p === "/" ) return new Response("Card Vault Market Collector " + VERSION + " · OK", { headers: { "content-type": "text/plain; charset=utf-8", ...h } });
  if (!env.CV_KEY) return json({ error: "Falta el secreto CV_KEY en el Worker" }, 500, h);
  if (req.headers.get("x-cv-key") !== env.CV_KEY) return json({ error: "Clave incorrecta" }, 401, h);
  await ensureSchema(env);
  const q = k => url.searchParams.get(k) || "";

  if (p === "/api/status") {
    const c = async s => (await env.DB.prepare(s).first())?.n ?? 0;
    const d = day();
    return json({
      version: VERSION, day: d, sources: { cardtrader: !!env.CARDTRADER_TOKEN, psa: !!env.PSA_TOKEN },
      products: { pokemon: await c("SELECT COUNT(*) n FROM products WHERE universe='pokemon'"), lorcana: await c("SELECT COUNT(*) n FROM products WHERE universe='lorcana'") },
      pricesToday: await c(`SELECT COUNT(*) n FROM prices WHERE day='${d}'`), priceRows: await c("SELECT COUNT(*) n FROM prices"),
      historyDays: await c("SELECT COUNT(DISTINCT day) n FROM prices"), firstDay: (await env.DB.prepare("SELECT MIN(day) d FROM prices").first())?.d || null,
      writesToday: await writesToday(env), writeBudget: WRITE_BUDGET, writeBudgetRemaining: Math.max(0, WRITE_BUDGET - await writesToday(env)),
      tracked: await c("SELECT COUNT(*) n FROM tracked"), offersToday: await c(`SELECT COUNT(*) n FROM offers WHERE day='${d}'`),
      ctBlueprints: await c("SELECT COUNT(*) n FROM ct_blueprints"), writesToday: await writesToday(env), fx: await fxToday(env),
      lastRuns: (await env.DB.prepare("SELECT at,phase,n,ms,error FROM runs ORDER BY id DESC LIMIT 12").all()).results
    }, 200, h);
  }
  if (p === "/api/search") {
    const universe = q("universe") || "pokemon", term = "%" + q("q").trim() + "%", nb = numKey(q("number"));
    let rows = (await env.DB.prepare("SELECT id,universe,name,set_name,number,rarity,image,tcgplayer_id FROM products WHERE universe=? AND name LIKE ? ORDER BY set_name LIMIT 200").bind(universe, term).all()).results || [];
    if (nb) rows = rows.filter(r => numKey(r.number) === nb);
    return json({ results: rows.slice(0, Number(q("limit")) || 30) }, 200, h);
  }
  if (p === "/api/ct/search") {
    const g = env.CARDTRADER_TOKEN ? await ctGames(env) : {};
    const game = q("game") === "lorcana" ? g.lorcana : g.pokemon;
    const rows = (await env.DB.prepare("SELECT id,expansion_name,name,version,number,category_id,image FROM ct_blueprints WHERE game_id=? AND (name LIKE ? OR expansion_name LIKE ?) ORDER BY expansion_name LIMIT 40")
      .bind(game || -1, "%" + q("q") + "%", "%" + q("q") + "%").all()).results || [];
    return json({ results: rows.map(r => ({ ...r, url: "https://www.cardtrader.com/cards/" + r.id })) }, 200, h);
  }
  if (p === "/api/ct/candidates") {
    const prod = await env.DB.prepare("SELECT * FROM products WHERE id=?").bind(q("product_id")).first();
    if (!prod) return json({ error: "Producto no encontrado" }, 404, h);
    const g = env.CARDTRADER_TOKEN ? await ctGames(env) : {};
    let rows = [];
    if (prod.universe === "lorcana" && prod.tcgplayer_id) rows = (await env.DB.prepare("SELECT * FROM ct_blueprints WHERE tcgplayer_id=?").bind(prod.tcgplayer_id).all()).results || [];
    if (!rows.length) {
      const first = norm(prod.name).split(" ")[0] || "";
      const cand = (await env.DB.prepare("SELECT * FROM ct_blueprints WHERE game_id=? AND name LIKE ? LIMIT 400").bind(prod.universe === "lorcana" ? g.lorcana : g.pokemon, "%" + first + "%").all()).results || [];
      const nk = numKey(prod.number);
      rows = cand.filter(b => norm(b.name).startsWith(norm(prod.name).split(" - ")[0]) && (!nk || numKey(b.number) === nk));
    }
    const exact = prod.universe === "lorcana" && rows.length === 1 && rows[0].tcgplayer_id === prod.tcgplayer_id;
    return json({ product: prod, exact, results: rows.slice(0, 20).map(r => ({ id: r.id, expansion: r.expansion_name, name: r.name, version: r.version, number: r.number, image: r.image, url: "https://www.cardtrader.com/cards/" + r.id })) }, 200, h);
  }
  if (p === "/api/track" && req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    const items = Array.isArray(body.items) ? body.items.slice(0, 2000) : [];
    const now = new Date().toISOString();
    const stmts = [];
    if (body.replace) stmts.push(env.DB.prepare("DELETE FROM tracked"));
    for (const it of items) {
      if (!it.product_id) continue;
      stmts.push(env.DB.prepare(`INSERT INTO tracked(product_id,label,universe,lang,condition,priority,blueprint_id,blueprint_confirmed,added_at,last_offers_day)
        VALUES(?,?,?,?,?,?,?,?,?,NULL) ON CONFLICT(product_id) DO UPDATE SET label=excluded.label,lang=excluded.lang,condition=excluded.condition,priority=excluded.priority,
        blueprint_id=excluded.blueprint_id,blueprint_confirmed=excluded.blueprint_confirmed`)
        .bind(it.product_id, String(it.label || "").slice(0, 200), it.universe || (String(it.product_id).startsWith("lor:") ? "lorcana" : "pokemon"),
          String(it.lang || "").toLowerCase().slice(0, 5), String(it.condition || "").slice(0, 40), Number(it.priority) || 1, it.blueprint_id || null, it.blueprint_confirmed ? 1 : 0, now));
    }
    for (let i = 0; i < stmts.length; i += 100) await env.DB.batch(stmts.slice(i, i + 100));
    await addWrites(env, stmts.length);
    return json({ ok: true, tracked: items.length }, 200, h);
  }
  if (p === "/api/history") {
    const { pts, asks } = await loadSeries(env, q("id"), Math.min(3650, Number(q("days")) || 365));
    return json({ id: q("id"), points: pts, asks }, 200, h);
  }
  if (p === "/api/signals") {
    const ids = q("ids").split(",").map(s => s.trim()).filter(Boolean).slice(0, 150), out = {};
    for (const id of ids) { const { pts, asks } = await loadSeries(env, id, 400); out[id] = signalsFrom(pts, asks); }
    return json({ day: day(), signals: out }, 200, h);
  }
  if (p === "/api/offers") {
    const ids = q("ids").split(",").map(s => s.trim()).filter(Boolean).slice(0, 150), out = {};
    for (const id of ids) {
      const last = await env.DB.prepare("SELECT MAX(day) d FROM offers WHERE product_id=?").bind(id).first();
      out[id] = last?.d ? { day: last.d, offers: (await env.DB.prepare("SELECT * FROM offers WHERE product_id=? AND day=? ORDER BY price_eur").bind(id, last.d).all()).results } : null;
    }
    return json({ offers: out }, 200, h);
  }
  if (p.startsWith("/api/cert/")) {
    const cert = p.split("/").pop().replace(/\D/g, "");
    if (!cert) return json({ error: "Certificado no válido" }, 400, h);
    const cached = await env.DB.prepare("SELECT fetched_at,json FROM certs WHERE cert=?").bind(cert).first();
    if (cached) return json({ cert, cached: true, fetchedAt: cached.fetched_at, data: JSON.parse(cached.json) }, 200, h);
    if (!env.PSA_TOKEN) return json({ error: "Falta PSA_TOKEN en el Worker" }, 400, h);
    const r = await fetch(PSA + "/cert/GetByCertNumber/" + cert, { headers: { authorization: "Bearer " + env.PSA_TOKEN, accept: "application/json" } });
    if (!r.ok) return json({ error: "PSA respondió " + r.status }, 502, h);
    const data = await r.json();
    await env.DB.prepare("INSERT OR REPLACE INTO certs(cert,fetched_at,json) VALUES(?,?,?)").bind(cert, new Date().toISOString(), JSON.stringify(data)).run();
    return json({ cert, cached: false, fetchedAt: new Date().toISOString(), data }, 200, h);
  }
  if (p === "/api/run" && req.method === "POST") {
    return json({ ran: await tick(env, PHASES[q("phase")] ? q("phase") : null) }, 200, h);
  }
  return json({ error: "Ruta no encontrada" }, 404, h);
}

export default {
  async fetch(req, env) {
    try { return await handle(req, env); }
    catch (e) { return json({ error: String(e.message || e) }, 500, cors(env, req)); }
  },
  async scheduled(event, env, ctx) { ctx.waitUntil(tick(env)); }
};
if (globalThis.__CV_TEST_MODE__) globalThis.__CV_TEST__ = { tick, handle, PHASES, parseProps, pokemonPriceRow, numKey, signalsFrom, seriesValue };
