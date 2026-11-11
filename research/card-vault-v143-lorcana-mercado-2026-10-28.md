# Card Vault V143 · Lorcana completa y revisión de todo el mercado (28/10/2026)

## Petición
«Esmérate en Lorcana y que funcione al 100 %. ¿Estás segura de que cubrimos todo el mercado? ¿No nos dejamos ninguna web
válida y verificada con precio de compra y venta verificado?»

## 1. Lorcana: qué fallaba y qué hace ahora
He revisado el código de Bindex (de donde salen los precios de Cardmarket de Lorcana). Cada carta de Lorcana tiene dos
precios en Cardmarket: normal y **foil** (columnas «-foil» de la guía oficial).

| Antes | Ahora (V143) |
|---|---|
| Solo una versión por carta: la foil en las Enchanted/Iconic/Epic y la normal en el resto | Además, **la versión foil de las cartas normales** sale aparte cuando vale ≥ 20 €: es otro precio (una legendaria foil puede valer varias veces la normal) |
| El enlace de Cardmarket mezclaba anuncios foil y normales | El enlace de una foil abre **solo anuncios foil** (`isFoil=Y`), también en el precio objetivo |
| CardTrader mezclaba foil y normal: una normal de 10 € podía parecer una foil de 120 € (beneficio falso) | CardTrader separa **foil** y **normal**: la foil solo se compara con foils, y la normal con normales |
| Sin historial de precio | «Ver historial de precio» con el historial diario de Bindex (tendencia de Cardmarket de esa versión), sin los puntos estimados |
| Cartas graduadas solo de Pokémon | Las **Lorcana graduadas** (PSA, BGS, CGC…) también se buscan en CardTrader (hasta 4 colecciones por búsqueda) |

Lo que ya hacía y sigue igual:
- Precio objetivo en inglés.
- CardTrader para Lorcana (juego «Disney Lorcana») emparejado por id de Cardmarket.
- Beneficio mínimo propio de Lorcana en «Supuestos».
- Idiomas en que se imprime: inglés, alemán, francés, italiano, japonés y chino.

## 2. ¿Cubrimos todo el mercado? Revisión web a web
**Respuesta honesta:** nadie puede cubrir el 100 % del mercado. Sí se pueden cubrir todas las fuentes que dan precios
reales, que se pueden leer gratis y legalmente desde el iPhone, y que no usan eBay. En esa revisión faltaba una:
**CardNexus**. Ya está dentro.

### Dentro de la app
| Fuente | Compra | Venta | Cómo |
|---|---|---|---|
| **Cardmarket** (guía oficial diaria) | «Desde» y «EX o mejor» | Medias de ventas 1/7/30 días y tendencia | Espejo diario en GitHub y pokemontcg.io |
| **CardTrader** | Anuncio por idioma y estado, con envío real | Otros idiomas: lo que piden los demás vendedores del idioma | API con tu token |
| **CardNexus** (nuevo, opcional) | Anuncio más barato **de Cardmarket por idioma y estado** (la guía oficial no lo separa) y anuncios de CardNexus con envío real a España | — | API con clave gratuita de tu cuenta |
| **TCGplayer** (EE. UU.) | Precio de mercado, importada a 41020 con IVA | — | pokemontcg.io |
| **Tiendas japonesas** (Zenpan, Hareruya2) | Solo si dejan leer su precio | — | Su buscador público |
| **Bindex** | Lorcana | Lorcana (Cardmarket) | Datos diarios públicos |

**Sobre CardNexus:** mercado europeo (Francia, abierto en marzo de 2026) para Pokémon, Lorcana y otros juegos. Su API
pública:
- empareja por el id de Cardmarket (200 por consulta);
- da el **anuncio más barato de Cardmarket por estado (NM, LP…) y por idioma**, separado en normal y foil;
- da sus propios anuncios, con el envío real a España y la nota del vendedor (se descartan los que dicen «proxy»);
- retiene el pago hasta que recibes la carta.

Límites: 600 consultas de precios por hora y 120 de anuncios. La app los cuenta y no los supera.

**Lo que no sé:** si CardNexus deja consultar desde el navegador del iPhone (CORS). Si no lo permite, la app lo dirá en
«Estado de las fuentes» y en «Copiar diagnóstico».

### Fuera, y por qué
| Web | Motivo |
|---|---|
| eBay, PriceCharting, Collectr, PokeData y otros agregadores | Usan datos de eBay: excluidos por tus condiciones |
| API de Cardmarket | Cerrada a nuevos usuarios |
| API de TCGplayer | Cerrada a nuevos desarrolladores (sus documentos oficiales) |
| JustTCG, TCG Price Lookup, PokemonPriceTracker | De pago o con límites. Sus precios son de TCGplayer y eBay, que ya están dentro o están excluidos |
| SNKRDUNK, Mercari Japón, Yahoo! Subastas, Card Rush, Yuyu-tei | Sin API pública: leerlas sería saltarse sus condiciones |
| Vinted, Wallapop | Sin API pública, prohibido extraer datos, sin verificación y con muchas falsas |
| FoilMarket, Card Synced | No he encontrado API pública |

**Aviso de transparencia:** TCGplayer es de eBay desde 2022. Sus precios son ventas de TCGplayer, no de eBay, por eso
siguen dentro. Si para ti cuenta como eBay, se puede quitar.

## Pruebas
tests/v143-lorcana-cardnexus-e2e.cjs (13 comprobaciones), todas con datos simulados:
- Elsa foil aparte, con su enlace solo foil.
- La compra en CardTrader de la Elsa foil usa la foil de 60 € y no la normal de 10 €, que daría +99 € falsos.
- Stitch Enchanted con su foil.
- Historial de Lorcana.
- CardNexus: compra a 144 € con envío real, sin el anuncio «Proxy» de 50 €.
- Cardmarket en inglés NM a 156 €, con su enlace solo en inglés y NM.
- Emparejado por id de Cardmarket.
- La clave no aparece en el diagnóstico.
- Panel de CardNexus.
- Graduadas de Lorcana: Elsa PSA 9 → +43 €.

## Fuentes
- CardNexus, qué es: https://help.cardnexus.com/articles/7670061
- CardNexus, SDK oficial con la descripción de su API pública: https://github.com/cardnexus/cardnexus-sdk
- CardNexus, apertura del mercado (marzo 2026):
  https://cardnexus.featurebase.app/changelog/freshly-sleeved-13-the-nexus-marketplace-is-now-open
- TCGplayer, acceso a la API cerrado: https://docs.tcgplayer.com/docs/getting-started
- Alternativas a Cardmarket en la UE (2026): https://foilmarket.eu/cardmarket-alternative
- Dónde comprar y vender en 2026:
  https://pokewallet.io/blog/where-to-buy-sell-pokemon-cards-online-best-marketplaces
- Bindex (Lorcana): https://github.com/douxeh/bindex-prices
