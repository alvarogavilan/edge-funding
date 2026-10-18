"""Malla facial densa (MediaPipe Face Landmarker, Apache-2.0) para medir zonas de maquillaje."""
from __future__ import annotations

import hashlib
import os
import urllib.request
from pathlib import Path

import numpy as np

MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
MODEL_SHA256 = "64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff"

# Índices de la malla de 478 puntos de MediaPipe.
REGIONS = {
    "lips": [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185],
    "eyelid_left": [33, 246, 161, 160, 159, 158, 157, 173, 133, 190, 56, 28, 27, 29, 30, 247],
    "eyelid_right": [263, 466, 388, 387, 386, 385, 384, 398, 362, 414, 286, 258, 257, 259, 260, 467],
    "cheek_left": [50, 101, 118, 117, 116, 123, 147, 187, 205, 36],
    "cheek_right": [280, 330, 347, 346, 345, 352, 376, 411, 425, 266],
    "forehead": [10, 338, 297, 332, 67, 109, 151, 108, 69, 337, 299],
    "jaw_contour_left": [172, 136, 150, 149, 176, 58, 132],
    "jaw_contour_right": [397, 365, 379, 378, 400, 288, 361],
}


def model_path() -> Path:
    cache = Path(os.environ.get("LIORA_ENGINE_CACHE", Path.home() / ".cache" / "liora_engine"))
    cache.mkdir(parents=True, exist_ok=True)
    p = cache / "face_landmarker.task"
    if not p.exists():
        tmp = p.with_suffix(".part")
        urllib.request.urlretrieve(MODEL_URL, tmp)
        digest = hashlib.sha256(tmp.read_bytes()).hexdigest()
        if digest != MODEL_SHA256:
            tmp.unlink()
            raise RuntimeError(f"Huella inesperada del modelo de MediaPipe: {digest}")
        tmp.rename(p)
    return p


class FaceMesh:
    def __init__(self):
        import mediapipe as mp
        from mediapipe.tasks.python import BaseOptions, vision
        self._mp = mp
        opts = vision.FaceLandmarkerOptions(base_options=BaseOptions(model_asset_path=str(model_path())), num_faces=1)
        self.landmarker = vision.FaceLandmarker.create_from_options(opts)

    def _detect(self, rgb: np.ndarray) -> np.ndarray | None:
        img = self._mp.Image(image_format=self._mp.ImageFormat.SRGB, data=np.ascontiguousarray(rgb[..., :3]))
        res = self.landmarker.detect(img)
        if not res.face_landmarks:
            return None
        h, w = rgb.shape[:2]
        return np.array([[p.x * w, p.y * h] for p in res.face_landmarks[0]])

    def _face_boxes(self, rgb: np.ndarray) -> list[tuple[int, int, int, int]]:
        """Cajas candidatas: detector de dlib si está instalado y, si no, recortes cuadrados del tercio superior/central."""
        h, w = rgb.shape[:2]
        try:
            import dlib
            if not hasattr(self, "_dlib_det"):
                self._dlib_det = dlib.get_frontal_face_detector()
            dets = sorted(self._dlib_det(np.ascontiguousarray(rgb), 1), key=lambda d: -d.width() * d.height())
            if len(dets):
                return [(r.left(), r.top(), r.width(), r.height()) for r in dets]
        except ImportError:
            pass
        side = min(w, h)
        return [(0, max(0, int(h * f) - side // 2), side, side) for f in (0.35, 0.5, 0.25)]

    def points(self, rgb: np.ndarray) -> np.ndarray | None:
        """(478, 2) en píxeles o None. MediaPipe reduce la imagen a 128 px: en planos verticales completos
        la cara queda diminuta, así que se reintenta sobre un recorte cuadrado alrededor de la cara."""
        pts = self._detect(rgb)
        if pts is not None:
            return pts
        h, w = rgb.shape[:2]
        for x, y, bw, bh in self._face_boxes(rgb):
            cx, cy, half = x + bw / 2, y + bh / 2, max(bw, bh) * 1.1
            x0, y0 = int(max(0, cx - half)), int(max(0, cy - half))
            x1, y1 = int(min(w, cx + half)), int(min(h, cy + half))
            crop = rgb[y0:y1, x0:x1]
            if crop.size == 0:
                continue
            pts = self._detect(crop)
            if pts is not None:
                return pts + np.array([x0, y0])
        return None


def region_mask(shape: tuple[int, int], pts: np.ndarray, idx: list[int]) -> np.ndarray:
    from PIL import Image, ImageDraw
    poly = pts[idx]
    # envolvente convexa para que el orden de los índices no importe
    hull = _convex_hull(poly)
    m = Image.new("L", (shape[1], shape[0]), 0)
    ImageDraw.Draw(m).polygon([tuple(p) for p in hull], fill=255)
    return np.asarray(m) > 0


def _convex_hull(p: np.ndarray) -> np.ndarray:
    pts = sorted(map(tuple, p))
    if len(pts) <= 2:
        return np.array(pts)

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lower, upper = [], []
    for q in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], q) <= 0:
            lower.pop()
        lower.append(q)
    for q in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], q) <= 0:
            upper.pop()
        upper.append(q)
    return np.array(lower[:-1] + upper[:-1])
