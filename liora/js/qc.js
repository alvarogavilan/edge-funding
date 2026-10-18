// Liora Studio · control de calidad automático de un clip (todo en el iPhone).
// Son indicadores medidos sobre fotogramas reales; no sustituyen la revisión humana obligatoria.
import { analyzeFace, closestFace, distance, mouthOpenness, drawToCanvas, engineReady, loadFaceEngine } from './face.js';
import { identityVerdict } from './pipeline.js';

export async function loadVideo(blob) {
  const v = document.createElement('video');
  v.muted = true; v.playsInline = true; v.preload = 'auto';
  v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
  v.src = URL.createObjectURL(blob);
  await new Promise((res, rej) => {
    v.onloadeddata = res;
    v.onerror = () => rej(new Error('Safari no puede decodificar este vídeo (usa MP4 H.264/HEVC).'));
    setTimeout(() => rej(new Error('Tiempo de carga del vídeo agotado.')), 20000);
  });
  // iOS a veces no pinta fotogramas hasta un primer play().
  try { await v.play(); v.pause(); } catch { /* sin autoplay: seguimos con seek */ }
  // Los WebM de MediaRecorder no declaran duración (Infinity): se fuerza buscando al final.
  if (!Number.isFinite(v.duration)) {
    await new Promise(res => {
      const done = () => { if (Number.isFinite(v.duration)) { v.removeEventListener('durationchange', done); res(); } };
      v.addEventListener('durationchange', done);
      v.currentTime = 1e7;
      setTimeout(res, 8000);
    });
    if (!Number.isFinite(v.duration)) throw new Error('No se puede determinar la duración del vídeo.');
    await seek(v, 0);
  }
  return v;
}

export function seek(v, t) {
  return new Promise(res => {
    const done = () => { v.removeEventListener('seeked', done); res(); };
    v.addEventListener('seeked', done);
    v.currentTime = Math.max(0, Math.min(t, (v.duration || t) - 0.01));
    setTimeout(done, 4000);
  });
}

function gray(canvas, w = 96) {
  const h = Math.max(1, Math.round(canvas.height * w / canvas.width));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(canvas, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  const g = new Float32Array(w * h);
  for (let i = 0; i < g.length; i++) g[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
  return { g, w, h };
}

export function lumaMean({ g }) { let s = 0; for (const x of g) s += x; return s / g.length; }

export function laplacianVariance({ g, w, h }) {
  let sum = 0, sum2 = 0, n = 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    const l = 4 * g[i] - g[i - 1] - g[i + 1] - g[i - w] - g[i + w];
    sum += l; sum2 += l * l; n++;
  }
  if (!n) return 0;
  const m = sum / n;
  return sum2 / n - m * m;
}

export function meanAbsDiff(a, b) {
  if (!a || !b || a.g.length !== b.g.length) return null;
  let s = 0; for (let i = 0; i < a.g.length; i++) s += Math.abs(a.g[i] - b.g[i]);
  return s / a.g.length;
}

const REGIONS = { eyes: [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47], lips: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59], face: [1, 2, 3, 13, 14, 15, 29, 30, 31, 35] };

function regionColor(canvas, landmarks, keys) {
  const pts = keys.map(i => landmarks[i]);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x = Math.max(0, Math.floor(Math.min(...xs))), y = Math.max(0, Math.floor(Math.min(...ys)));
  const w = Math.max(2, Math.ceil(Math.max(...xs)) - x), h = Math.max(2, Math.ceil(Math.max(...ys)) - y);
  const d = canvas.getContext('2d', { willReadFrequently: true }).getImageData(x, y, Math.min(w, canvas.width - x), Math.min(h, canvas.height - y)).data;
  let r = 0, g = 0, b = 0; const n = d.length / 4 || 1;
  for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
  return [r / n, g / n, b / n];
}

const colorDist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

export function pearson(xs, ys) {
  const n = xs.length; if (n < 4) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sx = 0, sy = 0;
  for (let i = 0; i < n; i++) { const dx = xs[i] - mx, dy = ys[i] - my; sxy += dx * dy; sx += dx * dx; sy += dy * dy; }
  return sx && sy ? sxy / Math.sqrt(sx * sy) : null;
}

async function audioEnvelope(blob, times) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
    ctx.close?.();
    const ch = buf.getChannelData(0), sr = buf.sampleRate, win = Math.round(sr * 0.06);
    return times.map(t => {
      const c = Math.round(t * sr); let s = 0, n = 0;
      for (let i = Math.max(0, c - win); i < Math.min(ch.length, c + win); i++) { s += ch[i] * ch[i]; n++; }
      return n ? Math.sqrt(s / n) : 0;
    });
  } catch { return null; }
}

