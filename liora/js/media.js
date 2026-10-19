// Liora Studio · audio (recorte de la canción por etapas) y exportación vertical en el iPhone.
import { loadVideo, seek, canvasToBlob } from './qc.js';

const Ctx = () => new (window.AudioContext || window.webkitAudioContext)();

// iOS solo deja sonar un AudioContext creado o reanudado dentro del gesto del usuario:
// llamar a esto en la primera línea del manejador del botón, antes de cualquier await.
export function unlockAudio() {
  const ac = Ctx();
  try { ac.resume(); } catch { /* */ }
  return ac;
}

export async function decodeAudio(blob) {
  const ctx = Ctx();
  try { return await ctx.decodeAudioData(await blob.arrayBuffer()); } finally { ctx.close?.(); }
}

// Recorta [start, end) segundos y lo devuelve como WAV PCM 16 bits (formato aceptado por los proveedores).
export function sliceToWav(buffer, start, end, targetRate = 44100) {
  const sr = buffer.sampleRate;
  const from = Math.max(0, Math.floor(start * sr)), to = Math.min(buffer.length, Math.floor(end * sr));
  const channels = Math.min(2, buffer.numberOfChannels);
  const ratio = sr / targetRate;
  const frames = Math.max(0, Math.floor((to - from) / ratio));
  const data = new DataView(new ArrayBuffer(44 + frames * channels * 2));
  const str = (o, s) => { for (let i = 0; i < s.length; i++) data.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); data.setUint32(4, 36 + frames * channels * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
  data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, channels, true);
  data.setUint32(24, targetRate, true); data.setUint32(28, targetRate * channels * 2, true);
  data.setUint16(32, channels * 2, true); data.setUint16(34, 16, true); str(36, 'data'); data.setUint32(40, frames * channels * 2, true);
  const chData = []; for (let c = 0; c < channels; c++) chData.push(buffer.getChannelData(c));
  let o = 44;
  for (let i = 0; i < frames; i++) {
    const idx = from + Math.floor(i * ratio);
    for (let c = 0; c < channels; c++) {
      const s = Math.max(-1, Math.min(1, chData[c][idx] || 0));
      data.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true); o += 2;
    }
  }
  return new Blob([data], { type: 'audio/wav' });
}

// Reparte la canción entre las etapas según su duración (editable después en la escena).
export function stageRanges(scenes, offset = 0) {
  let t = offset;
  return scenes.map(s => { const r = [+t.toFixed(2), +(t + s.seconds).toFixed(2)]; t += s.seconds; return r; });
}

export function recorderMime() {
  if (typeof MediaRecorder === 'undefined') return null;
  const c = ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'];
  return c.find(m => MediaRecorder.isTypeSupported?.(m)) || null;
}

function drawCover(ctx, v, W, H, mode) {
  const vw = v.videoWidth, vh = v.videoHeight;
  const k = mode === 'contain' ? Math.min(W / vw, H / vh) : Math.max(W / vw, H / vh);
  const w = vw * k, h = vh * k;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(v, (W - w) / 2, (H - h) / 2, w, h);
}

/**
 * Renderiza en tiempo real una lista de clips en un lienzo 1080×1920 y graba el resultado.
 * audio: 'clips' usa el sonido de cada clip; Blob usa la canción completa como pista única.
 * Es un render en tiempo real: un vídeo de 40 s tarda unos 40 s. La pantalla debe permanecer encendida.
 */
