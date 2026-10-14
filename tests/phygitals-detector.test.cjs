/* node tests/phygitals-detector.test.cjs
 * Usa la evidencia real publicada (phygitals-evidence-data.json). Los objetos de catálogo con
 * ev_updated_at fijado son ENTRADAS DE PRUEBA etiquetadas, no datos de mercado. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
global.PhygitalsDecision = require('../phygitals-decision-engine.js');
global.PhygitalsPartyArbitrage = require('../phygitals-party-arbitrage.js');
const D = require('../phygitals-detector.js');
const ev = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'phygitals-evidence-data.json'), 'utf8'));
const E = Object.fromEntries(ev.packs.map(p => [p.slug, p]));
const now = Date.parse('2026-10-14T00:00:00Z');
const ctx = { usdToEur: 0.86, feesEUR: 0, budgetEUR: 50, now };
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('PASS:', name); };

// 1. Evidencia: no hay datos sintéticos y la cobertura cuadra con el informe.
ok('evidencia: 11 packs, 460.173 aperturas agregadas', () => {
  assert.equal(ev.packs.length, 11);
  assert.equal(ev.packs.reduce((s, p) => s + p.n, 0), 460173);
  assert.deepEqual(ev.temporal_patterns_validated, []);
});

// 2. Catálogo real transcrito (Rookie, 2026-10-13T23:41Z): EV 26,16 · recompra 85 % → NO COMPRAR.
const rookie = { slug: 'rookie-pack', mint_price: 25, ev: 26.16, buyback_percent: 0.85, in_stock: true, enable: true, ev_updated_at: '2026-10-13T23:41:26.446Z' };
ok('Rookie real → NO COMPRAR (margen del operador negativo)', () => {
  const r = D.randomPack(rookie, E['rookie-pack'], ctx);
  assert.equal(r.signal, 'NO COMPRAR');
  assert.ok(r.marginEUR < 0);
  assert.ok(r.reasons.some(x => /negativo/.test(x)));
});

// 3. Elite Riftbound real: recompra 100 %, observado 109 % pero IC95 inferior < 100 % → NO COMPRAR.
ok('Elite Riftbound real → NO COMPRAR (IC95 no demuestra margen)', () => {
  const p = { slug: 'elite-riftbound-pack', mint_price: 50, ev: 46.51, buyback_percent: 1, in_stock: true, enable: true, ev_updated_at: '2026-10-13T22:44:46.866Z' };
  const r = D.randomPack(p, E['elite-riftbound-pack'], ctx);
  assert.equal(r.signal, 'NO COMPRAR');
  assert.ok(r.reasons.some(x => /IC95/.test(x)));
});

// 4. Ningún pack de la evidencia real pasa a REVISAR con su propio precio y recompra conocida.
ok('ningún pack real llega a REVISAR', () => {
  for (const e of ev.packs) {
    const p = { slug: e.slug, mint_price: e.price_usd, ev: e.price_usd * 1.05, buyback_percent: e.buyback_percent || 0.85, in_stock: true, enable: true, ev_updated_at: '2026-10-13T23:00:00Z' };
    assert.equal(D.randomPack(p, e, ctx).signal, 'NO COMPRAR', e.slug);
  }
});

// 5. Pirate Pack: el cambio de régimen bloquea aunque se fuerce un EV ficticio favorable (entrada de prueba).
ok('Pirate: cambio de régimen detectado bloquea', () => {
  const p = { slug: 'pirate-pack', mint_price: 10, ev: 20, buyback_percent: 1, in_stock: true, enable: true, ev_updated_at: '2026-10-13T23:00:00Z' };
  const r = D.randomPack(p, E['pirate-pack'], ctx);
  assert.equal(r.signal, 'NO COMPRAR');
  assert.ok(r.reasons.some(x => /régimen/.test(x)));
});

// 6. Trainer: déficit significativo del nivel alto bloquea.
ok('Trainer: Mythic por debajo de lo anunciado bloquea', () => {
  const p = { slug: 'trainer-pack', mint_price: 10, ev: 20, buyback_percent: 1, in_stock: true, enable: true, ev_updated_at: '2026-10-13T23:00:00Z' };
  const r = D.randomPack(p, E['trainer-pack'], ctx);
  assert.equal(r.signal, 'NO COMPRAR');
  assert.ok(r.reasons.some(x => /por debajo de lo anunciado/.test(x)));
});

// 7. Lógica de REVISAR con evidencia de prueba claramente sintética: solo si TODO cuadra, y nunca COMPRA YA.
const fakeEvidence = { n: 99999, window: ['TEST', 'TEST'], buyback_percent: 1, value_return: 1.2, value_return_ci95: [1.1, 1.3], value_return_last14: 1.15, regime_break: null, odds_p_holm: 1, top_tier: null };
const fakePack = { slug: 'TEST', mint_price: 10, ev: 12, buyback_percent: 1, in_stock: true, enable: true, ev_updated_at: '2026-10-13T23:00:00Z' };
ok('prueba sintética favorable → REVISAR, nunca COMPRA YA', () => {
  assert.equal(D.randomPack(fakePack, fakeEvidence, ctx).signal, 'REVISAR');
});
ok('sin evidencia independiente → NO COMPRAR aunque el EV sea favorable', () => {
  assert.equal(D.randomPack(fakePack, null, ctx).signal, 'NO COMPRAR');
});
ok('EV caducado (>24 h) → NO COMPRAR', () => {
  assert.equal(D.randomPack({ ...fakePack, ev_updated_at: '2026-10-12T20:00:00Z' }, fakeEvidence, ctx).signal, 'NO COMPRAR');
});
ok('sin cambio de divisa → NO COMPRAR', () => {
  assert.equal(D.randomPack(fakePack, fakeEvidence, { ...ctx, usdToEur: null }).signal, 'NO COMPRAR');
});
ok('presupuesto > 50 € se recorta a 50 €', () => {
  assert.equal(D.randomPack({ ...fakePack, mint_price: 100, ev: 120 }, fakeEvidence, { ...ctx, budgetEUR: 500 }).signal, 'NO COMPRAR');
});

// 8. COMPRA YA solo con puja firme (motor existente).
const firm = { budgetEUR: 50, purchaseEUR: 39, feesEUR: 1, withdrawalFeesEUR: 1, fxSpreadEUR: 1, firmExitEUR: 48, assetId: 'TEST-ASSET', buyUrl: 'https://example.org/item', randomPack: false, exitEvidenceUrl: 'https://example.org/bid', exitTransferable: true, exitAvailableToSpain: true, exitVerifiedAt: now - 60000, exitType: 'binding_bid' };
ok('puja firme verificada (sintética) → COMPRA YA', () => assert.equal(D.firmOffer(firm, null, now).signal, 'COMPRA YA'));
ok('anuncio no firme → NO COMPRAR', () => assert.equal(D.firmOffer({ ...firm, exitType: 'listing' }, null, now).signal, 'NO COMPRAR'));
ok('pack aleatorio vía oferta → NO COMPRAR', () => assert.equal(D.firmOffer({ ...firm, randomPack: true }, null, now).signal, 'NO COMPRAR'));
ok('Pack Party incompleta → NO COMPRAR', () => assert.equal(D.party({ cards: [{}, {}], pricePerSpotEUR: 5, totalFeesEUR: 0, budgetEUR: 50 }).signal, 'NO COMPRAR'));

console.log(n + ' pruebas superadas. Las entradas marcadas como sintéticas no son mercado real.');
