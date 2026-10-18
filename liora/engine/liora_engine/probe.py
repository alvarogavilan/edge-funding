"""Medición real de la capacidad de cómputo disponible (CPU, RAM, disco, GPU, red)."""
from __future__ import annotations

import os
import platform
import shutil
import subprocess
import time
import urllib.request
from datetime import datetime, timezone

import numpy as np


def _meminfo_gb(key: str) -> float | None:
    try:
        for line in open("/proc/meminfo"):
            if line.startswith(key + ":"):
                return round(int(line.split()[1]) / 1024 / 1024, 2)
    except OSError:
        pass
    return None


def _reachable(url: str, timeout: float = 6.0) -> bool | str:
    try:
        req = urllib.request.Request(url, method="HEAD")
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status < 500
    except Exception as e:  # noqa: BLE001
        return type(e).__name__ + ": " + str(e)[:80]


def gpu_facts() -> dict:
    facts: dict = {"cuda": False}
    try:
        import torch
        facts["torch"] = torch.__version__
        if torch.cuda.is_available():
            p = torch.cuda.get_device_properties(0)
            facts.update(cuda=True, gpu_count=torch.cuda.device_count(), gpu_name=p.name,
                         vram_gb=round(p.total_memory / 1024 ** 3, 2), capability=f"{p.major}.{p.minor}",
                         bf16=torch.cuda.is_bf16_supported(), cuda_version=torch.version.cuda)
    except ImportError:
        facts["torch"] = None
    if not facts["cuda"] and shutil.which("nvidia-smi"):
        r = subprocess.run(["nvidia-smi", "--query-gpu=name,memory.total", "--format=csv,noheader"], capture_output=True, text=True)
        facts["nvidia_smi"] = r.stdout.strip() or r.stderr.strip()
    return facts


def benchmark(seconds: float = 3.0) -> dict:
    """Rendimiento de multiplicación de matrices: GPU (fp16/bf16) si existe, si no CPU fp32."""
    out = {}
    try:
        import torch
        if torch.cuda.is_available():
            for dt in [torch.float16] + ([torch.bfloat16] if torch.cuda.is_bf16_supported() else []):
                a = torch.randn(4096, 4096, device="cuda", dtype=dt)
                torch.cuda.synchronize(); t0 = time.time(); n = 0
                while time.time() - t0 < seconds:
                    a @ a; n += 1
                torch.cuda.synchronize()
                out[f"gpu_{str(dt).split('.')[-1]}_tflops"] = round(2 * 4096 ** 3 * n / (time.time() - t0) / 1e12, 2)
    except ImportError:
        pass
    a = np.random.rand(1024, 1024).astype(np.float32)
    t0, n = time.time(), 0
    while time.time() - t0 < seconds:
        a @ a; n += 1
    out["cpu_fp32_gflops"] = round(2 * 1024 ** 3 * n / (time.time() - t0) / 1e9, 1)
    return out


def capacity(bench: bool = False, workdir: str = ".") -> dict:
    du = shutil.disk_usage(workdir)
    rep = {
        "measured_at": datetime.now(timezone.utc).isoformat(),
        "host": platform.node(), "platform": platform.platform(), "python": platform.python_version(),
        "cpu_count": os.cpu_count(), "ram_total_gb": _meminfo_gb("MemTotal"), "ram_available_gb": _meminfo_gb("MemAvailable"),
        "disk_free_gb": round(du.free / 1024 ** 3, 1),
        "gpu": gpu_facts(),
        "network": {"huggingface.co": _reachable("https://huggingface.co/api/models/Wan-AI/Wan2.2-TI2V-5B-Diffusers")},
        "env_hints": {k: True for k in ("KAGGLE_KERNEL_RUN_TYPE", "COLAB_RELEASE_TAG", "SPACE_ID") if os.environ.get(k)},
    }
    if bench:
        rep["benchmark"] = benchmark()
    return rep
