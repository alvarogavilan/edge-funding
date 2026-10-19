// Exporta a WAV la instrumental original de La Reina del Eclipse (js/music-original.js), tal como la genera Safari,
// para mezclarla con clips del motor fuera del navegador. Uso: OUT=eclipse.wav PW=…/playwright-core node tests/export-instrumental.mjs
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW || 'playwright-core');
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage();
await page.goto((process.env.LIORA_URL || 'http://127.0.0.1:8765/liora/') + 'produccion.html');
const b64 = await page.evaluate(async () => {
  const { buildEclipseInstrumental } = await import('./js/music-original.js');
  const blob = await buildEclipseInstrumental();
  return await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result.split(',')[1]); fr.readAsDataURL(blob); });
});
writeFileSync(process.env.OUT, Buffer.from(b64, 'base64'));
await browser.close();
console.log('instrumental escrita en', process.env.OUT);
