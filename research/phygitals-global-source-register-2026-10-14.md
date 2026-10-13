# Phygitals — fuentes internacionales y límites de cobertura (14 octubre 2026)

## Fuentes verificadas (URL pública, no dataset descargado)

| Fuente | URL | Datos realmente disponibles | Limitación | Valor |
| --- | --- | --- | --- | --- |
| Phygitals · API oficial | https://www.phygitals.com/docs/public-api | Catálogo de packs y cartas perseguibles; funciones autenticadas para operaciones propias | No expone un historial público completo de aperturas individuales; la clave requiere cuenta y no puede exponerse en GitHub Pages | Catálogo + seguimiento de cambios |
| Phygitals · Recent Pulls | https://www.phygitals.com/ | Ejemplos de aperturas recientes con carta y pack; cobertura instantánea | Feed promocional/parcial; no permite reconstruir denominador | Verificación de resultados, NO tasas |
| RipIndex | https://rip-index.com/pokemon-card-mystery-pack-odds | Comparaciones históricas publicadas; afirma registrar pulls y verificarlos en Solana | No se encontró exportación completa, libre y reutilizable de filas individuales | Comparación secundaria |
| Blockworks Intel | https://app.blockworks.com/projects/phygitals/analytics/phygitals-gachapon | Estadísticas por tiers, aperturas NFT, gasto, P&L, tarjeta/USDC | Excluye aperturas sin NFT en ciertos gráficos; excluye tarjetas en otros. Datos individualizados/exportación restringidos | Series agregadas; no reconstruir odds |
| Dune | https://dune.com/discover/content/popular?dune_tag=Trading+Bot&order=favorites&q=pokj&tags=Airdrop&time_range=30d | Descubrimiento de paneles sobre Phygitals, Solana RWA y Pokémon | Consultas específicas, metodología y denominadores requieren validación | Prospectiva de fuentes, no resultados |
| Solscan | https://solscan.io/ | Actividad pública de NFT y transacciones Solana | Identificar las firmas y decodificar eventos Phygitals antes de clasificar premios; mint no equivale siempre a pack abierto | Verificación on-chain de operaciones puntuales |
| Documentación packs | https://docs.phygitals.com/about-phygitals/welcome-to-phygitals-the-future-of-collecting/packs | Odds anunciadas y recompra porcentual | No constituye resultados históricos ni garantiza efectivo de venta | Línea base de expectativa |
| Creator Packs | https://docs.phygitals.com/about-phygitals/welcome-to-phygitals-the-future-of-collecting/packs/creator-packs | Cartas devueltas pueden regresar a la rotación | No demuestra calendario ni contador público predictivo | Revisar hipótesis de inventario |
| Pack Party | https://docs.phygitals.com/about-phygitals/welcome-to-phygitals-the-future-of-collecting/packs/pack-party | Asignación aleatoria de cartas entre participantes | Requiere conocer lista exacta y plazas para calcular economía; no garantizar premio particular | Analizar sólo con inventario + coste |
| RipIndex comparación | https://rip-index.com/compare/tilt-rips-vs-phygitals | Estimaciones independientes de cash-out medio | Muestra y metodología propias; no sustituye registro bruto | Control de sesgos |

## Hallazgo actual
Según RipIndex (consulta 14/10/2026), el efectivo medio tras recompras de Phygitals sería aproximadamente el 87% de lo pagado en las aperturas examinadas. Es una estadística histórica atribuida a un tercero, no garantía ni cifra de nuestro propio ledger.

## Estado de adquisición
Se verificaron páginas y metodología públicas. **Cero descargas de dataset completo de aperturas individuales** confirmadas en esta sesión. Ningún scraper 24/7 ejecutándose. Cero ganancias demostradas, cero compras automáticas. No existe evidencia de un segundo, hora, contador o secuencia predictiva para Mythic/Epic.

## Protocolo de investigación
1. Antes de inferir una tasa, exigir los identificadores de todas las aperturas elegibles, incluidos resultados comunes y sin NFT entregado, además de timestamp y versión de odds.
2. Tratar streams, vídeos y feeds de ganadores como verificación cualitativa; nunca como muestra aleatoria.
3. Deducir intervalos sólo por pack y versión, controlar múltiples comparaciones, retraso on-chain y sesgo de selección.
4. Reservar la segunda mitad temporal como prueba fuera de muestra; no optimizar retrospectivamente sobre ella.
5. Nunca activar COMPRAR por un resultado estadístico o EV publicado: hace falta operación identificada y salida ejecutable con margen neto positivo.

## Cumplimiento
Sin pagos, scraping intrusivo, credenciales, GitHub Actions ni acceso a endpoints privados. Cualquier extracción futura debe respetar permisos, límites de uso y derechos sobre los datos.
