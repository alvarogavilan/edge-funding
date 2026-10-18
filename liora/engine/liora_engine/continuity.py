"""Continuidad del maquillaje entre escenas.

Mide el color medio (CIELAB) de cada zona facial al inicio y al final de cada clip:
  · en el corte entre escenas no debe haber salto (ΔE pequeño entre el final de N y el inicio de N+1);
  · dentro de la escena, la zona trabajada debe cambiar y las ya maquilladas no deben retroceder;
  · cambios bruscos entre fotogramas seguidos en la zona trabajada = maquillaje «mágico».
Son mediciones, no juicios estéticos: la revisión humana decide.
"""
from __future__ import annotations

import numpy as np

from . import media
from .landmarks import REGIONS, FaceMesh, region_mask

STAGE_FOCUS = {
    "inicial": [],
    "piel": ["forehead", "cheek_left", "cheek_right"],
    "base": ["forehead", "cheek_left", "cheek_right", "jaw_contour_left", "jaw_contour_right"],
    "ojos": ["eyelid_left", "eyelid_right"],
    "delineado": ["eyelid_left", "eyelid_right"],
    "labios": ["lips"],
    "caracterizacion": ["cheek_left", "cheek_right", "eyelid_left", "eyelid_right"],
    "final": [],
}
CUT_MAX_DE = 8.0       # salto máximo admitido en el corte entre escenas
REGRESS_MAX_DE = 10.0  # cambio máximo en zonas que no se trabajan en la escena
FOCUS_MIN_DE = 3.0     # cambio mínimo esperado en la zona trabajada
ABRUPT_DE = 12.0       # salto entre fotogramas muestreados consecutivos


def rgb_to_lab(rgb: np.ndarray) -> np.ndarray:
    c = rgb.astype(np.float64) / 255.0
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    m = np.array([[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.0721750], [0.0193339, 0.1191920, 0.9503041]])
    xyz = c @ m.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 216 / 24389, np.cbrt(xyz), (24389 / 27 * xyz + 16) / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], axis=-1)


def region_lab(rgb: np.ndarray, pts: np.ndarray) -> dict[str, list[float]]:
    lab = rgb_to_lab(rgb)
    out = {}
    for name, idx in REGIONS.items():
        m = region_mask(rgb.shape[:2], pts, idx)
        if m.sum() < 20:
            continue
        out[name] = np.median(lab[m], axis=0).round(2).tolist()
    return out


def delta_e(a, b) -> float:
    return float(np.linalg.norm(np.asarray(a) - np.asarray(b)))


def profile(video, *, every_s: float = 0.25, mesh: FaceMesh | None = None) -> dict:
    """Serie de color por zona a lo largo del clip."""
    mesh = mesh or FaceMesh()
    series = []
    for t, rgb in media.read_frames(video, every_s=every_s):
        pts = mesh.points(rgb)
        if pts is not None:
            series.append({"t": round(t, 3), "lab": region_lab(rgb, pts)})
    return {"series": series}


def _agg(series: list[dict], which: str, n: int = 3) -> dict[str, list[float]]:
    part = series[:n] if which == "start" else series[-n:]
    regions = set().union(*(s["lab"].keys() for s in part)) if part else set()
    return {r: np.median([s["lab"][r] for s in part if r in s["lab"]], axis=0).round(2).tolist() for r in regions}


def evaluate(stage_key: str, prof: dict, prev_end: dict | None) -> dict:
    s = prof["series"]
    if len(s) < 2:
        return {"verdict": "fail", "reason": "No se detecta la malla facial en suficientes fotogramas"}
    start, end = _agg(s, "start"), _agg(s, "end")
    focus = STAGE_FOCUS.get(stage_key, [])
    issues, notes = [], []
    cut = {}
    if prev_end:
        cut = {r: round(delta_e(prev_end[r], start[r]), 2) for r in prev_end if r in start}
        jumps = {r: d for r, d in cut.items() if d > CUT_MAX_DE}
        if jumps:
            issues.append(f"Salto en el corte con la escena anterior: {jumps}")
    change = {r: round(delta_e(start[r], end[r]), 2) for r in start if r in end}
    if focus:
        worked = {r: change.get(r, 0) for r in focus}
        if all(d < FOCUS_MIN_DE for d in worked.values()):
            issues.append(f"La zona trabajada apenas cambia: {worked}")
        else:
            notes.append(f"Cambio en zona trabajada: {worked}")
    regress = {r: d for r, d in change.items() if r not in focus and d > REGRESS_MAX_DE}
    if regress:
        issues.append(f"Zonas no trabajadas cambian (posible retroceso o maquillaje que aparece/desaparece): {regress}")
    abrupt = []
    for r in focus or []:
        for a, b in zip(s, s[1:]):
            if r in a["lab"] and r in b["lab"] and delta_e(a["lab"][r], b["lab"][r]) > ABRUPT_DE:
                abrupt.append({"t": b["t"], "region": r})
    if abrupt:
        issues.append(f"Cambios bruscos entre fotogramas: {abrupt[:6]}")
    verdict = "fail" if any(k.startswith("Salto en el corte") for k in issues) else ("review" if issues else "pass")
    return {"verdict": verdict, "issues": issues, "notes": notes, "cut_delta_e": cut, "change_delta_e": change,
            "start": start, "end": end, "focus": focus}
