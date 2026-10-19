// Motor → Studio: importa render/studio (studio-manifest.json + MP4), QC de identidad, aprobación humana
// y máster con la instrumental original automática. Uso:
// RENDER_DIR=…/render/studio OFFICIAL=…/oficial.png PW=…/playwright-core node tests/e2e-engine-import.mjs
import { createRequire } from 'node:module';
import { readFileSync, readdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { routeSealedLock } from './sealed-lock.mjs';
const require = createRequire(import.meta.url);
const { chromium, devices } = require(process.env.PW || 'playwright-core');
const URL_ = process.env.LIORA_URL || 'http://127.0.0.1:8765/liora/produccion.html';
// El Chromium de Playwright no trae decodificador H.264 (Safari sí): con FFMPEG definido, los clips se convierten
// a WebM VP9 y se recalculan las huellas del manifiesto solo para poder ejecutar esta prueba en Chromium.
function webmCopy(src) {
  const dir = mkdtempSync(join(tmpdir(), 'liora-webm-'));
  const m = JSON.parse(readFileSync(join(src, 'studio-manifest.json'), 'utf8'));
  for (const sc of m.scenes) {
    const name = sc.file.replace(/\.mp4$/, '.webm');
    execFileSync(process.env.FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-i', join(src, sc.file), '-c:v', 'libvpx-vp9', '-b:v', '2M', '-an', join(dir, name)]);
    sc.file = name; sc.sha256 = createHash('sha256').update(readFileSync(join(dir, name))).digest('hex');
  }
  writeFileSync(join(dir, 'studio-manifest.json'), JSON.stringify(m));
  return dir;
}
const DIR = process.env.FFMPEG ? webmCopy(process.env.RENDER_DIR) : process.env.RENDER_DIR;
const LAST = JSON.parse(readFileSync(join(DIR, 'studio-manifest.json'), 'utf8')).scenes.at(-1).file;
const log = (...a) => console.log('·', ...a);
const fail = m => { console.error('FALLO:', m); process.exitCode = 1; };

const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--autoplay-policy=no-user-gesture-required', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ ...devices['iPhone 13'] })).newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('dialog', d => d.accept(d.type() === 'prompt' ? 'e2e' : undefined));
await routeSealedLock(page, readFileSync(process.env.OFFICIAL));
await page.goto(URL_);

// Instrumental original vinculada automáticamente al proyecto «La Reina del Eclipse»
await page.waitForFunction(() => window.__liora?.state?.project?.audio?.blobKey, null, { timeout: 30000 }).catch(() => fail('la instrumental no se vinculó'));
const song = await page.evaluate(async () => {
  const p = window.__liora.state.project; const b = await window.__liora.db.get('blobs', p.audio.blobKey);
  const ac = new AudioContext(); const buf = await ac.decodeAudioData(await b.arrayBuffer());
  const ch = buf.getChannelData(0); let peak = 0; for (let i = 0; i < ch.length; i += 50) peak = Math.max(peak, Math.abs(ch[i]));
  return { title: p.title, name: p.audio.name, duration: +buf.duration.toFixed(2), peak: +peak.toFixed(3), license: p.audio.license.ok };
});
log('instrumental', JSON.stringify(song));
if (!(song.duration > 27 && song.peak > 0.05 && song.license)) fail('instrumental vacía o sin licencia');

await page.selectOption('#refAngle', 'oficial');
await page.setInputFiles('#refFile', { name: 'oficial.png', mimeType: 'image/png', buffer: readFileSync(process.env.OFFICIAL) });
await page.waitForFunction(() => window.__liora.state.refs.some(r => r.official && r.descriptor), null, { timeout: 120000 });

await page.click('nav button[data-t="produccion"]');
const files = readdirSync(DIR).map(f => ({ name: f, mimeType: f.endsWith('.json') ? 'application/json' : f.endsWith('.webm') ? 'video/webm' : 'video/mp4', buffer: readFileSync(join(DIR, f)) }));
// Una huella alterada debe rechazarse
const tampered = files.map(f => f.name === LAST ? { ...f, buffer: Buffer.concat([f.buffer, Buffer.from([0])]) } : f);
await page.setInputFiles('#engineImport', tampered);
await page.waitForFunction(() => /Importación del motor/.test(document.getElementById('engineImportReport').textContent), null, { timeout: 600000 });
const report = await page.textContent('#engineImportReport');
log('informe:', report.replace(/\s+/g, ' ').slice(0, 400));
if (!report.includes(LAST + ': la huella SHA-256 no coincide')) fail('no se detectó el archivo alterado');
await page.setInputFiles('#engineImport', files.filter(f => f.name === 'studio-manifest.json' || f.name === LAST));
await page.waitForFunction(() => window.__liora.state.project.scenes[7].auto, null, { timeout: 120000 }).catch(async () => fail('escena 8 no reimportada: ' + await page.textContent('#engineImportReport') + ' · ' + await page.evaluate(() => JSON.stringify(window.__liora.state.project.scenes[7].status))));

const qc = await page.evaluate(() => window.__liora.state.project.scenes.map(s => [s.status, s.auto?.identity?.verdict, s.engine?.seed]));
log('escenas', JSON.stringify(qc));
if (!qc.every(([st, id]) => st === 'REVISIÓN' && id === 'pass')) fail('no todas las escenas pasaron a REVISIÓN con identidad OK');

for (let i = 0; i < 8; i++) {
  await page.click(`#sceneList .scene:nth-child(${i + 1})`);
  await page.waitForTimeout(600);
  const checks = page.locator('#sceneDetail label.check').filter({ hasNotText: 'Audio nativo' }).locator('input');
  for (let k = 0; k < await checks.count(); k++) await checks.nth(k).check();
  await page.fill('#sceneDetail input[placeholder="Nombre o iniciales"]', 'E2E');
  await page.dispatchEvent('#sceneDetail input[placeholder="Nombre o iniciales"]', 'change');
  await page.fill('#sceneDetail textarea[placeholder^="Segundo"]', 'Clip de motor de prueba NO generativo');
  await page.dispatchEvent('#sceneDetail textarea[placeholder^="Segundo"]', 'change');
  await page.waitForTimeout(150);
  await page.click('#sceneDetail button:text-is("Aprobar")');
  await page.waitForFunction(n => window.__liora.state.project.scenes[n].status === 'APROBADO', i, { timeout: 10000 }).catch(async () => fail('no aprobada ' + i + ': ' + await page.textContent('#gateMsg')));
}

await page.click('nav button[data-t="montaje"]');
if (await page.inputValue('#masterAudio') !== 'song') fail('el máster no usa la canción por defecto');
await page.click('#renderMaster');
await page.waitForFunction(() => window.__liora.state.project.exports.length > 0, null, { timeout: 180000 });
const master = await page.evaluate(async () => {
  const ex = window.__liora.state.project.exports.at(-1); const b = await window.__liora.db.get('blobs', ex.masterKey);
  const ac = new AudioContext(); let audio = null;
  try { const buf = await ac.decodeAudioData(await b.arrayBuffer()); const ch = buf.getChannelData(0); let peak = 0; for (let i = 0; i < ch.length; i += 50) peak = Math.max(peak, Math.abs(ch[i])); audio = { duration: +buf.duration.toFixed(2), peak: +peak.toFixed(3) }; } catch (e) { audio = String(e); }
  return { mime: ex.mime, mb: +(ex.size / 1e6).toFixed(1), duration: ex.duration && +ex.duration.toFixed(2), audioTrack: ex.audio, audio };
});
log('máster', JSON.stringify(master));
if (!(master.duration > 25 && master.duration < 31)) fail('duración del máster fuera de 25–31 s');
if (!(master.audio?.peak > 0.05)) fail('el máster no lleva la música');
if (errors.length) { console.log(errors); fail('errores en la página'); }
await browser.close();
console.log(process.exitCode ? 'E2E motor→Studio con fallos' : 'E2E motor→Studio superado');
