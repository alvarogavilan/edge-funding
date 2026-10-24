# Card Vault V110 · registro de investigación comercial · 24/10/2026

Destino: Sevilla (41020). Presupuesto 20–100 €. Objetivo ≥ 40 € de margen conservador. Sin eBay ni agregadores de eBay.

## Acceso real a fuentes desde el contenedor de trabajo

| Fuente | Método | Resultado |
|---|---|---|
| cardmarket.com, tcgplayer.com, cardtrader.com, api.tcgdex.net, api.lorcast.com, pokemillon.com, chaoscards.co.uk, trollandtoad.com, GitHub Pages | Lectura directa (curl / WebFetch) | **Bloqueado** por la política de red del entorno (rechazo de túnel / DNS). No se reintentó más allá de una comprobación. |
| Buscador web | WebSearch (modo extendido) | Accesible. Devuelve resúmenes de páginas con fecha de captura desconocida: **no** sirven como stock, precio actual ni foto del ejemplar. |

## Consultas realizadas y descartes

| # | Consulta | Hallazgos | Clasificación | Motivo de descarte |
|---|---|---|---|---|
| 1 | CardTrader · Bella 214/204 (versiones) | Lectura directa bloqueada | — | Sin acceso |
| 2 | Cardmarket Base Set holo «Poor» (Charizard/Blastoise/Venusaur) | Ficha Cardmarket Charizard BS4 con ofertas «Poor» a 100 € y 130 € en una captura de ~1.900 días | Anuncio activo (captura antigua) | Captura caducada; sin vendedor, país, foto ni stock actuales; precio fuera del rango tras costes. TCGplayer «Damaged» 207,30 $ es dato agregado, no venta |
| 3 | Tiendas españolas con holo vintage dañado | pokemillon.com (graduadas, vintage hasta 5.999,90 €), vendeloamazing.com (Base Set con nota AP), cardzone.es (lotes japoneses 50–200 €, algunos agotados), metamorphcenter.com (sellado) | Catálogos de tienda | Ninguna ficha concreta de carta dañada con precio, estado, foto y stock verificables; los lotes no identifican cartas |
| 4 | Lorcana Enchanted Played/Damaged en UE | Cardmarket (precios «desde» del set), tiendas de EE. UU. en USD, lorcanacardlist (agregados TCGplayer) | Agregado / catálogo | Sin oferta individual con estado; «desde» del set no es la carta encantada |
| 5 | Chaos Cards (Reino Unido) y vintage jugado | Chaos Cards: stock moderno (p. ej. Mew ex 152/128 a 89,99 £); Evo Cards: Charizard Base Shadowless HP 1.376 $, Venusaur 1.ª ed. HP 1.101 $ | Anuncios activos (captura) | Fuera de presupuesto; importación UK con IVA/arancel sin presupuesto; sin comparables de venta |
| 6 | Mandarake (Japón) dañadas | Política de envío (EMS, paquete internacional, DHL; fin del Small Packet 25/12/2025); sin ficha de carta dañada concreta | Condiciones de tienda | Sin ejemplar concreto ni coste de envío a España para una carta |

## Anuncios concretos aportados por el commit concurrente fd310a6 (24/10/2026 09:52 UTC)

Integrados sin cambios en `market-offers-verified.js`. **Consultados por otra sesión; no reverificados desde este contenedor** (sin acceso a esas webs).

| Carta | Tienda / país | Precio | Coste conocido | Ventas comparables | Estado en la app |
|---|---|---|---|---|---|
| The Black Cauldron · Whispers in the Well 225 (Enchanted, Lorcana) | Kai of Cards B.V. · Países Bajos | 90 € | 90 + 19,99 € de tarifa publicada a España = 109,99 € (pendiente de confirmar en pedido); idioma y estado no especificados | Ninguna | En observación; supera presupuesto con envío |
| Rapunzel - Gifted with Healing · The First Chapter 18 (japonés, NM, foil) | Mandragora TCG · país sin confirmar | 49,85 € | Envío e impuestos desconocidos | Ninguna | En observación |
| Charizard · XY Evolutions 11/108 (reverse holo, dañada, fotos reales) | Whatnot · thecardfather_ · Estados Unidos | 35 USD (≈ 31,26 € según la plataforma) | Envío, IVA, arancel y gestión desconocidos | Ninguna | Restaurar · en investigación |

Ninguno supera el filtro: falta coste completo puesto en Sevilla y no hay ventas cerradas comparables verificadas.

## Recuento

- Referencias del catálogo de la app: 5.213 (identidad, sin precios).
- Consultas de mercado realizadas en esta sesión: 6 (1 directa bloqueada + 5 búsquedas).
- Anuncios individuales con stock observado: **3** (los de fd310a6, de otra sesión; no reverificados aquí). Comprobados por esta sesión: **0**.
- Ventas cerradas individuales verificadas: **0**.
- Ofertas con coste completo puesto en Sevilla: **0**.
- Oportunidades que superan el filtro económico: **0**.

## Qué permitiría avanzar

1. Desde el iPhone: pestaña «En investigación» → consultar una familia (consulta TCGdex/Lorcast desde Safari) → abrir en Cardmarket las candidatas → «Comprobar ahora» con vendedor, foto y costes → «Añadir venta real» con ventas comparables.
2. Para que una próxima sesión de trabajo pueda consultar fuentes: permitir esos dominios en la configuración de red del entorno de Claude Code (no es infraestructura de pago).
