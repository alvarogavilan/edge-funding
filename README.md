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

## Privacidad
GitHub Pages aloja el código de la aplicación. Las fotos y la colección del usuario permanecen en el navegador del dispositivo salvo exportación manual.

## Limitaciones
Las señales y escenarios no son garantías de rentabilidad. Las valoraciones dependen de la disponibilidad y calidad de datos públicos de terceros. El reconocimiento puede requerir revisión manual.

## Apps independientes

- **Card Vault**: `index.html`, colección y mercado de cartas.
- **Phygitals Lab**: `phygitals.html`, calculadora condicional, simulación de categorías y resumen local del historial. No comparte estado, almacenamiento, servidor ni capital con Card Vault.

Phygitals Lab incorpora y revisa el trabajo de `claude/phygitals-lab` (868cf9d). La revisión está en `research/phygitals-timing-review.md`. No produce horarios de compra ni presupone distribuciones de premios no publicadas.

Comprobación del motor: `node tests/phygitals-lab.test.cjs`. Simulación descriptiva: `python tools/phygitals_lab.py 5000000` (requiere NumPy).
