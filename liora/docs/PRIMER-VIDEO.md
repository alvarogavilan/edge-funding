# Plan del primer vídeo (prioridad absoluta)

1. **Cerrar la identidad** – Identidad → subir la fotografía oficial (tipo «Fotografía oficial»). Queda bloqueada.
   Exportar el paquete de identidad a Archivos/iCloud.
2. **Backend** – desplegar `worker/worker.js` en Cloudflare (pasos en Motores), con `ALLOW_PAID=false`.
   Conectar desde Motores y pulsar «Verificar modelos y precios» (sin coste). Corregir cualquier modelo que no
   encaje con su esquema real.
3. **Autorizar un gasto de prueba** – cargar saldo en fal.ai (p. ej. 10 USD) y poner `ALLOW_PAID=true`,
   `MAX_USD_PER_JOB=3`, `MAX_USD_TOTAL=10`.
4. **Escena de maquillaje natural** – Producción → etapa 1 (rostro inicial) con Veo 3.1 Fast (≈0,80 USD)
   para validar identidad y movimiento; si pasa el QC, regenerar con Veo 3.1 y aprobar. Etapa 2 (piel) desde su
   último fotograma: es la primera prueba real de manos + producto + piel.
5. **Canto sincronizado** – cargar la canción con licencia y su tramo; sobre la etapa 2 probar Sync Lipsync 2 Pro
   (clip aprobado + tramo) y OmniHuman 1.5 (imagen + tramo). Elegir la ruta con mejor boca↔voz y revisión humana.
6. **Vídeo completo** – completar las 8 etapas con la ruta elegida, montar el máster con la canción completa.
7. **Validar antes de publicar** – validación humana final, portadas, textos con aviso de IA, publicar y registrar.
