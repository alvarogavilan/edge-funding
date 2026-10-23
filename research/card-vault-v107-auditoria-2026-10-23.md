# Card Vault V107 · auditoría técnica e investigación · 23/10/2026

Base: `main` en `3971a79` (V106), sin cambios locales ajenos. Se conserva todo lo de V104–V106. No se cambian claves de almacenamiento (`cardvault.v2`, `cv_v104_user`, `cv_v105_radar`) ni registros de colección, compras o ventas.

## Entorno de trabajo (límite real)

El contenedor de trabajo solo tiene salida a GitHub y registros de paquetes. `api.tcgdex.net`, `api.lorcast.com`, `cardmarket.com`, `tcgplayer.com`, `api.frankfurter.app` y la propia web de GitHub Pages devuelven rechazo de túnel (403) o DNS. Consecuencias:

- No se ha consultado en directo ningún precio, anuncio, stock ni venta.
- El buscador web solo ofrece fragmentos de páginas de fecha desconocida. No se usan como precio, stock ni venta.
- Las pruebas de navegador usan respuestas **simuladas** con el formato de las APIs públicas. Demuestran el comportamiento del código, no el funcionamiento de las APIs reales ni de las fotos externas en producción.
- Navegador de prueba: Chromium (Playwright 1.63) con emulación de iPhone y anchuras 320/375/390/430/1280 px. **No es Safari real.** WebKit no está instalado y no se descarga (política del entorno).

## Qué hace realmente cada fuente (comprobado en el código y la documentación pública, no en vivo)

| Fuente | Qué aporta | Qué NO aporta |
|---|---|---|
| TCGdex `/v2/en/cards/{id}` | Medias de Cardmarket (`trend`, `avg1/7/30`, `low`) y `marketPrice` de TCGplayer por acabado, con fecha | Vendedor, estado, idioma ni stock del anuncio más barato; ventas individuales; cartas japonesas; graduadas |
| Lorcast `/v0/sets/{code}/cards` | Identidad, imagen y precio de mercado TCGplayer (USD) | Cardmarket, anuncios, stock, ventas individuales |
| frankfurter.app | Cambio BCE USD→EUR con fecha | — |
| Cardmarket / TCGplayer (web) | Anuncios y ventas, consultables por el usuario | Acceso desde GitHub Pages (CORS/condiciones): no se automatiza |

## Fallos encontrados y corregidos

| # | Gravedad | Fallo | Corrección |
|---|---|---|---|
| 1 | Crítica | El radar V105/V106 mostraba «+X €» aplicando 60/75/90 % a medias agregadas y comparaba el anuncio más barato (estado e idioma desconocidos) con medias de todas las condiciones | Solo «diferencia bruta · indicador · NO es beneficio». Criba: diferencia ≥ beneficio mínimo y ≥ 35 %; descartes con motivo; riesgos de volatilidad, divergencia y liquidez |
| 2 | Crítica | «He comprado» podía registrar dos veces (doble toque), trataba gastos vacíos como 0 € y valoraba una carta para restaurar al precio de una original sin alterar | Bloqueo de envío doble e idempotencia; desglose de envío, IVA, aranceles, gestión y cambio con estado pagado/estimado/desconocido; restaurar valorada a coste |
| 3 | Alta | Importar una copia **sustituía** los datos locales | Fusión sin borrar nada: fichas por id, ventas sin duplicar, gana la comprobación más reciente; copia corrupta no cambia nada |
| 4 | Alta | `save()` de `app.js` no capturaba errores: con el almacenamiento lleno o bloqueado (navegación privada) varios módulos fallaban sin avisar | Error capturado y aviso visible permanente mientras no se pueda guardar |
| 5 | Alta | Al vender, el historial no conservaba el desglose de costes de compra | `purchaseCosts` y país de compra se copian al historial de ventas |
| 6 | Alta | Notas de septiembre con beneficios y stock aparecían como «Por qué merece la pena» | Rotuladas «Nota histórica · no reverificada, no es recomendación actual» |
| 7 | Media | Ventas con fecha futura y ventas «comprobadas» sin enlace aceptadas | Rechazadas en el formulario (el motor V106 ya las excluía del cálculo) |
| 8 | Media | Radar sin tiempo máximo, sin reintento acotado, sin validar respuestas, con precios de más de 24 h | 12 s por petición, 1 reintento ante 429/5xx/tiempo, 4 peticiones simultáneas, respuesta malformada contada como fallo, cachés vencidas ignoradas y avisadas |
| 9 | Media | Compras dentro de la UE obligaban a teclear 0 € en IVA de importación y aranceles, o se quedaban «desconocidas» | Zona de origen: en España/UE esos conceptos son «no aplica (UE)»; fuera de la UE quedan desconocidos hasta indicarlos. Sin regla aduanera automática |
| 10 | Media | Fichas Lorcana antiguas sin foto | Búsqueda por identidad exacta (colección + número + nombre) en Lorcast; si no coincide, aviso honesto. Variantes Pokémon sin foto exacta (Prize Pack) muestran «Sin foto verificada de esta variante exacta» |
| 11 | Media | Imagen rota sin reintento | Un reintento a los 2,5 s; después, aviso honesto |
| 12 | Media | Prueba de navegador rota desde V106 y dependiente de una ruta de otro entorno | Reparada; resolución de Playwright con varias rutas y mensaje «PENDIENTE» si no existe |
| 13 | Baja | Exportación rotulada «V104» | Formato `cv-user-v2` |

