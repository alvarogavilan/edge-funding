# Phygitals: evidencia y modelo descriptivo, 13 octubre 2026

## Resultado
No se ha verificado un truco de horarios, secuencias o combinaciones que aumente la probabilidad de premio. No se ejecutaron compras ni aperturas pagadas. Dos agentes investigaron probabilidades y envío por separado; se calcularon cinco millones de sorteos de un modelo local, no cinco millones de pruebas de la app.

El propietario informa de una carta valorada en 990 EUR, su venta y retirada bancaria instantánea, y de reinversión posterior de casi el mismo importe con resultados inferiores. Falta el historial de depósitos, compras, ventas, retiradas y saldo actual para conocer su resultado neto. Valor estimado y dinero realmente recibido son magnitudes distintas.

## Mythic Pokémon oficial
Consulta: https://www.phygitals.com/claw/mythic-pack y https://www.phygitals.com/claw

Precio publicado: 1.000 USD. La interfaz también muestra +100k pts; este informe no asigna valor monetario a puntos. Valor esperado publicado por el operador: 1.024 USD. Recompra publicada en catálogo: 90% del valor de la carta. No es 90% del precio pagado por el pack.

| Valor estimado de la carta (USD) | Probabilidad publicada | Frecuencia en modelo de 5.000.000 sorteos |
|---|---:|---:|
| 600–1.000 | 80% | 4.001.038 |
| 1.000–2.000 | 15% | 748.248 |
| 2.000–8.000 | 4% | 200.496 |
| 8.000–100.000 | 1% | 50.218 |

Si el valor esperado del operador y la recompra del 90% son aplicables, el efectivo esperado sería 1.024 × 0,90 = 921,60 USD, una pérdida media de 78,40 USD por pack de 1.000 USD antes de otros costes y cambio de divisa. Esto es una inferencia condicional, no rendimiento auditado ni garantía individual. No se conoce la distribución de precios dentro de cada tramo, por lo que no se inventó una distribución uniforme ni una probabilidad exacta de beneficio. Los valores y promociones pueden variar.

La simulación usa NumPy default_rng con semilla 20261013 y límites acumulados [0,80; 0,95; 0,99; 1]. Frecuencia del tramo superior: 1,00436%. Solo reproduce las probabilidades publicadas. Bajo independencia, la probabilidad de no obtener ese tramo en 20 aperturas es 0,99^20 = 81,79%. No implica que abrir más sea rentable ni que este modelo valide el generador de Phygitals.

## Packs de creadores y Epic
https://www.phygitals.com/repacks/10-mythic-vhmkpl publica un pack distinto, “10% Mythic”, de 100 USD (+10k pts), con valor esperado de 105 USD: 90% en 50–100 USD y 10% en 200–10.000 USD. No confundirlo con Mythic Pokémon de 1.000 USD. Su recompra concreta no se verificó y no se proyectan ingresos aplicando un porcentaje supuesto.

No se identificó inequívocamente el pack “Epic” del usuario. Sus probabilidades requieren el enlace o nombre exacto. No trasladar las odds de Mythic a Epic.

## Aleatoriedad y auditoría
https://docs.phygitals.com/platform-features/provable-fairness describe un esquema commit–reveal, hash SHA-256 y semillas de cliente y servidor. La explicación comercial también menciona VRF público; no se comprobó independientemente su implementación ni se reprodujo el resultado de una apertura real. La documentación no permite predecir la semilla secreta. Una demo no demuestra las probabilidades de aperturas pagadas. Las pérdidas anteriores no acreditan que la siguiente apertura deba ganar.

## Liquidez y entrega física
https://docs.phygitals.com/financial/adding-and-withdrawing-funds describe SEPA Instant para retiradas estándar en España y costes visibles antes de confirmar. La retirada instantánea informada por el usuario es compatible con esa explicación; no demuestra rentabilidad acumulada ni que todas las retiradas sean instantáneas.

https://docs.phygitals.com/platform-features/pack-opening-and-buyback describe recompra sobre valor estimado y condiciones temporales. “100% buyback” significa porcentaje del valor de la carta, no recuperación del importe del pack.

Las condiciones de redeem de cartas físicas deben comprobarse por carta/vault y destino: envío internacional, valor declarado, posibles impuestos de importación, gestión y envíos separados pueden reducir la rentabilidad. No se ha presupuestado la entrega física a Sevilla de la cartera del usuario ni probado retirada o compra alguna.

## Decisión práctica
Con 60 EUR de caja confirmada en Cardmarket y 160 EUR brutos de Pikachu pendientes de envío, no hay base para recomendar reinvertir en aperturas buscando recuperar pérdidas o financiar una cartera. Para analizar una compra directa harían falta precio total, foto real, versión/idioma/nota/certificado y ventas cerradas comparables. Las ofertas minoristas disponibles en Card Vault se muestran separadas de recomendaciones de inversión verificadas.
