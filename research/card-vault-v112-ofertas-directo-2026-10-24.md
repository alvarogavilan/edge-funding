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