export async function renderVertical(clips, { audio = 'clips', audioOffset = 0, W = 1080, H = 1920, fps = 30, bitrate = 12_000_000, mode = 'cover', onProgress = () => {}, audioContext = null } = {}) {
  const mime = recorderMime();
  if (!mime) throw new Error('Este navegador no permite grabar vídeo (MediaRecorder). Actualiza iOS a 14.5 o superior.');
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const stream = canvas.captureStream(fps);
  const ac = audioContext || Ctx();
  const dest = ac.createMediaStreamDestination();
  dest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
  let song = null;
  if (audio instanceof Blob) {
    const buf = await ac.decodeAudioData(await audio.arrayBuffer());
    song = ac.createBufferSource(); song.buffer = buf; song.connect(dest);
  }
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bitrate, audioBitsPerSecond: 256_000 });
  const chunks = []; rec.ondataavailable = e => e.data.size && chunks.push(e.data);
  const stopped = new Promise(r => { rec.onstop = r; });
  const videos = [];
  for (const c of clips) videos.push(await loadVideo(c));
  if (ac.state === 'suspended') await ac.resume();
  rec.start(500);
  if (song) song.start(0, audioOffset);
  const total = videos.reduce((a, v) => a + v.duration, 0);
  let elapsed = 0;
  for (let i = 0; i < videos.length; i++) {
    const v = videos[i];
    await seek(v, 0);
    let srcNode = null;
    if (!song) { v.muted = false; srcNode = ac.createMediaElementSource(v); srcNode.connect(dest); }
    await new Promise((resolve, reject) => {
      let raf;
      const tick = () => { drawCover(ctx, v, W, H, mode); onProgress(`Renderizando ${Math.round(((elapsed + v.currentTime) / total) * 100)} %`); raf = requestAnimationFrame(tick); };
      v.onended = () => { cancelAnimationFrame(raf); drawCover(ctx, v, W, H, mode); resolve(); };
      v.onerror = () => { cancelAnimationFrame(raf); reject(new Error('Error reproduciendo el clip ' + (i + 1))); };
      v.play().then(tick).catch(reject);
    });
    srcNode?.disconnect();
    elapsed += v.duration;
    URL.revokeObjectURL(v.src);
  }
  song?.stop();
  rec.stop();
  await stopped;
  stream.getTracks().forEach(t => t.stop());
  ac.close?.();
  return new Blob(chunks, { type: mime.split(';')[0] });
}

// Portada vertical 1080×1920 y recorte 3:4 (1080×1440) para la cuadrícula de Instagram.
export async function makeCovers(videoBlob, t) {
  const v = await loadVideo(videoBlob);
  await seek(v, t);
  const out = {};
  for (const [name, W, H] of [['vertical', 1080, 1920], ['grid34', 1080, 1440]]) {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    drawCover(c.getContext('2d'), v, W, H, 'cover');
    out[name] = await canvasToBlob(c, 'image/jpeg', 0.92);
  }
  URL.revokeObjectURL(v.src);
  return out;
}

export function extOf(blob) { return /mp4/.test(blob.type) ? 'mp4' : /webm/.test(blob.type) ? 'webm' : /jpeg/.test(blob.type) ? 'jpg' : 'bin'; }

// Descarga/compartir: en iOS el menú Compartir permite «Guardar vídeo» en Fotos.
export async function shareOrDownload(blob, filename) {
  const file = new File([blob], filename, { type: blob.type });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: filename }); return 'shared'; } catch (e) {
      if (e.name === 'AbortError') return 'cancelled';
      // Safari exige un gesto reciente: si se perdió por las lecturas previas, se ofrece un botón que lo renueva.
      if (e.name === 'NotAllowedError') return tapToShare(file);
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  return 'downloaded';
}

function tapToShare(file) {
  return new Promise(resolve => {
    const b = document.createElement('button');
    b.textContent = 'Toca para guardar «' + file.name + '»';
    b.style.cssText = 'position:fixed;left:16px;right:16px;bottom:calc(76px + env(safe-area-inset-bottom));z-index:30';
    b.onclick = () => {
      navigator.share({ files: [file], title: file.name })
        .then(() => resolve('shared'), e => resolve(e.name === 'AbortError' ? 'cancelled' : 'failed'))
        .finally(() => b.remove());
    };
    document.body.appendChild(b);
  });
}

export function blobToDataUrl(blob) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(blob); });
}

// Comprime una imagen para enviarla como referencia (los proveedores limitan a ~8 MB).
export async function compressImage(blob, maxSide = 1536, q = 0.9) {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image(); img.src = url; await img.decode();
    const k = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return await canvasToBlob(c, 'image/jpeg', q);
  } finally { URL.revokeObjectURL(url); }
}
