# Card Vault V139 · Mal estado, CardTrader en cada carta y margen mínimo (26/10/2026)

## 1. «Al pulsar mal estado no funciona bien el buscador y solo salen japonesas»
**Causa.** Desde V131, restaurar solo usaba japonesas, porque en las internacionales el «desde» no dice el idioma. Al
buscar una internacional en «Mal estado» salía la carta sin ninguna propuesta y parecía que el buscador fallaba.

**Ahora** las internacionales salen también en «Mal estado», con su línea de qué hacer:

> 🔧 **BUSCA EN INGLÉS EN MAL ESTADO** · cómprala solo si la encuentras a **≤ 91,50 €** (37 % de su valor) →
> restaurada la vendes a **~150 €** (60 % de su valor, conservador) → **ganas ≥ 40 €**. [Ver solo anuncios en inglés ↗]

- Venta restaurada = valor × «restaurado conservador» (60 %, editable en Supuestos).
- Solo objetivos realistas: tendrías que pagar al menos el 25 % de su valor.
- El buscador funciona igual en «Buen estado» y «Mal estado», y el texto escrito no se pierde (comprobado en la prueba).

## 2. «CardTrader no funciona bien: salen dos opciones de Cardmarket»
**Causa.** CardTrader solo se consultaba para 60 candidatas y las 25 primeras al abrir. En las demás cartas la tabla
enseñaba dos filas de Cardmarket («EX o mejor» y «cualquier estado») y ninguna de CardTrader.

**Ahora:**
- **Cada carta que aparece en tu pantalla consulta CardTrader sola.** Va en cola, de una en una con pausa, porque el
  límite de CardTrader es 10 por segundo.
- **Una fila por sitio en «Dónde comprarla».** Cardmarket sale una vez, con la compra comparable: «EX o mejor» del mismo
  idioma, o el «desde» a precio de mercado. Si no la hay, sale el más barato marcado «no comparable», con el enlace
  filtrado en inglés y EX o mejor.
- **La fila de CardTrader siempre aparece:** «⏳ consultando», su precio con envío real, «no tiene ninguna en
  inglés/japonés ahora» o el error exacto.

## 3. «Cartas con muy poco margen»
Nuevo supuesto **«Margen mínimo %» (25 % por defecto)**. Una compra solo se propone si gana tu mínimo en euros **y**
al menos ese % de lo que pagas. Por ejemplo, pagar 199 € para ganar 40,15 € (20 %) ya no se propone.

Se aplica en Compra YA, la línea de qué hacer, el Top 5, los chollos, el Punto de mira y los precios objetivo. Con el
25 %, el objetivo de una carta de 250 € es ≤ 180 € con un beneficio ≥ 46,50 €. Se cambia en «Supuestos del cálculo».

## Pruebas
- tests/v139-mal-estado-margen-e2e.cjs (14 comprobaciones).
- Las pruebas anteriores fijan el margen al 0 % para seguir midiendo lo suyo.
- tools/verificar-precios.py usa la fórmula nueva del objetivo (beneficio y margen).