Embudo de verificación nuevo (Compra YA): referencias del catálogo → consultadas (≤ 24 h) → anuncios individuales → stock comprobado → coste completo en Sevilla → ventas comparables → superan el filtro.

## Módulos activos e interferencias

`vault-v104.js` (Compra YA, Restaurar, Ventas reales), `vault-radar.js` (En investigación) y `vault-data.js` son los módulos que pintan las pestañas principales. Los antiguos (`cv-final.js`, `card-arbitrage-priority.js`, `available-offers.js`, `today-simple.js`…) siguen cargándose y pintando en contenedores ocultos de Compra YA. No se eliminan para no romper otras pestañas; su coste es rendimiento (carga medida en Chromium móvil: ~1,2–1,4 s con red local).

## Investigación de mercado de esta sesión

- Consultas en directo: **0** (bloqueadas).
- Búsquedas web: 3 (tiendas UE/España con vintage dañado; Lorcana Enchanted played/damaged con envío a España). Resultados: mayoritariamente eBay (excluido), réplicas en Etsy (excluidas), y fichas de tienda o colecciones sin precio, estado ni stock verificables (pokemillon.com, vendeloamazing.com, tiendalorcanatcg.com, gameknight.ca, houseofcards.ca). **Ninguna oferta individual verificada.**
- Anuncios individuales comprobados: 0. Ventas cerradas verificadas: 0. Oportunidades que superan filtros: 0.

## Pruebas (resultados reales en este contenedor)

- `node tests/vault-v104-engine.test.cjs` — motor (cálculos, costes, comparables, radar).
- `node tests/vault-v104-e2e.cjs` — flujo completo en Chromium con APIs simuladas.
- `node tests/vault-v107-regresion-e2e.cjs` — anchuras, fotos, historial, importación/exportación, compra→venta→archivo, almacenamiento bloqueado, API caída y malformada.
- `node tests/card-images.test.cjs`.

Pendiente: Safari real en iPhone, APIs reales, fotos externas en producción.

## V108 · segunda pasada (misma fecha)

Base: `main` en `4fdc705` (V107), sin cambios ajenos.

| Gravedad | Fallo | Corrección |
|---|---|---|
| Alta | La graduación de la venta se fijaba siempre en «RAW» y la del anuncio no se registraba: una PSA 10 podía compararse con una RAW | Campo de graduación en anuncio y venta; el comparable exige la misma graduación |
| Alta | Restaurar no separaba defectos observados / no evaluables, intervención prevista, riesgo irreversible y escenario de salida | Campos propios en el formulario y bloque «evaluación del ejemplar» en la ficha; aviso si falta foto real |
| Media | Sin comparables intervenidos no había forma honesta de ver un escenario | Las referencias de tipo «estimación» del usuario se muestran como «ESCENARIO ESTIMADO · NO VERIFICADO»; no cambian el veredicto ni cuentan como venta; sin costes completos no se calcula margen |
| Media | «He comprado» no guardaba la moneda original ni el cambio aplicado | Moneda, importe original, cambio y fecha; si no se documenta, la compra queda marcada «cambio no documentado» |
| Media | Las tarjetas no mostraban país del vendedor, número de comparables válidos ni riesgos | Añadidos: país, comparables válidos/excluidos, riesgos (muestra pequeña, dispersión, importación, capital > 100 €, falsificación, restauración declarada) |

Mercado: sin cambios respecto a V107; la red de este entorno sigue bloqueando las fuentes. 0 ofertas y 0 ventas verificadas.
