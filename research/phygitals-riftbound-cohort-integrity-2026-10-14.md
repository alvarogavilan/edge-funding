# Phygitals Riftbound: revisión de coherencia de datos — 2026-10-14
Fuentes accesibles:
- https://rip-index.com/sites/phygitals (publicado 2026-10-13 22:59 UTC)
- https://ripranks.com/card-rip-sites/phygitals/packs/starter-riftbound-pack (consultado 2026-10-14)

## Datos observados (no descargados como transacciones)
- RipIndex: Starter Riftbound USD 25, 1.536 aperturas en 7 días, retorno neto estimado por recompra -6,8%.
- RipRanks: Starter Riftbound USD 25, 8.312 'real pulls sampled' en su cabecera; el bloque inferior marca 9.323 'all time' y 9.323 en la sección de resultados; las frecuencias por rareza (7.684 Common + 1.354 Uncommon + 183 Epic + 102 Mythic) **suman 9.323**, no 8.312. Advertencia: segmentos posiblemente generados en distintas fechas o actualizaciones parciales. **No utilizar 8.312 como denominador de esas tasas por rareza.**
- RipRanks: probabilidad API 2026-10-13: 82% Common / 15% Uncommon / 2% Epic / 1% Mythic. Observaciones en la tabla de 9.323: 82,4% / 14,5% / 2,0% / 1,1%. No evidencia fuerte de divergencia, pero la muestra no está auditada íntegramente.
- RipRanks informa mediana de valor nominal 43,5% y promedio 98,5% del coste (etiqueta cabecera: n=8.312); solo 17,7% de aperturas valían al menos lo pagado. No equiparar nominal a cash.
- Bloque 'Today' de RipRanks: 39 pulls, USD 975 gastados, USD 645 en valor de cartas; relación 66,2% nominal, NO devolución neta verificada.

## Interpretación
El hallazgo relevante es la **desincronización interna del proveedor de datos**: porcentajes/conteos de distintos cortes temporales pueden hacer que aparezcan patrones ficticios. Ningún análisis de posición, segundo, o secuencia tiene sentido antes de fijar fuente y cohorte.

## Semáforo
NO COMPRAR. No hay dato de una posición ganadora, hora o segunda carta predecible. Cero movimientos individuales con timestamps UTC/firmas descargados durante esta revisión. Las estadísticas anteriores no son un precio ejecutable.
