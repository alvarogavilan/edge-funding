# Card Vault V146 · 🩹 Mal estado barato (29/10/2026)

## Petición
«Buscar cartas en mal estado a precios muy bajos (20–30 €) cuyo valor sea muy superior y con mercado de venta
corroborado. Me interesan mucho las cartas muy económicas en mal estado.»

## Qué se puede comprobar de verdad
- **El estado de cada anuncio:**
  - CardTrader lo dice en cada anuncio (Slightly Played, Moderately Played, Played, Heavily Played, Poor), junto con el
    idioma.
  - CardNexus (opcional) da el anuncio más barato de Cardmarket por estado (MP, HP, DMG) y por idioma.
  - La guía oficial de Cardmarket no lo separa.
- **Que la carta se vende:** la guía oficial de Cardmarket tiene medias de ventas de 1, 7 y 30 días. Se exigen tus
  «Ventas mínimas» (por defecto, se vende cada semana).
- **Lo que vale en mal estado:** no hay ventas públicas por estado, así que no se inventan. Se usa el **MENOR** de:
  1. lo que piden **otros vendedores en ese mismo estado** (CardTrader, −5 % para venderla antes);
  2. una **estimación prudente por estado**, por debajo de las referencias públicas.

| Estado | Referencia pública (ejemplo de TCGplayer) | La app usa |
|---|---|---|
| Poco jugada (SP/LP) | ≈ 87 % | 75 % |
| Jugada (MP) | ≈ 67 % | 60 % |
| Jugada (PL) | — | 45 % |
| Muy jugada (HP) | ≈ 44 % | 35 % |
| Dañada (Poor/DMG) | ≈ 34 % | 25 % |

## Qué hace la app
Nuevo panel en Compra YA, **«🩹 Mal estado barato»**. Por defecto:
- **la carta cuesta ≤ 35 €** (sin envío);
- **vale ≥ 2,5 veces** lo que pagas en buen estado;
- **ganas ≥ 15 €** vendiéndola **tal cual, sin restaurar**, tras comisión y envíos, y con tu margen mínimo %;
- la carta **se vende cada semana** en Cardmarket;
- el **idioma y el estado están comprobados**: CardTrader, Cardmarket por estado vía CardNexus, o japonesas (su ficha es
  solo japonesa; si el anuncio no dice el estado, se cuenta como muy jugada);
- se descarta por debajo del 10 % de su valor (proxy o falsa), además de los anuncios que dicen «proxy»/«réplica» y los
  vendedores de vacaciones.

Cada línea dice el idioma, el estado, lo que pagas con el envío real, lo que vale en buen estado (×veces), cada cuánto se
vende, a cuánto la vendes tal cual y de dónde sale ese precio, y lo que ganas. Restaurarla es un extra que se enseña pero
**no se cuenta** en el beneficio.

Los tres límites se cambian en «Supuestos del cálculo». El barrido de CardTrader incluye ahora estas cartas baratas y
pide el envío real de su vendedor.

## Con la guía real de hoy (29/10)
Sin CardTrader en esta prueba, solo con japonesas (estado sin indicar, contadas como muy jugadas):
- **Latias**, Legendary Holo Collection (japonés): 17,50 € · vale 168 € · se vende a diario → +27,35 € tal cual.
- **Mew V**, Fusion ARTS (japonés): 27,99 € · vale 177 € · se vende a diario → +19,78 € tal cual.

Con tu token de CardTrader saldrán además las inglesas con el estado comprobado, colección a colección.

## Pruebas
tests/v146-mal-estado-barato-e2e.cjs (9 comprobaciones):
- Alakazam HP a 22 € (+5 € de envío real), que vale 200 €: tal cual 60,80 € (otros 3 vendedores en ese estado) →
  +25,76 €;
- fuera la «proxy» y la coreana;
- Mewtwo HP no sale, porque los demás HP piden casi lo mismo;
- restaurada «no contado»;
- enlace;
- nivel de estado;
- ajustes.

## Fuentes
- Guía de estados y ejemplo de precios por estado:
  https://rarecandy.com/blog/pokemon-card-condition-guide
- Estados de TCGplayer: https://help.tcgplayer.com/hc/en-us/articles/221430307-Card-Conditioning-Overview
- Cada estado resta un 10–25 %: https://tcgsync.com/glossary/nm-lp-mp-condition
- Estados en CardNexus: https://help.cardnexus.com/articles/6146447
