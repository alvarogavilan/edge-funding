# LIORA IDENTITY LOCK

Fuente única de verdad de la identidad de Liora Vale (`LIORA-VALE-0001`) para Liora Studio, Liora Engine, Instagram, TikTok y cualquier desarrollo futuro.

| Archivo | Qué es | ¿Público? |
|---|---|---|
| `identity-lock.json` | Manifiesto canónico: identificador, huella SHA-256 del maestro, procedencia, huella del pasaporte, derivados autorizados, historial de versiones y reglas | Sí (solo huellas) |
| `identity-lock.js` / `identity_lock.py` | La misma lógica en el navegador y en el motor (integridad, estados, sello, control fotograma a fotograma) | Sí |
| `passport.js` | Pasaporte biométrico: medidas objetivas del maestro + observaciones humanas | Código sí; **el pasaporte generado, no** |
| Fotografía maestra | El retrato original aprobado | **No. Solo en el iPhone** |

## Estados
- **REFERENCIA AUSENTE**: no hay maestro sellado. Nada puede representar oficialmente a Liora: el Studio no aprueba escenas y el motor no genera contenido facial.
- **PENDIENTE DE SELLAR**: hay una foto oficial en el dispositivo, pero su huella no está en el manifiesto.
- **REFERENCIA VERIFICADA**: el archivo local coincide byte a byte (SHA-256) con el maestro sellado.
- **SUSTITUCIÓN BLOQUEADA**: el archivo local no es el maestro sellado.
- Renders: **RENDER PENDIENTE**, **RENDER APROBADO** y **RENDER RECHAZADO**. Para aprobar hacen falta la referencia verificada, una distancia facial ≤ 0,55, el control de todos los fotogramas y la revisión visual humana.

## Control fotograma a fotograma
- El rostro de Liora debe aparecer en al menos el 80 % de los fotogramas.
- No puede haber 2 fotogramas seguidos con otro rostro.
- Ningún fotograma puede superar en más de 0,10 el umbral de identidad.
- La medición tiene que cubrir toda la escena.

No basta con el primer fotograma, con la mediana ni con el nombre «Liora» en un prompt.

## Recuperación del maestro (una sola vez, privada)
1. En el iPhone, abre Liora Studio → 1 · Identidad. La foto oficial guardada en Safari aparece como **PENDIENTE DE SELLAR**.
2. Pulsa **Sellar identidad oficial** y envía `liora-sello-identidad.json`: contiene la huella y las medidas, no la imagen.
3. El mantenedor ejecuta `python identity/identity_lock.py seal liora-sello-identidad.json`. Queda la versión 1, **REFERENCIA VERIFICADA**.
4. Pulsa **Generar pasaporte biométrico (privado)** y completa las observaciones visuales. Escribe solo lo que se ve.
5. Exporta el pasaporte. Para vincular su huella, `python identity/identity_lock.py passport liora-pasaporte-identidad.json`; el archivo no se sube.

Un maestro distinto nunca sustituye al sellado. Cambiar de persona exige un identificador nuevo y la decisión expresa del propietario.
