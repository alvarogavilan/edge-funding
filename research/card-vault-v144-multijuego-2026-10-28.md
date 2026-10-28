# Card Vault V144 · Magic, One Piece y ventas mínimas (28/10/2026)

## Petición
«¿Añadimos todo el mercado mundial de cartas? Con la misma calidad que Pokémon: Yu-Gi-Oh, Magic, fútbol, baloncesto…
Todo con verificación y ventas comprobadas (no me vale una carta que se venda una vez cada 2 años).»

## Regla de calidad
Un juego entra solo si tiene lo mismo que Pokémon:
1. **Precio de venta comprobado con ventas reales.** La guía oficial de Cardmarket da la media de las ventas del último
   día, de los últimos 7 días y de los últimos 30 días. Si no hubo ventas, el dato está vacío, así que también dice
   **cada cuánto se vende**.
2. **Cada carta emparejada con su ficha de Cardmarket.**
3. **Gratis, legal desde el iPhone y sin eBay.**

## Juego a juego
| Juego | ¿Entra? | Por qué |
|---|---|---|
| **Pokémon** | Sí (ya estaba) | Guía de Cardmarket (espejo diario) |
| **Lorcana** | Sí (ya estaba) | Bindex: guía de Cardmarket emparejada carta a carta |
| **Magic: The Gathering** | **Sí, nuevo** | Bindex publica la guía de Cardmarket de Magic con las medias de venta de 1, 7 y 30 días |
| **One Piece** | **Sí, nuevo** | Bindex, emparejado por el código de la carta (OP05-119…) |
| Gundam, Riftbound | Pendiente | Bindex tiene los datos, pero no he podido confirmar la dirección de su ficha en Cardmarket. No pongo enlaces inventados |
| **Yu-Gi-Oh!** | No | Ninguna fuente gratuita trae sus ventas. YGOPRODeck da un único «precio de Cardmarket» (el más bajo de todas las ediciones) sin ventas ni frecuencia. No existe un espejo público de la guía de Yu-Gi-Oh y no se puede crear uno sin infraestructura propia |
| **Fútbol, baloncesto y otros deportes** | No | Cardmarket y CardTrader no venden cartas deportivas. Las ventas comprobadas de deporte salen de eBay y de casas de subastas: SportsCardsPro/PriceCharting, Card Ladder, 130point… Excluido por tus condiciones (sin eBay) o de pago (HobbyCardIndex) |

## Qué hace ahora la app
**Juego:** Todas, Pokémon, Pokémon japonés, Lorcana, **Magic**, **One Piece**. Cada carta de Magic y One Piece funciona
igual que en Pokémon y Lorcana:
- precio de venta de Cardmarket;
- precio objetivo «🔎 BUSCA EN INGLÉS» con el enlace a su ficha filtrada;
- CardTrader (juegos «Magic: The Gathering» y «One Piece Card Game»), separando foil y no foil, por idioma y con el
  envío real;
- CardNexus si lo conectas;
- versión foil aparte cuando vale ≥ 20 €;
- historial de precio;
- vídeos;
- Top 5;
- graduadas (CardTrader).

**Magic es enorme** (unas 105.000 cartas). Para no gastar datos del iPhone:
- se cargan las 40 colecciones con más valor y las más recientes;
- solo se guardan las cartas que valen 15 € o más (las de menos no pueden dejar tu beneficio mínimo).

**Ventas mínimas (nuevo en Supuestos):**
- 1 = al menos una venta en 30 días;
- **2 = cada semana (por defecto)**;
- 3 = a diario.

Por debajo de tu mínimo, la carta no se recomienda ni entra en el Top 5. Con la guía real de hoy, las 83 recomendadas de
Pokémon ya se venden cada semana o más.

## Pruebas
tests/v144-multijuego-e2e.cjs (14 comprobaciones):
- juegos en el filtro;
- Magic con su etiqueta y su ficha;
- Magic con CardTrader: la normal a 70 € (+62,50 €), sin contar la foil de 50 €;
- Magic foil aparte;
- las cartas de menos de 15 € no se cargan;
- una carta con una sola venta en 30 días no se recomienda;
- ajuste «Ventas mínimas»;
- One Piece con precio objetivo y su ficha en inglés;
- filtro «Magic»;
- historial y vídeos de Magic.

## Fuentes
- Bindex (Pokémon, One Piece, Magic, Lorcana, Gundam, Riftbound): https://github.com/douxeh/bindex-prices
- Guía de Cardmarket: avg1, avg7 y avg30 son medias de ventas:
  https://mtg-powertools.outseta.com/support/kb/articles/j9b8Mwmn/how-to-price-your-cards-based-on-trend-average-price-price-guide
- YGOPRODeck (un solo precio, el más bajo de todas las ediciones): https://ygoprodeck.com/api-guide/
- SportsCardsPro (de PriceCharting, datos de eBay): https://sportscardpro.com/api-documentation
- HobbyCardIndex (de pago): https://mcpservers.org/servers/hobbycardindex-com-developers
- One Piece en Cardmarket: https://tcgtalk.com/guides/one-piece-tcg-website-directory
