// Decisión editorial de cada archivo final. Los estados se derivan de comprobaciones reales
// (huella del archivo, Identity Lock, veredicto del render, formato y revisión humana), nunca se eligen a mano.
import { REF, RENDER } from '../identity/identity-lock.js';

export const ED = Object.freeze({ NO: 'NO PUBLICAR', REVISAR: 'REVISAR', APTO: 'APTO PARA PUBLICAR' });

// item: { kind: 'grafico' | 'liora', reserved, reserved_reason, sha_expected, sha_actual, mime, width, height, duration,
//         identity: { master_sha256, states: [RENDER_…] }, review: { by, at, sha256 } | null }
export function decide(item, { lockState, lockSha } = {}) {
  const no = reason => ({ state: ED.NO, reason });
  if (!item.sha_actual) return no('Archivo no disponible en este dispositivo.');
  if (item.sha_expected && item.sha_expected !== item.sha_actual) return no('El archivo no coincide con su huella registrada: puede estar alterado.');
  if (item.reserved) return no(item.reserved_reason || 'Reservado por decisión editorial.');
  if (!/^video\/mp4/.test(item.mime || '')) return no('No es MP4: Instagram y TikTok necesitan el MP4 exportado desde Safari.');
  if (!(item.width > 0 && item.height > 0) || Math.abs(item.width / item.height - 9 / 16) > 0.02) return no('No es vertical 9:16.');
  if (!(item.duration >= 3)) return no('Dura menos de 3 s.');
  if (item.kind === 'liora') {
    if (lockState !== REF.VERIFICADA) return no('Identity Lock: la referencia maestra de Liora no está verificada.');
    const id = item.identity || {};
    if (id.master_sha256 !== lockSha) return no('Generado desde otra referencia que no es el maestro sellado.');
    if (!id.states?.length || id.states.some(s => s !== RENDER.APROBADO)) return no('Hay escenas sin RENDER APROBADO (identidad fotograma a fotograma y revisión humana).');
  }
  if (!item.review || item.review.sha256 !== item.sha_actual) return { state: ED.REVISAR, reason: 'Falta la revisión editorial final de este archivo exacto (verlo completo con sonido).' };
  return { state: ED.APTO, reason: `Revisado por ${item.review.by} el ${item.review.at.slice(0, 16).replace('T', ' ')}. Pendiente de subirlo: la publicación es manual.` };
}

export const REVIEW_CHECKS = ['He visto el archivo completo con sonido', 'Es la misma Liora en todos los fotogramas (sin cambios de persona ni deformaciones)',
  'Manos, pincel y ojos sin defectos', 'Se marcará como contenido generado con IA en Instagram y TikTok', 'Sin marcas de agua ni logos de otras plataformas'];
