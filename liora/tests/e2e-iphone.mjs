// Prueba de extremo a extremo en Chromium con emulación de iPhone (no sustituye a Safari real).
// Uso: LIORA_URL=http://127.0.0.1:8765/liora/ FACE_IMG=/ruta/rostro.png PW=/ruta/node_modules/playwright-core node tests/e2e-iphone.mjs
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { routeSealedLock } from './sealed-lock.mjs';
const require = createRequire(import.meta.url);
const { chromium, devices } = require(process.env.PW || 'playwright-core');

const URL_ = process.env.LIORA_URL || 'http://127.0.0.1:8765/liora/produccion.html';
const FACE = readFileSync(process.env.FACE_IMG);
const OUT = process.env.OUT_DIR || '.';
const log = (...a) => console.log('·', ...a);
const fail = m => { console.error('FALLO:', m); process.exitCode = 1; };

const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--autoplay-policy=no-user-gesture-required', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ ...devices['iPhone 13'], acceptDownloads: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('dialog', async d => { log('diálogo:', d.message().slice(0, 90)); await d.accept(d.type() === 'prompt' ? 'prueba e2e' : undefined); });

await routeSealedLock(page, FACE);
await page.goto(URL_);
await page.waitForSelector('#statusline .pill');
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
if (overflow) fail('scroll horizontal a 390 px'); else log('sin scroll horizontal a ancho de iPhone');

// 1) Fotografía oficial
await page.selectOption('#refAngle', 'oficial');
await page.setInputFiles('#refFile', { name: 'oficial.png', mimeType: 'image/png', buffer: FACE });
await page.waitForFunction(() => window.__liora.state.refs.some(r => r.official && r.descriptor), null, { timeout: 120000 });
log('fotografía oficial con descriptor facial de 128 dimensiones');

// 2) Referencia de ángulo (recorte/escala de la misma persona) → debe aceptarse
const angle = await page.evaluate(async () => {
  const off = window.__liora.state.refs.find(r => r.official);
  const img = new Image(); img.src = URL.createObjectURL(off.blob); await img.decode();
  const c = document.createElement('canvas'); c.width = 400; c.height = 460;
  const g = c.getContext('2d'); g.translate(200, 230); g.rotate(0.06); g.drawImage(img, -230, -200, 512 * 0.95, 512 * 0.95);
  return c.toDataURL('image/jpeg', 0.9);
});
await page.selectOption('#refAngle', 'tres-cuartos-izq');
await page.setInputFiles('#refFile', { name: 'angulo.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(angle.split(',')[1], 'base64') });
await page.waitForFunction(() => window.__liora.state.refs.length === 2 && window.__liora.state.refs.every(r => r.descriptor), null, { timeout: 60000 });
const refInfo = await page.evaluate(() => window.__liora.state.refs.map(r => ({ angle: r.angle, accepted: r.accepted, official: r.official, d: r.distanceToOfficial })));
log('referencias:', JSON.stringify(refInfo));
if (!refInfo.find(r => !r.official)?.accepted) fail('la referencia de ángulo de la misma persona no se aceptó');

// 3) Clip de prueba generado en el navegador (zoom lento sobre el rostro + tono de audio)
const clipB64 = await page.evaluate(async () => {
  const off = window.__liora.state.refs.find(r => r.official);
  const img = new Image(); img.src = URL.createObjectURL(off.blob); await img.decode();
  const c = document.createElement('canvas'); c.width = 540; c.height = 960;
  const g = c.getContext('2d');
  const stream = c.captureStream(30);
  const ac = new AudioContext(); const osc = ac.createOscillator(); const gain = ac.createGain(); const dest = ac.createMediaStreamDestination();
  osc.connect(gain); gain.connect(dest); osc.start(); stream.addTrack(dest.stream.getAudioTracks()[0]);
  const rec = new MediaRecorder(stream, { mimeType: 'video/webm' }); const chunks = [];
  rec.ondataavailable = e => chunks.push(e.data); const done = new Promise(r => { rec.onstop = r; });
  rec.start(200); const t0 = performance.now();
  await new Promise(res => { const tick = () => { const t = (performance.now() - t0) / 1000; const k = 1.6 + t * 0.05; g.fillStyle = '#222'; g.fillRect(0, 0, 540, 960); g.drawImage(img, 270 - 256 * k + 30, 300 - 256 * k + 120, 512 * k, 512 * k); gain.gain.value = 0.2 + 0.2 * Math.sin(t * 6); if (t < 3.2) requestAnimationFrame(tick); else res(); }; tick(); });
  rec.stop(); await done; osc.stop(); ac.close();
  const b = new Blob(chunks, { type: 'video/webm' });
  return await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result.split(',')[1]); fr.readAsDataURL(b); });
});
const clip = Buffer.from(clipB64, 'base64');
log('clip de prueba', (clip.length / 1024).toFixed(0), 'KB');

