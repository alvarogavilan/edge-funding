// Genera un clip MP4 sintético (zoom lento sobre un rostro + tono) para pruebas locales.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW || 'playwright-core');
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
await page.goto((process.env.LIORA_URL || 'http://127.0.0.1:8765/liora/') + 'css/app.css');
const b64 = await page.evaluate(async face => {
  const img = new Image(); img.src = 'data:image/png;base64,' + face; await img.decode();
  const c = document.createElement('canvas'); c.width = 720; c.height = 1280; const g = c.getContext('2d');
  const stream = c.captureStream(30); const ac = new AudioContext(); const osc = ac.createOscillator(); const gain = ac.createGain(); const dest = ac.createMediaStreamDestination();
  osc.connect(gain); gain.connect(dest); osc.start(); stream.addTrack(dest.stream.getAudioTracks()[0]);
  const rec = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm' }); const ch = [];
  rec.ondataavailable = e => ch.push(e.data); const done = new Promise(r => { rec.onstop = r; }); rec.start(200); const t0 = performance.now();
  await new Promise(res => { const tick = () => { const t = (performance.now() - t0) / 1000, k = 2.1 + t * 0.05; g.fillStyle = '#222'; g.fillRect(0, 0, 720, 1280); g.drawImage(img, 360 - 256 * k + 40, 400 - 256 * k + 160, 512 * k, 512 * k); gain.gain.value = 0.2 + 0.2 * Math.sin(t * 6); t < 3.2 ? requestAnimationFrame(tick) : res(); }; tick(); });
  rec.stop(); await done; osc.stop();
  const b = new Blob(ch); return await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result.split(',')[1]); fr.readAsDataURL(b); });
}, readFileSync(process.env.FACE_IMG).toString('base64'));
writeFileSync(process.env.OUT, Buffer.from(b64, 'base64'));
await browser.close();
console.log('clip escrito en', process.env.OUT);
