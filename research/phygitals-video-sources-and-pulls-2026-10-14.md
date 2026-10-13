# Phygitals — vídeos, retransmisiones y nuevas fuentes (14/10/2026)

## Fuentes verificables
- PackSpy, revisión Phygitals: https://packspy.com/sites/phygitals — publicación 25/07/2026, actualización 03/09/2026. Su responsable declara registrar pulls continuamente y transmitir aperturas en Kick y Discord, con clips en @GGspins. La página informa que entre 3.881 cartas deportivas observadas, solo 1.240 llevaban grado PSA/BGS/CGC explícito, por lo que una clasificación visual puede fallar.
- Página oficial de Phygitals: https://www.phygitals.com/ — feed de Recent Pulls con nombre de carta, pack y tiempos relativos como «just now», «16s ago». Las marcas relativas no son timestamps absolutos auditados; al recargar pueden cambiar.
- RipRanks, Rookie Football 25 USD: https://ripranks.com/card-rip-sites/phygitals/packs/rookie-sport-pack — 5.219 aperturas **muestreadas**; 4.260 Common, 761 Uncommon, 155 Epic, 43 Mythic. Publica 50 resultados individuales visibles con nombres y valoraciones en el cuerpo de la página, pero sin marcas UTC segundo ni tx IDs en lo recuperado aquí. La propia web los considera sampled.
- RipRanks, Starter Football 10 USD: https://ripranks.com/card-rip-sites/phygitals/packs/starter-sport-pack — 183 muestras; 158 Common y 25 Mythic bajo la taxonomía de ese pack. No comparar «Mythic» entre packs sin comparar rangos de valor: en este pack aparece 14–50 USD, no una carta de 990 EUR.
- API oficial de Phygitals: https://www.phygitals.com/docs/public-api — endpoints GET /vm/available y GET /vm/chase/{slug}; no documenta un GET anónimo con todas las aperturas individuales de terceros. Registro de compras propias y recompra requieren clave/operación específica.

## Estado real de la adquisición
1. Se identificaron fuentes internacionales adicionales que publican aperturas reales y testimonios en vídeo.
2. **No se ha descargado un vídeo completo verificable ni un CSV individual con segundos/IDs de blockchain en esta ejecución.** El entorno de descarga directa produjo fallo DNS. Los resultados de páginas web permiten contrastar informes agregados, no extraer toda su base.
3. Clips de grandes premios, vídeos editados y un feed parcial no constituyen muestreo aleatorio; no se usarán para declarar ventaja en hora/minuto/segundo.

## Nueva cuestión falsable
Si se obtiene una emisión continua que muestre *todas* las aperturas de una sesión y un identificador de resultado por apertura, comparar timestamps capturados del vídeo con firmas on-chain y las probabilidades vigentes del pack concreto. Distinguir hora del vídeo de hora de asignación en el servidor. Estimar desfase de transmisión y excluir segmentos perdidos. Validar en otra sesión posterior.

## Advertencia sobre Mythic
La categoría Mythic puede representar valor nominal de 14–50 USD en Starter Football, mientras en otros packs abarca miles de USD. Contar «Mythic» no es equivalente a contar ganancias altas.

## Conclusión
Evidencia pública de aperturas sí; registro temporal completo para predecir el siguiente gran premio, no. No hay compra autorizada por estas observaciones.
