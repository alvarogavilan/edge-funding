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

## Si Safari no puede guardar

- Aparece un aviso fijo arriba. Mientras esté visible, **las operaciones nuevas no se registran** (He comprado, ventas, envíos, cobros, importación) y lo dicen expresamente.
- Causas habituales: navegación privada, almacenamiento lleno, datos de sitios bloqueados.
- Qué hacer: exporta una copia completa, libera espacio o sal de la navegación privada, recarga y repite la operación (no se duplicará).

## Dos pestañas o ventanas a la vez

Si abres Card Vault en dos pestañas, la que tenga datos más antiguos deja de guardar y muestra «Otra pestaña o ventana ha cambiado tus datos». Recárgala y repite la operación: así ninguna sobrescribe lo que hizo la otra.

## Lotes y costes

Cada compra registrada con «He comprado» guarda un lote: precio, envío, IVA de importación, aranceles, gestión y cambio/pago, cada uno como pagado, estimado, desconocido, no aplica o incluido. El coste se reparte una vez entre las unidades (al céntimo) y cada venta consume su parte: el coste de lo que queda no cambia. Si falta algún gasto, el resultado de la venta queda «no confirmado».

Las compras antiguas sin envío registrado aparecen con coste «pendiente» (no se inventa el envío). Limitación conocida: todavía no hay un campo en la ficha de la carta para completar ese envío antiguo; mientras tanto, su resultado de venta queda «no confirmado».