// 4) Recorrer las 8 escenas: subir clip, QC automático, controles humanos, aprobar
await page.click('nav button[data-t="produccion"]');
for (let i = 0; i < 8; i++) {
  await page.click(`#sceneList .scene:nth-child(${i + 1})`);
  await page.waitForSelector('#sceneDetail input[type=file]');
  await page.setInputFiles('#sceneDetail input[type=file]', { name: `escena${i + 1}.webm`, mimeType: 'video/webm', buffer: clip });
  await page.waitForFunction(n => !!window.__liora.state.project.scenes[n].auto, i, { timeout: 180000 });
  const auto = await page.evaluate(n => { const a = window.__liora.state.project.scenes[n].auto; return { v: a.verdict, id: a.identity?.verdict, med: a.identity?.median, cont: a.continuity?.verdict, fr: a.frames?.verdict, lips: a.lips?.verdict, fmt: a.format?.verdict }; }, i);
  log(`escena ${i + 1} QC`, JSON.stringify(auto));
  if (auto.id !== 'pass') fail(`identidad no superada en escena ${i + 1}`);
  // Intentar aprobar sin controles humanos → debe bloquear
  if (i === 0) {
    await page.click('#sceneDetail button:text-is("Aprobar")');
    const blocked = await page.textContent('#gateMsg');
    if (!/No se puede aprobar/.test(blocked)) fail('la aprobación sin revisión humana no se bloqueó'); else log('aprobación sin revisión humana bloqueada');
  }
  await page.waitForTimeout(800); // el detalle se vuelve a pintar tras el QC
  const checks = page.locator('#sceneDetail label.check').filter({ hasNotText: 'Audio nativo' }).locator('input');
  const n = await checks.count();
  for (let k = 0; k < n; k++) await checks.nth(k).check();
  await page.fill('#sceneDetail input[placeholder="Nombre o iniciales"]', 'E2E');
  await page.dispatchEvent('#sceneDetail input[placeholder="Nombre o iniciales"]', 'change');
  await page.fill('#sceneDetail textarea[placeholder^="Segundo"]', 'Clip sintético de prueba técnica');
  await page.dispatchEvent('#sceneDetail textarea[placeholder^="Segundo"]', 'change');
  await page.waitForTimeout(150);
  await page.click('#sceneDetail button:text-is("Aprobar")');
  await page.waitForFunction(n => window.__liora.state.project.scenes[n].status === 'APROBADO', i, { timeout: 10000 }).catch(async () => fail(`escena ${i + 1} no aprobada: ` + await page.textContent('#gateMsg')));
}
log('8 escenas aprobadas');

// 5) Montaje del máster con audio de los clips
await page.click('nav button[data-t="montaje"]');
await page.selectOption('#masterAudio', 'clips');
await page.click('#renderMaster');
await page.waitForFunction(() => window.__liora.state.project.exports.length > 0, null, { timeout: 120000 });
const ex = await page.evaluate(() => window.__liora.state.project.exports.at(-1));
log('máster', JSON.stringify({ mime: ex.mime, size: ex.size, duration: ex.duration }));
if (!(ex.size > 10000)) fail('máster vacío');
for (const cb of await page.$$('.fc')) await cb.check();
await page.fill('#finalReviewer', 'E2E');
await page.click('#validateMaster');
await page.waitForSelector('#deliverSection:not(.hidden)');
await page.click('#makeCovers');
await page.waitForFunction(() => !!window.__liora.state.project.exports.at(-1).covers, null, { timeout: 30000 });
const statuses = await page.evaluate(() => window.__liora.state.project.scenes.map(s => s.status));
log('estados finales', statuses.join(','));
if (!statuses.every(s => s === 'EXPORTADO')) fail('las escenas no pasaron a EXPORTADO');
await page.screenshot({ path: OUT + '/e2e-montaje.png', fullPage: false });

// 6) Persistencia tras recargar
await page.reload();
await page.waitForFunction(() => window.__liora?.state?.project?.scenes?.every(s => s.status === 'EXPORTADO') && window.__liora.state.refs.length === 2, null, { timeout: 30000 });
log('datos persistidos tras recargar');
await page.click('nav button[data-t="identidad"]');
await page.screenshot({ path: OUT + '/e2e-identidad.png', fullPage: false });

const relevant = errors.filter(e => !/favicon/.test(e));
if (relevant.length) { console.log('Errores de consola:', relevant); fail('errores en consola'); }
await browser.close();
console.log(process.exitCode ? 'E2E con fallos' : 'E2E superado');
