# Card Vault V109 · corrección de bloqueantes y matriz de aceptación

Base: `main` en `b9c1235` (V108), sin cambios ajenos. Las pruebas de este informe usan **solo datos ficticios** («Carta Prueba …») en navegadores aislados; no se ha tocado ninguna colección real.

## 1. Reproducción previa (sobre V108, antes de corregir)

`ONLY=A,G,I node tests/cv-aceptacion-e2e.cjs` sobre `b9c1235`:

- **P0-A**: cartera 57 €; archivo `{"basis":50,"net":95,"result":45}`; historial «resultado vs coste aterrizado +45,00 €»; CSV con coste 50 y beneficio 45.
- **P0-B**: «He comprado» con `listing.grade="PSA 10"` registró `{"grading":"RAW","grade":"NM"}`; tras venta, archivo e importación seguía RAW/NM.
- **P0-C**: con `localStorage` fallando, la carta quedó en memoria (`n` +1) y marcada comprada; una venta con almacenamiento bloqueado dejó historial, libro y archivado modificados (`h 2→3, l 2→3, archivado`).

## 2. Causas (mapa de productores y consumidores)

| Dato | Productores | Consumidores | Problema |
|---|---|---|---|
| `purchase`, `purchaseShipping`, `purchaseFees` | app.js (alta manual), purchase-actions.js, cv-final.js, vault-v104.js (He comprado) | prime-valuation.basisUnit, master-sets.cost, prime-exit-pricing, prime-grading, collection-simple | He comprado guardaba IVA/aranceles/gestión solo en `purchaseCosts`, que nadie leía → 50+5+2 = 57 |
| `landedCostUnit` | purchase-actions.js | archive.records, sale-history, prime-valuation | He comprado no lo rellenaba → el archivo usaba solo `purchase` (50) → 95−50 = 45 |
| `quantity` + gastos del lote | app.js, collection-sales.sell | prime-valuation.basisUnit | Al vender parte, `quantity` bajaba y los gastos del lote se repartían entre menos unidades: el coste unitario restante subía |
| `grading`, `grade`, `condition` | vault-v104 (He comprado), collection-sales/archive/sales-desk (instantáneas) | colección, archivo, CSV, identidad | He comprado ponía la graduación en `grading` = «RAW» por defecto y el estado físico en `grade`; las instantáneas convertían vacío en «RAW» |
| `save()` | app.js | todos los módulos | Capturaba el error pero no devolvía resultado: nadie podía saber que no se había guardado |
| Compra en el libro (`investmentLedger`) | ledger.js, purchase-actions.js | caja (`investmentLedgerStats`) | He comprado no creaba movimiento: la caja no veía la compra |
| Copia completa | app.js #export/#import | — | No incluía oportunidades ni comprobaciones; la importación sustituía todo el estado, escribía fotos antes de validar y no comprobaba el guardado |

## 3. Correcciones

- **`cv-money.js` (nuevo, cálculo único)**: céntimos enteros; entrada española validada (NaN, Infinity y texto rechazados); lote `costLot` con precio, envío, IVA de importación, aranceles, gestión y cambio/pago, cada uno con estado pagado/estimado/desconocido/no-aplica/incluido; reparto exacto al céntimo entre unidades; venta parcial que consume su parte sin recalcular el resto; resultado confirmado solo con coste pagado, estimación separada y ninguno con coste desconocido o en conflicto; migración idempotente de los formatos antiguos (no inventa gastos que falten; un envío antiguo no registrado queda «desconocido»); conflictos detectados (coste aterrizado distinto del desglose, precio o cantidad editados tras la compra).
- **`CVGrade`**: empresa (PSA, BGS, CGC…) y nota separadas del estado físico; vacío = «sin confirmar», nunca RAW; «NM» no es una nota.
- **Consumidores** conectados al cálculo único: prime-valuation.basisUnit, master-sets, prime-grading; archive.records, sale-history y CSV usan el coste y resultado guardados en la venta (`basisCents`, `basisStatus`), con columnas «Estado del coste» y «Beneficio estimado».
- **`save()`** devuelve `true` solo si escribió; si no, `false`, aviso fijo y motivo. Protección de dos pestañas por número de revisión: la pestaña desactualizada no guarda.
- **He comprado**: lote canónico, `landedCostUnit` coherente, graduación correcta, movimiento de compra en el libro (los gastos estimados no salen de caja), clave idempotente, y alta atómica (si el guardado falla, se deshace y lo dice).
- **Ventas, envío y cobro**: validación estricta; operación completa o nada (copia previa y restauración si el guardado falla); el coste de la venta se calcula y se fija en el momento de vender.
- **Copia completa v4**: incluye oportunidades, comprobaciones y fotos de anuncios. Importación: validar → preparar sin tocar → confirmar → guardar (confirmado) → fotos. Fusión por id; ventas duplicadas detectadas también por canal + número de pedido; diferencias conservan lo local y se informan; claves peligrosas rechazadas.
- **Seguridad**: escape de texto en historial y archivo (nombre, detalle, procedencia, notas, imagen).

