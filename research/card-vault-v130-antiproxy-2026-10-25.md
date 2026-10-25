# Card Vault V130 · Escudo anti-proxy (25/10/2026)

## Qué pasó
El chollo del Mewtwo & Mew GX japonés (sm11, nº 98, Cardmarket 557060) a **50 €** frente a un valor de ~638 € (8 %)
era un anuncio de **carta proxy**: así lo decía la descripción. El pedido se canceló a tiempo. La guía diaria de
Cardmarket solo trae el precio más barato, no la descripción del anuncio, así que la app no podía leer «proxy».

## Lo que hace ahora la app
1. **Suelo del 30 %.** Ningún anuncio por debajo del 30 % de lo que la carta vale y se vende se propone como compra.
   Esto se aplica en:
   - Chollos, Punto de mira y el Top 5;
   - las compras «EX o mejor» y «Restaurar»;
   - los idiomas pegados.

   Casi siempre son proxies, falsificaciones, otra carta o un error. El panel de chollos dice cuántos se han descartado
   hoy. Con la guía real del 25/10 quedan 38 chollos de los 233 de V129, y la japonesa de 50 € ya no sale. El
   verificador independiente da 0 errores.
2. **«🚫 Es proxy o falsa».** Este botón está en cada chollo, en el Punto de mira y en el Top 5. Oculta ese anuncio
   mientras siga siendo el más barato. Si aparece otro anuncio más caro, la carta vuelve a evaluarse.
3. **Detector de palabras de proxy.** Pega la descripción del anuncio en «🔎 ¿Es proxy?» y la app la revisa. También se
   revisa al pegar datos de un idioma y en Cartas graduadas. Detecta, entre otras: proxy, réplica, fake, custom, fan
   art/made, orica, no original, unofficial, inoffiziell, Fälschung, contrefaçon, falsa, imitación, reproducción, copia,
   playtest, プロキシ y レプリカ.
4. **Cartas graduadas.** Una graduada por menos del 30 % de la carta sin graduar sale como «⛔ Sospechosa»: probable
   cápsula falsa.
5. **«Antes de pagar».** Su primer punto es ahora «Que no sea proxy ni falsa: lee la descripción entera».

## Límites (con honestidad)
La app sigue sin poder leer los anuncios de Cardmarket, porque su API está cerrada. Un proxy puesto a un precio
normal (por ejemplo, al 60 % del valor) solo se detecta leyendo la descripción y mirando las fotos. Cardmarket prohíbe
vender falsificaciones: si llega una, se reclama.

## Pruebas
- tests/v130-antiproxy-e2e.cjs (13 comprobaciones), con el caso real de 50 € frente a ~638 €.
- tools/verificar-precios.py ahora da error si un chollo o un Punto de mira está por debajo del 30 %.
