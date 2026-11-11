# Card Vault V145 · Carta clara, Gundam y Riftbound (28/10/2026)

## Lo que pasaba (captura del usuario, «Mal estado»)
En la misma carta salían tres precios de compra sin explicar:
1. **«Compra en Cardmarket 113,95 €».** Cuando la carta no tenía una compra que dejara beneficio, esa caja enseñaba el
   «desde EX o mejor» de Cardmarket, que no es tu compra.
2. **«Dónde comprarla más barata · Cardmarket 35,00 €».** Es el anuncio más barato de cualquier idioma y estado (29 €)
   más el envío. Salía como si fuera una compra.
3. **«Mismo idioma · Todos (guía) 29,00 €».** Una fila que mezclaba todos los idiomas, con el nombre «mismo idioma».

## Ahora (V145)
**Las tres cajas dicen lo mismo que la línea de decisión:**
- **Compra confirmada:** «Pagas en CardTrader 75 €» (carta + envío · idioma · estado) · «La vendes a» · «Ganas +…».
- **Precio objetivo:** «Paga como máximo ≤ 48,91 €» (con envío; carta ≤ 42,90 € · inglés · mal estado) · «La vendes
  a 98,85 €» (restaurada, 60 %) · «Ganas ≥ 40 €».
- **Otro idioma sin datos:** «Compra —» · «Valor en Cardmarket» (todos los idiomas mezclados) · «Ganas —».
- **Mejor opción sin beneficio suficiente:** dice que «no llega a tu mínimo».

Nunca se enseña un «desde» de otro idioma o estado como si fuera tu compra.

**«Dónde comprarla» en dos bloques:**
- **Compras comparables** (mismo idioma y estado, con envío a 41020). Si no hay ninguna, lo dice.
- **⚠ Solo referencia, NO es tu compra:** atenuado, con el motivo (por ejemplo, «cualquier idioma: puede ser coreano o
  chino»).
- Al final, **«👉 Tu precio máximo para ganar tu mínimo: ≤ … con envío»**.
- El texto ya no se corta en el iPhone.

**Fuera lo confuso:**
- la fila «Todos (guía)»;
- la frase «Sin precio de compra en 20–200 € o sin ventas de referencia»;
- la tabla de idiomas, que solo sale si has pegado datos de un idioma;
- las opciones calculadas, que quedan plegadas en «Todas las opciones calculadas».

## Gundam y Riftbound
He confirmado sus fichas en Cardmarket (cardmarket.com/en/Gundam y cardmarket.com/en/Riftbound) y entran igual que
Magic y One Piece:
- precio y ventas de Cardmarket vía Bindex;
- precio objetivo, CardTrader, foil aparte, historial y vídeos.

**Juegos en Compra YA:** Pokémon, Pokémon japonés, Lorcana, Magic, One Piece, Gundam y Riftbound.

**Siguen fuera:**
- **Yu-Gi-Oh:** ninguna fuente gratuita da sus ventas.
- **Cartas deportivas:** sus ventas comprobadas vienen de eBay y de casas de subastas.

## Pruebas
tests/v145-carta-clara-e2e.cjs (9 comprobaciones), con el caso exacto de la captura (anuncio más barato de 29 €, vale
164,75 €, «Mal estado»):
- las cajas;
- la referencia de 35 € en su bloque;
- el precio máximo;
- sin «Todos (guía)»;
- Gundam y Riftbound con sus fichas.

Captura del iPhone simulado revisada.

## Fuentes
- Cardmarket Gundam: https://www.cardmarket.com/en/Gundam
- Cardmarket Riftbound: https://www.cardmarket.com/en/Riftbound
- Cardmarket abre Gundam: https://news.cardmarket.com/en/Magic/gundam-card-game-has-arrived
