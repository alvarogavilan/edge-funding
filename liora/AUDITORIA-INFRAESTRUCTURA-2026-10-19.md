# LIORA STUDIO — AUDITORÍA DE CAPACIDAD Y ALOJAMIENTO
Fecha: 2026-10-19. Verificación de documentación oficial. Presupuesto autorizado: 0 EUR.

## Dictamen
Existe interfaz accesible desde iPhone en GitHub Pages. NO existe capacidad probada de generación continua de vídeo hiperrealista, canto/lip-sync ni GPU garantizada. El objetivo de capacidad ilimitada y gratuita NO está alcanzado. No marcar producción como lista.

## Restricciones verificadas
- GitHub Pages: plataforma estática; sitios publicados máximo 1 GB, límite flexible de 100 GB/mes y reglas que prohíben usar Pages como hosting gratuito para SaaS comercial. https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- Hugging Face ZeroGPU: cuotas de GPU, recursos compartidos y disponibilidad no garantizada; algunas cuentas gratuitas verificadas pueden alojar hasta dos ZeroGPU Spaces; evaluar elegibilidad, licencia y rendimiento real. https://huggingface.co/docs/hub/spaces-zerogpu
- Google Colab gratis: GPU no garantizada, tiempo y políticas restringidos, no apto como servidor web 24/7. Ver limitaciones y prohibición de deepfakes antes de usarlo. https://research.google.com/colaboratory/faq.html

## Diseño de continuidad
Frontend móvil desacoplado del procesamiento; separar archivos originales, proyectos y metadatos por marca. Motor de vídeo con adaptadores reemplazables: no depender de un proveedor o espacio gratuito individual. Almacenamiento con respaldo/restauración verificados. No publicar ni almacenar secretos en un repositorio público ni frontend estático. Capacidad GPU de coste cero sólo activada tras verificar cuotas, autorización comercial y pruebas reproducibles. Si no hay GPU, estado BLOQUEADO, sin salida falsa.
No ejecutar procesos 24/7 en infraestructura que prohíba servidores persistentes o viole límites de uso.
Para una operación comercial estable puede ser necesario revisar la estrategia de alojamiento antes del lanzamiento, aunque no se autoriza gasto alguno.

## Próximas pruebas para Claude Code
1. Recuperar el avatar maestro realmente elegido, fichero original y checksum; incorporar como referencia de producción, sin pedir más fotos al usuario.
2. Investigar ejecución de generación de clips original y permitida comercialmente sin coste: modelo, cuenta, cuotas, licencia, latencia, disponibilidad.
3. Probar GPU/render auténtico y registrar salida MP4, parámetros, tiempo y cero euros gastados. No usar animación de fotos con zoom como simulación.
4. Conseguir segundo clip manteniendo rostro y progresión del maquillaje.
5. Probar voz original y canto/lip-sync. Registrar permisos y calidad.
6. Primer vídeo completo exportado y visible desde Safari, con revisión manual.
7. Ensayar recuperación de proyectos y 3 renders consecutivos sin editar código.
8. Validar condiciones reales de hosting y recursos antes de anunciar servicio comercial.
No tocar Card Vault; todo en /liora, sin GitHub Actions propios, commits [skip ci].

## Política de decisión
Calidad exigente, pero ninguna garantía de cero errores; revisar cada clip. Si ninguna GPU gratuita admite el modelo y la duración requeridos, comunicar imposibilidad bajo el presupuesto de 0 euros, no inventar infraestructura.
