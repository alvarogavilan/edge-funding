"""Contrato común de los motores. Cualquier modelo futuro se añade implementando Backend."""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import asdict, dataclass, field
from pathlib import Path


@dataclass
class Preflight:
    ok: bool
    issues: list[str] = field(default_factory=list)
    facts: dict = field(default_factory=dict)

    def as_dict(self) -> dict:
        return asdict(self)


@dataclass
class GenerationRequest:
    out_path: Path
    prompt: str = ""
    negative_prompt: str = ""
    start_image: Path | None = None
    ref_images: list[Path] = field(default_factory=list)
    audio: Path | None = None
    video: Path | None = None
    seconds: float = 5.0
    width: int = 704
    height: int = 1280
    fps: int = 24
    seed: int = 0
    steps: int = 40
    guidance: float = 5.0
    extra: dict = field(default_factory=dict)  # marcadores adicionales del catálogo (p. ej. genre_txt, lyrics_txt)


@dataclass
class GenerationResult:
    path: Path
    elapsed_s: float
    params: dict
    environment: dict


class BackendError(RuntimeError):
    pass


class Backend(ABC):
    id: str = ""
    role: str = ""  # video | singing | lipsync | music

    def __init__(self, spec: dict):
        self.spec = spec

    @property
    def license(self) -> dict:
        return self.spec.get("license", {})

    @abstractmethod
    def preflight(self) -> Preflight: ...

    @abstractmethod
    def generate(self, req: GenerationRequest) -> GenerationResult: ...
