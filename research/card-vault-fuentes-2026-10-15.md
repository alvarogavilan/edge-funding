# Fuentes de compra y venta — Card Vault · 2026-10-15

## Cardmarket — decisión técnica verificada
La ayuda oficial indica expresamente que Cardmarket no acepta nuevas solicitudes de acceso a la API: https://help.cardmarket.com/de/cardmarket-api.
No suponer acceso a tokens, ni pedir credenciales del usuario para incrustarlas en GitHub Pages.
No simular consulta automática de ventas cerradas cuando únicamente existen anuncios, tendencias o precios de referencia.

## Tiendas
La consulta Shopify /products/{handle}.js puede proporcionar variantes, precio y disponibilidad, pero cada tienda puede bloquear solicitudes CORS desde un origen externo. No renovar checkedAt sin respuesta válida.
Precios obtenidos del navegador no prueban que un pedido llegue a completarse ni la posibilidad de revender con beneficio.

## Caso observado en Lorcana
Hades - King of Olympus Encantada 205/204 EN The First Chapter, ficha específica: https://www.tiendalorcanatcg.com/es/cartas-sueltas/492-547-205-204en1-hades-king-of-olympus-encantada-temporada-1-carta-en-ingles.html
Precio publicado en la consulta: 159,20 EUR, se indica una unidad; **NO COMPRA**: fuera del rango principal, sin prueba de margen de reventa y sujeto a cambios.
No importarlo como oferta actual permanente; cualquier caché de precios se considera caducada tras 24 horas.

## Estado operativo
Ninguna de estas observaciones habilita etiqueta «COMPRA YA» para inversión. Para ello exigir identificador exacto, idioma, estado, vendedor, costes finales, evidencia de venta cerrada comparable y margen neto después de comisiones y envío. No eBay.
