# Liora Studio

Aplicación iPhone-first (Safari) para producir vídeos de **Liora Vale** (@lioravalemakeup): una única
influencer virtual que canta mientras se maquilla paso a paso. Servida gratis por GitHub Pages en
`https://alvarogavilan.github.io/edge-funding/liora/`.

| Módulo | Estado real |
|---|---|
| Identidad (foto oficial bloqueada, referencias por ángulo, comparador, copia de seguridad) | Funcional en el dispositivo (face-api, sin servidores) |
| Pipeline de 8 escenas con estados, continuidad y regeneración | Funcional |
| QC automático (identidad, continuidad, fotogramas, maquillaje, boca↔voz, formato) | Funcional; indicadores, no veredictos |
| Revisión humana obligatoria y validación final | Funcional |
| Generación real (Veo 3.1, Kling 3.0, Seedance 2.0, OmniHuman 1.5, Sync Lipsync) | Integrada vía Worker + fal.ai. **Pendiente de desplegar el Worker y autorizar gasto**: hasta entonces no se genera nada |
| Canción con licencia, tramos por etapa, voz oficial | Funcional (recorte WAV en el iPhone) |
| Montaje del máster 1080×1920, portadas 9:16 y 3:4, textos, entregables | Funcional (render en tiempo real) |
| Tendencias con métricas verificadas y conceptos originales | Funcional; no inventa datos |
| Registro de publicaciones | Funcional (manual; sin API de Instagram/TikTok) |

* `index.html`, `css/`, `js/` – interfaz (módulos ES, sin compilación).
* `vendor/face-api/` – @vladmandic/face-api 1.7.15 (MIT) + modelos + binarios WASM de TensorFlow.js 4.22 (Apache-2.0).
* `worker/` – backend privado para Cloudflare Workers (claves y topes de gasto).
* `docs/` – [proveedores y costes](docs/PROVEEDORES.md), [arquitectura y seguridad](docs/ARQUITECTURA.md), [plan del primer vídeo](docs/PRIMER-VIDEO.md).
* `tests/` – `npm test` (unitarias de pipeline y Worker) y pruebas E2E con Playwright/Chromium en emulación iPhone.