## 4. Matriz de aceptación (resultado de ejecución real en este contenedor)

Leyenda: **EJ-OK** ejecutado y aprobado · **EJ-FALLO** ejecutado y fallido · **INSP** inspeccionado · **NO-EJ** no ejecutado (motivo).
Navegador: Chromium 1243 (Playwright 1.63) con emulación de iPhone. **No es Safari real.**

| Fila | Caso | Estado | Evidencia |
|---|---|---|---|
| A | Coste 79, neto 95, beneficio 16 | EJ-OK | cv-aceptacion A: cartera 79; «Coste 79,00 €» visible; archivo 79/95/16; historial visible neto 95 y +16; CSV 79 y 16 |
| B | Coste desconocido → no confirmado | EJ-OK | cv-aceptacion B; cv-money B |
| C | Estimado ≠ pagado | EJ-OK | cv-aceptacion C (lote estimado, libro sin extras, resultado solo estimado 16) |
| D | IVA incluido / UE sin duplicar | EJ-OK | cv-aceptacion D (55 €); cv-money D |
| E | Venta parcial: coste restante | EJ-OK | cv-aceptacion E: 110/55, beneficio 15, 1 unidad, restante 55 |
| F | Redondeo exacto | EJ-OK | cv-aceptacion F (30,01 € en 3); cv-money F |
| G | PSA 10 de anuncio a archivo, recarga, exportación e importación | EJ-OK | cv-aceptacion G |
| H | RAW y estado físico separados | EJ-OK | cv-aceptacion H (RAW/EX; BGS 8,5; PSA sin nota; NM no es nota) |
| I | Guardado fallido sin falso éxito | EJ-OK | cv-aceptacion I (compra y venta) |
| J | Reintento sin duplicación | EJ-OK | cv-aceptacion J |
| K | Compra → venta → envío → cobro → caja | EJ-OK | cv-aceptacion K: libro 79; venta pendiente no entra en caja; tras cobro +95; tras recargar COBRADA y 16 |
| L | Exportar/importar equivalente | EJ-OK | cv-aceptacion L (dos importaciones, mismo contenido) |
| M | Copia inválida sin cambios | EJ-OK | cv-aceptacion M (corrupta, `__proto__`, sin cartas, tipos) |
| N | Migración repetida | EJ-OK | cv-aceptacion N; cv-money N |
| O | Comparables incompatibles excluidos | EJ-OK | vault-v104-engine (idioma, edición, estado, graduación, enlace, fecha futura, duplicados) |
| P | Restauración sin comparables → estimado | EJ-OK | vault-v104-engine (estimación no cambia veredicto); vault-v107-regresion (ficha de restauración) |
| Q | API caída / cancelada | EJ-OK | cv-aceptacion Q; vault-v107-regresion (503 y JSON malformado) |
| R | Imagen incorrecta no presentada como válida | EJ-OK | vault-v107-regresion (variante sin foto exacta; imagen rota con un reintento) |
| S | Móvil 320/375/390/430 sin desbordamiento, botones ≥ 44 px | EJ-OK | cv-aceptacion S (emulación Chromium) |
| T | Producción = commit | ver §6 | GitHub Pages no es accesible desde el contenedor |
| U | Dos pestañas | EJ-OK | cv-aceptacion U |
| V | Recarga durante el registro | EJ-OK | cv-aceptacion V |

## 5. Inspeccionado sin cambio (riesgo residual documentado)

- Muchas lecturas antiguas usan `grading||"RAW"` para clasificar en valoración y filtros: una carta con graduación vacía se trata como RAW **solo al leer**; los productores ya no escriben «RAW» por defecto y las pantallas de historial y archivo muestran «graduación sin confirmar».
- `purchase-actions.js` y `cv-final.js` (tablero antiguo oculto) siguen llamando a `save()` sin comprobar el resultado.
- Compras antiguas sin envío registrado: coste «pendiente»; no hay todavía un campo en la ficha para completarlo.

## 6. Publicación

Ver el apartado final de la respuesta: commit, ejecución de GitHub Pages y comparación de contenido del commit. La URL pública no es accesible desde este contenedor (política de red), así que no se ha podido comprobar en vivo.

## 7. Investigación comercial

Sin cambios respecto a `research/card-vault-v107-auditoria-2026-10-23.md`: el contenedor no puede abrir Cardmarket, TCGplayer, TCGdex, Lorcast ni la web pública. **0 anuncios verificados, 0 ventas cerradas verificadas, 0 oportunidades que superen filtros.** No se han hecho nuevas búsquedas.
