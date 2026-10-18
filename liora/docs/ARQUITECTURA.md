# Liora Studio · Arquitectura y seguridad

```
iPhone (Safari)                                   Cloudflare Worker (liora-backend)          fal.ai
┌──────────────────────────────┐   HTTPS + Bearer ┌──────────────────────────────┐  Key     ┌─────────────┐
│ Pages /liora/produccion.html  │ ───────────────▶ │ FAL_KEY (secreto)            │ ───────▶ │ cola de     │
│ IndexedDB: referencias, clips,│   clave Liora    │ LIORA_ACCESS_KEY (secreto)   │          │ modelos     │
│ proyectos, máster, registros  │   en memoria     │ ALLOW_PAID / topes de gasto  │ ◀─────── │ vídeo/canto │
│ face-api (reconocimiento)     │ ◀─────────────── │ KV: gasto estimado, trabajos │  vídeo   └─────────────┘
│ QC, montaje, portadas         │   vídeo (proxy)  │ OpenAPI: esquema real        │
└──────────────────────────────┘                  └──────────────────────────────┘
```

## Qué es público y qué no

* **La URL de GitHub Pages es pública.** Cualquiera puede abrir la interfaz. No contiene claves ni datos:
  todo el contenido (fotos de Liora, clips, canciones, proyectos) está en el IndexedDB del iPhone que lo usa.
  La app no es «privada» por ser de uso interno; lleva `noindex`, pero eso no impide el acceso.
* **Claves de proveedores:** solo en el Worker como secretos de Cloudflare. Nunca en JavaScript, en el
  repositorio ni en el almacenamiento del navegador.
* **Clave de acceso de Liora:** la escribes en «Motores». Se guarda solo en memoria de la pestaña; el
  formulario permite que el llavero de iCloud la recuerde. El Worker la compara en tiempo constante y bloquea
  15 min tras 10 intentos fallidos por IP. CORS limitado a `https://alvarogavilan.github.io`.
* **Gasto:** el Worker rechaza cualquier generación si `ALLOW_PAID` no es `"true"`, si el usuario no confirma
  el coste estimado, si supera `MAX_USD_PER_JOB` o si el acumulado estimado supera `MAX_USD_TOTAL`. Antes de
  enviar, valida la petición contra el esquema OpenAPI real del modelo: si no encaja, no se envía (no se cobra).
* **Imágenes y audio enviados:** solo al lanzar una generación, como data URI dentro de la petición al Worker,
  que los reenvía a fal. fal guarda los resultados en su CDN temporal; la app los descarga al iPhone.

## Persistencia

* IndexedDB propia `liora_studio` v1 (almacenes `refs`, `projects`, `blobs`, `trends`, `posts`, `kv`).
* El panel principal (`index.html`) sigue usando `liora_assets` v1. El estudio solo la lee (sin subir su
  versión ni crearla si no existe) e importa la foto maestra si el estudio aún no tiene referencias; copia una
  vez el proyecto, reglas, revisión y tendencias de `localStorage` sin borrarlos.
* Safari puede borrar datos de webs no usadas en semanas: pedir almacenamiento persistente (Motores), añadir
  a pantalla de inicio y **exportar el paquete de identidad** a Archivos/iCloud.

## Pipeline de una escena

1. `PENDIENTE` → generar (Worker → fal) → `GENERANDO` → resultado descargado → `REVISIÓN`
   (o subir un clip hecho fuera → `REVISIÓN`).
2. QC automático en el iPhone: identidad por fotograma contra las referencias maestras, saltos de identidad,
   continuidad con el último fotograma de la etapa anterior, fotogramas negros/blancos/desenfocados/
   congelados/saltos, cambio de color en la zona trabajada, correlación boca↔energía vocal, formato 9:16.
3. Revisión humana obligatoria (8 controles + revisor). Identidad «FALLA» bloquea la aprobación.
4. `APROBADO` (su último fotograma es el punto de partida de la siguiente) o `RECHAZADO` → regenerar.
5. Máster con las 8 escenas aprobadas → validación humana final → `EXPORTADO` → entregables.

## Limitaciones conocidas

* El reconocimiento facial (face-api, descriptor de 128 dimensiones) está entrenado con fotos reales; el
  maquillaje de fantasía muy intenso aumenta la distancia. Etapas 7–8 tienen +0,05 de tolerancia, marcado.
* Manos y herramientas no se evalúan automáticamente: no hay un detector fiable gratuito en el navegador.
* El indicador boca↔voz es una correlación, no un veredicto de sincronía.
* El montaje en el iPhone es un render en tiempo real con MediaRecorder (Safari graba MP4 H.264/AAC).
  Instagram y TikTok reciben el mismo archivo limpio con nombre propio; lo que cambia por plataforma es
  portada, texto, etiquetas y avisos. Para re-codificación de máxima calidad haría falta un servicio de pago
  (no activado).
