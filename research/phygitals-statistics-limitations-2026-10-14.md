# Phygitals · revisión de registros públicos (14/10/2026)

## Fuentes contrastadas
- Blockworks: https://app.blockworks.com/projects/phygitals/analytics/phygitals-gachapon
- Metodología Blockworks: https://blockworks.com/analytics/phygitals/phygitals-financials/phygitals-gacha-spend-vs-buyback-cost
- API oficial: https://www.phygitals.com/docs/public-api
- Metodología declarada RipIndex: https://rip-index.com/methodology

## Conclusión
Blockworks excluye algunas aperturas sin NFT entregado y algunas series excluyen pagos con tarjeta. Parte de sus métricas detalladas está restringida a Pro. La API oficial pública documenta catálogo; no documenta exportación pública y exhaustiva de todas las aperturas individuales. No se ha descargado un registro integral de aperturas ni reconstruido sus probabilidades a partir de un denominador completo.

No usar el feed de ganadores para inferir que después de X aperturas toca Epic/Mythic. El nuevo módulo phygitals-patterns.js divide por pack y versión de probabilidades, rechaza duplicados, mide intervalos y límites de confianza y **nunca** genera señal de compra. Cualquier asociación temporal requiere muestra independiente futura, control de pruebas múltiples y cobertura verificable.

Sin costes, sin scraping agresivo ni extracción detrás de paywalls. No se han realizado apuestas, pagos ni compras.
