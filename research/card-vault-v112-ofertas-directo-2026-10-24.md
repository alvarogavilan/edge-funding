# Card Vault V112 · ofertas en directo de Cardmarket en Compra YA y Comprar para restaurar

## Qué hace
Al abrir Compra YA o Comprar para restaurar en el iPhone, la app consulta en directo (desde Safari) los precios de Cardmarket que publica TCGdex. Primero consulta la familia Vintage y se pueden pedir las demás o «Todas». Los precios se guardan 24 h en el dispositivo.

| Dato en la ficha | Origen | Qué es |
|---|---|---|
| Oferta más barata | Cardmarket (`low`) | Precio real pedido del anuncio más barato de esa carta. Estado, idioma y vendedor se ven al abrir la ficha |
| Venta demostrada | Cardmarket (`avg30` y `trend`, se toma la menor) | Media de ventas reales de la plataforma. Agregado de todos los estados, no una venta individual |
| Beneficio estimado | Cálculo | venta × (1 − comisión) − envío de venta − (compra + envío de compra). Supuestos editables. Nunca es beneficio seguro |
| Enlace | `prices.pokemontcg.io/cardmarket/<id>` | Redirige a la ficha de la carta en Cardmarket |

- **Compra YA**: anuncio ≥ 50 % de la media de ventas y beneficio ≥ 40 € vendiendo a la media. Escenario conservador: 10 % por debajo.
- **Restaurar**: anuncio < 60 % de la media (casi siempre un ejemplar en mal estado). Venta como carta mejorada al 60 / 75 / 90 % de la media. Debe dejar ≥ 40 € en el escenario central. Ejemplo de la prueba: compra a 50 €, media de ventas 200 €, venta mejorada 150 €, beneficio estimado +81,50 € (conservador +53 €).
- Compra entre 20 y 200 €. Se excluyen las cartas que ya están en Mi colección.
- «Registrar este anuncio» la pasa al flujo de comprobación (fotos, estado, costes reales a Sevilla, ventas comparables).

## Límites reales
- Sin conexión, la consulta se detiene sola tras 8 fallos seguidos sin ningún acierto.
- Lorcana: no hay en abierto anuncios ni ventas de Cardmarket. Solo el precio de mercado de TCGplayer en dólares (sección «En investigación»), así que no hay ofertas en directo de Lorcana.
- El contenedor de desarrollo no puede abrir Cardmarket ni TCGdex. Las pruebas usan respuestas simuladas con el formato real de TCGdex. **No se ha visto ninguna oferta real desde aquí.**
- Safari real no probado (Chromium con emulación de iPhone).

## Pruebas
- `tests/v112-ofertas-directo-e2e.cjs`: 12 comprobaciones.
- Motor: 42 + integración.
- `vault-v104-e2e`: 47.
- `vault-v107-regresion`: 60.
- Matriz de aceptación: 0 filas fallidas.
- cv-money 16, migración 5.

---

# V113 · idiomas separados y fotos exactas (24/10/2026)

## Idiomas (aviso del propietario: Charizard ex de Destinos de Paldea)
La guía diaria de Cardmarket que publica TCGdex (y también pokemontcg.io) da **una sola cifra por carta, con todos los idiomas y estados mezclados**. El «desde» puede ser un ejemplar italiano, portugués o dañado, y la media de ventas mezcla todos los idiomas. Por eso V112 mostraba beneficios que no existían para un mismo idioma.

Ninguna fuente abierta y gratuita publica ventas de Cardmarket por idioma. La API oficial de Cardmarket requiere credenciales de cuenta.

V113:
- La diferencia «desde» vs media queda solo como **criba** («NO es beneficio»). Ya no aparece como beneficio.
- **Ventas en inglés**: precio de mercado de TCGplayer (EE. UU.), calculado con ventas reales de ejemplares en inglés. Llega en el mismo dato de TCGdex.
- **Precios por idioma** en cada ficha (inglés, español, francés, alemán, italiano y portugués): compra y venta del mismo idioma, anotadas tras filtrar por idioma en Cardmarket. En inglés se propone la venta de TCGplayer (× 75 % en Restaurar).
- El **beneficio solo se calcula con compra y venta del mismo idioma**. La ficha pasa a «RENTABLE EN ‹IDIOMA›» si deja ≥ 40 € y sube al principio de la lista.
- Los precios se guardan en el iPhone (`cv_v113_lang`) y se conservan al recargar. «Registrar este anuncio» pasa la carta en ese idioma, con sus precios etiquetados por idioma.
- Las cartas japonesas son otra ficha en Cardmarket.

## Fotos y enlaces (aviso: Giratina)
La conversión antigua de códigos de colección solo cubría Escarlata/Púrpura y Megaevolución. Fallaban enlace y foto de respaldo en Colección Legendaria, Destinos Ocultos, Destinos Brillantes, Camino de Campeones, Majestad de Dragones, Cenit Supremo y su Galería de Galar (Giratina VSTAR GG69), Pokémon GO, Rayo Negro, Llama Blanca, 30 aniversario, Héroes Ascendidos y los holos «H» de e-Card.

- Nuevo `vault-ptcg-map.js`, generado a partir de PokemonTCG/pokemon-tcg-data. **5.185 de 5.213 cartas** se emparejan por colección y número. Las 28 restantes (colección Unown de Unseen Forces) no tienen equivalente: se enlazan con la búsqueda de Cardmarket.
- Foto: primero la de pokemontcg.io/scrydex (confirmada en su base de datos), después la de TCGdex, después un reintento, después aviso con nombre, colección y número.
- Las 15 URLs fijas de imágenes del proyecto se han comprobado contra el dataset. 14 están allí; la de Eevee ex SVP 174 se sirve desde un archivo incluido en la app.

## Pruebas V113
- `tests/v113-ofertas-idiomas-e2e.cjs`: 16 comprobaciones (incluye inglés +2,40 € no rentable, español +55,25 € «RENTABLE EN ESPAÑOL», persistencia tras recargar y respaldo de foto).
- Motor: 44 (correspondencias especiales y cálculo por idioma).
- `vault-v104-e2e`: 47.
- `vault-v107-regresion`: 60.
- Matriz de aceptación: 0 filas fallidas.
- cv-money 16, migración 5.
