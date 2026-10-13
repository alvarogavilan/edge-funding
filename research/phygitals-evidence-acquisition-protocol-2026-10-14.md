# Phygitals — protocolo de adquisición de evidencia primaria (14-10-2026)

## Objetivo
Obtener registros individuales, auditables, no solo resúmenes agregados. Esta tarea no aprueba compras ni presupone sesgos del sorteo.

## Fuentes verificadas
1. API pública Phygitals: https://www.phygitals.com/docs/public-api . Ruta GET /api/vm/available: id, slug, mint_price, ev, ev_updated_at, in_stock, buyback_percent, odds. No requiere API key para el catálogo. Recompra particular y compras requieren autorización. No almacenar claves en el frontend.
2. RipIndex: https://rip-index.com/compare/courtyard-vs-phygitals — declara auditar el feed y verificar NFT individuales de Phygitals en Solana. Metodología ajena; no se ha obtenido acceso al ledger bruto.
3. Vollector https://vollector.id/g/phygitals — listado consultado: 84 packs, promedio EV +0.6%, GEV -10%; son derivaciones de cifras del operador, no liquidaciones independientes verificadas.
4. Pack Party: https://docs.phygitals.com/about-phygitals/welcome-to-phygitals-the-future-of-collecting/packs/pack-party — 2-10 cartas conocidas, asignación aleatoria al llenarse. Comprobar reglas de compra múltiple antes de cualquier arbitraje.

## Esquema mínimo de registro de apertura
source_url,source_kind,observed_at_utc,occurred_at_utc,pack_id,pack_slug,odds_version,price_paid_currency,price_paid,pull_result_asset_id,rarity,card_market_value_currency,card_market_value,firm_buyback_offer,firm_buyback_currency,offer_verified_at_utc,tx_signature,video_url,video_start_sec,position_selected,number_of_positions,completeness_status,verification_status.
No rellenar datos faltantes con cero o inferencias: null. Cuando la fuente no muestre la posición, no usarla para un análisis de posiciones.

## Hipótesis y condiciones de éxito
- Sesgo de posición: solo con número de posiciones comparable, pérdidas completas, elección aleatorizada o confusores controlados, holdout posterior y corrección por pruebas múltiples.
- Sesgo temporal: timestamp de asignación, no timestamp de publicación/transmisión; odds y pack constantes; contraste en días posteriores.
- Anomalía económica: oferta real ejecutable por el comprador en España, costes efectivos, porcentaje de recompra vigente y stock confirmado.
- Se invalidan pruebas que mezclen Dollar Pack Pokémon con Dollar Sport, métricas brutas con liquidaciones, o ventanas solapadas como si fueran independientes.

## Entregable medible
Un manifiesto de fuentes con accesibilidad de datos, fechas de captura y cobertura; exportación de registros individuales solo si pueden verificarse; test reproducible. No decir «millones de casos reales» si no existen. Hasta disponer de datos primarios y salidas firmes, NO COMPRAR.
