# Card Vault V135 · Comparar solo con precio: Cardmarket y CardTrader (25/10/2026)

## Petición
«De nada me vale tener 7 sitios en cada carta sin precio. Quédate con Cardmarket y CardTrader (ya tengo el token). Si
hay otra con precio, métela; si no, nada.»

## Qué se ha quitado (no daban precio)
- Mercari y Yahoo vía Buyee.
- El enlace a Hareruya2.
- Las tiendas cuyo precio no se puede leer.
- La calculadora «¿Y si la compro en Japón?».
- La lista de enlaces a tiendas de graduadas.

Las tiendas Zenpan EU, Zenpan Japan y Hareruya2 solo aparecen si desde tu iPhone se puede leer su precio. Si no, no
salen. «Estado de las fuentes» lo indica.

## CardTrader, investigado y afinado
Formato de su API, según los ejemplos públicos de respuestas (repositorio Eomm/cardtrader-api-skills) y su referencia:
- **Probar el token:** `GET /info` es la llamada que CardTrader indica para comprobar la autenticación. Se hace al cargar
  y con el botón «Probar CardTrader» de «Estado de las fuentes», que muestra «✓ conectado» o el error exacto.
- **Emparejar exacto:** el catálogo (`/blueprints/export`) trae `card_market_ids`. La carta de CardTrader se elige por el
  **id de la ficha de Cardmarket**. Si no aparece, se busca por número y nombre en la colección, y el nombre exacto va
  primero («Base Set» no es «Base Set 2»).
- **Mismo idioma:** `/marketplace/products` devuelve los 25 anuncios más baratos, que pueden ser todos coreanos. Se pide
  además con `&language=en` (o `jp` para las japonesas).
- **Precio:** `price.cents` en tu moneda (EUR). `price_cents` como respaldo.
- **Envío REAL:** `GET /shipping_methods?username=<vendedor>` da los métodos de ese vendedor a tu país. Se usa el más
  barato. Si CardTrader no lo da, sale «envío estimado» y se dice.
- **CardTrader Zero:** si el vendedor lo admite (`can_sell_via_hub`), se indica. En ese caso CardTrader revisa la carta
  antes de enviártela.
- **Automático:** al cargar se comprueban las 30 cartas con más margen posible y las 25 primeras de Compra YA. Son unas
  3 consultas por carta, a 250 ms una de otra; el límite de CardTrader es 10 por segundo.

## Cómo queda «Dónde comprarla más barata»
Solo filas con precio y lo que pagas en 41020:
- Cardmarket: «desde» EX o mejor y cualquier estado.
- CardTrader: anuncio del mismo idioma más su envío real.
- TCGplayer, cuando hay: precio de mercado más envío, IVA y gestión.

Primero va lo comparable, de más barata a más cara; lo no comparable (otro estado o idioma probable) va al final. Lo más
barato entra en las oportunidades y en el Top 5.

## Lo que no se ha podido comprobar desde aquí
Este entorno no llega a api.cardtrader.com y el token está solo en tu iPhone. Las pruebas usan respuestas con el formato
de los ejemplos públicos de la API. En el iPhone, «Probar CardTrader» confirma si funciona de verdad. Si CardTrader no
admitiera consultas desde una web (CORS), saldría «CardTrader no responde o no permite consultas desde el navegador».

## Fuentes
- Referencia de la API de CardTrader: https://www.cardtrader.com/en-EU/docs/api/full/reference
- Ejemplos de respuestas: https://github.com/Eomm/cardtrader-api-skills
- CardTrader Zero: https://www.cardtrader.com/en/pages/zero
