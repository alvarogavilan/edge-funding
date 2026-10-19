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
        self.model_id = os.environ.get(spec.get("model_env", "LIORA_WAN22_TI2V"), spec["model"])
        self.label = spec.get("label", "Wan 2.2")
        self._pipe = None
        self._mode = self._task = None
        self._placement_used = None

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
        if not g.get("cuda") and os.environ.get("LIORA_ALLOW_CPU") == "1":
            facts["cpu_test_mode"] = "LIORA_ALLOW_CPU=1: solo para validar la canalización con un modelo diminuto"
        elif not g.get("cuda"):
            issues.append("No hay GPU CUDA: Wan 2.2 5B no es ejecutable en CPU en un tiempo útil")
        else:
            need = self.spec["requirements"]["min_vram_gb_offload"]
            # Una T4 se anuncia como 15 GB (15360 MiB) y PyTorch informa 14,56 GiB: no rechazar por GB/GiB.
            if g["vram_gb"] < need - 0.75:
                issues.append(f"VRAM {g['vram_gb']} GiB < {need} GB nominales con descarga a CPU")
            elif g["vram_gb"] < need:
                facts["vram_warning"] = f"{g['vram_gb']} GiB (cifra nominal cercana a {need} GB): ejecución experimental, puede agotar la memoria"
            if float(g.get("capability", "0")) < 8:
                facts["dtype_warning"] = "GPU anterior a Ampere: se usará fp16 (Wan se entrenó en bf16; si salen fotogramas negros, LIORA_DTYPE=bfloat16)"
        ram = probe._meminfo_gb("MemTotal") or 0
        if ram < self.spec["requirements"]["min_ram_gb"] and not facts.get("cpu_test_mode"):
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

    def _dtype(self):
        """bf16 nativo solo en Ampere o posterior (cc ≥ 8). En T4/P100 se usa fp16: la emulación bf16 es muy lenta.
        LIORA_DTYPE=bfloat16|float16|float32 lo fuerza (p. ej. si fp16 produce fotogramas negros)."""
        import torch
        forced = os.environ.get("LIORA_DTYPE")
        if forced:
            return getattr(torch, forced)
        if not torch.cuda.is_available():
            return torch.float32
        major, _ = torch.cuda.get_device_capability(0)
        return torch.bfloat16 if major >= 8 else torch.float16

    def _placement(self) -> dict | None:
        """Reparto manual de componentes (sin sumar memorias de GPU distintas).
        Con 2 GPU de ≥ 14 GiB (2 × T4): texto en CPU (bf16), transformador en cuda:0, VAE en cuda:1.
        LIORA_DEVICES="text_encoder=cpu,transformer=cuda:0,vae=cuda:1" lo fuerza."""
        import torch
        forced = os.environ.get("LIORA_DEVICES")
        if forced:
            return dict(kv.split("=") for kv in forced.split(","))
        if torch.cuda.device_count() >= 2 and all(
                torch.cuda.get_device_properties(i).total_memory / 1024 ** 3 >= 14 for i in (0, 1)):
            return {"text_encoder": "cpu", "transformer": "cuda:0", "vae": "cuda:1"}
        if torch.cuda.device_count() == 1 and self.spec.get("fits_single_gpu"):
            return {"text_encoder": "cpu", "transformer": "cuda:0", "vae": "cuda:0"}
        return None

    # Puntos de extensión para otros modelos de la familia Wan (p. ej. VACE).
    def _pipeline_class(self, task: str):
        from diffusers import WanImageToVideoPipeline, WanPipeline
        return WanImageToVideoPipeline if task == "image-to-video" else WanPipeline

    def _post_load(self, pipe) -> None:
        pass

    def _task_and_args(self, req: GenerationRequest, nf: int) -> tuple[str, dict]:
        task = "image-to-video" if req.start_image else "text-to-video"
        args = dict(prompt=req.prompt, negative_prompt=req.negative_prompt, height=req.height, width=req.width, num_frames=nf,
                    num_inference_steps=req.steps, guidance_scale=req.guidance)
        if req.start_image:
            args["image"] = fit_image(req.start_image, req.width, req.height)
        return task, args

    def _load(self, task: str, mode: str | None = None):
        """Carga una sola canalización a la vez (texto→vídeo o imagen→vídeo; mismos pesos)."""
        if self._pipe is not None and self._task == task and (mode is None or mode == self._mode):
            return self._pipe
        import torch
        from diffusers import AutoencoderKLWan
        from transformers import UMT5EncoderModel
        self._unload()
        dtype = self._dtype()
        cls = self._pipeline_class(task)
        placement = self._placement() if mode in (None, "split") else None
        vae = AutoencoderKLWan.from_pretrained(self.model_id, subfolder="vae", torch_dtype=torch.float32)
        if placement:
            # El codificador UMT5 se desborda en fp16: en CPU con bf16 (precisión de entrenamiento), una vez por prompt.
            te_dev = placement.get("text_encoder", "cpu")
            te_dtype = torch.bfloat16 if te_dev == "cpu" and dtype != torch.float32 else dtype
            text_encoder = UMT5EncoderModel.from_pretrained(self.model_id, subfolder="text_encoder", torch_dtype=te_dtype)
            pipe = cls.from_pretrained(self.model_id, vae=vae, text_encoder=text_encoder, torch_dtype=dtype)
            pipe.text_encoder.to(te_dev)
            pipe.transformer.to(placement["transformer"])
            pipe.vae.to(placement["vae"])
            mode = "split"
            self._placement_used = {**placement, "text_encoder_dtype": str(te_dtype).split(".")[-1]}
        else:
            pipe = cls.from_pretrained(self.model_id, vae=vae, torch_dtype=dtype)
            vram = torch.cuda.get_device_properties(0).total_memory / 1024 ** 3
            mode = mode or ("gpu" if vram >= 40 else "model_cpu_offload" if vram >= 14 else "sequential_cpu_offload")
            if mode == "gpu":
                pipe.to("cuda")
            elif mode == "model_cpu_offload":
                pipe.enable_model_cpu_offload()
            else:
                pipe.enable_sequential_cpu_offload()
            self._placement_used = None
        try:
            pipe.vae.enable_tiling()
        except Exception:  # noqa: BLE001
            pass
        self._post_load(pipe)
        self._mode, self._task, self._dtype_name = mode, task, str(dtype).split(".")[-1]
        self._pipe = pipe
        return pipe

    def _unload(self):
        if self._pipe is None:
            return
        import torch
        self._pipe = None
        gc.collect(); torch.cuda.empty_cache()

    def generate(self, req: GenerationRequest) -> GenerationResult:
        pre = self.preflight()
        if not pre.ok:
            raise BackendError(f"{self.label} no ejecutable: " + "; ".join(pre.issues))
        import torch
        nf = frames_for(req.seconds, req.fps)
        task, args = self._task_and_args(req, nf)
        t_load = time.time()
        self._load(task)
        load_s = time.time() - t_load
        attempts = []
        while True:
            pipe = self._pipe
            for d in range(torch.cuda.device_count()):
                torch.cuda.reset_peak_memory_stats(d)
            t0 = time.time()
            try:
                frames = pipe(**args, generator=torch.Generator(device="cpu").manual_seed(req.seed)).frames[0]
                break
            except torch.cuda.OutOfMemoryError as e:
                attempts.append({"mode": self._mode, "error": "CUDA OOM: " + str(e)[:200]})
                if self._mode == "sequential_cpu_offload":
                    raise BackendError("Sin memoria de GPU incluso con descarga secuencial: " + str(e)[:300]) from e
                gc.collect(); torch.cuda.empty_cache()
                self._load(task, "model_cpu_offload" if self._mode in ("gpu", "split") else "sequential_cpu_offload")
        elapsed = time.time() - t0
        media.frames_to_mp4(frames, req.out_path, fps=req.fps)
        peak = {f"cuda:{d}": round(torch.cuda.max_memory_allocated(d) / 1024 ** 3, 2) for d in range(torch.cuda.device_count())}
        del frames; gc.collect(); torch.cuda.empty_cache()
        return GenerationResult(path=Path(req.out_path), elapsed_s=round(elapsed, 1),
                                params={"model": self.model_id, "task": task, "frames": nf, "fps": req.fps, "width": req.width,
                                        "height": req.height, "steps": req.steps, "guidance": req.guidance, "seed": req.seed,
                                        "dtype": self._dtype_name, "memory_mode": self._mode, "load_s": round(load_s, 1),
                                        "oom_retries": attempts, "placement": self._placement_used},
                                environment={**pre.facts, "peak_vram_gb": peak})
