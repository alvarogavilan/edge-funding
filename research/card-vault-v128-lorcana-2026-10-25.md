# Card Vault V128 · Lorcana: por qué no hay oportunidades, zanjado con números (25/10/2026)

## La causa (matemática, no un fallo de la fuente)
En Lorcana no hay «desde EX o mejor» (en Pokémon llega por pokemontcg.io). Sin él, la única compra fiable es un «desde» de
al menos el 75 % de la venta: por debajo suele ser una carta jugada o un anuncio ya vendido (caso Mew ex 232, V126).
Con comisión del 5 % y 11 € de envíos, el beneficio es 0,95·V − 11 − compra:
- para ganar 40 € con compra ≥ 0,75·V hace falta V ≥ (40 + 11) / 0,20 = **255 €**;
- para que la compra quepa en 200 €, V ≤ 200 / 0,75 = **266,67 €**.
Solo cartas de entre 255 € y 267 € podrían cumplir, y en Lorcana casi ninguna vale eso. Las que valen más (Enchanted,
Iconic) no caben en el presupuesto; las demás no dejan 40 € entre su anuncio más barato y su precio de venta.

## Lo que hace ahora la app
- Con «Lorcana» elegido y sin oportunidades: el diagnóstico con estas cuentas (con tus supuestos), cuántas cartas caen en
  la ventana de valor, cuántas tienen «desde» dentro del presupuesto y cuántas lo superan, y las 10 de mejor margen.
- Nuevo supuesto **«Beneficio mínimo en Lorcana»** (40 € por defecto): si aceptas márgenes menores en Lorcana, bájalo y
  esas cartas salen en Compra YA y en el Top 5, sin tocar el mínimo de Pokémon.

## Otra investigación hecha
- Fuentes públicas de precios de Lorcana en Cardmarket: Bindex (la que usa la app, comprobada contra su código), la guía
  oficial de Cardmarket (descarga sin CORS) y servicios de pago (Apify, lorcana-prices.com, TCGGraph). Ni Bindex ni la guía
  oficial son accesibles desde el entorno de pruebas; en el iPhone la app usa Bindex.
- Tendencias 2026 (TCGplayer, EE. UU.): suben sobre todo Enchanted antiguas e Iconic, muy por encima de 200 €.

## Fallo encontrado y corregido (formularios)
Al abrir una hoja de registro, la app enfocaba el primer campo 50 ms después; si ya estabas escribiendo en otro, te
robaba el foco y lo siguiente acababa en el campo del enlace («…charizard180»). Mismo patrón en «Revisar coste» y en el
buscador de Compra YA. Ahora solo enfoca si no estás escribiendo en otro campo. Era el fallo intermitente de la prueba
«Rechaza enlace de búsqueda».

## Pruebas
V128 (6) y todas las anteriores, dos vueltas completas sin fallos; motor, dinero (16), migración (5), aceptación (0 filas
fallidas). Chromium con emulación de iPhone, no Safari real.

Fuentes: [Bindex prices](https://github.com/Douxeh/bindex-prices), [TCGplayer: tendencias Lorcana 07/2026](https://seller.tcgplayer.com/blog/price-trends-disney-lorcana-cards-climbing-in-price-07-06-2026),
[lorcana.gg: cartas más valiosas 2026](https://lorcana.gg/the-most-valuable-disney-lorcana-cards-in-2026/), [Lorcana API (de pago)](https://www.lorcana-prices.com/).
