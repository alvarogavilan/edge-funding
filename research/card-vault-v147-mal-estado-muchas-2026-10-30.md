# Card Vault V147 · Mal estado barato: muchas más cartas (30/10/2026)

## Queja
«No consigo ver lo que quiero: tiene que haber muchísimas cartas que valen mucho y que en mal estado están a precios
muy bajos.»

## Causa
En V146 el panel solo enseñaba anuncios con el estado **ya comprobado**, y eso solo lo da CardTrader (o CardNexus). Sin
anuncios de CardTrader revisados, casi no salía nada.

En la guía oficial de Cardmarket sí hay muchas: con la guía real de hoy hay **150 cartas** que se venden cada semana,
valen ≥ 60 € y tienen un anuncio de ≤ 35 € a menos del 40 % de su valor. Por ejemplo:
- Dragonite ex (Dragon) desde 25 €, vale 250 €;
- Blaine's Moltres (Gym Heroes) desde 24,80 €, vale 241 €;
- Rayquaza-EX (Dragons Exalted) desde 28 €, vale 250 €;
- Pikachu δ (Legend Maker) desde 29,50 €, vale 258 €.

No salían porque ese anuncio no dice ni el idioma ni el estado.

## Ahora (V147)
El panel «🩹 Mal estado barato» tiene dos bloques:
1. **✅ Estado e idioma comprobados.** Como en V146: CardTrader (o CardNexus) dice el idioma y el estado de cada
   anuncio, y la venta es tal cual.
2. **🔎 Por comprobar en un toque.** Todas las cartas de la guía que:
   - se venden cada semana (tus «Ventas mínimas»);
   - valen ≥ 60 € y ≥ 2,5 veces el anuncio;
   - tienen un anuncio de ≤ 35 €;
   - no bajan del 10 % de su valor (por debajo, se descarta: proxy o falsa).

   No se inventa el estado. La app calcula **en qué estado tiene que estar como mínimo** para que, vendiéndola tal cual,
   ganes tu mínimo con tu margen. Lo dice así:

   > «Te compensa: sirve aunque esté DAÑADA» · «sirve si está muy jugada (HP) o mejor» · «… PL o mejor» · «… MP o
   > mejor» · «solo si está poco jugada (SP/LP) o mejor»

   Además dice cuánto ganarías si estuviera muy jugada (HP). El botón **«Ver solo inglesas ↗»** abre la ficha de
   Cardmarket con solo los anuncios en inglés, ordenados por precio, para ver el estado en las fotos en un toque.

**Primero salen las que sirven en peor estado.** Con la guía real de hoy, de las 150:
- 5 sirven aunque estén dañadas;
- 23 sirven muy jugadas;
- 26 sirven jugadas (PL);
- 60 en MP;
- 36 solo poco jugadas.

**CardTrader las comprueba solo.** Las 30 primeras se consultan carta a carta en CardTrader (idioma inglés y su
estado). Si hay una en mal estado que cumple, pasa a «✅ comprobadas» con su envío real. Si no, la carta lo dice.

**En el iPhone:** el botón va debajo del nombre, a lo ancho. El nombre ya no se aprieta (también en chollos y en el Top
5).

## Pruebas
tests/v146-mal-estado-barato-e2e.cjs, ampliado a 12 comprobaciones:
- Mewtwo por comprobar: «desde 24 € · vale 4,2 veces más · sirve si está en MP o mejor», con lo que dice CardTrader;
- el enlace solo a inglesas;
- sin repetir las comprobadas.

Captura del panel con la guía real revisada.
