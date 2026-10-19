// Identity Lock en el navegador (iPhone emulado):
// 1) con el manifiesto REAL publicado (sin maestro) → REFERENCIA AUSENTE / PENDIENTE DE SELLAR y aprobación bloqueada;
// 2) «Sellar identidad oficial» descarga un sello con el SHA-256 exacto y sin imagen;
// 3) con un candado sellado, otra imagen no puede convertirse en oficial (sustitución bloqueada).
// FACE_IMG=… OTHER_IMG=… PW=…/playwright-core node tests/e2e-identity-lock.mjs
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { routeSealedLock } from './sealed-lock.mjs';
const require = createRequire(import.meta.url);
const { chromium, devices } = require(process.env.PW || 'playwright-core');
const URL_ = process.env.LIORA_URL || 'http://127.0.0.1:8765/liora/produccion.html';
const FACE = readFileSync(process.env.FACE_IMG);
const OTHER = readFileSync(process.env.OTHER_IMG);
const log = (...a) => console.log('·', ...a);
const fail = m => { console.error('FALLO:', m); process.exitCode = 1; };
const sha = b => createHash('sha256').update(b).digest('hex');

const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const errors = [];

async function open(ctxOpts = {}) {
  const ctx = await browser.newContext({ ...devices['iPhone 13'], acceptDownloads: true, ...ctxOpts });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.accept(d.type() === 'prompt' ? '' : undefined));
  return { ctx, page };
}
const lockPill = page => page.$eval('#statusline', e => e.textContent);

// 1 · manifiesto real
{
  const { ctx, page } = await open();
  await page.goto(URL_);
  await page.waitForFunction(() => document.querySelector('#statusline')?.textContent.includes('Identity Lock'));
  let st = await lockPill(page);
  st.includes('Identity Lock: REFERENCIA AUSENTE') ? log('sin foto oficial → REFERENCIA AUSENTE') : fail('estado inicial: ' + st);
  await page.click('nav button[data-t="identidad"]');
  await page.selectOption('#refAngle', 'oficial');
  await page.setInputFiles('#refFile', { name: 'oficial.png', mimeType: 'image/png', buffer: FACE });
  await page.waitForFunction(() => window.__liora.state.refs.some(r => r.official && r.descriptor), null, { timeout: 180000 });
  st = await lockPill(page);
  st.includes('PENDIENTE DE SELLAR') ? log('foto oficial local sin sello → PENDIENTE DE SELLAR (no VERIFICADA)') : fail('tras oficial: ' + st);
  const local = await page.evaluate(() => window.__liora.state.masterSha);
  local === sha(FACE) ? log('huella local = SHA-256 del archivo') : fail('huella local distinta');
  // 2 · sello
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#lockPanel button:text-is("Sellar identidad oficial")')]);
  const seal = JSON.parse(readFileSync(await dl.path(), 'utf8'));
  seal.sha256 === sha(FACE) && seal.format === 'liora-identity-seal-v1' && seal.width > 0 ? log('sello descargado', dl.suggestedFilename(), seal.width + '×' + seal.height) : fail('sello incorrecto ' + JSON.stringify(seal));
  JSON.stringify(seal).length < 1000 ? log('el sello no contiene la imagen (' + JSON.stringify(seal).length + ' bytes)') : fail('sello demasiado grande');
  const panel = await page.$eval('#lockPanel', e => e.textContent);
  panel.includes('no se aprueba ninguna escena') ? log('aviso visible: sin referencia verificada no se aprueba ninguna escena') : fail('falta el aviso de bloqueo');
  await ctx.close();
}

