# PHYGITALS — DICTAMEN OPERATIVO DE CIERRE (15 octubre 2026)

## Decisión sobre compras
**NO COMPRAR** packs aleatorios buscando un Mythic, una posición, hora, secuencia o número de apertura. Ninguna de esas tácticas se ha demostrado predictiva con datos completos e independientes. Presupuesto máximo de referencia: 50 EUR. Compras ejecutadas: 0.

## Estado verificado
- El fichero principal `phygitals.html` existe en la rama `main` de GitHub, pero su acceso a la API del operador desde GitHub Pages sigue sin prueba de funcionamiento. Que el JSON abra como página en Safari no implica permiso CORS para fetch desde otro origen.
- Documentación pública de la API: https://www.phygitals.com/docs/public-api . No inferir cabeceras CORS sin inspeccionarlas realmente.
- El módulo `phygitals-decision-engine.js` solo puede recomendar `REVISAR OFERTA` con datos declarados. No prueba por sí mismo que una puja sea ejecutable.
- Las muestras de RipIndex, RipRanks, PackSpy y Vollector tienen metodologías y períodos diferentes; no mezclar cohortes ni el valor nominal con recompra ejecutada. No existen en este repositorio aperturas individuales completas con selección, segundo de asignación y transacción enlazadas y verificadas.

## Condiciones mínimas para reabrir como oportunidad
1. Oferta concreta identificada, precio de compra y stock verificados en vivo.
2. Salida firme legalmente disponible en España, identidad exacta de carta, gastos y caducidad de oferta comprobados.
3. Beneficio neto positivo después de todos los gastos dentro de 50 EUR; revisión manual antes de actuar.
4. Para anomalías temporales/posicionales, ledger completo y holdout prospectivo independiente; vídeos de ganadores aislados no cumplen.

## Limitación técnica pendiente
Sin CORS autorizado por Phygitals, GitHub Pages no puede consultar de manera directa la API pública a través de fetch. Soluciones reales: habilitación CORS por el titular, backend autorizado con costes y mantenimiento apropiados, o fuente externa independiente que ofrezca acceso permitido y trazabilidad. Los proxies de terceros no verificados NO son una reparación.

## Estado
Investigación cerrada con resultado negativo en predicción y arbitraje verificado. Software experimental conservado. No hay compra que recomendar ni despliegue final funcional certificado. Sin costes, sin Actions y sin compras automáticas.