# Card Vault V119 · Investigación «ser los más rápidos» y lo que se ha hecho (24/10/2026)

## Lo que dice la investigación
| Hallazgo | Fuente | Qué implica |
|---|---|---|
| La guía oficial de precios de Cardmarket se publica **una vez al día** (≈ 02:45, hora de Madrid), en descarga pública sin acceso | Nota de Cardmarket enlazada en [ZyzyThePizi/pokemon-price-data](https://github.com/ZyzyThePizi/pokemon-price-data) · `downloads.s3.cardmarket.com/productCatalog/priceGuide/price_guide_6.json` | Nadie que use la guía tiene datos más frescos que esa hora; la ventaja es **mirar primero lo que acaba de bajar**. |
| Cardmarket sirve esa descarga **sin CORS** (un navegador no puede leerla) | README del espejo | La app usa el espejo público, que copia la guía a las ≈ 05:00 y guarda **fotos diarias de 14 días**. |
| Las guías mezclan idiomas y estados (ediciones internacionales) | README del espejo | Ver V118: japonesas = producto propio; resto con «Pegar datos». |
| Herramientas de alertas en tiempo real (TCGPriceAlert, PING, CardEdge) trabajan sobre **TCGplayer o eBay**, de pago, desde EE. UU. | [tcgpricealert.com](https://tcgpricealert.com/), [pingtcg.com](https://pingtcg.com/), [cardedge.app](https://cardedge.app/) | No sirven desde 41020 (sin eBay ni EE. UU.). No se ha encontrado una alerta en directo de anuncios de Cardmarket. |
| Listas de deseos de Cardmarket: se pegan como texto línea a línea; Pokémon necesita nombre + ataques | [Ayuda de Cardmarket](https://help.cardmarket.com/en/how-to-add-a-pkmn-decklist-to-wants) | Sin formato de importación masiva oficial: no se automatiza. |
| Notificaciones push en iPhone exigen web añadida a la pantalla de inicio + Push API + **servidor de envío** | [OneSignal](https://documentation.onesignal.com/docs/ios-web-push) y otros | Fuera de las reglas (sin servidores ni costes). Los avisos se muestran dentro de la app. |
| Mercado 2026: vintage y modernas populares aguantan; modernas intermedias sobreimpresas caen | [Pokemon Price Tracker](https://www.pokemonpricetracker.com/blog/posts/how-to-flip-pokemon-cards-for-profit-2026-strategy) | El orden por liquidez y tendencia ya penaliza lo que no se vende. |

## Hecho en V119
1. **🔥 Bajadas desde ayer.** La app descarga la foto del día anterior (una vez por guía, guardada en IndexedDB) y compara el
   «desde»: aviso «BAJÓ X % DESDE AYER», línea «ayer → hoy», contador en el resumen y orden «🔥 Bajadas desde ayer».
   Solo se marca 🔥 si además deja el beneficio mínimo. Hora de los datos visible para saber cuándo mirar.
2. **≈ 5.270 cartas japonesas** (antes 152). En las 44 expansiones japonesas identificadas, el resto de cartas se empareja
   por nombre y, si hay varias versiones, por orden de numeración. Comprobación: aplicado a las cartas cuyo producto ya se
   conocía, acierta **130 de 130**. Las expansiones que Cardmarket agrupa (Ancient Roar + Future Flash) no se adivinan.
   Ejemplo real: Umbreon ex SV8A nº 217 (SAR) ≈ 352 € frente a la nº 93 ≈ 2 €.
3. **«Antes de pagar (30 segundos)»** en cada carta: número, fotos, vendedor, total máximo con envío y pago dentro de Cardmarket.

## Descartado a propósito
- Compra automática, bots o lectura de anuncios de Cardmarket: va contra sus condiciones y las reglas del proyecto.
- Servicios de pago, servidores, push, eBay y precios de EE. UU.

## Pruebas
`node tests/v119-rapidez-e2e.cjs` (13), más V118 (23), V117 (42), flujo (47), regresión (50), motor, dinero y aceptación (0 filas fallidas).
Chromium con emulación de iPhone, no Safari real; fuentes simuladas con su formato público y precios inventados.
