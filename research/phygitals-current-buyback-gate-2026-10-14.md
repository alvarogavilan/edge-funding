# Phygitals — filtro económico verificable, 14 octubre 2026

Fuente: https://rip-index.com/sites/phygitals (publicado 2026-10-13 22:59 UTC).

El corte publica retornos de recompra negativos para todos los packs económicos: Dollar $1 −6.0%; Pokémon Rookie $25 −11%; Pokémon Elite $50 −13.6%; Riftbound Rookie $10 −9.6%; Riftbound Starter $25 −6.8%; Riftbound Elite $50 −7%; One Piece Starter $25 −11.3%; One Piece Elite $50 −14.2%. Son resultados estimados del feed del proveedor, no operaciones verificadas por nosotros.

Documentación oficial: https://www.phygitals.com/docs/public-api

GET /api/vm/available es público y declara en su esquema los campos mint_price, ev, buyback_percent, ev_updated_at e in_stock. No hemos obtenido respuesta en vivo del endpoint en esta ejecución.

GET /api/vm/offers/{mint_address_or_slug} exige clave de cuenta y determina la oferta por carta. No publicar claves en GitHub Pages.

POST /api/vm/buy/crypto: según documentación, el servidor verifica el pago y después ejecuta el sorteo; la respuesta incluye la carta y buyback_price. Esto no acredita una posición visual ganadora.

Matemáticamente el retorno teórico con buyback del 85% exige un EV nominal de más del 117.65% del precio antes de gastos. Con recompra al 100%, requiere más del 100%. El beneficio ejecutable exige confirmar oferta real y restricciones.

Veredicto: NO COMPRAR; ninguna oportunidad con beneficio neto verificado hoy.