"""Identidad facial consistente de Liora.

Descriptor: red ResNet de dlib (128 dimensiones, distancia euclídea) con alineación de 5 puntos.
Modelos del paquete face_recognition_models (copias de dlib-models). No se usa el predictor de 68
puntos de dlib (entrenado con iBUG 300-W, de uso no comercial).

El «paquete de identidad» guarda solo descriptores y huellas SHA-256 de las imágenes: las fotos
de Liora nunca se escriben en el repositorio público.
"""
from __future__ import annotations

import importlib.util
import json
import os
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

from . import media

# Umbrales para el descriptor de dlib (0.6 es el corte estándar de «misma persona»).
STRONG = 0.45
DOUBTFUL = 0.55
MAKEUP_TOLERANCE = 0.05  # etapas de caracterización intensa


def _models_dir() -> str:
    spec = importlib.util.find_spec("face_recognition_models")
    if not spec or not spec.origin:
        raise RuntimeError("Falta face_recognition_models (pip install 'liora-engine[identity]')")
    return os.path.join(os.path.dirname(spec.origin), "models")


class FaceEncoder:
    def __init__(self, upsample: int = 1):
        import dlib
        d = _models_dir()
        self._dlib = dlib
        self.detector = dlib.get_frontal_face_detector()
        self.sp = dlib.shape_predictor(os.path.join(d, "shape_predictor_5_face_landmarks.dat"))
        self.rec = dlib.face_recognition_model_v1(os.path.join(d, "dlib_face_recognition_resnet_model_v1.dat"))
        self._cnn = None
        self._cnn_path = os.path.join(d, "mmod_human_face_detector.dat")
        self.upsample = upsample

    def _detect(self, rgb: np.ndarray):
        dets = list(self.detector(rgb, self.upsample))
        if not dets:  # detector CNN más robusto con giros y maquillaje intenso (más lento en CPU)
            if self._cnn is None:
                self._cnn = self._dlib.cnn_face_detection_model_v1(self._cnn_path)
            dets = [d.rect for d in self._cnn(rgb, self.upsample)]
        return dets

    def encode_all(self, rgb: np.ndarray) -> list[dict]:
        """Todas las caras detectadas (el detector puede dar falsos positivos: no se asume que la mayor sea Liora)."""
        rgb = np.ascontiguousarray(rgb[..., :3])
        out = []
        for r in self._detect(rgb):
            desc = np.array(self.rec.compute_face_descriptor(rgb, self.sp(rgb, r), 1), dtype=np.float64)
            out.append({"descriptor": desc, "box": [r.left(), r.top(), r.width(), r.height()]})
        return out

    def encode(self, rgb: np.ndarray) -> dict | None:
        """Cara más grande (para registrar referencias, donde la foto debe tener una sola cara clara)."""
        faces = self.encode_all(rgb)
        if not faces:
            return None
        best = max(faces, key=lambda f: f["box"][2] * f["box"][3])
        return {**best, "faces": len(faces)}


def load_rgb(path: str | Path, max_side: int = 1600) -> np.ndarray:
    im = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    k = min(1.0, max_side / max(im.size))
    if k < 1:
        im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    return np.asarray(im)


def distance(a, b) -> float:
    return float(np.linalg.norm(np.asarray(a) - np.asarray(b)))


@dataclass
class IdentityPack:
    reference_id: str = "LIORA-IDENTIDAD-001"
    refs: list[dict] = field(default_factory=list)  # {sha256, angle, official, descriptor, accepted, distance_to_official}
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    @property
    def official(self) -> dict | None:
        return next((r for r in self.refs if r["official"]), None)

    def usable(self) -> list[np.ndarray]:
        return [np.array(r["descriptor"]) for r in self.refs if r["official"] or r.get("accepted")]

    def distance(self, desc) -> float:
        refs = self.usable()
        if not refs:
            raise RuntimeError("El paquete de identidad no tiene referencias utilizables")
        centroid = np.mean(refs, axis=0)
        return min(min(distance(desc, r) for r in refs), distance(desc, centroid))

    def save(self, path: str | Path) -> None:
        media.write_json(path, {"format": "liora-identity-pack-v1", "reference_id": self.reference_id, "created_at": self.created_at,
                                "refs": [{**r, "descriptor": [round(x, 6) for x in r["descriptor"]]} for r in self.refs]})

    @classmethod
    def load(cls, path: str | Path) -> "IdentityPack":
        d = json.loads(Path(path).read_text(encoding="utf-8"))
        if d.get("format") != "liora-identity-pack-v1":
            raise ValueError("Formato de paquete de identidad desconocido")
        return cls(reference_id=d["reference_id"], refs=d["refs"], created_at=d["created_at"])


