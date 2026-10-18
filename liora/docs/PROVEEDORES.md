# Liora Studio · Evaluación de proveedores (18-oct-2026)

Precios obtenidos de búsquedas públicas del 18-oct-2026 (páginas de modelos de fal.ai y agregadores).
Desde este entorno no se pudo abrir fal.ai directamente, así que **ningún precio está confirmado con una
cuenta**. El Worker consulta el precio real con tu clave (`GET /v1/models/pricing` de fal) y el esquema real de
cada modelo (OpenAPI público de fal) en «Motores → Verificar modelos y precios», sin coste.

## Por qué fal.ai como pasarela

* Una sola clave y **saldo prepago**: el saldo que cargues es el tope de gasto, además de los topes del Worker.
* Da acceso a los modelos punteros de vídeo con fotograma inicial / referencias y a los de canto y lip-sync.
* API de cola estándar (`queue.fal.run`) con estado y resultado: permite generar y **regenerar escenas sueltas**.
* Alternativas directas (Google Gemini API para Veo, BytePlus para Seedance/OmniHuman, Kling API oficial)
  se pueden añadir como adaptadores más adelante si el precio compensa.

## Vídeo (visual)

| Modelo (endpoint fal) | USD/s sin audio | USD/s con audio | Duración | Fuerte en | Límites |
|---|---|---|---|---|---|
| Veo 3.1 · `fal-ai/veo3.1/image-to-video` | 0,20 | 0,40 | 8 s a 1080p (4/6 s solo 720p) | Fotorrealismo, piel, luz, expresiones; audio nativo | 8 s por toma; filtros de seguridad en entradas y salidas |
| Veo 3.1 Fast · `fal-ai/veo3.1/fast/image-to-video` | 0,10 | 0,15 | 4/6/8 s | Pruebas baratas de movimiento | Menos detalle |
| Veo 3.1 Referencias · `fal-ai/veo3.1/reference-to-video` | 0,20 | 0,40 | 8 s | Identidad desde varias referencias | Sin fotograma inicial → peor continuidad entre etapas; imágenes ≤ 8 MB |
| Kling 3.0 Pro · `fal-ai/kling-video/v3/pro/image-to-video` | 0,112 | 0,168 | 5/10 s | Física de manos y objetos, precio | Campo `start_image_url`; precios publicados contradictorios (0,112 vs 0,224) |
| Seedance 2.0 · `bytedance/seedance-2.0/reference-to-video` | ≈0,30 (720p) | incluido | 5/10 s | Hasta 9 imágenes + audio de referencia | Esquema sin confirmar; 1080p ≈ 0,68 USD/s |

**Recomendación visual:** Veo 3.1 imagen→vídeo partiendo del último fotograma aprobado (continuidad), con
Kling 3.0 Pro como segunda opción si fallan manos/brochas. Las referencias múltiples (Veo Ref, Seedance) se
usan para recuperar identidad si una etapa deriva.

Riesgos reales para el maquillaje: el maquillaje que «aparece» sin contacto de la brocha, dedos extra al
sujetar herramientas finas (delineador, pinzas), y deriva facial en tomas encadenadas. Por eso el QC mide
identidad fotograma a fotograma, continuidad entre etapas y cambios bruscos de color en la zona trabajada.

## Canto y sincronía labial

| Modelo | USD/s | Entrada | Valoración |
|---|---|---|---|
| OmniHuman 1.5 · `fal-ai/bytedance/omnihuman/v1.5` | 0,16 (fal; otras webs 0,12–0,18) | imagen + audio (< 30 s a 1080p) | El más prometedor para **cantar**: respiración, gesto y emoción guiados por el audio. Débil en interacción precisa con brochas. |
| Sync Lipsync 2 Pro · `fal-ai/sync-lipsync/v2/pro` | ≈0,083–0,094 (sin confirmar) | vídeo + audio | Rehace solo la boca y conserva manos/maquillaje del clip aprobado. Hay que validarlo con canto y con la brocha delante de la cara. |
| Audio nativo de Veo 3.1 / Kling 3.0 | incluido en tarifa con audio | prompt | Genera voz propia en cada toma: **no mantiene una voz consistente** ni sigue una canción concreta. No válido para la voz oficial. |

No se asume que un lip-sync de voz hablada funcione cantando: vocales sostenidas, notas largas y
respiraciones fallan con frecuencia. Prueba obligatoria: misma escena con Ruta A (visual + Sync) y Ruta C
(OmniHuman) sobre el mismo tramo de canción, comparando con el indicador boca↔voz y a ojo.

## Canción y voz de Liora

* **ElevenLabs Music (v2, jun-2026):** derechos comerciales desde el plan Starter (≈6 USD/mes); API ≈0,15
  USD/min (precio de julio 2026, a verificar). Entrenado con datos licenciados. Riesgo: la voz cantada no está
  garantizada idéntica entre canciones.
* **Suno:** sin API oficial pública; no se integra.
* **Opción más sólida para una voz consistente:** cantante humana contratada con cesión de voz (misma
  cadena de grabación) y, si se quiere un timbre propio, conversión a una voz Liora con licencia (p. ej. Kits.ai;
  precio de API no verificado). La app guarda el método, el identificador y una muestra de referencia.

## Coste orientativo del primer vídeo (42 s, 8 escenas, ×1,5 por regeneraciones)

| Ruta | Estimación |
|---|---|
| Prueba mínima: 1 escena Veo 3.1 Fast (8 s) + Sync Lipsync | ≈ 1,55 USD |
| A · Veo 3.1 1080p (tomas de 8 s) + Sync Lipsync 2 Pro | ≈ 25,1 USD |
| B · Kling 3.0 Pro + Sync Lipsync 2 Pro | ≈ 15,2 USD (≈ 24,4 si la tarifa real es 0,224 USD/s) |
| C · OmniHuman 1.5 | ≈ 10,1 USD |

Cálculo en la app (Motores → Calculadora) con los precios que devuelva el Worker. No incluye la música.

## Fuentes consultadas

* fal.ai – Veo 3.1 reference-to-video / image-to-video / fast (llms.txt y páginas API)
* fal.ai docs – Kling Video v3 Pro; fal.ai learn – guías de imagen→vídeo 2026
* fal.ai – OmniHuman v1.5 (llms.txt y API); BytePlus OmniHuman 1.5
* fal.ai – Sync Lipsync 2.0; RunComfy y Runware (precios de lipsync-2-pro)
* fal.ai – Seedance 2.0 (página de producto y Mini reference-to-video)
* fal.ai docs – Platform API `v1/models/pricing`
* Blogs de precios ElevenLabs 2026 (smallest.ai, dubspot, techjacksolutions)
