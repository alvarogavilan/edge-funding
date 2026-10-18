"""Wan 2.2 TI2V-5B (Apache-2.0) mediante diffusers: imagen inicial + texto → vídeo 720p a 24 fps."""
from __future__ import annotations

import gc
import importlib.metadata as md
import os
import shutil
import time
from pathlib import Path

from PIL import Image, ImageOps

from .. import media, probe
from .base import Backend, BackendError, GenerationRequest, GenerationResult, Preflight


def frames_for(seconds: float, fps: int) -> int:
    """Wan exige 4n+1 fotogramas."""
    n = max(9, round(seconds * fps))
    return -(-(n - 1) // 4) * 4 + 1  # redondeo hacia arriba: 5 s × 24 fps → 121


def fit_image(path: Path, width: int, height: int) -> Image.Image:
    im = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    return ImageOps.fit(im, (width, height), Image.LANCZOS, centering=(0.5, 0.4))


class Wan22TI2V(Backend):
    id = "wan22-ti2v-5b"
    role = "video"

    def __init__(self, spec: dict):
        super().__init__(spec)
        self.model_id = os.environ.get("LIORA_WAN22_TI2V", spec["model"])
        self._pipe = None
        self._mode = None

    def preflight(self) -> Preflight:
        issues, facts = [], {"model": self.model_id}
        g = probe.gpu_facts()
        facts["gpu"] = g
        for pkg in ("torch", "diffusers", "transformers", "accelerate", "ftfy"):
            try:
                facts[pkg] = md.version(pkg)
            except md.PackageNotFoundError:
                issues.append(f"Falta el paquete {pkg}")
        try:
            from diffusers import WanImageToVideoPipeline  # noqa: F401
        except Exception:  # noqa: BLE001
            issues.append("diffusers no incluye WanImageToVideoPipeline (actualiza diffusers ≥ 0.35)")
        if not g.get("cuda"):
            issues.append("No hay GPU CUDA: Wan 2.2 5B no es ejecutable en CPU en un tiempo útil")
        else:
            need = self.spec["requirements"]["min_vram_gb_offload"]
            if g["vram_gb"] < need:
                issues.append(f"VRAM {g['vram_gb']} GB < {need} GB mínimos con descarga a CPU")
            if not g.get("bf16"):
                facts["dtype_warning"] = "La GPU no soporta bf16: se usará fp16 (Wan se entrenó en bf16; calidad/estabilidad sin verificar)"
        ram = probe._meminfo_gb("MemTotal") or 0
        if ram < self.spec["requirements"]["min_ram_gb"]:
            issues.append(f"RAM {ram} GB < {self.spec['requirements']['min_ram_gb']} GB necesarios para cargar el modelo")
        local = Path(self.model_id).is_dir()
        if not local:
            reach = probe._reachable(f"https://huggingface.co/api/models/{self.model_id}")
            facts["hub_reachable"] = reach
            if reach is not True:
                issues.append(f"Pesos no disponibles: {self.model_id} no está en disco y huggingface.co no responde ({reach})")
            free = shutil.disk_usage(os.environ.get("HF_HOME", Path.home())).free / 1024 ** 3
            if free < self.spec["requirements"]["disk_gb"]:
                issues.append(f"Disco libre {free:.0f} GB < {self.spec['requirements']['disk_gb']} GB para los pesos")
        return Preflight(ok=not issues, issues=issues, facts=facts)

    def _load(self):
        if self._pipe is not None:
            return self._pipe
        import torch
        from diffusers import AutoencoderKLWan, WanImageToVideoPipeline
        p = torch.cuda.get_device_properties(0)
        vram = p.total_memory / 1024 ** 3
        dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
        vae = AutoencoderKLWan.from_pretrained(self.model_id, subfolder="vae", torch_dtype=torch.float32)
        pipe = WanImageToVideoPipeline.from_pretrained(self.model_id, vae=vae, torch_dtype=dtype)
        if vram >= 40:
            pipe.to("cuda"); self._mode = "gpu"
        elif vram >= 20:
            pipe.enable_model_cpu_offload(); self._mode = "model_cpu_offload"
        else:
            pipe.enable_sequential_cpu_offload(); self._mode = "sequential_cpu_offload"
        try:
            pipe.vae.enable_tiling()
        except Exception:  # noqa: BLE001
            pass
        self._dtype = str(dtype).split(".")[-1]
        self._pipe = pipe
        return pipe

    def generate(self, req: GenerationRequest) -> GenerationResult:
        pre = self.preflight()
        if not pre.ok:
            raise BackendError("Wan 2.2 no ejecutable: " + "; ".join(pre.issues))
        if not req.start_image:
            raise BackendError("Wan 2.2 TI2V necesita imagen inicial (foto oficial o último fotograma aprobado)")
        import torch
        pipe = self._load()
        nf = frames_for(req.seconds, req.fps)
        image = fit_image(req.start_image, req.width, req.height)
        torch.cuda.reset_peak_memory_stats()
        t0 = time.time()
        frames = pipe(image=image, prompt=req.prompt, negative_prompt=req.negative_prompt, height=req.height, width=req.width,
                      num_frames=nf, num_inference_steps=req.steps, guidance_scale=req.guidance,
                      generator=torch.Generator(device="cpu").manual_seed(req.seed)).frames[0]
        elapsed = time.time() - t0
        media.frames_to_mp4(frames, req.out_path, fps=req.fps)
        peak = round(torch.cuda.max_memory_allocated() / 1024 ** 3, 2)
        del frames; gc.collect(); torch.cuda.empty_cache()
        return GenerationResult(path=Path(req.out_path), elapsed_s=round(elapsed, 1),
                                params={"model": self.model_id, "frames": nf, "fps": req.fps, "width": req.width, "height": req.height,
                                        "steps": req.steps, "guidance": req.guidance, "seed": req.seed, "dtype": self._dtype,
                                        "memory_mode": self._mode},
                                environment={**pre.facts, "peak_vram_gb": peak})