// 3 · candado sellado: sustitución bloqueada
{
  const { ctx, page } = await open();
  await routeSealedLock(page, FACE);
  await page.goto(URL_);
  await page.waitForFunction(() => window.__liora?.state.lock?.master);
  await page.click('nav button[data-t="identidad"]');
  await page.selectOption('#refAngle', 'oficial');
  await page.setInputFiles('#refFile', { name: 'impostora.png', mimeType: 'image/png', buffer: OTHER });
  await page.waitForTimeout(1500);
  const refs = await page.evaluate(() => window.__liora.state.refs.length);
  refs === 0 ? log('otra imagen rechazada como oficial: SUSTITUCIÓN BLOQUEADA') : fail('se aceptó una imagen no sellada');
  await page.setInputFiles('#refFile', { name: 'oficial.png', mimeType: 'image/png', buffer: FACE });
  await page.waitForFunction(() => window.__liora.state.refs.some(r => r.official), null, { timeout: 180000 });
  const st = await lockPill(page);
  st.includes('REFERENCIA VERIFICADA') ? log('maestro sellado → REFERENCIA VERIFICADA') : fail('con maestro: ' + st);
  // pasaporte biométrico (imagen de PRUEBA): medidas objetivas, observaciones pendientes, exportación privada sin imagen
  await page.click('#lockPanel button:text-is("Generar pasaporte biométrico (privado)")');
  await page.waitForSelector('#passportPanel textarea', { timeout: 180000 });
  await page.fill('#passportPanel textarea >> nth=0', 'Observación de prueba');
  await page.locator('#passportPanel textarea').first().dispatchEvent('change');
  await page.waitForTimeout(300);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#passportPanel button:text-is("Exportar pasaporte (privado)")')]);
  const pp = JSON.parse(readFileSync(await dl.path(), 'utf8'));
  const raw = JSON.stringify(pp);
  pp.master_sha256 === sha(FACE) && pp.geometria.ojos.anchura_derecho > 0 && pp.color.piel_mejillas ? log('pasaporte:', 'ojos', pp.geometria.ojos.anchura_derecho, pp.geometria.ojos.anchura_izquierdo, '· boca', pp.geometria.boca.anchura, '· simetría', pp.geometria.simetria.asimetria_media, '· piel', pp.color.piel_mejillas.categoria_ita) : fail('pasaporte incompleto');
  pp.observaciones.contorno.estado === 'OBSERVADO_POR_PROPIETARIO' && pp.observaciones.orejas.estado === 'PENDIENTE_DE_OBSERVACION' ? log('observaciones: solo lo escrito por el propietario; el resto PENDIENTE') : fail('observaciones ' + JSON.stringify(pp.observaciones.contorno));
  !/data:image|base64/.test(raw) && !('descriptor' in pp) ? log('pasaporte sin imagen ni descriptor (' + raw.length + ' bytes)') : fail('el pasaporte contiene datos de imagen');
  // 4 · fotograma a fotograma: el primer fotograma es Liora, pero el rostro desaparece a mitad de escena → RENDER RECHAZADO
  const clipB64 = await page.evaluate(async () => {
    const off = window.__liora.state.refs.find(r => r.official);
    const img = new Image(); img.src = URL.createObjectURL(off.blob); await img.decode();
    const c = document.createElement('canvas'); c.width = 540; c.height = 960; const g = c.getContext('2d');
    const rec = new MediaRecorder(c.captureStream(30), { mimeType: 'video/webm' }); const ch = [];
    rec.ondataavailable = e => ch.push(e.data); const done = new Promise(r => { rec.onstop = r; }); rec.start(200); const t0 = performance.now();
    await new Promise(res => { const tick = () => { const t = (performance.now() - t0) / 1000; g.fillStyle = '#556'; g.fillRect(0, 0, 540, 960);
      if (t < 1.0 || t > 2.4) g.drawImage(img, -138, 92, 819, 819); else { g.fillStyle = '#a87'; g.fillRect(120, 300, 300, 360); }
      t < 3.4 ? requestAnimationFrame(tick) : res(); }; tick(); });
    rec.stop(); await done;
    return await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result.split(',')[1]); fr.readAsDataURL(new Blob(ch, { type: 'video/webm' })); });
  });
  await page.click('nav button[data-t="produccion"]');
  await page.click('#sceneList .scene:nth-child(1)');
  await page.setInputFiles('#sceneDetail input[type=file]', { name: 'cambio.webm', mimeType: 'video/webm', buffer: Buffer.from(clipB64, 'base64') });
  await page.waitForFunction(() => !!window.__liora.state.project.scenes[0].auto, null, { timeout: 180000 });
  const auto = await page.evaluate(() => { const a = window.__liora.state.project.scenes[0].auto.identity; return { v: a.verdict, faceRatio: a.faceRatio, first: a.frameSeries[0] }; });
  log('QC del clip con cambio:', JSON.stringify(auto));
  await page.waitForTimeout(800);
  const checks = page.locator('#sceneDetail label.check').filter({ hasNotText: 'Audio nativo' }).locator('input');
  for (let k = 0; k < await checks.count(); k++) await checks.nth(k).check();
  await page.fill('#sceneDetail input[placeholder="Nombre o iniciales"]', 'E2E');
  await page.dispatchEvent('#sceneDetail input[placeholder="Nombre o iniciales"]', 'change');
  await page.fill('#sceneDetail textarea[placeholder^="Segundo"]', 'Intento de aprobar un clip con cambio de rostro');
  await page.dispatchEvent('#sceneDetail textarea[placeholder^="Segundo"]', 'change');
  await page.waitForTimeout(150);
  await page.click('#sceneDetail button:text-is("Aprobar")');
  const msg = await page.textContent('#gateMsg');
  const status = await page.evaluate(() => window.__liora.state.project.scenes[0].status);
  /RENDER RECHAZADO/.test(msg) && status !== 'APROBADO' ? log('aprobación bloqueada:', msg.replace(/\s+/g, ' ').slice(0, 160)) : fail('se aprobó un clip que pierde el rostro a mitad de escena: ' + msg);
  await ctx.close();
}

await browser.close();
if (errors.length) fail('errores de página: ' + errors.join(' | '));
if (!process.exitCode) console.log('E2E Identity Lock superado');
