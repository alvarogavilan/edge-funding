# Card Vault V110 · cierre de V109: costes históricos, guardado y copias

Base: `main` en `bce2e55` (V109). Integrados sin sobrescribir los commits concurrentes del propietario `fd310a6` (anuncios concretos) y `8c27db2` (V111, presupuesto 20–200 €); la versión publicada pasa a llamarse V111. Pruebas con datos ficticios en navegadores aislados (Chromium con emulación de iPhone; **no es Safari real**). Las fuentes externas se simulan en pruebas; no son datos de mercado.

## 1. Fallos y causas

| # | Gravedad | Fallo (reproducido antes de corregir) | Causa | Corrección | Archivos |
|---|---|---|---|---|---|
| 1 | P0 | Compra antigua (50 + 5 + 2, Japón, sin datos fiscales) migrada como «pagado» 57 € con IVA, aranceles y gestión «no aplica» | Rama de legado de `migrateCard` asignaba `no-aplica` por defecto | IVA, aranceles y gestión quedan **desconocidos**; subtotal conocido 57 €; total pendiente; resultado no confirmado. Precio, envío y comisiones originales intactos | cv-money.js |
| 2 | P0 | Lotes ya persistidos por V109 con ventas conservaban el «no-aplica» inferido y sus resultados como confirmados | La migración V109 se guardaba al vender | `repairState` versionado (`v110-fiscal-inferido`), idempotente: marca el lote «revisar», conserva reparto, unidades vendidas, importes y el estado anterior; las ventas afectadas guardan su cálculo como antecedente y dejan de contar como beneficio confirmado | cv-money.js, cv-cost-review.js |
| 3 | Alta | Coste aterrizado antiguo tratado como «IVA/aranceles incluidos» | Inferencia sin evidencia | Envío y comisiones «incluidos en el coste aterrizado» (sí lo estaban); IVA, aranceles y gestión desconocidos | cv-money.js |
| 4 | Alta | Ventas anteriores a V109 mostraban un resultado como confirmado aunque el coste no tenía desglose | Archivo calculaba neto − precio | Se muestran como «Resultado NO confirmado · antecedente …» hasta revisar el coste; columna CSV «Beneficio antecedente» | archive.js, sale-history.js |
| 5 | Alta | No había forma de completar gastos pendientes | — | «Revisar coste» en Mi colección y «Revisar coste de adquisición» en historial y archivo: importes por concepto, estado (pagado/estimado/desconocido/incluido/no aplicable), dónde está incluido, fecha, referencia, origen real del envío, vista previa y guardado confirmado. Reparte el nuevo total entre las unidades originales y actualiza las ventas afectadas con historial | cv-cost-review.js, collection-simple.js, archive.js, sale-history.js |
| 6 | Alta | Rutas críticas ignoraban `save()` | Contrato V109 solo aplicado al flujo principal | Guardado protegido común `CVGuard` con copia previa y restauración en: alta desde catálogo, guardar y eliminar carta (la foto se borra **después** de guardar), limpiar pruebas, alta de varias, guardar valoración, escritorio de ventas (venta, precio, pausa, capital), archivo (comisión, volver a vigilar), sellado (guardar/borrar), compras de purchase-actions, libro (formulario/borrar) y restaurar instantánea | app.js, sales-desk.js, archive.js, sealed.js, purchase-actions.js, ledger.js, recovery-safety-net.js, cv-cost-review.js |
| 7 | Alta | Dos pestañas: si la escritura de la revisión fallaba tras escribir los datos, la otra pestaña no lo detectaba | Datos y revisión en dos claves | Revisión dentro del mismo valor que los datos (una sola escritura, atómica para localStorage); detección por evento `storage` del mismo valor | app.js |
| 8 | Alta | Importación: fallos de fotos u oportunidades silenciados y anunciados como recuperación completa | `catch{}` vacío | Validación previa de todos los bloques; «RECUPERACIÓN PARCIAL» con lo que falló; registro `lastImport`; repetir completa lo pendiente sin duplicar; una foto de anuncio que falla ya no se queda en memoria como guardada | app.js, cv-money.js, vault-v104.js |
| 9 | Media | Editar una carta con graduación vacía la convertía en RAW | El desplegable no tenía «sin confirmar» | Opción «Graduación sin confirmar»; alta en lote sin graduación inventada | index.html, app.js |
| 10 | Media | Comparables: graduación vacía se trataba como RAW | `GRADE("")→"RAW"` | Vacío = sin confirmar y no comparable; valoración de cartas sin graduación confirmada queda provisional | vault-v104.js, prime-valuation.js |

## 2. Inventario del contrato de guardado

- **Operaciones críticas activas (corregidas)**: las de la fila 6, más «He comprado», ventas, envío, cobro e importación (V109).
- **Configuración / datos de usuario no financieros** (guardado normal con aviso fijo si falla): seguimiento, evidencias de mercado manuales, comparación, políticas de sellado, propósito de cartas.
- **Migraciones automáticas y cachés regenerables** (unas 100 llamadas): marcas de migración, escaneos de mercado, historial de señales, errores de ejecución. Si fallan, el aviso fijo lo indica; los cambios quedan en memoria y se guardan en el siguiente guardado correcto.
- **Código inaccesible / legado**: `cv-final.js` (tablero antiguo oculto en Compra YA) y `buy-to-restore.js` (no cargado).

