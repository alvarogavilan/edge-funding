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
  await ctx.close();
}

await browser.close();
if (errors.length) fail('errores de página: ' + errors.join(' | '));
if (!process.exitCode) console.log('E2E Identity Lock superado');
