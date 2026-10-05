# Tesis interna: arbitraje online de productos desde España

Revisión: 6 de octubre de 2026, Europe/Madrid. Informe de evidencia observada; no servicio de monitorización continua.

## Conclusión operativa

No se ha demostrado una pareja de compra y venta con beneficio cerrado. No se recomienda ninguna compra con esta evidencia. Esto no demuestra que no existan oportunidades en todo el mercado.

Una recompra publicada, una valoración automática y un anuncio de reventa son tres cosas distintas de una oferta vinculante sobre la unidad concreta. Una empresa puede ser solvente y permitir pagos bancarios sin garantizar que la operación sea rentable.

La condición de precio necesaria es:

**Cobro de salida − compra − envíos − comisiones − retirada − impuestos aplicables − contingencias > 0.**

También son necesarias la coincidencia exacta de unidad/estado/accesorios, disponibilidad, elegibilidad desde España, plazos compatibles y logística desde casa. Incluso con contrato existen riesgos de incumplimiento, transporte y ejecución: no equivale a seguridad absoluta.

## Alcance y método

Dos líneas de investigación paralelas: productos físicos con recompra profesional y productos digitales/metales custodiados. Se consultaron fuentes primarias y se separaron precios de compra, techos de tasación y ofertas de salida. No se realizaron compras, ventas, contactos ni gastos.

Se excluyen eBay, promociones, saldos sin retirada a dinero, desplazamientos necesarios y valoraciones que equiparen un producto deteriorado con otro impecable. No se han consultado millones de personas; se han ejecutado dos millones de casos sintéticos para comprobar el filtro matemático. Los resultados reproducibles figuran en arbitrage-validation.json.

## Hallazgos por ruta

| Ruta | Salida y logística observadas | Impedimento para cerrar beneficio |
| --- | --- | --- |
| Cámaras y objetivos → MPB | Recogida gratuita en domicilio UE, transporte asegurado, banco | Cotización inicial no vinculante; inspección y derecho de rechazo |
| Móviles → Swappie | España admitida, envío gratuito, banco | Tasación revisable tras inspección; recogida domiciliaria no verificada para un pedido |
| Electrónica → reBuy | Envío prepagado, oferta provisional y posible contraoferta | Inspección; recogida desde casa no corroborada; móviles con piezas cambiadas pueden ser rechazados |
| Consolas/tablets/audio → Back Market | Recompra y transferencia; admite dispositivos reparados | Contraoferta si difiere el estado; envío estándar al transportista |
| Videojuegos/consolas → CeX | Venta online y envío GLS Parcel Shop | Estado y accesorios; efectivo distinto de vale; domicilio no confirmado |
| LEGO/objetos → Vintage.com | Recogida solo en determinadas regiones | No se cierra tasación por set exacto antes de comprar |
| Libros/videojuegos → Hamelyn | Recogida en domicilio y banco/PayPal | Términos orientados a consumidores que venden fuera de actividad comercial |
| Oro custodiado → BullionVault | Compra/venta digital y retirada SEPA | Costes y diferencial; ninguna cotización cruzada positiva ejecutable encontrada |
| Skins → Skinport | Mercado digital con comisión | No hay comprador contratado; anuncio no equivale a salida firme |

## Caso concreto descartado: iPhone 13 128 GB Medianoche

Swappie publica 265 € para estado **Satisfactorio**, con arañazos visibles. NomoPhone publica un máximo de 171 € para 128 GB en **estado perfecto**, condicionado a revisión. Incluso ese techo de estado superior deja −94 € antes de gastos.

No son ofertas equivalentes por condición, ni una tasación aceptada de la misma unidad. El cálculo sirve para descartar este circuito observado, no para afirmar que todas las recompras pagan 171 €. Los 354 € citados previamente desde un agregador no constituyen una oferta de salida verificable para esa unidad y quedan retirados como fundamento de compra.

Fuente de compra: https://swappie.com/es/iphone/iphone-13/iphone-13-128gb-medianoche-7/

Techo de recompra observado en resultado oficial indexado (la apertura directa no fue recuperable):
https://nomophone.com/es/buyback/apple/iphone-13/128

## Barreras que los cálculos de margen no resuelven

- Estado: “excelente” del vendedor puede no equivaler al grado del comprador.
- Piezas: reBuy declara que no compra ciertos móviles con componentes cambiados. Comprar reacondicionado no prueba elegibilidad de salida.
- Contrato: MPB 7.3.3 identifica la cotización inicial como no vinculante.
- Plazo: un precio válido no evita que una revisión posterior determine otra condición.
- Logística: etiqueta gratuita no equivale a recogida en domicilio.
- Liquidez: precio de anuncio y saldo de tienda no equivalen a efectivo cobrado.
- Costes: no se asigna cero a gastos o impuestos desconocidos.
- Seguridad: la devolución de un artículo no garantiza recuperar todo el capital a tiempo ni obtener beneficio.

## Filtro implementado y validación

El filtro de online-arbitrage.js exige precios en céntimos enteros, costes completos, fuentes HTTPS sin eBay, comprador vinculante, inspección resuelta, mismo producto/estado, disponibilidad, cuenta elegible, salida a dinero, logística desde casa y operación sin promociones. Bloquea precios sin revisión en las últimas 24 horas, ofertas caducadas y margen no positivo.

Una operación que supere los controles queda **pendiente de revisión humana**. Nunca se activa una compra automática ni se asigna garantía de beneficio.

La malla sintética recorre 200 precios de reventa, 50 recortes de valoración y 100 niveles de gasto; repite cada combinación con comprador vinculante y sin él: 2.000.000 de casos. Verifica céntimos, signo del margen y bloqueo sin comprador. Son supuestos de prueba, no distribuciones empíricas. Ninguna cantidad de simulaciones descubre una oferta contractual que no se haya observado.

Ejecutar desde la raíz: node tests/online-arbitrage.test.cjs

## Fuentes primarias

- MPB venta: https://www.mpb.com/es-es/vender-o-intercambiar
- MPB contrato: https://www.mpb.com/es-es/ayuda/terminos-y-condiciones-generales
- MPB logística: https://es.help.mpb.com/es/articles/11712611-informacion-sobre-envios-a-mpb
- Swappie tasación: https://help.swappie.com/es/article/obtener-un-precio-e-iniciar-la-venta
- reBuy proceso: https://www.rebuy.es/vender/
- reBuy componentes: https://www.rebuy.es/vender/apple-iphone-13-128gb-medianoche_12216196
- Back Market recompra: https://www.backmarket.es/es-es/buyback/home
- CeX venta online: https://es.support.webuy.com/support/solutions/folders/43000262910
- Vintage.com términos: https://www.vintage.com/es/terms-conditions
- Hamelyn términos: https://blog.hamelyn.com/terminos-y-condiciones/
- BullionVault tarifas: https://oro.bullionvault.es/help/tariff.html
- Skinport comisiones: https://skinport.com/blog/lower-fees-for-everybody

## Decisión

La pestaña “Arbitraje online” queda separada de colección, valoraciones y compra de cartas. Conserva rutas investigadas y descartes, con fecha, fuentes y motivo de bloqueo. No contiene recomendaciones de compra ficticias ni afirma explorar automáticamente todo el mercado. El siguiente hallazgo válido deberá aportar simultáneamente producto exacto disponible, coste total y salida vinculante verificable.
