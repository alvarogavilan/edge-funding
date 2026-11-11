# Card Vault V140 · Orden por precio, Lorcana y piloto automático (26/10/2026)

## 1. «Al ordenar por menor precio de compra no aparece así»
**Causa.** Se ordenaba por el precio de la carta sin envío, mientras la línea de cada carta enseña «Pagas …» con
envío. Además, las cartas con precio objetivo (sin compra confirmada) iban siempre al final.

**Ahora** se ordena por **lo que pagas**: el «Pagas» de las compras y el «≤ … con envío» de los objetivos, todo junto
y de menos a más. La prueba lo comprueba con 186 → 192,08 → 200 → 200.

## 2. «Lorcana sigue sin nada»
**Causa, con números.** Con 200 € de compra máxima, 40 € de beneficio mínimo y 25 % de margen, comprar al precio
normal de mercado (≥ 75 % de su valor) no puede dejar ese margen dentro del presupuesto. En Lorcana solo había ese
tipo de compra, y además CardTrader no se consultaba para Lorcana.

**Ahora:**
- **Precio objetivo también en Lorcana:** «🔎 BUSCA EN INGLÉS · cómprala por ≤ 194 € → la vendes a 300 € → ganas
  ≥ 80 €», con el enlace a Cardmarket Lorcana solo en inglés.
- **CardTrader también para Lorcana,** su juego «Disney Lorcana», emparejado por id de Cardmarket. Si hay una inglesa
  más barata, pasa a «✅ COMPRA en CardTrader» con su envío real.

## 3. Japonesas que no salían
Si el anuncio más barato de una japonesa estaba entre el 50 % y el 75 % de su valor, no salía nada: no era chollo y
tampoco «precio de mercado». Ahora sale **«🔎 BUSCA EN BUEN ESTADO · JAPONÉS»** con su precio máximo y el enlace solo
a EX o mejor.

## 4. «Una IA más potente que tú dentro de la app para que todo vaya solo»
**Lo que no es posible, con honestidad.**
- **Un modelo de IA dentro del iPhone** (WebLLM, con WebGPU en Safari 26): en un iPhone solo caben modelos pequeños,
  de unos 0,6–1 mil millones de parámetros y 300–700 MB de descarga, con límites de memoria. Son mucho menos capaces
  que yo.
- **Una IA potente** necesita una clave de pago y un servidor. Lo descartaste: cero costes y sin servidores ni claves.
- **Ninguna IA hace los precios más fiables:** los precios salen de las fuentes (Cardmarket, CardTrader…), y una IA
  podría inventarlos.

**Lo que sí hace ahora la app sola — 🤖 Piloto automático:**
- Con la app abierta, cada 15 min vuelve a mirar la guía (si hay una nueva) y CardTrader en tus cartas.
- Detecta las **compras y chollos que no estaban antes**: los marca **🆕 NUEVA** y avisa con un mensaje en pantalla. Si
  lo permites con «🔔 Avisarme de compras nuevas», también con un aviso del sistema. En iPhone, los avisos del sistema
  funcionan con la app añadida a la pantalla de inicio.

## Pruebas
tests/v140-orden-lorcana-piloto-e2e.cjs (10 comprobaciones):
- orden por lo que pagas;
- Lorcana con objetivo y con CardTrader;
- japonesa al 54 %;
- chollo nuevo detectado solo al revisar.

## Fuentes
- WebLLM y WebGPU en el navegador (2026): https://pinggy.io/blog/run_llm_in_browser_webgpu/
- Límites de memoria de WebGPU en iPhone: https://tianpan.co/blog/2026-04-17-browser-native-llm-inference-webgpu
- Bindex (datos de Lorcana): https://github.com/douxeh/bindex-prices

## Verificación con la guía real del 27/10/2026
- 83 recomendadas, 72 pendientes y 25 pintadas, con 0 errores.
- El verificador ya no exige el filtro de inglés en las japonesas: su ficha es solo japonesa.
- Batería completa en verde (v117 adaptada al orden por lo que pagas).
