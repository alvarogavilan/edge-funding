# Card Vault · copias y recuperación (V109)

## Dos tipos de exportación

| Botón | Dónde | Qué incluye | Para qué |
|---|---|---|---|
| **Copia de seguridad** (completa) | Pestaña Datos | Colección, compras con su lote de costes, ventas, archivo, libro de caja (cobros), divisas, notas, fotos de cartas, oportunidades, comprobaciones de anuncios, referencias de venta y fotos de anuncios | Cambiar de iPhone, recuperar tras borrar Safari, guardar en Archivos/iCloud |
| **Exportar parcial** | Ventas reales → Exportación parcial | Solo oportunidades, comprobaciones y referencias de venta | Compartir o mover solo la investigación |

La copia completa NO incluye la caché del radar ni el catálogo de cartas: se regeneran solos.

## Restaurar una copia completa

1. Datos → «Restaurar copia» → elige el archivo `card-vault-completo-AAAA-MM-DD.json`.
2. La app comprueba el archivo antes de tocar nada (formato, tipos, claves peligrosas, tamaño ≤ 80 MB). Si no es válido: «No se ha cambiado nada».
3. Muestra un resumen (cartas, ventas y movimientos nuevos; diferencias) y pide confirmación.
4. Fusiona sin borrar: añade lo que falta; si un registro existe con otro contenido, **se conserva el de este iPhone** y se informa. Una venta con el mismo canal y número de pedido no se duplica aunque tenga otro identificador.
5. Solo anuncia «Copia importada y guardada» si el guardado se confirma. Si falla, se deshace y tus datos quedan como estaban.
6. Importar dos veces el mismo archivo no duplica nada.

Copias antiguas (V3 y anteriores, y exportaciones parciales V104–V108) siguen siendo aceptadas.

Si falla algún paso posterior (fotos de cartas, fotos de anuncios, oportunidades), el aviso dice «RECUPERACIÓN PARCIAL» y enumera lo que falta. Repite la importación con el mismo archivo cuando el problema se resuelva: solo añadirá lo pendiente.

## Si Safari no puede guardar

- Aparece un aviso fijo arriba. Mientras esté visible, **las operaciones nuevas no se registran** (He comprado, ventas, envíos, cobros, importación) y lo dicen expresamente.
- Causas habituales: navegación privada, almacenamiento lleno, datos de sitios bloqueados.
- Qué hacer: exporta una copia completa, libera espacio o sal de la navegación privada, recarga y repite la operación (no se duplicará).

## Dos pestañas o ventanas a la vez

Si abres Card Vault en dos pestañas, la que tenga datos más antiguos deja de guardar y muestra «Otra pestaña o ventana ha cambiado tus datos». Recárgala y repite la operación: así ninguna sobrescribe lo que hizo la otra.

## Lotes y costes

Cada compra registrada con «He comprado» guarda un lote: precio, envío, IVA de importación, aranceles, gestión y cambio/pago, cada uno como pagado, estimado, desconocido, no aplica o incluido. El coste se reparte una vez entre las unidades (al céntimo) y cada venta consume su parte: el coste de lo que queda no cambia. Si falta algún gasto, el resultado de la venta queda «no confirmado».

## Revisar costes pendientes (V110)

Las compras antiguas no registraban IVA de importación, aranceles ni gestión. Desde V110 esos conceptos aparecen como **desconocidos** (no como 0 €): verás «pendiente de confirmar (subtotal conocido …)» y los resultados de venta como «no confirmado» o «antecedente».

Para completarlos:
1. Mi colección → botón **Revisar coste** en la carta (o, en una venta, **Revisar coste de adquisición** en el historial o el archivo).
2. Verás los datos originales, el subtotal conocido y los conceptos pendientes.
3. Para cada concepto elige: pagado (con importe), estimado, desconocido, incluido en otro importe (indica dónde) o no aplicable.
4. Añade fecha y referencia del justificante y el país real desde el que se envió.
5. Revisa la vista previa (total y estado) y guarda. Solo se anuncia como guardado si el guardado se confirma.

Si la carta ya tiene unidades vendidas, el nuevo total se reparte entre las unidades originales al céntimo y las ventas afectadas actualizan su coste, conservando el cálculo anterior como antecedente. Nada se borra: cada revisión queda en el historial del lote.

Si V109 llegó a marcar «no aplica» sin datos en una compra con ventas, verás el lote como «revisar»: es la corrección V110.