## 3. Matriz de aceptación V110

Ver resultados de ejecución en la respuesta de entrega y en `tests/cv-aceptacion-e2e.cjs` (filas A–V de V109 + C2, E2, I2, K2, L2 de V110), `tests/cv-migracion-v110.test.cjs`, `tests/cv-money.test.cjs`, `tests/vault-v104-engine.test.cjs`.

| Fila del encargo | Prueba | Estado |
|---|---|---|
| A 79/95/16 | cv-aceptacion A, cv-money | Ejecutada y superada |
| B PSA 10 completo | cv-aceptacion G; L2 (BGS 8,5) | Ejecutada y superada |
| C Japón sin fiscales | cv-migracion C; cv-aceptacion C2 | Ejecutada y superada |
| D Impuestos incluidos | cv-migracion D; cv-money D | Ejecutada y superada |
| E Lote V109 «no-aplica» | cv-migracion E/G; cv-aceptacion E2 | Ejecutada y superada |
| F Ventas parciales del lote | cv-aceptacion E2 (unidades y reparto conservados; antecedente) | Ejecutada y superada |
| G Migración repetida | cv-migracion E/G; cv-aceptacion E2 | Ejecutada y superada |
| H Completar costes en la interfaz | cv-aceptacion E2 (revisión → 110 € pagado, venta +15 confirmada, restante 55, trazado, tras recarga) | Ejecutada y superada |
| I Guardado fallido en operaciones críticas | cv-aceptacion I, J, I2 | Ejecutada y superada (I2 cubre capital y borrar carta; resto de rutas: inspeccionadas tras aplicar el mismo `CVGuard`) |
| J Dos pestañas y fallo de revisión | cv-aceptacion U (revisión en el mismo valor: el caso «datos sí, revisión no» ya no existe) | Ejecutada y superada |
| K Importación con fallo de fotos | cv-aceptacion K2 | Ejecutada y superada |
| L Equivalencia completa | cv-aceptacion L, L2 | Ejecutada y superada |
| M Venta parcial 2×50+10 | cv-aceptacion E, cv-money E | Ejecutada y superada |
| N Reparto no divisible | cv-aceptacion F, cv-money F | Ejecutada y superada |
| O Anuncios/agregados/incompatibles | vault-v104-engine | Ejecutada y superada |
| P Restaurada sin comparables | vault-v104-engine; vault-v107-regresion | Ejecutada y superada |
| Q Red y fotos | cv-aceptacion Q; vault-v107-regresion | Ejecutada y superada (simulado) |
| R Versión publicada | comparación de hashes del commit | Ver entrega; GitHub Pages no es accesible desde el contenedor |

## 3b. Ejecución final (tras integrar fd310a6 y 8c27db2)

| Prueba | Resultado |
|---|---|
| tests/cv-money.test.cjs | 16 superadas |
| tests/cv-migracion-v110.test.cjs | 5 superadas |
| tests/vault-v104-engine.test.cjs | 39 + feed real + límite 200/200,01 superadas |
| tests/card-images.test.cjs | OK |
| tests/cv-aceptacion-e2e.cjs | Filas fallidas: 0 |
| tests/vault-v104-e2e.cjs | 47 comprobaciones superadas |
| tests/vault-v107-regresion-e2e.cjs | 60 comprobaciones superadas |
| available-offers, phygitals-detector, phygitals-lab, prime-market, ton-arb-scanner | superadas |
| online-arbitrage.test.cjs, card-vault-compra-ya-smoke.cjs | **Fallan igual en `main` antes de V110** (`evaluate is not a function`; `setInterval is not defined` en el entorno de prueba). Módulos no tocados; no se han desactivado |

Ajustes de pruebas por cambios de `fd310a6` (no por V110): los objetivos sin anuncio ahora van plegados, así que las pruebas abren el bloque antes de pulsar o medir fotos; el carril de restauración tiene 12 objetivos + los anuncios concretos registrados; el envío conocido se rotula «tarifa publicada»; las fotos de los nuevos anuncios (Shopify, Whatnot) se sirven con la imagen de muestra en la prueba.

## 4. Pendientes reales

- Safari real en iPhone no probado (no hay WebKit en el entorno).
- APIs reales (TCGdex, Lorcast, BCE) y fotos externas en producción no probadas desde aquí.
- Algunas lecturas antiguas de valoración siguen tratando una graduación vacía como RAW al **clasificar** (no al calcular costes ni comparables).
- `cv-final.js` (tablero oculto) no se ha modificado.
- Dos pruebas antiguas (online-arbitrage, compra-ya-smoke) ya fallaban en `main`; no se han reparado en esta entrega.
- Mercado: 0 ofertas verificadas (ver `research/card-vault-v110-investigacion-2026-10-24.md`).
