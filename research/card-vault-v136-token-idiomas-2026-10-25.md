# Card Vault V136 · CardTrader «HTTP 500» y «Todos los idiomas» (25/10/2026)

## 1. CardTrader: «HTTP 500» con el token
**Qué significa.** Un «HTTP 500» es una respuesta de CardTrader. Si el navegador bloqueara la consulta (CORS) no habría
código de estado. Así que el iPhone sí llega a CardTrader y es CardTrader quien falla al recibir la llamada.

**Causa más probable:** el token llega deformado. Al copiarlo y pegarlo en el iPhone a veces se cuela «Bearer » delante,
comillas tipográficas, espacios o un salto de línea en medio. La prueba nueva lo reproduce: con comillas, la limpieza
anterior dejaba «BearereyJ…» y CardTrader respondía 500.

**Arreglo:**
- **Limpieza al guardar y al usar,** también del token ya guardado. Se quitan las comillas, el «Bearer»/«Bearer:», los
  espacios y los saltos de línea, en ese orden.
- **Se comprueba el propio token,** sin enviarlo a ningún sitio. Si no tiene la forma de un token de CardTrader (3 partes
  separadas por puntos), está incompleto o ha caducado, la app lo dice con la fecha y cómo generar uno nuevo
  (CardTrader → Ajustes → API).
- **«Probar CardTrader»:** si `/info` da 500, se prueba `/games`. Si eso funciona, la app sigue usando CardTrader y lo
  indica. Si todo da 500, dice que CardTrader da error interno con ese token y que se copie de nuevo entero o se genere
  uno nuevo.
- Los errores muestran el código y el inicio de la respuesta de CardTrader.

## 2. «Todos los idiomas» solo enseñaba japonesas
**Causa.** La regla de V131 quitaba de Compra YA toda carta internacional cuyo «EX o mejor» barato no dijera el idioma.
Con 200 € de compra máxima y 40 € de beneficio, casi no quedaba ninguna internacional.

**Ahora:**
- Esas cartas **vuelven a Compra YA** (también con el idioma «Inglés»), marcadas **«🌐 IDIOMA POR CONFIRMAR»**.
- Su enlace abre la ficha de Cardmarket con **solo los anuncios en inglés** (EX o mejor), para ver el precio real en un
  toque.
- Su confianza es como mucho 40/100.
- **No entran en el Top 5** (caso del Umbreon coreano), salvo que CardTrader confirme un anuncio en inglés: entonces
  entran con ese precio y su envío real.
- El aviso 🌐 cuenta cuántas hay de cada tipo: japonesas, internacionales con el idioma comprobado e internacionales por
  confirmar.

Nota: el «EX o mejor» de las internacionales llega de pokemontcg.io, que se comprueba poco a poco la primera vez. Se
guarda en el iPhone, así que las siguientes veces ya está desde el principio.

## Pruebas
tests/v136-token-idiomas-e2e.cjs (13 comprobaciones):
- token con «Bearer», comillas y salto de línea;
- `/info` con 500 y el resto funcionando;
- token mal copiado;
- token caducado;
- internacionales marcadas, con el enlace en inglés y fuera del Top 5;
- el aviso de idiomas;
- el idioma «Inglés».
