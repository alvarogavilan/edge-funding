# Liora Studio — Plan técnico sin coste y expansión multicanal
Fecha: 2026-10-19. Archivo operativo; no implica que los proveedores estén conectados.

## Mandato
- Presupuesto máximo: 0 EUR, ninguna suscripción ni clave API en GitHub Pages.
- iPhone: panel principal /liora/ con un vídeo realmente aprobado, descarga y compartir nativo cuando Safari lo permita.
- Perfil activo único: lioravalemakeup (Instagram y TikTok), personaje LIORA-IDENTIDAD-001.
- Futuras marcas: arquitectura multi-canal separada, NO lanzar ni publicar otra marca aún.
- No usar GitHub Actions propios. Commits con [skip ci]. No modificar Card Vault.

## Jerarquía del sistema
Organización -> Marca -> Canal -> Serie -> Producción -> Escena -> Archivo -> Revisión -> Publicación -> Métricas.
Separar configuraciones, bibliotecas, audios, derechos y permisos por marca. Dejar la UI "Publicar hoy" filtrada a Liora de manera predeterminada. No mostrar marcas vacías.

## Flujo obligatorio de publicaciones
1. Registrar referencias reales y verificables de tendencias, fecha, fuente y métrica.
2. Aprobar editorialmente un concepto original con derechos musicales claros.
3. Generar escenas desde identidad oficial, sin sustituir rostro.
4. Revisar interacción pincel/piel, progresión, dedos, expresiones, sincronía de labios y uniformidad de luz.
5. Crear máster 1080x1920 9:16 sin marca de agua.
6. Revisar calidad humana; publicar solo tras aprobación.
7. Recoger resultados con fechas: reproducciones, retención cuando sea accesible, compartidos, seguidores obtenidos. No rellenar resultados inventados.

## Puertas de calidad
Estado: idea -> listo para generar -> generando -> clip candidato -> revisión -> aprobado/rechazado -> descargable -> publicado.
Si falta motor de vídeo, no fingir generación ni mostrar un CTA activo de "Publicar" sin archivo final.
Si falla un clip, rechazarlo, registrar motivo y reintentar solo si no hay coste.
No prometer 100% de continuidad: medirlo sobre los resultados.

## Proveedores potenciales para investigar
- Wan 2.2 TI2V-5B / I2V y Wan2.2-Lightning: código/modelos abiertos; GPU necesaria, disponibilidad gratuita no garantizada.
- Consultar licencia de modelo, derechos de uso comercial, privacidad, límites y condición de salida. No implementar dependencias de GPU en Pages.
- Voz y canto: comprobar solución original con licencia comercial antes de integrar.
- GitHub Pages: frontend estático público; nunca poner secretos o activos estratégicos privados allí.

## Próximos entregables mínimos
A. Foto oficial original como referencia de alta resolución gestionada adecuadamente sin pedirle otra subida al usuario; no sustituir por dibujo, miniatura o un nuevo rostro.
B. Prueba de 3-5 segundos, mismo rostro, aplicación de maquillaje coherente.
C. Prueba sincronizada de canto original.
D. Primer Reel completo aprobado (no antes).
E. Panel principal conectado al archivo aprobado; descargas para Instagram y TikTok.
F. Métricas verificadas tras publicar.

## Comité virtual
Funciones: investigación, guion, maquillaje físico, identidad, vídeo, audio, legal/derechos, calidad, social growth y monetización.
No presentar a estos roles como empleados reales, agentes activos o investigaciones permanentes si no se está ejecutando una automatización comprobable.

## Coordinación de desarrollo
Claude Code: integrar motor, construir backend seguro si hay una opción realmente gratuita, pruebas y render.
ChatGPT: producto, protocolos de publicación, revisión de código, metodología de medición.
Evitar ediciones simultáneas del mismo archivo, agrupar cambios pequeños y verificar estado antes de la entrega.
