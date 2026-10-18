import test from 'node:test';
import assert from 'node:assert/strict';
import * as P from '../js/pipeline.js';
import * as C from '../js/content.js';

const S = P.STATUS;
function project() { const p = P.newProject({ title: 't', character: 'c', concept: 'x' }); p.id = 'p1'; return p; }
function readyScene(sc) {
  sc.currentClip = { blobKey: 'k' };
  sc.auto = { verdict: 'pass', identity: { verdict: 'pass' }, continuity: { verdict: 'pass' }, frames: { verdict: 'pass' } };
  for (const c of P.MANUAL_CHECKS) sc.manual[c.key] = true;
  sc.reviewer = 'AG';
}

test('8 etapas en el orden obligatorio', () => {
  assert.deepEqual(P.STAGES.map(s => s.key), ['inicial', 'piel', 'base', 'ojos', 'delineado', 'labios', 'caracterizacion', 'final']);
});

test('transiciones válidas e inválidas', () => {
  const sc = project().scenes[0];
  assert.throws(() => P.transition(sc, S.APROBADO));
  P.transition(sc, S.GENERANDO); P.transition(sc, S.REVISION); P.transition(sc, S.RECHAZADO);
  P.transition(sc, S.GENERANDO); P.transition(sc, S.REVISION); P.transition(sc, S.APROBADO); P.transition(sc, S.EXPORTADO);
  assert.equal(sc.status, S.EXPORTADO);
  assert.equal(sc.history.length, 8);
});

test('continuidad: no se genera la etapa 2 sin aprobar la 1', () => {
  const p = project();
  assert.equal(P.canGenerate(p, 0).ok, true);
  assert.equal(P.canGenerate(p, 1).ok, false);
  p.scenes[0].status = S.APROBADO;
  assert.equal(P.canGenerate(p, 1).ok, true);
});

test('aprobación exige QC, controles humanos y revisor', () => {
  const p = project(); const sc = p.scenes[0];
  P.transition(sc, S.REVISION);
  let g = P.approvalGate(p, 0);
  assert.equal(g.ok, false);
  readyScene(sc);
  g = P.approvalGate(p, 0);
  assert.equal(g.ok, true, g.problems.join());
  sc.manual.hands = false;
  assert.equal(P.approvalGate(p, 0).ok, false);
});

test('identidad inconsistente bloquea la aprobación', () => {
  const p = project(); const sc = p.scenes[0];
  P.transition(sc, S.REVISION); readyScene(sc);
  sc.auto.identity.verdict = 'fail';
  const g = P.approvalGate(p, 0);
  assert.equal(g.ok, false);
  assert.match(g.problems.join(), /Identidad inconsistente/);
});

test('identidad dudosa exige nota; no disponible también', () => {
  const p = project(); const sc = p.scenes[0];
  P.transition(sc, S.REVISION); readyScene(sc);
  sc.auto.identity.verdict = 'review';
  assert.equal(P.approvalGate(p, 0).ok, false);
  sc.reviewNote = 'comparado a ojo con la oficial';
  assert.equal(P.approvalGate(p, 0).ok, true);
});

test('etapa posterior no se aprueba si la anterior no lo está', () => {
  const p = project(); const sc = p.scenes[1];
  sc.status = S.REVISION; readyScene(sc);
  assert.equal(P.approvalGate(p, 1).ok, false);
  p.scenes[0].status = S.APROBADO;
  assert.equal(P.approvalGate(p, 1).ok, true);
});

test('veredicto de identidad por distancias', () => {
  assert.equal(P.identityVerdict([0.3, 0.32, 0.35, 0.31], 1, 1).verdict, 'pass');
  assert.equal(P.identityVerdict([0.5, 0.48, 0.5, 0.49], 1, 1).verdict, 'review');
  assert.equal(P.identityVerdict([0.7, 0.68, 0.65, 0.66], 1, 1).verdict, 'fail');
  assert.equal(P.identityVerdict([], 1, 0).verdict, 'fail');
  // tolerancia de maquillaje intenso en etapas 7-8
  assert.equal(P.identityVerdict([0.48, 0.47, 0.49, 0.46], 6, 1).verdict, 'pass');
  assert.equal(P.identityVerdict([0.3, 0.3, 0.3, 0.3], 1, 0.4).verdict, 'review');
});

test('prompt incluye identidad, continuidad y canto', () => {
  const p = project();
  const txt = P.buildPrompt({ identityText: 'hazel eyes', setting: 'vanity', scene: p.scenes[2], previous: p.scenes.slice(0, 2), singing: true });
  assert.match(txt, /hazel eyes/); assert.match(txt, /Continue EXACTLY/); assert.match(txt, /singing/); assert.match(txt, /five fingers/);
});

test('coste estimado', () => {
  assert.equal(P.estimateCost({ usdPerSecond: 0.2, usdPerSecondAudio: 0.4 }, 8, false), 1.6);
  assert.equal(P.estimateCost({ usdPerSecond: 0.2, usdPerSecondAudio: 0.4 }, 8, true), 3.2);
});

test('máster solo con todas las escenas aprobadas', () => {
  const p = project();
  assert.equal(P.projectReadyForMaster(p).ok, false);
  p.scenes.forEach(s => { s.status = S.APROBADO; });
  assert.equal(P.projectReadyForMaster(p).ok, true);
});

test('tendencias: métricas sin verificar no cuentan', () => {
  const trends = [
    { url: 'https://a', duration: 30, revealAt: 25, hook: 'pregunta en texto', metrics: { views: 1000, likes: 100, verified: false } },
    { url: 'https://b', duration: 40, revealAt: 36, hook: 'pregunta en texto', metrics: { views: 2000, likes: 200, comments: 0, verified: true, verifiedAt: '2026-10-18' } }
  ];
  const pt = C.trendPatterns(trends);
  assert.equal(pt.verifiedCount, 1);
  assert.equal(pt.medianEngagement, 0.1);
  assert.equal(pt.hooks[0][0], 'pregunta en texto');
  const c = C.originalConcept([], [], () => 0);
  assert.match(c.basis, /Sin referencias/);
  assert.equal(c.targetSeconds, 42);
});

test('textos de publicación incluyen aviso de IA y sin marcas cruzadas', () => {
  const t = C.caption({ title: 'X', character: 'reina' }, 'instagram');
  assert.match(t, /IA/);
  assert.doesNotMatch(C.caption({ title: 'X' }, 'tiktok'), /instagram/i);
});
