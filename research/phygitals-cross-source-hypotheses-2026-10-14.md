# Phygitals · contraste de hipótesis entre fuentes (14-10-2026)

## Hallazgo transversal
La coincidencia más robusta no es una hora ganadora: la **diferencia sistemática entre promedio nominal alto y probabilidad reducida de recuperar el precio**. Las fuentes pueden presentar promedios atractivos por premios extremos, mientras la mayoría de las aperturas queda por debajo del coste. Comparar series de distintas fechas, categorías o feeds como si fueran la misma población inventaría una señal.

## Evidencia textual recuperada
1. PackSpy One Piece, ventana aproximadamente 47 horas: 236 aperturas observadas; 83 Starter One Piece de 25 USD (retorno nominal medio 187%; solo 30% recupera nominalmente el coste), 48 Elite de 50 USD (143%; 33%), 16 Pirate de 10 USD (167%; 63%). Fuente: https://packspy.com/sites/phygitals/pulls?game=onepiece&window=all
2. PackSpy ventana 24 horas **solapada**, 139 aperturas One Piece; 60 Starter (212% nominal, 32% recupera nominalmente el coste), 31 Elite (103%, 29%). No sumarlas a la ventana más larga. Fuente: https://packspy.com/sites/phygitals/pulls?game=onepiece&window=24
3. RipRanks Rookie Football 25 USD, 5.219 aperturas **muestreadas**: promedio nominal 94,7%, mediana 64,3%, solo 18,6% a valor nominal >= precio. Odds de API fechadas 09-09-2026 no necesariamente vigentes durante toda la muestra. Fuente: https://ripranks.com/card-rip-sites/phygitals/packs/rookie-sport-pack
4. RipRanks Mythic Football 1.000 USD, 32 aperturas muestreadas en una página y 117 en otra ruta, muestras no necesariamente coincidentes: promedio nominal 99,0% frente a 100,9%, mediana 64,3% frente a 79,8%, 'beat price' 18,8% frente a 21,4%. **No es comparación controlada** de la misma población y ni siquiera entra en presupuesto. Fuentes: https://ripranks.com/card-rip-sites/phygitals/packs/mythic-sport-pack y https://ripranks.com/card-rip-sites/phygitals/packs/mythic-football
5. RipIndex, semana del 28-09-2026: 320.289 aperturas en **cinco** plataformas, no solo Phygitals; balance cash-out conjunto -5,2%. Fuente: https://rip-index.com/report

## Hipótesis contrastadas
- **H1, 'después de varios fallos toca Mythic'**: sin denominador completo, timestamps verificables e inventario agotable, no evaluable. La recirculación declarada de Creator Packs debilita la premisa de agotamiento.
- **H2, 'mejor segundo/hora'**: sin registros completos en UTC con hora del evento de asignación y versiones de odds, no evaluable. Un timestamp de publicación o de vídeo no sustituye el de asignación.
- **H3, 'PackSpy detecta packs con EV positivo que contradicen RipRanks/RipIndex'**: metodologías, packs, períodos y probabilidades distintos. Muestras pequeñas y feeds sesgados impiden generalizar; no es arbitraje.
- **H4, 'una apuesta ganadora si compro cuando salga un gran premio en el feed'**: secuencias seleccionadas a posteriori, sin validación fuera de muestra. No demostrada.

## Decisión
CERO patrones temporales validados. CERO filas individuales con firma/timestamp UTC verificadas y descargadas en esta investigación. CERO oportunidades de compra con una salida firme y neta. Sin señal COMPRA YA.

La mejor investigación siguiente es conseguir material bruto de sesiones completas, capturar **también cada pérdida**, identificar versión de odds y obtener el evento on-chain correcto, y después correr el test temporal con separación entrenamiento/validación. No presentar comparaciones agregadas como millones de aperturas propias.
