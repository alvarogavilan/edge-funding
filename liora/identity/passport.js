// LIORA IDENTITY PASSPORT · ficha técnica del rostro maestro. Se genera en el iPhone a partir de la fotografía
// maestra y es PRIVADA (dato biométrico): no se publica; el candado solo guarda su SHA-256.
// Solo contiene lo que se puede medir u observar en la imagen. Lo que no se mide queda «pendiente de observación».

// Puntos del modelo de 68 landmarks (iBUG 300-W): mandíbula 0–16, cejas 17–26, nariz 27–35, ojos 36–47, boca 48–67.
const P = { jawR: 0, jawL: 16, chin: 8, gonR: 4, gonL: 12, chinR: 6, chinL: 10, nasion: 27, noseTip: 30, noseBase: 33, alaR: 31, alaL: 35,
  eyeROut: 36, eyeRIn: 39, eyeLIn: 42, eyeLOut: 45, mouthR: 48, mouthL: 54, upperTop: 51, upperIn: 62, lowerIn: 66, lowerBot: 57 };

// Inspección humana obligatoria: rasgos que un modelo de 68 puntos no mide con fiabilidad.
export const OBSERVATIONS = [
  ['contorno', 'Contorno y proporciones del rostro'], ['frente', 'Frente y nacimiento del cabello'], ['pomulos', 'Pómulos'],
  ['mandibula', 'Mandíbula y mentón'], ['ojos', 'Forma, color y separación de los ojos'], ['parpados', 'Cejas, párpados y pestañas'],
  ['nariz', 'Nariz y perfil nasal'], ['boca', 'Boca, labios y sonrisa'], ['orejas', 'Orejas'], ['piel', 'Tono, subtono y textura de la piel'],
  ['marcas', 'Pecas, lunares, marcas y asimetrías reales'], ['cabello', 'Cabello: color, textura, densidad y nacimiento'],
  ['distintivos', 'Rasgos distintivos para reconocerla entre escenas']
];
export const NOT_MEASURABLE = ['altura de la frente (el modelo no localiza el nacimiento del cabello)', 'orejas', 'perfil nasal (requiere una vista lateral)',
  'pecas y lunares (requieren inspección visual)', 'textura cutánea', 'color y densidad del cabello'];

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const mean = pts => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
const r3 = x => Math.round(x * 1000) / 1000;
const deg = r => r3(r * 180 / Math.PI);
function angleAt(v, a, b) { // ángulo en v entre los segmentos v→a y v→b
  const u = [a[0] - v[0], a[1] - v[1]], w = [b[0] - v[0], b[1] - v[1]];
  return Math.acos((u[0] * w[0] + u[1] * w[1]) / (Math.hypot(...u) * Math.hypot(...w)));
}

