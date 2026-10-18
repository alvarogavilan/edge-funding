"""Registro de motores a partir de catalog.json."""
from __future__ import annotations

import importlib
import json
from pathlib import Path

from .base import Backend, BackendError, GenerationRequest, GenerationResult, Preflight  # noqa: F401

CATALOG = Path(__file__).resolve().parent.parent / "catalog.json"


def catalog() -> dict:
    return json.loads(CATALOG.read_text(encoding="utf-8"))


def specs() -> dict[str, dict]:
    return {b["id"]: b for b in catalog()["backends"]}


def get(backend_id: str, extra_specs: dict[str, dict] | None = None) -> Backend:
    all_specs = {**specs(), **(extra_specs or {})}
    if backend_id not in all_specs:
        raise KeyError(f"Motor desconocido: {backend_id}. Disponibles: {', '.join(all_specs)}")
    spec = all_specs[backend_id]
    if spec["class"] == "command":
        from .command import CommandBackend
        return CommandBackend(spec)
    mod, cls = spec["class"].rsplit(".", 1)
    return getattr(importlib.import_module(f".{mod}", __package__), cls)(spec)
