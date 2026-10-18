// Liora Studio · reconocimiento facial en el propio dispositivo (sin enviar imágenes a servidores).
// Motor: @vladmandic/face-api 1.7.15 (MIT) con TensorFlow.js, modelos servidos desde /liora/vendor.
// Descriptor: vector de 128 dimensiones (ResNet-34 estilo dlib). Se compara con distancia euclídea.
let api = null;
let loading = null;

export async function loadFaceEngine(onStatus = () => {}) {
  if (api) return api;
  if (loading) return loading;
  loading = (async () => {
    onStatus('Cargando motor facial (≈8 MB, solo la primera vez)…');
    const faceapi = await import('../vendor/face-api/face-api.esm.js');
    const tf = faceapi.tf;
    // WebGL (GPU del iPhone) → WebAssembly → CPU. setBackend devuelve false si no puede.
    tf.setWasmPaths?.(new URL('../vendor/face-api/', import.meta.url).href);
    let ok = false;
    for (const b of ['webgl', 'wasm', 'cpu']) {
      try { ok = await tf.setBackend(b); } catch { ok = false; }
      if (ok) break;
    }
    if (!ok) throw new Error('Ningún motor de cálculo disponible.');
    await tf.ready();
    const base = new URL('../vendor/face-api/model/', import.meta.url).href;
    await faceapi.nets.tinyFaceDetector.loadFromUri(base);
    await faceapi.nets.faceLandmark68Net.loadFromUri(base);
    await faceapi.nets.faceRecognitionNet.loadFromUri(base);
    onStatus('Motor facial listo (' + tf.getBackend() + ').');
    api = faceapi;
    return api;
  })();
  try { return await loading; } finally { loading = null; }
}

export function engineReady() { return !!api; }

// Devuelve la cara más grande del lienzo/imagen o null.
export async function analyzeFace(input, { inputSize = 416, minScore = 0.4 } = {}) {
  const faceapi = await loadFaceEngine();
  const opts = new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold: minScore });
  const results = await faceapi.detectAllFaces(input, opts).withFaceLandmarks().withFaceDescriptors();
  if (!results.length) return null;
  const best = results.reduce((a, b) => (a.detection.box.area > b.detection.box.area ? a : b));
  const pts = best.landmarks.positions.map(p => [p.x, p.y]);
  return {
    faces: results.length,
    score: best.detection.score,
    box: { x: best.detection.box.x, y: best.detection.box.y, w: best.detection.box.width, h: best.detection.box.height },
    descriptor: Array.from(best.descriptor),
    landmarks: pts
  };
}

export function distance(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; }
  return Math.sqrt(s);
}

export function centroid(descriptors) {
  const n = descriptors.length;
  const c = new Array(128).fill(0);
  for (const d of descriptors) for (let i = 0; i < 128; i++) c[i] += d[i] / n;
  return c;
}

// Distancia a la identidad oficial: mínimo entre referencias y centroide.
export function identityDistance(descriptor, refDescriptors) {
  if (!refDescriptors.length) return null;
  const toRefs = Math.min(...refDescriptors.map(r => distance(descriptor, r)));
  const toCentroid = distance(descriptor, centroid(refDescriptors));
  return Math.min(toRefs, toCentroid);
}

// Apertura de la boca normalizada (labios interiores 61–67 sobre anchura de boca 60–64).
export function mouthOpenness(landmarks) {
  if (!landmarks || landmarks.length < 68) return null;
  const d = (i, j) => Math.hypot(landmarks[i][0] - landmarks[j][0], landmarks[i][1] - landmarks[j][1]);
  const width = d(60, 64) || 1;
  return (d(61, 67) + d(62, 66) + d(63, 65)) / (3 * width);
}

export async function blobToImage(blob) {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}

// Reduce la imagen (las fotos del iPhone pesan mucho) manteniendo proporción.
export function drawToCanvas(source, maxSide = 1280) {
  const w = source.videoWidth || source.naturalWidth || source.width;
  const h = source.videoHeight || source.naturalHeight || source.height;
  const k = Math.min(1, maxSide / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * k); c.height = Math.round(h * k);
  c.getContext('2d', { willReadFrequently: true }).drawImage(source, 0, 0, c.width, c.height);
  return c;
}