// Proporciones normalizadas por la distancia entre centros de los ojos (independientes del tamaño de la foto).
export function geometry(lm) {
  if (!Array.isArray(lm) || lm.length !== 68) throw new Error('Se necesitan 68 landmarks');
  const eyeR = mean(lm.slice(36, 42)), eyeL = mean(lm.slice(42, 48));
  const iod = dist(eyeR, eyeL);
  const n = x => r3(x / iod);
  const eyeW = (o, i) => dist(lm[o], lm[i]);
  const eyeH = s => (dist(lm[s + 1], lm[s + 5]) + dist(lm[s + 2], lm[s + 4])) / 2;
  const roll = Math.atan2(eyeL[1] - eyeR[1], eyeL[0] - eyeR[0]);
  // inclinación cantal: ángulo del eje canto interno→externo respecto a la línea de los ojos (positivo = canto externo más alto)
  const rot = p => [p[0] * Math.cos(-roll) - p[1] * Math.sin(-roll), p[0] * Math.sin(-roll) + p[1] * Math.cos(-roll)];
  const tilt = (inner, outer) => { const i = rot(lm[inner]), o = rot(lm[outer]); return deg(Math.atan2(i[1] - o[1], Math.abs(o[0] - i[0]))); };
  // simetría: reflejo de los puntos pares respecto al eje nasion→mentón
  const ax = lm[P.nasion], bx = lm[P.chin], dx = bx[0] - ax[0], dy = bx[1] - ax[1], L2 = dx * dx + dy * dy;
  const reflect = p => { const t = ((p[0] - ax[0]) * dx + (p[1] - ax[1]) * dy) / L2; const f = [ax[0] + t * dx, ax[1] + t * dy]; return [2 * f[0] - p[0], 2 * f[1] - p[1]]; };
  const pairs = [[0, 16], [2, 14], [4, 12], [6, 10], [17, 26], [19, 24], [21, 22], [31, 35], [36, 45], [39, 42], [48, 54], [50, 52], [58, 56]];
  const asym = pairs.map(([r, l]) => dist(reflect(lm[r]), lm[l]) / iod);
  const browY = mean([lm[19], lm[24]])[1];
  return {
    normalizacion: 'distancia entre centros de los ojos = 1',
    rostro: { anchura_bicigomatica: n(dist(lm[P.jawR], lm[P.jawL])), altura_nasion_menton: n(dist(lm[P.nasion], lm[P.chin])),
      relacion_ancho_alto: r3(dist(lm[P.jawR], lm[P.jawL]) / dist(lm[P.nasion], lm[P.chin])) },
    mandibula: { anchura_gonial: n(dist(lm[P.gonR], lm[P.gonL])), relacion_gonial_cigomatica: r3(dist(lm[P.gonR], lm[P.gonL]) / dist(lm[P.jawR], lm[P.jawL])),
      angulo_menton_grados: deg(angleAt(lm[P.chin], lm[P.chinR], lm[P.chinL])) },
    tercios: { ceja_a_base_nasal: n(Math.abs(lm[P.noseBase][1] - browY)), base_nasal_a_menton: n(Math.abs(lm[P.chin][1] - lm[P.noseBase][1])),
      relacion_medio_inferior: r3(Math.abs(lm[P.noseBase][1] - browY) / Math.abs(lm[P.chin][1] - lm[P.noseBase][1])) },
    ojos: { anchura_derecho: n(eyeW(36, 39)), anchura_izquierdo: n(eyeW(42, 45)), apertura_derecho: r3(eyeH(36) / eyeW(36, 39)), apertura_izquierdo: r3(eyeH(42) / eyeW(42, 45)),
      distancia_intercantal: n(dist(lm[P.eyeRIn], lm[P.eyeLIn])), inclinacion_cantal_derecho_grados: tilt(39, 36), inclinacion_cantal_izquierdo_grados: tilt(42, 45) },
    cejas: { longitud_derecha: n(dist(lm[17], lm[21])), longitud_izquierda: n(dist(lm[22], lm[26])),
      altura_sobre_ojo_derecha: n(Math.abs(mean(lm.slice(17, 22))[1] - eyeR[1])), altura_sobre_ojo_izquierda: n(Math.abs(mean(lm.slice(22, 27))[1] - eyeL[1])) },
    nariz: { longitud: n(dist(lm[P.nasion], lm[P.noseBase])), anchura_alar: n(dist(lm[P.alaR], lm[P.alaL])), relacion_ancho_largo: r3(dist(lm[P.alaR], lm[P.alaL]) / dist(lm[P.nasion], lm[P.noseBase])) },
    boca: { anchura: n(dist(lm[P.mouthR], lm[P.mouthL])), labio_superior: n(dist(lm[P.upperTop], lm[P.upperIn])), labio_inferior: n(dist(lm[P.lowerIn], lm[P.lowerBot])),
      relacion_superior_inferior: r3(dist(lm[P.upperTop], lm[P.upperIn]) / dist(lm[P.lowerIn], lm[P.lowerBot])), relacion_boca_nariz: r3(dist(lm[P.mouthR], lm[P.mouthL]) / dist(lm[P.alaR], lm[P.alaL])),
      apertura: r3(dist(lm[62], lm[66]) / dist(lm[P.mouthR], lm[P.mouthL])) },
    simetria: { asimetria_media: r3(asym.reduce((a, b) => a + b, 0) / asym.length), asimetria_maxima: r3(Math.max(...asym)) },
    pose: { giro_en_plano_grados: deg(roll), desviacion_nariz: r3((lm[P.noseTip][0] - mid(eyeR, eyeL)[0]) / iod) }
  };
}

// sRGB (0–255) → CIELAB (D65)
export function rgbToLab([r, g, b]) {
  const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const X = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047, Y = 0.2126 * R + 0.7152 * G + 0.0722 * B, Z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883;
  const f = t => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}

