# Card Vault V141 · Más rápida y CardTrader por colección (27/10/2026)

## Petición
«Revisa todo y consigue el máximo rendimiento y beneficios para mi app.»

## 1. Rendimiento: medido con la guía real de Cardmarket
Medido con la guía real del 27/10, en Chromium con emulación de iPhone 13 y la CPU frenada ×4 para parecerse a un móvil:

| | Antes (V140) | Ahora (V141) |
|---|---|---|
| Pintar Compra YA | 2.511 ms | 466 ms (**5,4 veces más rápido**) |
| Elementos en Compra YA | 22.472 | 4.738 |
| HTML generado en cada pintado | ~1,3 MB | ~0,3 MB |
| Elementos de toda la app | 32.191 | 14.457 |

**Causas:**
- **Listas cerradas construidas en cada pintado.** «Ver más» (58 cartas) y «Por confirmar» (40 cartas) se construían
  enteras aunque estuvieran cerradas: unos 18.000 elementos cada 8 s. Ahora se rellenan solo al abrirlas, y siguen
  abiertas al repintar.
- **Cartas calculadas cuatro veces por pintado.** La lista, el Top 5, el Punto de mira y los chollos las calculaban
  cada uno por su cuenta, unas 10.000 cartas cada vez. Ahora se calculan una vez por pintado.

## 2. Beneficios: CardTrader por colección
**Antes:** una consulta por carta. Al abrir se miraban 60 cartas, más las que aparecían en pantalla.

**Ahora:** la API de CardTrader devuelve, con una sola consulta por colección, los 25 anuncios más baratos de cada
carta en el idioma que se compara (`/marketplace/products?expansion_id=…&language=en|jp`):
- La app elige las 12 colecciones con más beneficio posible para ti: las cartas que se venden, valen ≥ 40 € y cuyo
  anuncio más barato aún podría dejar tu beneficio y tu margen.
- Empareja cada carta por su id de Cardmarket, sin adivinar por nombre.
- Pide el envío real solo a los vendedores que pueden dar beneficio.
- Va rotando: una colección no se repite en 6 h, y cada hora con la app abierta barre otras 12. En pocas horas compara
  la mayoría de las cartas que pueden dar dinero, no solo 60.
- La línea del 🤖 Piloto automático dice cuántas cartas ha comparado, en cuántas colecciones y cuántas compras dejan
  tu beneficio.

## 3. Más protección en CardTrader
Ya no cuentan, ni en Compra YA ni en Graduadas:
- los anuncios cuya descripción dice «proxy», «réplica», «custom», «no original»…: el mismo detector anti-proxy de
  Cardmarket;
- los vendedores de vacaciones (`on_vacation`), que no enviarían a tiempo.

## Pruebas
tests/v141-rendimiento-barrido-e2e.cjs (10 comprobaciones):
- «Ver más» cerrado no construye cartas, se rellena al abrir, sigue abierto al repintar y se vacía al cerrar;
- pintado rápido;
- barrido de una colección: Alakazam a 150 € + 5 € de envío real → +77,50 €, sin el anuncio «PROXY» de 90 € ni el de
  vacaciones de 95 €;
- una sola consulta por colección;
- texto del piloto automático.

También la batería completa y la verificación de precios con la guía real.

## Fuente
- API de CardTrader, `marketplace/products` por `expansion_id` (25 más baratos por carta), límite de 10 consultas por
  segundo: https://www.cardtrader.com/docs/api/full/reference
