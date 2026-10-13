# Phygitals — auditoría de selección de posición y vídeos (14 octubre 2026)

## Hallazgo principal verificable
La presentación actual de Phygitals describe el flujo como **abrir un pack aleatorio y después tocar para revelar la carta obtenida**. Eso es compatible con una animación en la que elegir una tarjeta visual no cambia el premio. No se ha demostrado el instante exacto de asignación en la implementación; no hay evidencia para recomendar «tercera carta», «séptima carta» ni segundos de apertura. Fuente: https://www.phygitals.com/how-it-works y https://www.phygitals.com/

La documentación de Pack Party diferencia otra modalidad: vendedor selecciona 2–10 cartas, los participantes compran posiciones y el reparto aleatorio ocurre al llenarse la fiesta. **No se debe confundir el orden de las posiciones/slots con seleccionar cartas boca abajo durante la animación.** Fuente: https://docs.phygitals.com/about-phygitals/welcome-to-phygitals-the-future-of-collecting/packs/pack-party

Los Creator Packs recirculan cartas recompradas, por lo que no podemos usar una cuenta regresiva de premios sin inventario completo e historiales de cambios. Fuente: https://docs.phygitals.com/about-phygitals/welcome-to-phygitals-the-future-of-collecting/packs/creator-packs

## Material de vídeo accesible o no accesible
- Phygitals «How It Works» anuncia «See It in Action — Watch a pack opening from start to finish», pero el texto recuperable no aporta una línea temporal fotograma a fotograma de decisiones, identificador on-chain y resultado. https://www.phygitals.com/how-it-works
- GGspins Kick https://kick.com/ggspins/videos muestra actualmente «There are no videos»; **cero sesiones VOD descargables allí en esta consulta**.
- La página https://www.phygitals.com/claw/elite-soccer-pack muestra «Try a free demo spin» en su ficha; una demo, incluso cuando se pueda observar, no demuestra equivalencia exacta con asignaciones pagadas.
- El sistema IFrame oficial incluye modo sandbox y modo live, con integración del servidor de wallet. Es una vía de prueba autorizada para partners, NO una API abierta que publique todas las posiciones escogidas por otros usuarios: https://www.phygitals.com/docs/iframe

## Especificación de evidencia real necesaria
Para cada apertura: fuente, vídeo completo (URL y segmento), fecha UTC del suceso (no de emisión), pack y versión de odds, tipo de interacción, número de posiciones visuales, índice elegido, identificador de transacción o prueba VRF, asignación y valor realmente cobrado. Documentar las aperturas comunes y los clips omitidos. Sin ese denominador, no calcular tasa de premio por posición.

## Resultado
- Sesiones de vídeo completas contrastables cuadro a cuadro con resultado y posición: 0.
- Registros individuales fechados con selección y firma verificables descargados: 0.
- Número/posición/hora de beneficio demostrado: ninguno.
- Recomendación: NO COMPRAR solo por posición. Primer paso de mayor valor: comprobar **en una demo sin dinero real** cuándo ocurre la asignación respecto al toque y si la posición se transmite como argumento de la decisión, con permiso y sin saltar protecciones.