// Mediana de color en un disco (sin sombras ni brillos extremos). pixels = ImageData-like {data, width, height}.
export function sampleDisc(pixels, [cx, cy], radius) {
  const vals = [];
  for (let y = Math.max(0, Math.floor(cy - radius)); y <= Math.min(pixels.height - 1, Math.ceil(cy + radius)); y++)
    for (let x = Math.max(0, Math.floor(cx - radius)); x <= Math.min(pixels.width - 1, Math.ceil(cx + radius)); x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 > radius * radius) continue;
      const i = (y * pixels.width + x) * 4;
      const lab = rgbToLab([pixels.data[i], pixels.data[i + 1], pixels.data[i + 2]]);
      vals.push(lab);
    }
  if (!vals.length) return null;
  vals.sort((a, b) => a[0] - b[0]);
  const core = vals.slice(Math.floor(vals.length * 0.15), Math.ceil(vals.length * 0.85));
  const med = k => { const s = core.map(v => v[k]).sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
  return [r3(med(0)), r3(med(1)), r3(med(2))];
}

// Clasificación ITA° (Chardon et al.) del tono de piel; el subtono por ángulo de tono h_ab es orientativo.
export function skinTone(lab) {
  const [L, a, b] = lab;
  const ita = Math.atan2(L - 50, b) * 180 / Math.PI;
  const cat = ita > 55 ? 'muy clara' : ita > 41 ? 'clara' : ita > 28 ? 'intermedia' : ita > 10 ? 'bronceada' : ita > -30 ? 'morena' : 'oscura';
  const hue = Math.atan2(b, a) * 180 / Math.PI;
  const under = hue > 62 ? 'cálido/amarillo' : hue < 48 ? 'frío/rosado' : 'neutro';
  return { lab, ita_grados: r3(ita), categoria_ita: cat, angulo_tono_grados: r3(hue), subtono_orientativo: under };
}

export function colors(lm, pixels) {
  const eyeR = mean(lm.slice(36, 42)), eyeL = mean(lm.slice(42, 48)), iod = dist(eyeR, eyeL);
  const cheekR = mid(lm[2], lm[31]), cheekL = mid(lm[14], lm[35]);
  const eyeH = s => (dist(lm[s + 1], lm[s + 5]) + dist(lm[s + 2], lm[s + 4])) / 2;
  const lips = mean([lm[50], lm[52], lm[57], lm[58], lm[56]]);
  const skin = [sampleDisc(pixels, cheekR, iod * 0.12), sampleDisc(pixels, cheekL, iod * 0.12)].filter(Boolean);
  const skinLab = skin.length ? skin[0].map((_, k) => r3(skin.reduce((s, v) => s + v[k], 0) / skin.length)) : null;
  return {
    aviso: 'Colores medidos en la fotografía: dependen de su iluminación y balance de blancos. Orientativos; confirmar con la revisión visual.',
    piel_mejillas: skinLab ? skinTone(skinLab) : null,
    diferencia_mejillas_deltaE: skin.length === 2 ? r3(Math.hypot(skin[0][0] - skin[1][0], skin[0][1] - skin[1][1], skin[0][2] - skin[1][2])) : null,
    iris_derecho_lab: sampleDisc(pixels, eyeR, eyeH(36) * 0.3), iris_izquierdo_lab: sampleDisc(pixels, eyeL, eyeH(42) * 0.3),
    labios_lab: sampleDisc(pixels, lips, iod * 0.05)
  };
}

export function buildPassport({ identity_id, master_sha256, image, face, pixels }) {
  return {
    format: 'liora-identity-passport-v1', identity_id, master_sha256, generated_at: new Date().toISOString(),
    privado: 'Dato biométrico: no publicar. El candado público solo guarda la huella SHA-256 de este archivo.',
    imagen: { anchura: image.width, altura: image.height },
    deteccion: { confianza: r3(face.score), caras_detectadas: face.faces, caja: Object.fromEntries(Object.entries(face.box).map(([k, v]) => [k, Math.round(v)])),
      modelo: 'face-api.js (vladmandic 1.7.15) · 68 landmarks · descriptor 128-d (el descriptor se guarda solo en el dispositivo)' },
    geometria: geometry(face.landmarks),
    color: colors(face.landmarks, pixels),
    no_medible_automaticamente: NOT_MEASURABLE,
    observaciones: Object.fromEntries(OBSERVATIONS.map(([k, label]) => [k, { rasgo: label, texto: null, estado: 'PENDIENTE_DE_OBSERVACION' }]))
  };
}
