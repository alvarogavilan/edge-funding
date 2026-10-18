// Liora Studio · lógica pura del pipeline de producción (sin DOM, testeable en Node).

export const STATUS = Object.freeze({
  PENDIENTE: 'PENDIENTE',
  GENERANDO: 'GENERANDO',
  REVISION: 'REVISIÓN',
  APROBADO: 'APROBADO',
  RECHAZADO: 'RECHAZADO',
  EXPORTADO: 'EXPORTADO'
});

const S = STATUS;
const TRANSITIONS = {
  [S.PENDIENTE]: [S.GENERANDO, S.REVISION],
  [S.GENERANDO]: [S.REVISION, S.PENDIENTE],
  [S.REVISION]: [S.APROBADO, S.RECHAZADO, S.GENERANDO],
  [S.RECHAZADO]: [S.GENERANDO, S.REVISION, S.PENDIENTE],
  [S.APROBADO]: [S.EXPORTADO, S.REVISION],
  [S.EXPORTADO]: [S.REVISION]
};

export function canTransition(from, to) {
  return (TRANSITIONS[from] || []).includes(to);
}

// Las 8 etapas obligatorias. Cada una debe partir del último fotograma aprobado de la anterior.
export const STAGES = [
  { key: 'inicial', name: 'Rostro inicial', seconds: 3.5, focus: 'face',
    action: 'looks into the camera with a bare, natural face (no makeup), hair pulled back with a soft headband, begins to sing the first line softly',
    tool: 'none', checks: ['Rostro limpio sin maquillaje', 'Mirada a cámara y arranque del canto'] },
  { key: 'piel', name: 'Preparación de piel', seconds: 3.5, focus: 'face',
    action: 'presses a small amount of serum onto her cheeks with her fingertips and then pats primer on her forehead and cheeks with her right hand, skin texture visible, while singing',
    tool: 'fingertips, primer bottle', checks: ['Producto visible en dedos y piel', 'La piel cambia de forma gradual'] },
  { key: 'base', name: 'Base y contorno', seconds: 3.5, focus: 'face',
    action: 'blends liquid foundation with a damp beauty sponge using small pressing motions, then draws contour under the cheekbones with a dense angled brush and blends it, while singing',
    tool: 'beauty sponge, angled contour brush', checks: ['Esponja y brocha tocan la piel', 'Contorno aparece donde pasa la brocha'] },
  { key: 'ojos', name: 'Sombras y ojos', seconds: 3.5, focus: 'eyes',
    action: 'with one eye closed, sweeps dark midnight-blue eyeshadow onto the eyelid with a fluffy blending brush, building it up gradually in two passes, while humming the melody',
    tool: 'fluffy eyeshadow brush, eyeshadow palette', checks: ['Sombra se acumula en dos pasadas', 'Párpado y pestañas anatómicamente correctos'] },
  { key: 'delineado', name: 'Delineado', seconds: 3.5, focus: 'eyes',
    action: 'holds a black liquid eyeliner pen and draws a sharp winged line along the upper lash line in one steady stroke, elbow resting on the table, then sings again',
    tool: 'liquid eyeliner pen', checks: ['El trazo sigue la punta del delineador', 'Mano estable, sin dedos extra'] },
  { key: 'labios', name: 'Labios', seconds: 3.5, focus: 'lips',
    action: 'outlines her lips with a deep plum lip liner and fills them with a lip brush, then presses her lips together and continues singing',
    tool: 'lip liner pencil, lip brush', checks: ['Color de labios aparece con el pincel', 'Sincronía labial creíble'] },
  { key: 'caracterizacion', name: 'Detalles de caracterización', seconds: 3.5, focus: 'face',
    action: 'places tiny silver crystals along her cheekbones with tweezers and paints thin silver filigree lines at the outer corner of the eyes with a fine detail brush, while singing',
    tool: 'tweezers, fine detail brush', checks: ['Cada cristal se coloca con las pinzas', 'Filigrana trazada, no aparece de golpe'] },
  { key: 'final', name: 'Resultado final cinematográfico', seconds: 3.5, focus: 'face',
    action: 'removes the headband, lets her hair fall, turns slowly to the camera with the complete makeup and sings the final line with confidence, cinematic lighting',
    tool: 'none', checks: ['Maquillaje completo e idéntico al de la etapa anterior', 'Revelación final clara y en bucle'] }
];

