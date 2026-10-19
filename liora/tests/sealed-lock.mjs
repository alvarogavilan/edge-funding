// SOLO PRUEBAS: sirve al navegador un Identity Lock sellado con la imagen de prueba (nunca se escribe en el repositorio).
import { readFileSync } from 'node:fs';
import * as IL from '../identity/identity-lock.js';

export async function routeSealedLock(page, imageBuffer) {
  const base = JSON.parse(readFileSync(new URL('../identity/identity-lock.json', import.meta.url), 'utf8'));
  const lock = await IL.applySeal(base, await IL.buildSeal(new Blob([imageBuffer]), { width: null, height: null, source: 'prueba e2e' }));
  await page.route('**/identity/identity-lock.json', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify(lock) }));
  return lock;
}
