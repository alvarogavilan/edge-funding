# Card Vault V137 · Internacionales al momento y diagnóstico de errores (25/10/2026)

## Petición
«Completar absolutamente todo, ser los mejores del mundo, sin más fallos, controlando todo el mercado mundial.»

## Qué es posible y qué no (sin coste, sin servidores, sin eBay)
| Fuente | ¿Precio real legible desde el iPhone? | En la app |
|---|---|---|
| Guía oficial de Cardmarket (espejo diario) | Sí: «desde», tendencia, medias de 1/7/30 días | Sí, desde V117 |
| pokemontcg.io | Sí: «EX o mejor» de Cardmarket y TCGplayer | Sí. Ahora llega en segundos (abajo) |
| CardTrader (con tu token) | Sí: anuncio a anuncio, idioma, estado, envío real | Sí, pendiente de que tu token funcione |
| Bindex (Lorcana en Cardmarket) | Sí | Sí |
| TCGdex | Repite los datos de la guía de Cardmarket; no trae «EX o mejor» | No aporta nada nuevo |
| Tiendas Shopify (Zenpan, Hareruya2…) | Solo si la tienda deja leer su buscador | Se prueba sola; si no, no sale |
| Cardmarket (API) | Cerrada a particulares | — |
| eBay, PriceCharting (usa eBay) | Excluidos por tus condiciones | — |
| Mercari, Yahoo JP, Snkrdunk, Card Rush | Sin acceso público | — |

«Todo el mercado mundial» no es alcanzable gratis. Lo que sí: **todas las fuentes de precio real que se pueden leer
legalmente desde el móvil están dentro**, y cada una dice si funciona.

## 1. Las internacionales tardaban minutos (Compra YA «solo japonesas» al abrir)
**Causa.** El «EX o mejor» de las internacionales llega de pokemontcg.io, y la app lo pedía colección a colección:
cientos de colecciones, con 2 s de pausa obligada entre llamadas. En el iPhone tardaba muchos minutos.

**Arreglo.** pokemontcg.io admite pedir cartas concretas con una sola consulta (`id:"a" OR id:"b"…`). La app pide
**primero las 300 cartas que pueden ser oportunidad** (valen ≥ 40 €, se venden y su compra puede caber en tu
presupuesto), de 60 en 60. Después sigue con las colecciones. La prueba simula colecciones que tardan 20 s cada una, y
las cartas importantes llegan en unos 10 s.

**Además:** la prueba de CardTrader se hace al abrir, y sus precios se piden justo después de esas 300 cartas, en
paralelo. Antes esperaban a que terminaran todas las colecciones.

## 2. «No quiero más fallos» → registro de errores en tu iPhone
- Cualquier error de la app en tu móvil se guarda en el propio iPhone (los 20 últimos).
- En «Estado de las fuentes» aparecen **«Errores registrados en este iPhone: N»** y el botón **«Copiar diagnóstico»**.
  Copia la versión, el navegador, el estado de la guía, pokemontcg, CardTrader (con el resultado de su prueba), las
  tiendas, el cambio de divisas y los errores con fecha. **Nunca incluye el token**, solo su longitud y si tiene forma
  correcta.
- Pegándolo en el chat se ve exactamente qué ha fallado en tu móvil.

## CardTrader «HTTP 500»
No hay casos públicos de CardTrader devolviendo 500 por la API. Las causas conocidas en otros servicios son un token
mal formado (corregido en V136) o un valor que no es el token de la API (por ejemplo, el «shared secret»). El
diagnóstico dirá si el token tiene la forma correcta y qué contesta CardTrader.

## Pruebas
tests/v137-rapidez-diagnostico-e2e.cjs (7 comprobaciones) y la batería completa.
