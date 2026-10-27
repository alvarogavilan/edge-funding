# Card Vault V142 · Todos los idiomas con su precio, y vídeos (28/10/2026)

## Petición
«Idiomas inglés y japonés, pero hay más idiomas, necesito el 10 de todo. Investiga qué falta: vídeos, análisis…»

## 1. Qué dice la investigación sobre los idiomas
- **Cada idioma tiene su propio precio.** Las cartas en alemán suelen valer menos que en inglés o japonés, por menor
  demanda (CardCosmos). Las francesas antiguas se han revalorizado más en 2023-2026 que las inglesas (Cards'n'Packs, que
  vende cartas; tómalo con cautela).
- **La guía oficial de Cardmarket mezcla todos los idiomas** en la ficha internacional, así que no da el precio del
  alemán, del francés, etc.
- Comparar solo el anuncio más barato de cada idioma engaña (Journal du Geek).

**Conclusión:** comprar una alemana y calcular la venta con el precio de la inglesa daría beneficios falsos. Es el
mismo error que el del Umbreon coreano.

## 2. Qué hace ahora la app (V142)
**Nueve idiomas en el filtro:** inglés, español, francés, alemán, italiano, portugués, japonés y, nuevos, coreano y
chino.

**Para alemán, francés, italiano, español, portugués, coreano y chino**, todo sale de CardTrader, que dice el idioma
de cada anuncio:
- **Compra:** el anuncio NM/EX más barato de ese idioma, con el envío real del vendedor.
- **Venta:** lo que piden los demás vendedores de ese mismo idioma.
  - Es la mediana de hasta 5 anuncios, sin contar el que compras, y hacen falta al menos 3.
  - Se le resta un 5 % para venderla antes.
  - Nunca supera su valor en Cardmarket.
- **Confianza como mucho 60/100**, porque son precios pedidos y no ventas cerradas. Así se dice en cada carta.
- **No hay precio objetivo inventado** en esos idiomas: la guía no tiene su precio de venta.
- **La lista no se queda vacía.** Las cartas que podrían dar beneficio y aún no tienen precio en ese idioma salen al
  final como «🔎 POR COMPROBAR EN ITALIANO» (o el idioma que sea), sin beneficio inventado. Dicen qué ha visto
  CardTrader y enlazan a Cardmarket solo en ese idioma.
- **Al elegir un idioma, CardTrader barre las colecciones en ese idioma** (una consulta por colección). El barrido en
  un idioma no borra lo que ya había de otros.
- **«Todos los idiomas»** muestra cada compra con su idioma en mayúsculas (✅ COMPRA en CardTrader · ALEMÁN), también
  en el Top 5.
- **«Inglés»** ya no ofrece una alemana como si fuera inglesa.
- **Lorcana** solo aparece en los idiomas en que se imprime: inglés, alemán, francés, italiano, japonés y chino.

Ejemplo de la prueba: Alakazam vale 250 € en Cardmarket. En alemán hay una a 60 € (65 € con envío), y los otros 4
vendedores alemanes piden 120–140 €. La venta es 130 × 0,95 = 123,50 €, y ganas +47,32 €. Una coreana a 20 € **no**
sale: los otros coreanos piden unos 55 €. Con el precio de la inglesa habría salido un beneficio falso de +192 €.

## 3. Vídeos
Cada carta tiene dos botones:
- **🎥 ¿Es auténtica? Vídeos**
- **📺 Análisis de su precio**

Abren la búsqueda de YouTube de esa carta exacta (nombre, colección, japonesa o no, juego). No se inventa ningún
vídeo: se abre la búsqueda real.

## 4. Lo que tienen las mejores apps y cómo está Card Vault
| Función | Apps líderes | Card Vault |
|---|---|---|
| Historial de precio | Pokemon Price Tracker, PokeData | Sí («Ver historial de precio», guía diaria de Cardmarket) |
| Alertas de precio | PokeData (avisos push por umbral) | Sí: vigiladas con precio objetivo y 🤖 piloto automático con avisos |
| Comparar mercados | TCGplayer y otros | Cardmarket, CardTrader (por idioma), TCGplayer importada y tiendas con precio legible |
| Población PSA | PSA CardFacts (sin precios) | No: sin API gratuita |
| Escáner con cámara | Collectr, PokeData | No: necesita servicios de pago o modelos pesados |
| Vídeos de autenticidad | — | Sí (V142) |

## Pruebas
tests/v142-idiomas-videos-e2e.cjs (13 comprobaciones):
- los 9 idiomas;
- compra en alemán con su venta en alemán;
- barrido en alemán;
- aviso del idioma;
- «Todos los idiomas» y el Top 5 con el idioma;
- «Inglés» sin alemanas;
- coreana sin beneficio falso, que sale «por comprobar»;
- los idiomas no se borran entre barridos;
- vídeos.

Verificación con la guía real: 83 recomendadas, 72 pendientes y 25 pintadas, con 0 errores.

## Fuentes
- CardCosmos, valor de las cartas Pokémon:
  https://cardcosmos.de/en/blogs/news/everything-you-need-to-know-about-the-value-of-pokemon-cards
- Cards'n'Packs, francesas frente a inglesas (2026):
  https://www.cardsnpacks.com/en/blog/cartes-pokemon-francaises-vs-anglaises-valeur/
- Journal du Geek, ¿valen más las francesas? (10/2026):
  https://www.journaldugeek.com/2026/10/03/est-ce-que-les-cartes-pokemon-francaises-valent-plus-cher-que-les-autres-langues/
- Apps de seguimiento de precios en 2026:
  https://www.pokemonpricetracker.com/blog/posts/how-to-track-pokemon-card-prices-in-2026-tools-tips
- Mejores apps de colección en 2026: https://mydextcg.com/blog/best-pokemon-card-collection-apps-2026
- API de CardTrader: https://www.cardtrader.com/docs/api/full/reference
