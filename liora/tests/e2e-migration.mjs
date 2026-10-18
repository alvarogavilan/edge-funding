// Comprueba que los datos de la versión anterior (v1) se conservan al abrir la v2.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium, devices } = require(process.env.PW || 'playwright-core');
const BASE = (process.env.LIORA_URL || 'http://127.0.0.1:8765/liora/');
const FACE = readFileSync(process.env.FACE_IMG).toString('base64');
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext(devices['iPhone 13']);
const page = await ctx.newPage();
await page.goto(BASE + 'css/app.css');
await page.evaluate(async b64 => {
  localStorage.setItem('liora_project', JSON.stringify({ title: 'Proyecto antiguo', concept: 'Concepto antiguo', audio: 'x' }));
  localStorage.setItem('liora_trends', JSON.stringify([{ url: 'https://www.tiktok.com/@a/video/1', note: 'nota antigua' }]));
  const blob = await (await fetch('data:image/png;base64,' + b64)).blob();
  await new Promise((res, rej) => { const r = indexedDB.open('liora_assets', 1); r.onupgradeneeded = e => e.target.result.createObjectStore('files'); r.onsuccess = e => { const tx = e.target.result.transaction('files', 'readwrite'); tx.objectStore('files').put(blob, 'master'); tx.oncomplete = () => { e.target.result.close(); res(); }; }; r.onerror = rej; });
}, FACE);
await page.goto(BASE + 'produccion.html');
await page.waitForFunction(() => window.__liora?.state?.project, null, { timeout: 30000 });
await page.waitForFunction(() => window.__liora.state.refs.some(r => r.official && r.descriptor), null, { timeout: 120000 });
const r = await page.evaluate(async () => ({
  title: window.__liora.state.project.title, refs: window.__liora.state.refs.length,
  trends: (await window.__liora.db.all('trends')).map(t => t.notes),
  legacyV1: await new Promise(res => { const r = indexedDB.open('liora_assets', 1); r.onsuccess = e => { const d = e.target.result; const ok = d.version === 1 && d.objectStoreNames.contains('files'); const g = d.transaction('files').objectStore('files').get('master'); g.onsuccess = () => { res(ok && g.result instanceof Blob); d.close(); }; }; r.onerror = () => res(false); })
}));
// El panel principal (index.html, liora_assets v1) sigue funcionando después
const panelErrors = [];
page.on('pageerror', e => panelErrors.push(e.message));
await page.goto(BASE);
await page.waitForTimeout(2000);
const panelMaster = await page.evaluate(() => document.getElementById('avatarMsg')?.textContent || '');
console.log('panel principal:', JSON.stringify({ errores: panelErrors, avatarMsg: panelMaster }));
console.log(JSON.stringify(r));
const ok = r.title === 'Proyecto antiguo' && r.refs === 1 && r.trends[0] === 'nota antigua' && r.legacyV1 && panelErrors.length === 0;
await browser.close();
console.log(ok ? 'Migración superada' : 'Migración FALLIDA'); if (!ok) process.exitCode = 1;
