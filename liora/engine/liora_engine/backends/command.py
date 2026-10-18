"""Adaptador genérico para modelos que se ejecutan con el script oficial de su repositorio.

Cada modelo se describe en catalog.json (comando con marcadores, requisitos, licencia).
Permite incorporar modelos nuevos sin tocar el código: solo una entrada nueva en el catálogo.
"""
from __future__ import annotations

import os
import shlex
import subprocess
import time
from pathlib import Path

from .. import media, probe
from .wan22 import frames_for
from .base import Backend, BackendError, GenerationRequest, GenerationResult, Preflight


def _env_key(backend_id: str, what: str) -> str:
    return "LIORA_" + backend_id.upper().replace("-", "_").replace(".", "_") + "_" + what


class CommandBackend(Backend):
    def __init__(self, spec: dict):
        super().__init__(spec)
        self.id = spec["id"]
        self.role = spec["role"]
        self.repo = os.environ.get(_env_key(self.id, "REPO"), "")
        self.ckpt = os.environ.get(_env_key(self.id, "CKPT"), "")

    def preflight(self) -> Preflight:
        issues, facts = [], {"repo_env": _env_key(self.id, "REPO"), "ckpt_env": _env_key(self.id, "CKPT")}
        if not self.spec.get("command"):
            issues.append("Adaptador sin comando verificado todavía")
        if not self.repo or not Path(self.repo).is_dir():
            issues.append(f"Repositorio oficial no encontrado ({facts['repo_env']})")
        if self.spec.get("needs_ckpt", True) and (not self.ckpt or not Path(self.ckpt).exists()):
            issues.append(f"Pesos no encontrados ({facts['ckpt_env']})")
        g = probe.gpu_facts()
        facts["gpu"] = g
        need = self.spec.get("requirements", {}).get("min_vram_gb_offload")
        if need:
            if not g.get("cuda"):
                issues.append("No hay GPU CUDA")
            elif g["vram_gb"] < need:
                issues.append(f"VRAM {g['vram_gb']} GB < {need} GB")
        return Preflight(ok=not issues, issues=issues, facts=facts)

    def build_command(self, req: GenerationRequest) -> list[str]:
        values = {
            "python": "python", "repo": self.repo, "ckpt": self.ckpt, "prompt": req.prompt, "negative_prompt": req.negative_prompt,
            "image": str(req.start_image or ""), "audio": str(req.audio or ""), "video": str(req.video or ""),
            "out": str(Path(req.out_path).resolve()), "out_dir": str(Path(req.out_path).resolve().parent), "width": req.width, "height": req.height, "size": f"{req.width}*{req.height}",
            "frames": frames_for(req.seconds, req.fps), "fps": req.fps, "seed": req.seed,
            "steps": req.steps, "guidance": req.guidance, "seconds": req.seconds, **req.extra,
        }
        return [part.format(**values) for part in self.spec["command"]]

    def generate(self, req: GenerationRequest) -> GenerationResult:
        pre = self.preflight()
        if not pre.ok:
            raise BackendError(f"{self.id} no ejecutable: " + "; ".join(pre.issues))
        cmd = self.build_command(req)
        t0 = time.time()
        p = subprocess.run(cmd, cwd=self.repo, capture_output=True, text=True)
        elapsed = time.time() - t0
        out = Path(req.out_path)
        if p.returncode == 0 and self.spec.get("output_glob") and not out.exists():
            found = sorted(out.parent.glob(self.spec["output_glob"]), key=lambda f: f.stat().st_mtime)
            if found and found[-1].stat().st_mtime >= t0:
                found[-1].rename(out)
        valid = out.is_file() and out.stat().st_size > 0 and (self.role == "music" or media.count_frames(out) > 0)
        if p.returncode != 0 or not valid:
            raise BackendError(f"{self.id} terminó sin salida válida (código {p.returncode}): {p.stderr[-800:]}")
        return GenerationResult(path=out, elapsed_s=round(elapsed, 1), params={"command": shlex.join(cmd)}, environment=pre.facts)
