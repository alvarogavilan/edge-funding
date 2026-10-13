# Phygitals: ¿la posición elegida cambia la carta? — protocolo, 14/10/2026

## Evidencia documental
- https://docs.phygitals.com/logistics-and-legal/user-agreements/terms-of-service — mystery packs: resultado aleatorio; no se puede preseleccionar carta; puede existir auto-reveal.
- https://www.phygitals.com/how-it-works — resultados determinados por VRF público y comprobables on-chain, según la plataforma.
- https://docs.phygitals.com/about-phygitals/welcome-to-phygitals-the-future-of-collecting/packs/pack-party — se reparten cartas al azar cuando se completa la fiesta.
- https://play.google.com/store/apps/details?id=com.phygitals.mobile — describe opciones de riesgo en packs compatibles; no demuestra posición afortunada.

## Hipótesis contrapuestas
H0: escoger una figura/posición solo anima o revela el resultado de una asignación independiente de la posición, o todas las posiciones son estadísticamente intercambiables.
H1: después de controlar pack, probabilidades, tipo de pantalla y período, alguna posición altera consistentemente la distribución de cartas o su valor cobrado.

## Evidencia mínima para evaluar H1
Por **cada apertura**, guardar: transaction_id, pack_id, versión de probabilidades, hora UTC del resultado/VRF (no hora del vídeo), pantalla concreta, número de opciones, posición escogida (1..N), resultado final, rareza definida por ese pack, valor del sell-back realmente ofrecido, coste real y credencial de verificación pública. Registrar también todas las pérdidas y las aperturas con revelado automático. El contenido de cada opción no seleccionada **no puede conocerse** a partir de un vídeo donde solo se revela una.

Prueba: comparar posiciones **dentro del mismo tipo de pack y del mismo tamaño de cuadrícula**, no juntar pantallas de tamaños distintos. Selección de posiciones aleatoria *antes* de observar cualquier animación, evitando preferencias humanas. Usar una primera muestra para generar hipótesis y otra posterior independiente para contrastarlas, con ajuste por pruebas múltiples. Si no se puede controlar el algoritmo, el comportamiento de los usuarios y el histórico completo, no atribuir causalidad.

No comprar packs para «probar suerte» ni recomendar un número sin una señal replicada. Grabaciones y clips de grandes premios están sesgados si faltan los demás resultados.

## Conclusión actual
No hay pruebas de posición ganadora. La documentación oficial sostiene que la carta es aleatoria y no preseleccionable, lo cual contradice una ventaja simple por escoger posición. Puede probarse el flujo en una **demo gratuita** si existe, y examinar la verificación de una apertura propia sin pagos, pero una demo no valida el flujo de pago.
