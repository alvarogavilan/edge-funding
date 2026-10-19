import test from 'node:test';
import assert from 'node:assert/strict';
import * as PP from '../identity/passport.js';

// Rostro sintético perfectamente simétrico (68 puntos), eje vertical en x = 100, ojos a 60 px.
function face({ roll = 0 } = {}) {
  const half = [[40, 80], [42, 100], [46, 120], [52, 140], [60, 156], [70, 168], [80, 176], [90, 182]]; // 0–7
  const jaw = [...half, [100, 184], ...half.slice().reverse().map(([x, y]) => [200 - x, y])];
  const browR = [[52, 64], [60, 60], [68, 59], [76, 60], [84, 63]], browL = browR.slice().reverse().map(([x, y]) => [200 - x, y]);
  const nose = [[100, 70], [100, 82], [100, 94], [100, 106], [88, 114], [94, 116], [100, 117], [106, 116], [112, 114]];
  const eyeR = [[58, 80], [64, 76], [76, 76], [82, 80], [76, 84], [64, 84]];
  const eyeL = [[200 - 82, 80], [200 - 76, 76], [200 - 64, 76], [200 - 58, 80], [200 - 64, 84], [200 - 76, 84]];
  const mo = [[80, 140], [86, 134], [94, 131], [100, 132], [106, 131], [114, 134], [120, 140], [114, 147], [106, 150], [100, 151], [94, 150], [86, 147]];
  const mi = [[84, 140], [94, 137], [100, 137], [106, 137], [116, 140], [106, 143], [100, 144], [94, 143]];
  let pts = [...jaw, ...browR, ...browL, ...nose, ...eyeR, ...eyeL, ...mo, ...mi];
  if (roll) { const c = Math.cos(roll), s = Math.sin(roll); pts = pts.map(([x, y]) => [100 + (x - 100) * c - (y - 100) * s, 100 + (x - 100) * s + (y - 100) * c]); }
  return pts;
}

test('geometría: proporciones normalizadas, simetría perfecta y ojos sin inclinación', () => {
  const g = PP.geometry(face());
  assert.equal(g.simetria.asimetria_media, 0);
  assert.equal(g.pose.giro_en_plano_grados, 0);
  assert.equal(g.ojos.inclinacion_cantal_derecho_grados, 0);
  assert.equal(g.ojos.inclinacion_cantal_izquierdo_grados, 0);
  assert.equal(g.rostro.anchura_bicigomatica, +(120 / 60).toFixed(3));
  assert.equal(g.boca.anchura, +(40 / 60).toFixed(3));
  assert.equal(g.nariz.anchura_alar, +(24 / 60).toFixed(3));
  assert.equal(g.ojos.anchura_derecho, g.ojos.anchura_izquierdo);
});

test('geometría: invariante al giro de la cabeza en el plano', () => {
  const a = PP.geometry(face()), b = PP.geometry(face({ roll: 0.2 }));
  assert.ok(Math.abs(b.pose.giro_en_plano_grados - 11.459) < 0.01);
  for (const [grp, k] of [['rostro', 'relacion_ancho_alto'], ['boca', 'anchura'], ['ojos', 'distancia_intercantal']]) assert.ok(Math.abs(a[grp][k] - b[grp][k]) < 0.005, k);
  assert.ok(Math.abs(b.ojos.inclinacion_cantal_derecho_grados) < 0.01 && b.simetria.asimetria_media < 0.002);
});

test('geometría: detecta asimetría e inclinación cantal reales', () => {
  const lm = face();
  lm[45] = [lm[45][0], lm[45][1] - 4]; // canto externo izquierdo más alto
  const g = PP.geometry(lm);
  assert.ok(g.ojos.inclinacion_cantal_izquierdo_grados > 5);
  assert.ok(g.simetria.asimetria_maxima > 0.05);
  assert.throws(() => PP.geometry(lm.slice(0, 60)), /68/);
});

test('color: CIELAB correcto y clasificación ITA', () => {
  const white = PP.rgbToLab([255, 255, 255]);
  assert.ok(Math.abs(white[0] - 100) < 0.1 && Math.abs(white[1]) < 0.1 && Math.abs(white[2]) < 0.1);
  const skin = PP.rgbToLab([224, 182, 160]);
  const t = PP.skinTone(skin);
  assert.ok(Math.abs(skin[0] - 77.19) < 0.05 && Math.abs(skin[1] - 11.98) < 0.05 && Math.abs(skin[2] - 16.92) < 0.05, String(skin));
  assert.equal(t.categoria_ita, 'muy clara'); // ITA 58,1° > 55° (Chardon)
  assert.equal(PP.skinTone(PP.rgbToLab([141, 85, 36])).categoria_ita, 'morena');
  const w = 200, hgt = 200, data = new Uint8ClampedArray(w * hgt * 4);
  for (let i = 0; i < w * hgt; i++) data.set([224, 182, 160, 255], i * 4);
  const c = PP.colors(face(), { data, width: w, height: hgt });
  assert.equal(c.piel_mejillas.categoria_ita, t.categoria_ita);
  assert.equal(c.diferencia_mejillas_deltaE, 0);
});

test('pasaporte: estructura completa, observaciones pendientes y sin imagen', () => {
  const w = 200, hgt = 200, data = new Uint8ClampedArray(w * hgt * 4).fill(200);
  const pp = PP.buildPassport({ identity_id: 'LIORA-VALE-0001', master_sha256: 'a'.repeat(64), image: { width: w, height: hgt },
    face: { score: 0.98, faces: 1, box: { x: 40, y: 50, w: 120, h: 140 }, landmarks: face() }, pixels: { data, width: w, height: hgt } });
  assert.equal(pp.format, 'liora-identity-passport-v1');
  assert.equal(Object.keys(pp.observaciones).length, PP.OBSERVATIONS.length);
  assert.ok(Object.values(pp.observaciones).every(o => o.texto === null && o.estado === 'PENDIENTE_DE_OBSERVACION'));
  const raw = JSON.stringify(pp);
  assert.doesNotMatch(raw, /data:image|base64/);
  assert.ok(!('descriptor' in pp) && raw.length < 8000);
});