export const MANUAL_CHECKS = [
  { key: 'identity', label: 'Identidad: es la misma Liora de las referencias maestras' },
  { key: 'hands', label: 'Manos: cinco dedos, articulaciones y tamaño correctos en todo el clip' },
  { key: 'tools', label: 'Herramientas: brochas/esponjas tocan la piel y no atraviesan ni se deforman' },
  { key: 'progress', label: 'Evolución del maquillaje: aparece donde se aplica, sin cambios mágicos' },
  { key: 'continuity', label: 'Continuidad: parte exactamente del final de la etapa anterior' },
  { key: 'lips', label: 'Labios y sonido: la boca sigue el canto (no solo habla)' },
  { key: 'frames', label: 'Fotogramas: sin parpadeos, deformaciones, saltos ni artefactos' },
  { key: 'quality', label: 'Calidad final: publicable en 1080×1920 sin defectos visibles' }
];

export function newScene(stage, index) {
  return {
    index, key: stage.key, name: stage.name, seconds: stage.seconds,
    action: stage.action, tool: stage.tool,
    status: S.PENDIENTE, attempts: [], currentClip: null,
    auto: null, manual: {}, reviewNote: '', reviewer: '',
    history: [{ at: new Date().toISOString(), to: S.PENDIENTE, note: 'creada' }],
    audioRange: null
  };
}

export function newProject({ title, concept, character }) {
  return {
    id: null, title, concept, character,
    createdAt: new Date().toISOString(),
    audio: null, voice: null,
    scenes: STAGES.map((s, i) => newScene(s, i)),
    exports: []
  };
}

export function transition(scene, to, note = '') {
  if (!canTransition(scene.status, to)) {
    throw new Error(`Transición no permitida: ${scene.status} → ${to}`);
  }
  scene.status = to;
  scene.history.push({ at: new Date().toISOString(), to, note });
  return scene;
}

// Puede generarse si es la primera o si la anterior está aprobada (o exportada).
export function canGenerate(project, index) {
  const sc = project.scenes[index];
  if (![S.PENDIENTE, S.RECHAZADO, S.REVISION].includes(sc.status)) return { ok: false, reason: 'La escena está ' + sc.status };
  if (index === 0) return { ok: true };
  const prev = project.scenes[index - 1];
  if (![S.APROBADO, S.EXPORTADO].includes(prev.status)) {
    return { ok: false, reason: `Primero aprueba «${prev.name}»: su último fotograma es el punto de partida obligatorio.` };
  }
  return { ok: true };
}

// Reglas de aprobación. La revisión humana es obligatoria y el QC automático puede bloquear.
export function approvalGate(project, index) {
  const sc = project.scenes[index];
  const problems = [];
  if (sc.status !== S.REVISION) problems.push('Solo se aprueba desde REVISIÓN.');
  if (!sc.currentClip) problems.push('No hay clip cargado.');
  if (index > 0) {
    const prev = project.scenes[index - 1];
    if (![S.APROBADO, S.EXPORTADO].includes(prev.status)) problems.push(`La etapa anterior («${prev.name}») no está aprobada.`);
  }
  const auto = sc.auto;
  if (!auto) problems.push('Falta ejecutar el control automático.');
  else {
    if (auto.identity?.verdict === 'fail') problems.push('Identidad inconsistente: la escena debe rechazarse y regenerarse.');
    if (auto.identity?.verdict === 'unavailable' && !sc.reviewNote.trim()) problems.push('Sin comparación facial automática: escribe una nota justificando la verificación manual.');
    if (auto.identity?.verdict === 'review' && !sc.reviewNote.trim()) problems.push('Identidad dudosa: escribe una nota explicando por qué la apruebas.');
    if (auto.continuity?.verdict === 'fail') problems.push('Discontinuidad con la etapa anterior (rostro distinto en el corte).');
    if (auto.frames?.verdict === 'fail') problems.push('Fotogramas defectuosos detectados.');
  }
  const missing = MANUAL_CHECKS.filter(c => !sc.manual[c.key]);
  if (missing.length) problems.push('Controles humanos pendientes: ' + missing.map(m => m.key).join(', '));
  if (!sc.reviewer.trim()) problems.push('Indica quién revisa (revisión humana obligatoria).');
  return { ok: problems.length === 0, problems };
}