export async function canvasToBlob(canvas, type = 'image/jpeg', q = 0.9) {
  return new Promise(res => canvas.toBlob(res, type, q));
}

/**
 * Analiza un clip y devuelve el informe automático.
 * @param {Blob} blob vídeo
 * @param {{refDescriptors:number[][], stageIndex:number, prevLastDescriptor?:number[], focus?:string, onProgress?:Function}} o
 */
export async function analyzeClip(blob, o) {
  const onProgress = o.onProgress || (() => {});
  let faceOk = true;
  try { if (!engineReady()) await loadFaceEngine(onProgress); } catch { faceOk = false; }
  const v = await loadVideo(blob);
  const duration = v.duration, width = v.videoWidth, height = v.videoHeight;
  const maxFrames = 90;
  const step = Math.max(1 / 8, duration / maxFrames);
  const times = [];
  for (let t = 0.02; t < duration - 0.02; t += step) times.push(+t.toFixed(3));
  const frames = [];
  let prevGray = null, firstFrame = null, lastFrame = null;
  for (let i = 0; i < times.length; i++) {
    await seek(v, times[i]);
    const canvas = drawToCanvas(v, 720);
    const g = gray(canvas);
    const f = { t: times[i], luma: lumaMean(g), sharp: laplacianVariance(g), diff: meanAbsDiff(g, prevGray), face: false };
    prevGray = g;
    if (faceOk && refsUsable(o.refDescriptors)) {
      const face = closestFace(await analyzeFace(canvas, { inputSize: 320 }), o.refDescriptors);
      if (face) {
        f.face = true; f.faces = face.faces; f.descriptor = face.descriptor;
        f.dist = face.dist;
        f.mouth = mouthOpenness(face.landmarks);
        f.color = regionColor(canvas, face.landmarks, REGIONS[o.focus] || REGIONS.face);
      }
    }
    if (i === 0) firstFrame = await canvasToBlob(canvas);
    frames.push(f);
    onProgress(`Analizando fotograma ${i + 1}/${times.length}…`);
  }
  await seek(v, duration - 0.05);
  const lastCanvas = drawToCanvas(v, 1920);
  lastFrame = await canvasToBlob(lastCanvas, 'image/jpeg', 0.95);
  let lastDescriptor = null;
  if (faceOk && refsUsable(o.refDescriptors)) {
    const lf = closestFace(await analyzeFace(drawToCanvas(v, 720), { inputSize: 320 }), o.refDescriptors);
    lastDescriptor = lf?.descriptor || null;
  }
  URL.revokeObjectURL(v.src);

  const report = { analyzedAt: new Date().toISOString(), duration, width, height, sampled: frames.length };
  report.format = formatCheck(width, height, duration);
  report.frames = frameDefects(frames);

  if (!faceOk || !refsUsable(o.refDescriptors)) {
    report.identity = { verdict: 'unavailable', reason: !faceOk ? 'El motor facial no se pudo cargar en este navegador.' : 'No hay referencias maestras con rostro detectado.' };
  } else {
    const withFace = frames.filter(f => f.face);
    const faceRatio = withFace.length / Math.max(1, frames.length);
    report.identity = identityVerdict(withFace.map(f => f.dist), o.stageIndex, faceRatio);
    report.identity.faceRatio = faceRatio;
    report.identity.multiFaceFrames = withFace.filter(f => f.faces > 1).length;
    const jumps = [];
    for (let i = 1; i < withFace.length; i++) {
      const d = distance(withFace[i].descriptor, withFace[i - 1].descriptor);
      if (d > 0.38) jumps.push({ t: withFace[i].t, d: +d.toFixed(3) });
    }
    report.identity.intraJumps = jumps;
    if (jumps.length && report.identity.verdict === 'pass') { report.identity.verdict = 'review'; report.identity.reason = 'Saltos de identidad entre fotogramas en ' + jumps.map(j => j.t + ' s').join(', '); }
    report.identity.series = withFace.map(f => [f.t, +f.dist.toFixed(3)]);

    const firstDesc = withFace[0]?.descriptor;
    if (o.prevLastDescriptor && firstDesc) {
      const d = distance(firstDesc, o.prevLastDescriptor);
      report.continuity = { distance: +d.toFixed(3), verdict: d < 0.4 ? 'pass' : d < 0.5 ? 'review' : 'fail',
        reason: 'Rostro al inicio de esta etapa vs. final de la anterior: ' + d.toFixed(3) };
    } else {
      report.continuity = { verdict: o.stageIndex === 0 ? 'pass' : 'review', reason: o.stageIndex === 0 ? 'Primera etapa.' : 'No hay descriptor final de la etapa anterior.' };
    }

    const colored = withFace.filter(f => f.color);
    if (colored.length > 2) {
      const jumpsC = [];
      for (let i = 1; i < colored.length; i++) {
        const d = colorDist(colored[i].color, colored[i - 1].color);
        if (d > 28) jumpsC.push({ t: colored[i].t, d: Math.round(d) });
      }
      report.makeup = { region: o.focus || 'face', totalChange: Math.round(colorDist(colored[0].color, colored[colored.length - 1].color)), abruptChanges: jumpsC,
        verdict: jumpsC.length ? 'review' : 'pass',
        reason: jumpsC.length ? 'Cambios bruscos de color en la zona trabajada (posible maquillaje que aparece sin aplicación).' : 'Cambio de color gradual en la zona trabajada.' };
    }

    const mouthFrames = withFace.filter(f => f.mouth != null);
    const env = await audioEnvelope(blob, mouthFrames.map(f => f.t));
    if (!env) report.lips = { verdict: 'unavailable', reason: 'El clip no tiene pista de audio decodificable.' };
    else {
      const r = pearson(mouthFrames.map(f => f.mouth), env);
      report.lips = { correlation: r == null ? null : +r.toFixed(2), verdict: r == null ? 'unavailable' : r >= 0.3 ? 'pass' : r >= 0.1 ? 'review' : 'fail',
        reason: 'Correlación apertura de boca ↔ energía vocal: ' + (r == null ? 'insuficientes datos' : r.toFixed(2)) + '. Es un indicador, no un veredicto.' };
    }
  }
  report.lastDescriptor = lastDescriptor;
  report.verdict = overall(report);
  return { report, firstFrame, lastFrame };
}

