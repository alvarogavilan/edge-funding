# Liora Engine

Motor audiovisual propio de Liora Studio. Presupuesto 0 €: solo modelos abiertos con licencia comercial y
cómputo gratuito. Nada se declara terminado sin una ejecución real registrada en `results/`.

## Estado verificado (18-oct-2026)

| Componente | Estado | Prueba |
|---|---|---|
| Identidad facial (dlib ResNet, 128-d; paquete sin imágenes, oficial inmutable) | **Probado en CPU** | `tests/test_engine.py::Identity` |
| Continuidad del maquillaje (MediaPipe 478 puntos, ΔE CIELAB por zona, cortes y cambios «mágicos») | **Probado en CPU** | `::Continuity` (labios pintados de verdad sobre la malla) |
| Encadenado de escenas (último fotograma → siguiente), reintentos con semilla, manifiesto reproducible | **Probado en CPU** con un motor de prueba NO generativo | `::Pipeline` |
| Montaje y exportación MP4 H.264/AAC 1080×1920 *faststart* (Safari) + canción | **Probado en CPU** | `::Media`, `::Pipeline` |
| Detección de salidas rotas (negro, plano, congelado) | **Probado en CPU** | `::Media` |
| Wan 2.2 TI2V-5B (diffusers) · vídeo | Código escrito, **nunca ejecutado**: sin GPU ni pesos aquí | `results/` |
| Wan 2.2 S2V-14B · canto, LatentSync 1.6 · labios, YuE · canción | Adaptadores de catálogo, **sin probar** | — |

## Límites medidos en esta máquina (`results/`)

* 4 CPU, 15,7 GB RAM, sin GPU, ~0,5 TFLOP/s fp32. `huggingface.co` bloqueado por la red del entorno → no hay pesos.
* Un bloque real del transformador de Wan 2.2 5B (163,7 M parámetros, pesos aleatorios) tarda 15–17 s con
  27 280 tokens: **≈ 10–12 h** por clip de 5 s a 704×1280 y 40 pasos (solo transformador). 3 s y 20 pasos: ≈ 2,5 h.

## Uso

```bash
pip install -e ".[identity]"          # + ".[wan]" en una máquina con GPU
python -m liora_engine probe --bench --out capacity.json
python -m liora_engine identity-enroll --pack pack.json --image oficial.jpg --official
python -m liora_engine plan --official oficial.jpg --pack pack.json --out job.json --scenes 1 --seconds 5
python -m liora_engine render --job job.json --work render --only 1        # Wan 2.2 por defecto
python -m liora_engine assemble --manifest render/manifest.json --out master.mp4 --song cancion.wav
FACE_IMG=retrato_de_prueba.png python -m unittest discover -s tests -t .
```

Primera generación real en GPU gratuita: `notebooks/liora_engine_kaggle.ipynb`.
Motores nuevos: una entrada en `liora_engine/catalog.json` (comando con marcadores) o una clase `Backend`.
