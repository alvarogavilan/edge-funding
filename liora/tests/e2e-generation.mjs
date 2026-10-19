// Flujo de generación real de la interfaz contra el Worker ejecutado en local (tests/mock-backend.mjs, fal simulado).
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { routeSealedLock } from './sealed-lock.mjs';
const require = createRequire(import.meta.url);
const { chromium, devices } = require(process.env.PW || 'playwright-core');
const URL_ = process.env.LIORA_URL || 'http://127.0.0.1:8765/liora/produccion.html';
const log = (...a) => console.log('·', ...a);
const fail = m => { console.error('FALLO:', m); process.exitCode = 1; };
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--autoplay-policy=no-user-gesture-required', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext(devices['iPhone 13']);
const page = await ctx.newPage();
const dialogs = [];
page.on('dialog', async d => { dialogs.push(d.message()); await d.accept(d.type() === 'prompt' ? 'e2e' : undefined); });
page.on('pageerror', e => fail('pageerror ' + e.message));
await routeSealedLock(page, readFileSync(process.env.FACE_IMG));
await page.goto(URL_);
await page.selectOption('#refAngle', 'oficial');
await page.setInputFiles('#refFile', { name: 'oficial.png', mimeType: 'image/png', buffer: readFileSync(process.env.FACE_IMG) });
await page.waitForFunction(() => window.__liora.state.refs.some(r => r.official && r.descriptor), null, { timeout: 120000 });

// Canción sintética (WAV 45 s) con licencia confirmada
const sr = 22050, secs = 45, n = sr * secs, wav = Buffer.alloc(44 + n * 2);
wav.write('RIFF', 0); wav.writeUInt32LE(36 + n * 2, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(sr, 24); wav.writeUInt32LE(sr * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(n * 2, 40);
for (let i = 0; i < n; i++) wav.writeInt16LE(Math.round(8000 * Math.sin(2 * Math.PI * 440 * i / sr)), 44 + i * 2);
await page.click('nav button[data-t="audio"]');
await page.setInputFiles('#songFile', { name: 'cancion.wav', mimeType: 'audio/wav', buffer: wav });
await page.waitForFunction(() => window.__liora.state.project.audio?.name === 'cancion.wav'); // sustituye a la instrumental automática
await page.selectOption('#licType', 'original'); await page.check('#licOk'); await page.click('#saveSong');
await page.waitForFunction(() => window.__liora.state.project.audio.license?.ok);
log('canción cargada con licencia');

await page.click('nav button[data-t="motores"]');
await page.fill('#beUrl', 'http://127.0.0.1:8787');
await page.fill('#beKey', 'clave-de-prueba-local-123456789');
await page.click('#backendForm button[type=submit]');
await page.waitForFunction(() => !!window.__liora.state.cfg, null, { timeout: 15000 });
await page.click('#verifyModels');
await page.waitForFunction(() => !!window.__liora.state.verify, null, { timeout: 15000 });
const ver = await page.evaluate(() => window.__liora.state.verify.models.map(m => m.id + ':' + m.ok));
log('verificación', ver.join(' '));

async function generate(i, model) {
  await page.click('nav button[data-t="produccion"]');
  await page.click(`#sceneList .scene:nth-child(${i + 1})`);
  await page.waitForTimeout(400);
  await page.selectOption('#sceneDetail select >> nth=0', model);
  await page.click('#sceneDetail button:has-text("enerar escena")');
  await page.waitForFunction(n => window.__liora.state.project.scenes[n].status === 'GENERANDO', i, { timeout: 30000 }).catch(async () => fail('no pasó a GENERANDO: ' + await page.evaluate(n => window.__liora.state.project.scenes[n].lastError, i)));
  await page.waitForFunction(n => { const s = window.__liora.state.project.scenes[n]; return s.status === 'REVISIÓN' && s.auto; }, i, { timeout: 120000 });
  const sc = await page.evaluate(n => { const s = window.__liora.state.project.scenes[n]; return { src: s.currentClip.source, qc: s.auto.verdict, id: s.auto.identity.verdict, attempts: s.attempts.length }; }, i);
  log(`escena ${i + 1} con ${model}:`, JSON.stringify(sc));
  return sc;
}
const a = await generate(0, 'veo31-fast-i2v');
if (!a.src.includes('veo31-fast-i2v')) fail('origen del clip incorrecto');
const b = await generate(0, 'sync-lipsync2-pro');
if (b.attempts !== 2) fail('la regeneración no añadió intento');
// Aprobar escena 1 y generar la 2 con Kling desde su último fotograma
for (const cb of await page.locator('#sceneDetail label.check').filter({ hasNotText: 'Audio nativo' }).locator('input').all()) await cb.check();
await page.fill('#sceneDetail input[placeholder="Nombre o iniciales"]', 'E2E'); await page.dispatchEvent('#sceneDetail input[placeholder="Nombre o iniciales"]', 'change');
await page.fill('#sceneDetail textarea[placeholder^="Segundo"]', 'prueba'); await page.dispatchEvent('#sceneDetail textarea[placeholder^="Segundo"]', 'change');
await page.click('#sceneDetail button:text-is("Aprobar")');
await page.waitForFunction(() => window.__liora.state.project.scenes[0].status === 'APROBADO');
await generate(1, 'kling3-pro-i2v');
await generate(2, 'omnihuman15').catch(() => {}); // etapa 3 bloqueada: la 2 no está aprobada
const blocked = await page.evaluate(() => window.__liora.state.project.scenes[2].status);
if (blocked !== 'PENDIENTE') fail('la etapa 3 se generó sin aprobar la 2'); else log('etapa 3 bloqueada hasta aprobar la 2');
const costDialogs = dialogs.filter(d => d.includes('Coste estimado'));
log('confirmaciones de gasto mostradas:', costDialogs.length, '·', costDialogs[0]?.split('\n')[1]);
await browser.close();
console.log(process.exitCode ? 'Generación E2E con fallos' : 'Generación E2E superada');
