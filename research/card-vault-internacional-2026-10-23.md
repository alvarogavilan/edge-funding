# Card Vault V106 · revisión del 23 de octubre de 2026

Base: main 77bd1f5, V104. El HTML obtenido de GitHub Pages coincidía byte a byte con index.html de ese commit. No se reinicia la aplicación, no se cambian claves de almacenamiento ni los registros de colección, compras o ventas.

Durante la revisión Claude publicó V105 (8519cf9). Los cambios se integraron sobre ese commit, conservando su radar, universo de 5.213 referencias, consulta BCE y registro de compras. V106 endurece la calificación de Compra YA; las señales agregadas del radar siguen siendo investigación, no ofertas ni beneficios verificados. Tras la integración pasan 31 pruebas del motor y el render de las fichas. La interfaz V105 se abrió en navegador y se confirmó que todavía mostraba beneficios con referencias incompletas.

## Resultado comercial

Cero compras y cero restauraciones suficientemente verificadas con coste puesto en Sevilla y beneficio neto conservador de 40 € o más. Esta sesión no ha rastreado miles de referencias ni acredita cobertura exhaustiva de ningún país. No se ha contratado un servicio ni activado vigilancia continua.

- Bella, The First Chapter 214/204: TCGGraph indica mínimos anunciados diferentes por idioma (francés 70 €, inglés 180 €, actualización 22/10). Son referencias secundarias, sin vendedor ni portes contrastados. Sus cifras por día son medias de transacciones, no operaciones individuales. Fuente: https://tcggraph.com/cards/lor_1_214
- CardTrader: ficha de versiones de Bella localizada. El resultado indexado no demuestra precio o stock actual del ejemplar ni entrega a España: https://www.cardtrader.com/es/cards/258456-belle-strange-but-special-enchanted-the-first-chapter/versions
- TCGplayer: la ficha Blastoise Base Set requiere JavaScript en la respuesta de lectura; no se obtuvieron Latest Sales ni stock: https://www.tcgplayer.com/product/42360/pokemon-base-set-blastoise
- Mandarake, Japón: política internacional consultada; portes dependen de peso, tamaño y destino, importación aparte. Sin ejemplar deteriorado concreto y foto real verificable con coste completo: https://earth.mandarake.co.jp/help/es/faq/faq.html
- Chaos Cards, Reino Unido: condiciones internacionales y liquidación consultadas, sin presupuesto de una carta a Sevilla: https://www.chaoscards.co.uk/worldwide-shipping y https://www.chaoscards.co.uk/shop/single-cards-clearance
- Cherry Collectables, Australia: política anuncia envío mundial de singles a partir de 75 $, sujeto a verificar moneda, elegibilidad y checkout. No se presupone exención de importación: https://www.cherrycollectables.com.au/pages/shipping-options
- Canadá: Arthur encantada aparece en un resultado con etiquetas contradictorias de agotado y añadir al carrito. No es stock confirmado ni venta cerrada: https://beansgems.com/products/lorcana-arthur-wizards-apprentice-enchanted-nm

No se han utilizado operaciones de eBay. No se incorporan a precios de salida las medias de fuentes que mezclan plataformas. Ninguna de las páginas anteriores es presentada como una oferta individual ejecutable.

## Cambios funcionales

- IVA adicional, aranceles, gestión, cambio/pago, portes de entrada/salida, comisión e impuestos de venta por operación. Campo vacío significa desconocido, nunca cero. Los importes adicionales se introducen en EUR; el IVA ya incluido no se vuelve a sumar.
- País de expedición, entrega a Sevilla, fuente del presupuesto y confirmación explícita de costes. No se aplica automáticamente la antigua exención de arancel de 150 €. Referencia normativa consultada: https://www.consilium.europa.eu/en/press/press-releases/2025/12/12/customs-council-agrees-to-levy-customs-duty-on-small-parcels-as-of-1-july-2026/ . La cuantía aplicable se documenta por operación; no se codifica una regla fiscal universal.
- Ventas comparables: fuente, fecha, verificación, ID individual, colección, número, variante, idioma, estado y graduación. Duplicados no aumentan la muestra. Ventana de referencia de 90 días; una venta antigua permanece en el histórico pero no sustenta la recomendación actual.
- Restauradas: se conserva el histórico de referencias, pero no se generan beneficios aplicando porcentajes a cartas sin intervenir. Exige estado de salida e intervención comparable y foto del ejemplar. No descuenta horas ni materiales.
- Tipo separado de estimación. Las referencias declaradas sin verificación suficiente permanecen visibles y excluidas del cálculo.
- Ranking con hasta tres oportunidades calificadas y ampliación; resto en observación. Comparación de ofertas equivalentes por coste total, sin inferir comprador o salida inmediata.
- Duplicados de colección filtrados también en restauración.

## Validación y límites

Pruebas del motor, integración de render y pruebas de imágenes locales ejecutadas. La prueba Playwright se actualizó al nuevo flujo, pero no pudo ejecutarse: falta Chromium y el servidor de descarga devuelve un archivo que no es ZIP. No se afirma validación visual en Safari ni funcionamiento actual de todas las fotos externas.

Las confirmaciones manuales siguen siendo declaraciones del usuario, no auditorías automáticas de la plataforma. No se ha implementado un escáner mundial autónomo ni adquirido ninguna carta. El almacenamiento existente sigue local al navegador; desde el contenedor no se puede inspeccionar la colección privada del iPhone.
