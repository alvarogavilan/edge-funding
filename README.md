# Card Vault

Card Vault es una app iPhone-first para gestionar una colección de cartas Pokémon y analizar el mercado como un portfolio.

## Estado actual — V21
- Colección RAW, PSA, BGS y CGC.
- Fotos guardadas localmente en IndexedDB.
- Copia/restauración completa en JSON.
- Reconocimiento asistido por OCR + catálogo TCGdex.
- Precios RAW de referencia cuando TCGdex/Cardmarket los expone.
- Market Lab con señales de momentum, valor, estabilidad, presencia internacional y calidad de datos.
- Índice Card Vault, amplitud de mercado y sectores por personaje.
- Histórico de valoración, watchlist y radar.
- Diagnóstico interno de build, fotos, OCR y escaneo.

## V104 · Compra YA, Comprar para restaurar y Ventas reales
- Fichas grandes con foto, identidad, idioma, estado, precio de compra, envío (confirmado/estimado), venta estimada, gastos y beneficio en tres escenarios.
- Estados automáticos: COMPRA COMPROBADA (anuncio concreto, precio, stock y comprobación ≤ 24 h), EN OBSERVACIÓN y CADUCADA.
- El precio de salida solo se sustenta en ventas cerradas; las medias agregadas y los anuncios activos se muestran pero no generan beneficio.
- La comprobación del anuncio la hace el usuario desde el iPhone (el navegador no puede leer Cardmarket ni TCGplayer) y queda fechada.
- Pruebas: `node tests/vault-v104-engine.test.cjs` y `node tests/vault-v104-e2e.cjs` (Chromium con emulación de iPhone).

## V105 · Radar «En investigación»
- `vault-universe.js` (generado con `tools/build_vault_universe.py` desde tcgdex/cards-database): 5.213 cartas Pokémon con rareza de valor, sin precios.
- Desde Safari, el radar consulta en directo la API pública de TCGdex (precios Cardmarket/TCGplayer con su fecha) y Lorcast (Lorcana, USD) y clasifica por margen conservador. Todo es investigación: anuncio más barato sin estado ni idioma y medias agregadas.
- Cambio USD→EUR del BCE (frankfurter.app) con fecha; si falla, valor manual identificado.
- «He comprado» añade la carta a Mi colección con su coste.

## V107 · verdad comercial e integridad del historial
- El radar solo muestra una «diferencia bruta» como indicador; nunca beneficio ni porcentajes de restauración.
- «He comprado» guarda cada coste (pagado / estimado / desconocido), evita duplicados y valora a coste las cartas para restaurar.
- Importar copia fusiona sin borrar; aviso visible si Safari no puede guardar.
- Auditoría y límites: `research/card-vault-v107-auditoria-2026-10-23.md`.
- Pruebas: `node tests/vault-v104-engine.test.cjs`, `node tests/vault-v104-e2e.cjs`, `node tests/vault-v107-regresion-e2e.cjs`, `node tests/card-images.test.cjs` (Chromium con emulación móvil; no es Safari real).

## Privacidad
GitHub Pages aloja el código de la aplicación. Las fotos y la colección del usuario permanecen en el navegador del dispositivo salvo exportación manual.

## Limitaciones
Las señales y escenarios no son garantías de rentabilidad. Las valoraciones dependen de la disponibilidad y calidad de datos públicos de terceros. El reconocimiento puede requerir revisión manual.

## Apps independientes

- **Card Vault**: `index.html`, colección y mercado de cartas.
- **Phygitals Lab**: `phygitals.html`, calculadora condicional, simulación de categorías y resumen local del historial. No comparte estado, almacenamiento, servidor ni capital con Card Vault.

Phygitals Lab incorpora y revisa el trabajo de `claude/phygitals-lab` (868cf9d). La revisión está en `research/phygitals-timing-review.md`. No produce horarios de compra ni presupone distribuciones de premios no publicadas.

Comprobación del motor: `node tests/phygitals-lab.test.cjs`. Simulación descriptiva: `python tools/phygitals_lab.py 5000000` (requiere NumPy).
