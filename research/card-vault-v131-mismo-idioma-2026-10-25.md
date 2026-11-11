# Card Vault V131 · Compra y venta del mismo idioma (25/10/2026)

## Qué pasaba
En el Top 5 apareció un Umbreon a 135 € con un beneficio enorme. El anuncio era **coreano**, y la app lo comparaba con
ventas de todos los idiomas, sobre todo en inglés. El fallo es de fondo: en los productos internacionales de Cardmarket,
la guía diaria y pokemontcg.io dan el precio más barato («desde» y «desde EX o mejor») de **cualquier idioma**, también
coreano y chino, que valen mucho menos. La venta de referencia es de todos los idiomas. Mezclar las dos cosas inventa
beneficio.

## La regla ahora
Solo se calcula beneficio, y solo hay oportunidad en Compra YA, Top 5, Punto de mira y Chollos, cuando compra y venta son
del **mismo idioma**:

| Fuente | ¿Idioma comprobado? | Qué hace la app |
|---|---|---|
| Productos japoneses de Cardmarket (ficha solo japonesa) | Sí | Todo como antes |
| CardTrader (cada anuncio dice su idioma; con tu token) | Sí | Compra en **inglés** NM/EX → venta en Cardmarket |
| Lo que pegas de Cardmarket filtrado por idioma | Sí, si la venta del idioma se separó | Sin venta separada no cuenta como oportunidad |
| TCGplayer (EE. UU.) | Sí (inglés) | Importada, como antes |
| «Desde» / «EX o mejor» internacional **≥ 75 %** de su valor | Probable | Se acepta: a ese precio no es un coreano barato |
| «Desde» / «EX o mejor» internacional **< 75 %** | No | Sin beneficio: casi siempre es coreano o chino |

Cambios en cada sección:
- **Chollos:** solo cartas japonesas. Las internacionales descartadas se cuentan en el panel.
- **Punto de mira:** solo con idioma comprobado. Explica por qué las internacionales baratas no salen.
- **Restaurar:** ya no usa «desde» internacionales.
- **Sellado en el Top 5:** solo si el «desde» es ≥ 75 % de la tendencia, porque el sellado coreano o chino es más barato.
- **«Dónde comprarla»:** marca el «EX o mejor» internacional muy barato como «idioma sin indicar… casi seguro coreano o
  chino» y no lo propone como mejor opción.
- **CardTrader automático:** con tu token guardado, al cargar se consultan solo las 12 cartas con más margen posible.
  Si hay un anuncio en inglés lo bastante barato, entra como oportunidad.

## Consecuencia (con honestidad)
Con 200 € de compra máxima y 40 € de beneficio mínimo, una carta internacional sin CardTrader solo puede salir si vale
entre unos 255 € y 259 €. Es la misma cuenta que en Lorcana. Habrá menos oportunidades, pero las que salgan comparan
el mismo idioma.

La vía para tener más es **CardTrader con tu token**. Su API no se ha podido probar contra el servicio real desde este
entorno: no se sabe si permite consultas desde el navegador. Si falla, la app lo dice en «Estado de las fuentes».

## Otros cambios
- Se quita el botón «🚫 Es proxy o falsa» (lo pidió el usuario). Se mantienen el suelo del 30 % y el comprobador
  «🔎 ¿Es proxy?».

## Pruebas
- tests/v131-idioma-e2e.cjs (7 comprobaciones): el caso Umbreon y CardTrader en inglés frente al coreano.
- La batería anterior se ha adaptado; el ejemplo Mewtwo pasa a «EX o mejor» 194 € = 75 % de 258 €.
- tools/verificar-precios.py da error si un chollo o un Punto de mira no tiene idioma comprobado. Con la guía real del
  25/10: 14 chollos (todos japoneses), 3 en el Top 5 y 0 errores.