export function projectReadyForMaster(project) {
  const notApproved = project.scenes.filter(s => ![S.APROBADO, S.EXPORTADO].includes(s.status));
  return { ok: notApproved.length === 0, missing: notApproved.map(s => s.name) };
}

// Umbrales de distancia euclídea entre descriptores faciales de 128 dimensiones (face-api / dlib ResNet).
// < 0.45 misma persona con alta confianza · 0.45–0.55 dudoso · > 0.55 persona distinta.
// El maquillaje intenso de las últimas etapas sube la distancia: se tolera +0.05 marcándolo.
export const IDENTITY = { strong: 0.45, doubtful: 0.55, makeupTolerance: 0.05 };

export function identityVerdict(distances, stageIndex, faceRatio) {
  if (!distances.length) return { verdict: 'fail', reason: 'No se detecta el rostro de Liora en ningún fotograma.' };
  const tol = stageIndex >= 6 ? IDENTITY.makeupTolerance : 0;
  const sorted = [...distances].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const p90 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9))];
  const deviating = distances.filter(d => d > IDENTITY.doubtful + tol).length;
  const ratioDev = deviating / distances.length;
  let verdict = 'pass', reason = 'Coincide con las referencias maestras.';
  if (median > IDENTITY.doubtful + tol || ratioDev > 0.2) {
    verdict = 'fail'; reason = `Rostro distinto: mediana ${median.toFixed(3)}, ${Math.round(ratioDev * 100)} % de fotogramas desviados.`;
  } else if (median > IDENTITY.strong + tol || p90 > IDENTITY.doubtful + tol || faceRatio < 0.6) {
    verdict = 'review'; reason = `Dudoso: mediana ${median.toFixed(3)}, p90 ${p90.toFixed(3)}, rostro visible en ${Math.round(faceRatio * 100)} % de fotogramas.`;
  }
  return { verdict, reason, median, p90, deviatingFrames: deviating, tolerance: tol };
}

export function buildPrompt({ identityText, setting, scene, previous, singing }) {
  const prevDone = previous.map(p => p.name.toLowerCase()).join(', ');
  return [
    `Photorealistic vertical 9:16 smartphone-style beauty video of the SAME woman shown in the reference/start image: ${identityText}.`,
    `Setting (identical in every scene): ${setting}.`,
    previous.length
      ? `Continue EXACTLY from the start frame. Makeup already applied and unchanged: ${prevDone}.`
      : 'Start from the bare face in the start frame.',
    `Action: she ${scene.action}.`,
    scene.tool !== 'none' ? `Real makeup tools in contact with the skin: ${scene.tool}. Product appears only where the tool touches.` : '',
    singing ? 'She is singing (not talking): open vowels, breathing between phrases, natural throat and jaw movement.' : '',
    'Anatomically correct hands with five fingers, natural skin texture with pores, stable face identity, no morphing, no text, no watermark, no logos.'
  ].filter(Boolean).join(' ');
}

export const NEGATIVE_PROMPT = 'extra fingers, fused fingers, deformed hands, face morphing, different person, identity change, makeup appearing without tool contact, plastic skin, flicker, text, subtitles, watermark, logo, cartoon';

export function estimateCost(model, seconds, withAudio) {
  if (!model) return null;
  const rate = withAudio && model.usdPerSecondAudio != null ? model.usdPerSecondAudio : model.usdPerSecond;
  if (rate == null) return null;
  const billed = model.fixedSeconds ? Math.max(seconds, model.fixedSeconds) : seconds;
  return Math.round(rate * billed * 100) / 100;
}

export function summarizeProject(project) {
  const counts = {};
  for (const v of Object.values(S)) counts[v] = 0;
  for (const s of project.scenes) counts[s.status]++;
  const totalSeconds = project.scenes.reduce((a, s) => a + s.seconds, 0);
  return { counts, totalSeconds };
}
