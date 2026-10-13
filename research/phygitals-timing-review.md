# Revisión de Phygitals Lab y de la hipótesis horaria

Investigación realizada entre el 13 y el 14 de octubre de 2026, hora de Madrid. No se hicieron compras ni aperturas pagadas. El laboratorio se sirve en `phygitals.html`, sin usar el estado, cartera, servidor ni almacenamiento de Card Vault.

## Resultado y límites

No se identificó evidencia verificable de una hora, minuto o segundo que permita predecir premios. Eso no demuestra que hayamos auditado la independencia o uniformidad de todas las aperturas. Tampoco disponemos del historial completo del usuario, sus pruebas de fairness ni la implementación exacta del algoritmo. La investigación no es una auditoría exhaustiva del servidor privado.

## Hallazgos

1. **El tiempo no está descrito como un predictor.** La documentación oficial describe como entradas semillas de servidor y cliente; el timestamp aparece como metadato del historial. No expone allí una fórmula ejecutable completa, nonce o código que hayamos podido reproducir. Incluye enlaces rotos a localhost para las pruebas. Verificar SHA-256 de una semilla revelada solo verifica ese compromiso: no basta para comprobar selección de cartas, pesos, calidad del generador o completitud de los registros.
   Fuente: https://docs.phygitals.com/platform-features/provable-fairness
2. **Compra, apertura y cambios de reglas.** Los términos dicen que las odds se determinan al comprar y que los cambios afectan compras futuras. La descripción de selección habla del momento de apertura. No se ha reproducido un caso para resolver todos los detalles entre estos momentos. No hay un calendario publicado de segundos premiados.
   Fuente: https://docs.phygitals.com/user-agreements/terms-of-service (apartado 5).
3. **El inventario puede recircular.** La documentación de Creator Packs dice que el buyback devuelve cartas a la rotación. No cabe inferir que una secuencia de resultados pequeños agote las cartas baratas o haga obligatorio un premio alto.
   Fuente: https://docs.phygitals.com/about-phygitals/welcome-to-phygitals-the-future-of-collecting/packs/creator-packs
4. **Sesgo de la muestra pública.** RipIndex declara que el feed de Phygitals es una muestra inclinada hacia grandes premios. Dice mantener un registro on-chain más completo, pero eso es una afirmación de ese auditor, no una comprobación independiente nuestra. Su propia metodología reconoce retrasos y datos incompletos. Verificar que existe un NFT no demuestra por sí solo que el sorteo fue uniforme ni cuánto efectivo neto recibió el propietario.
   Fuente: https://rip-index.com/methodology
5. **Cambios observados, no horarios repetibles.** RipIndex publica fechas de cambios de odds y recompra; por ejemplo, registra un cambio de porcentaje del Pirate Pack el 5 de octubre a las 14:42 UTC. Una fecha de modificación no es evidencia de una ventaja que se repita cada día a esa hora. Los nombres genéricos en el registro tampoco identifican siempre una colección concreta.
   Fuente: https://rip-index.com/odds-changes
6. **Economía y pagos.** El EV anunciado del Mythic Pokémon observado fue 1.024 USD frente a un precio de 1.000 USD; con recompra del 90%, la inferencia es 921,60 USD de efectivo esperado antes de otros costes. Se conserva como snapshot fechado. Una promoción efectiva puede modificar la cuenta, pero requiere comprobar elegibilidad, límites y pago real. La recompra no es un reembolso del precio del pack y los términos permiten que no esté disponible.
   Fuentes: https://www.phygitals.com/claw/mythic-pack ; https://www.phygitals.com/claw ; términos, apartado 5.2.

## Revisión de la app de Claude

Origen: rama `claude/phygitals-lab`, commit `868cf9d4a3099f46511e4fc35f92229e069e7fe5`. Se incorporó la app independiente preservando Card Vault.

Se corrigieron estas limitaciones:
- Las medias de los tramos eran supuestas y se recomendaba estimarlas por debajo del punto medio sin evidencia del inventario.
- El simulador añadía ruido lognormal sin fuente. Podía generar valores fuera de un tramo y ofrecer una probabilidad de beneficio con precisión aparente.
- Se normalizaban probabilidades incompletas en lugar de bloquear el cálculo.
- “Ventaja a tu favor”, “a largo plazo no ganas ni pierdes” y la afirmación de que cierta promoción era la única ventaja posible excedían lo demostrado.
- La cifra del 39% de sesiones ganadoras no incluía una distribución real reproducible que la justificase.
- Los datos históricos de RipIndex no estaban enlazados ni fechados adecuadamente para el estado actual.

El laboratorio revisado calcula EV condicional, separa costes desconocidos, simula únicamente categorías y analiza CSV local por pack/versión/hora UTC. No crea señales de compra ni guarda historiales en Card Vault. La simulación JavaScript y la Python usan generadores distintos y no deben coincidir exactamente en recuentos; ambas están identificadas como modelos, no como el generador real de Phygitals.

## Qué falta para contrastar un patrón temporal

Usar únicamente historial ya existente, completo y autorizado, incluyendo pérdidas y cartas retenidas. Campos necesarios: ID, pack inequívoco, versión de probabilidades, timestamps de compra y apertura con zona horaria, precio total, condiciones de recompra, ingreso neto real y registros de verificación cuando existan. Para una auditoría del algoritmo hacen falta además los compromisos previos, semillas reveladas, mapeo de resultados, ponderaciones y algoritmo exacto.

El diseño estadístico debe fijarse antes de buscar la mejor franja: controlar pack, cambios de odds, promociones, inventario, volumen y selección de registros; separar periodos de descubrimiento y validación; corregir las comparaciones múltiples. Buscar 86.400 segundos y elegir el mejor a posteriori genera falsos patrones. Una asociación horaria no prueba causalidad ni una estrategia rentable futura.

No necesitamos que el usuario compre más packs para obtener pruebas. Un historial personal pequeño puede servir para reconstruir su saldo, pero probablemente no para demostrar un efecto horario raro. Epic/Mythic pueden ser tiers o packs distintos: falta el enlace exacto del producto usado por el usuario.
