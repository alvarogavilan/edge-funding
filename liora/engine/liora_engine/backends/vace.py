"""Wan 2.1 VACE 1.3B (familia Wan, Apache-2.0) mediante diffusers: alternativa ligera para una sola T4.

1,3 B de parámetros (≈2,6 GB en fp16): cabe en una GPU de 15 GB sin descarga a CPU. Admite:
  · primer fotograma fijo (imagen→vídeo mediante vídeo de control + máscara),
  · imágenes de referencia de identidad (la cara oficial de Liora en entornos privados),
  · texto→vídeo.
Resolución nativa 480p (vertical 480×832) a 16 fps; fotogramas 4n+1 (57 = 3,5 s).
"""
from __future__ import annotations

from PIL import Image

from .base import GenerationRequest
from .wan22 import Wan22TI2V, fit_image


class Wan21VACE(Wan22TI2V):
    id = "wan21-vace-1.3b"
    role = "video"

    def _pipeline_class(self, task: str):
        from diffusers import WanVACEPipeline
        return WanVACEPipeline

    def _post_load(self, pipe) -> None:
        from diffusers import UniPCMultistepScheduler
        # flow_shift 3.0 es el valor recomendado para 480p en la documentación de diffusers
        pipe.scheduler = UniPCMultistepScheduler.from_config(pipe.scheduler.config, flow_shift=self.spec.get("flow_shift", 3.0))

    def _task_and_args(self, req: GenerationRequest, nf: int) -> tuple[str, dict]:
        args = dict(prompt=req.prompt, negative_prompt=req.negative_prompt, height=req.height, width=req.width, num_frames=nf,
                    num_inference_steps=req.steps, guidance_scale=req.guidance)
        task = "text-to-video"
        if req.start_image:
            first = fit_image(req.start_image, req.width, req.height)
            grey = Image.new("RGB", (req.width, req.height), (128, 128, 128))
            args["video"] = [first] + [grey] * (nf - 1)
            args["mask"] = [Image.new("L", (req.width, req.height), 0)] + [Image.new("L", (req.width, req.height), 255)] * (nf - 1)
            task = "image-to-video"
        if req.ref_images:
            args["reference_images"] = [Image.open(p).convert("RGB") for p in req.ref_images]
            task += "+reference"
        return task, args
