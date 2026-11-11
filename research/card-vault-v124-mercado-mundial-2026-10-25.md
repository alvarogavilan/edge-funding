# Card Vault V124 · Mercado mundial accesible desde 41020 y Importar de Japón (25/10/2026)

## Dónde se puede comprar desde Sevilla, y qué sirve de verdad
| Mercado | Desde 41020 | Datos automáticos en la app | Veredicto |
|---|---|---|---|
| Cardmarket (UE) | Sin aduanas, envío certificado 5,74–7,15 € | Sí: guía oficial diaria (Pokémon, Lorcana vía Bindex, sellado) | Base de todo: compra y venta |
| Japón: Mercari, Yahoo! Subastas (vía Buyee), Card Rush | Importación: envío 15–30 €, IVA 21 %, gestión 15–25 € (transportista; Correos menos) | Venta real aquí de 5.270 japonesas (producto japonés en Cardmarket); precio japonés: lo miras tú | **Nuevo: «Importar de Japón»** con el máximo en yenes |
| Tiendas españolas de graduadas (Pokémillon, Iberian Collect, Cardzone, MaickJP) | Sin aduanas | No: sus webs no dejan leer precios desde otra web | Comparador y búsqueda directa (V123) |
| Catawiki, Wallapop, Vinted | Sin aduanas (UE) | No | Búsqueda directa; verificar certificado y vendedor |
| CardTrader (UE) | Sin aduanas | Solo con token de tu cuenta (opcional) | Anuncios por idioma si lo conectas |
| TCGplayer (EE. UU.) | Importación con IVA y gestión; precios en dólares | Retirado a petición tuya | No compensa en general desde 41020 |
| eBay | — | Excluido por tus reglas | — |

No hay oportunidades «seguras»: cualquier compra depende del estado, el idioma y de que el anuncio siga disponible. La app
solo marca lo que, con los costes reales a 41020, deja margen, y te dice cuánto pagar como máximo.

## Importar de Japón (Compra YA)
Para cada carta japonesa que se vende cada semana en Cardmarket:
máximo a pagar en Japón = (venta neta aquí − beneficio mínimo − gestión) / (1 + IVA) − envío, pasado a yenes con el tipo de
referencia del BCE (frankfurter.app) y redondeado a la baja a 100 ¥. Gastos editables (por defecto envío 20 €, IVA 21 %,
gestión 15 €; con Correos la gestión puede ser menor). Búsqueda directa en Mercari y Yahoo! Subastas (vía Buyee) y Card Rush.
Ejemplo real (guía del 24/10): Gengar & Mimikyu GX (Tag Bolt nº 103) se vende aquí a ~818 € → máximo ~98.700 ¥.
Los enlaces de búsqueda en Japón no se han podido abrir desde el entorno de pruebas; si una búsqueda no encuentra la carta,
prueba con el nombre en japonés.

## Fallo encontrado y corregido
Al terminar una tarea en segundo plano (cambio, verificación de versiones, foto de ayer), Compra YA se repintaba y
**cerraba el cuadro «Pegar datos» y borraba lo escrito**. Ahora no se repinta mientras escribes (espera a que salgas del
campo) y, al repintar, conserva desplegables abiertos y lo escrito. Prueba nueva en `tests/v124-japon-e2e.cjs`.

## Verificación
- Pruebas: V124 (12), V123 (10), V122 (18), V121 (10), V120 (20), V119 (13), V118 (23), V117 (42), flujo (47), regresión (50)
  — dos vueltas completas seguidas sin fallos —, motor, dinero (16), migración (5) y aceptación (0 filas fallidas).
- Auditoría de precios con datos reales (`tools/auditoria-precios.cjs` + `tools/verificar-precios.py`): 0 errores.
- Chromium con emulación de iPhone, no Safari real.

Fuentes: [guía de compra desde España (Metamorph)](https://metamorphcenter.com/en/blogs/news/cartas-pokemon-japonesas-guia-compra-espana),
[TCG Bestia](https://www.tcgbestia.com/blog/distribuidor-cartas-pokemon-japonesas-espana/),
[HolaPoke](https://holapoke.com/comprar-cartas-y-cajas-pokemon-desde-espana/),
[Buy&Ship: Mercari Japón](https://www.buyandship.com.my/blog/how-to-buy-pokemon-tcg-on-mercari-jp-get-rare-japan-us-pokemon-cards-via-free-proxy-service/),
[Frankfurter (tipos del BCE)](https://frankfurter.app/docs).