function refsUsable(refs) { return Array.isArray(refs) && refs.length > 0; }

export function formatCheck(w, h, duration) {
  const ratio = w / h;
  const vertical = Math.abs(ratio - 9 / 16) < 0.02;
  const issues = [];
  if (!vertical) issues.push(`Proporción ${w}×${h} no es 9:16`);
  if (h < 1280) issues.push('Resolución inferior a 720×1280');
  if (!(duration > 0)) issues.push('Duración desconocida');
  return { verdict: issues.length ? 'review' : 'pass', issues, vertical, ratio: +ratio.toFixed(4) };
}

export function frameDefects(frames) {
  const sharp = frames.map(f => f.sharp).sort((a, b) => a - b);
  const medianSharp = sharp[Math.floor(sharp.length / 2)] || 0;
  const diffs = frames.map(f => f.diff).filter(d => d != null).sort((a, b) => a - b);
  const medianDiff = diffs[Math.floor(diffs.length / 2)] || 0;
  const defects = [];
  let frozenRun = 0;
  for (const f of frames) {
    if (f.luma < 12) defects.push({ t: f.t, type: 'negro' });
    else if (f.luma > 245) defects.push({ t: f.t, type: 'blanco/destello' });
    if (medianSharp && f.sharp < medianSharp * 0.35) defects.push({ t: f.t, type: 'desenfocado' });
    if (f.diff != null && medianDiff > 0 && f.diff > Math.max(25, medianDiff * 5)) defects.push({ t: f.t, type: 'salto brusco' });
    frozenRun = f.diff != null && f.diff < 0.3 ? frozenRun + 1 : 0;
    if (frozenRun === 3) defects.push({ t: f.t, type: 'congelado' });
  }
  const severe = defects.filter(d => d.type === 'negro' || d.type === 'blanco/destello').length;
  const ratio = defects.length / Math.max(1, frames.length);
  return { verdict: severe || ratio > 0.15 ? 'fail' : defects.length ? 'review' : 'pass', defects, medianSharp: Math.round(medianSharp) };
}

export function overall(r) {
  const parts = [r.identity, r.continuity, r.frames, r.makeup, r.lips, r.format].filter(Boolean).map(x => x.verdict);
  if (r.identity?.verdict === 'fail' || r.continuity?.verdict === 'fail' || r.frames?.verdict === 'fail') return 'fail';
  if (parts.includes('review') || parts.includes('fail') || parts.includes('unavailable')) return 'review';
  return 'pass';
}
