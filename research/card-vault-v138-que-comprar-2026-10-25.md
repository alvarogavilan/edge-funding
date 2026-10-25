# Card Vault V138 · Qué comprar, en qué idioma y cuánto ganas (25/10/2026)

## 1. «Con todos los idiomas solo salen japonesas» — causa real
No era el filtro. Las internacionales dependían **por completo** del «EX o mejor» de pokemontcg.io. Si en tu iPhone no
llegaba, no tenían precio de compra y desaparecían de la lista:
- cuando el servicio iba lento o caído;
- cuando se gastaba el tope diario de 900 consultas tras recargar muchas veces.

Las japonesas no dependen de esa fuente, por eso eran las únicas que quedaban. La prueba nueva lo reproduce:
pokemontcg.io devuelve error y aun así salen internacionales y japonesas.

## 2. Arreglo: las internacionales salen siempre, con un precio objetivo realista
Si una internacional no tiene una compra confirmada en su idioma, sale con:

> 🔎 **BUSCA EN INGLÉS** · cómprala solo si la encuentras a **≤ 186,50 €** (75 % de su valor; ≤ 192,50 € con envío) →
> la vendes en Cardmarket a **250 €** → **ganas ≥ 40 €**. El anuncio más barato (90 €) no dice el idioma: puede ser
> coreano o chino. [Ver solo anuncios en inglés ↗]

- **Cómo se calcula:** precio máximo = venta × (1 − comisión) − envío de venta − beneficio mínimo, con tu compra máxima
  como tope y restando el envío de compra.
- **Solo objetivos realistas**, con el precio máximo al menos al 60 % de su valor. Una inglesa de 885 € al 22 % no
  existe: sería coreana o falsa. Con la guía real del 25/10 salen 66 internacionales con objetivo, por ejemplo Pikachu δ
  Legend Maker (vale 258 €, cómprala por ≤ 194 €).
- **Con CardTrader** (ahora funciona) se buscan en inglés automáticamente: las 60 de más margen al abrir y las 25
  primeras de la lista. Si hay un anuncio en inglés por debajo del objetivo, pasa a compra confirmada con su envío real.
- El orden es: primero las compras confirmadas, después los precios objetivo.

## 3. Claro y conciso en cada carta
Cada carta empieza con una sola línea que dice qué hacer:

> ✅ **COMPRA** en **Cardmarket** · **JAPONÉS** · estado sin indicar
> Pagas **199 €** (carta 193 € + envío) → la vendes en Cardmarket a **257 €** (ventas de japonesas) → **ganas +40,15 €**

> ✅ **COMPRA** en **CardTrader** · **INGLÉS** · NM/EX
> Pagas **155 €** (carta 150 € + envío) → la vendes en Cardmarket a **250 €** → **ganas +77,50 €**

El Top 5 también lleva el idioma de cada compra («· JAPONÉS», «· INGLÉS»).

## Coreano, chino y otros idiomas
En Cardmarket, las coreanas y chinas están dentro de la ficha internacional, y la guía oficial no separa su precio ni
sus ventas. Por eso la app **no recomienda comprar una coreana o china para venderla como inglesa**: sería el caso del
Umbreon. Para comprar y vender en otro idioma sigue estando «Pegar datos» de cada carta (ficha filtrada por idioma).

## Pruebas
tests/v138-que-comprar-e2e.cjs (12 comprobaciones), con pokemontcg.io sin responder y con CardTrader encontrando la
inglesa más barata que el objetivo. También la batería completa.
