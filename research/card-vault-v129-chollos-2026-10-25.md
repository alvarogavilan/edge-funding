# Card Vault V129 · Top 5 dentro del presupuesto y «🎲 Chollos por verificar» (25/10/2026)

> **Corrección (V130):** el anuncio de 50 € del Mewtwo & Mew GX era una carta **PROXY** (falsa); el pedido se canceló.
> Desde V130 nada por debajo del 30 % de su valor se propone. Ver card-vault-v130-antiproxy-2026-10-25.md.

## Fallo: el Top 5 enseñaba compras de más de 200 €
La compra máxima se comparaba con el precio del anuncio, sin el envío. Además, una versión antigua cacheada del Top 5 no
aplicaba el presupuesto. Ahora toda la app usa **lo que pagas en total, con envío** (o con envío, IVA y gestión si es
importada). Si eso pasa de tu compra máxima, la opción no sale en ninguno de estos sitios:
- Compra YA y el Top 5;
- Punto de mira y Chollos;
- Importar de Japón y TCGplayer;
- Sellado y «Dónde comprarla más barata».

En el Top 5, cada fila empieza por **«Pagas X €»**, y cada carta sale una sola vez.

## Caso real: Mewtwo & Mew GX, Miracle Twins (sm11) japonés
Guía oficial de Cardmarket, 25/10/2026:

| Producto | «Desde» | Tendencia | Media 1 día | Media 7 días | Media 30 días |
|---|---|---|---|---|---|
| 557059 (nº 97) | 50 € | 301,04 € | 525 € | 249,29 € | 97,58 € |
| 557060 (nº 98, la alternativa) | 239,99 € | 1.073,74 € | — | — | — |

Un anuncio de 50 € (en cualquier estado) frente a ventas de 100 a 300 € es exactamente lo que hay que cazar. Las medias
del nº 97 son muy volátiles, así que el beneficio no es seguro. Si llega distinta a lo anunciado, Cardmarket permite
reclamar.

## Método: «🎲 Chollos por verificar»
Cada día, sobre todas las cartas (Pokémon, japonesas y Lorcana), la app busca las que cumplen estas condiciones:
- el anuncio más barato de **cualquier estado** está al **50 % o menos** de su valor;
- la carta vale al menos 40 €;
- se vende cada semana (liquidez ≥ 2);
- la versión está comprobada con 2 fuentes;
- lo que pagas con envío cabe en el presupuesto;
- deja el beneficio mínimo «si está bien».

La confianza se divide entre 2 porque el estado no está comprobado. Con esa confianza reducida, los chollos compiten
en el Top 5, con un máximo de 3 para dejar sitio a las compras fiables. El enlace abre la ficha **sin filtro de estado** para ver ese mismo anuncio. Pueden ser cartas dañadas, de
otro idioma o ya vendidas. Hay que mirar las fotos antes de pagar.

## Con la guía real del 25/10/2026
233 chollos dentro de 200 €, entre ellos el propio Mewtwo & Mew GX nº 98 japonés (557060) con un anuncio a 50 € frente
a un valor de ~638 €. Muchos serán cartas jugadas u otra versión, por eso van marcados «por verificar».
Verificador independiente (tools/verificar-precios.py): 0 errores.

## Pruebas
- tests/v129-chollos-e2e.cjs (8 comprobaciones) y toda la batería anterior adaptada a los nuevos datos.
- tools/verificar-precios.py ahora también comprueba los chollos con la guía real: precio, regla del 50 %, fórmula y
  presupuesto. También comprueba que el Top 5 no pase de la compra máxima.