def enroll(pack: IdentityPack, image: str | Path, *, angle: str = "frontal", official: bool = False,
           encoder: FaceEncoder | None = None) -> dict:
    """Añade una referencia. Las de ángulo solo se aceptan si coinciden con la oficial (≤ DOUBTFUL)."""
    enc = encoder or FaceEncoder()
    face = enc.encode(load_rgb(image))
    if face is None:
        raise ValueError(f"No se detecta ningún rostro en {image}")
    ref = {"sha256": media.sha256(image), "angle": angle, "official": official, "descriptor": face["descriptor"].tolist(),
           "faces_in_image": face["faces"], "added_at": datetime.now(timezone.utc).isoformat()}
    if official:
        if pack.official and pack.official["sha256"] != ref["sha256"]:
            raise ValueError("Ya existe una referencia oficial distinta; la identidad es inmutable (crea un paquete nuevo de forma explícita)")
        ref["accepted"] = True
    else:
        off = pack.official
        if not off:
            raise ValueError("Primero registra la fotografía oficial")
        d = distance(ref["descriptor"], off["descriptor"])
        ref["distance_to_official"] = round(d, 4)
        ref["accepted"] = d <= DOUBTFUL
    pack.refs = [r for r in pack.refs if r["sha256"] != ref["sha256"]] + [ref]
    return ref


def check_video(pack: IdentityPack, video: str | Path, *, stage_index: int = 0, every_s: float = 0.25,
                encoder: FaceEncoder | None = None) -> dict:
    """Distancia a la identidad oficial en fotogramas muestreados y veredicto pass/review/fail."""
    enc = encoder or FaceEncoder()
    tol = MAKEUP_TOLERANCE if stage_index >= 6 else 0.0
    series, jumps, prev, multi = [], [], None, 0
    frames = media.read_frames(video, every_s=every_s)
    for t, rgb in frames:
        faces = enc.encode_all(rgb)
        if not faces:
            series.append({"t": round(t, 3), "face": False})
            continue
        # la cara que más se parece a Liora; el resto cuenta como «otras caras»
        dists = [pack.distance(f["descriptor"]) for f in faces]
        k = int(np.argmin(dists))
        d, face = dists[k], faces[k]
        multi += len(faces) > 1
        if prev is not None and distance(face["descriptor"], prev) > 0.38:
            jumps.append(round(t, 3))
        prev = face["descriptor"]
        series.append({"t": round(t, 3), "face": True, "distance": round(d, 4)})
    ds = sorted(s["distance"] for s in series if s["face"])
    face_ratio = len(ds) / max(1, len(series))
    if not ds:
        return {"verdict": "fail", "reason": "No aparece el rostro de Liora", "series": series, "face_ratio": 0}
    median = ds[len(ds) // 2]
    p90 = ds[min(len(ds) - 1, int(len(ds) * 0.9))]
    deviating = sum(d > DOUBTFUL + tol for d in ds) / len(ds)
    if median > DOUBTFUL + tol or deviating > 0.2:
        verdict, reason = "fail", f"Rostro distinto (mediana {median:.3f}, {deviating:.0%} de fotogramas desviados)"
    elif median > STRONG + tol or p90 > DOUBTFUL + tol or face_ratio < 0.6 or jumps:
        verdict, reason = "review", f"Dudoso (mediana {median:.3f}, p90 {p90:.3f}, rostro en {face_ratio:.0%}, saltos {len(jumps)})"
    else:
        verdict, reason = "pass", f"Misma identidad (mediana {median:.3f})"
    return {"verdict": verdict, "reason": reason, "median": median, "p90": p90, "face_ratio": round(face_ratio, 3),
            "jumps": jumps, "multi_face_frames": multi, "tolerance": tol, "sampled": len(series), "series": series}
