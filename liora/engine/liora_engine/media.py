"""Vídeo y audio con FFmpeg (binario estático de imageio-ffmpeg, con libx264 y AAC).

Todo lo que sale del motor se normaliza a MP4 H.264 High yuv420p + AAC con «faststart»,
que es lo que Safari en iPhone reproduce sin problemas.
"""
from __future__ import annotations

import hashlib
import json
import re
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image


def ffmpeg_exe() -> str:
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def run(args: list[str]) -> subprocess.CompletedProcess:
    p = subprocess.run([ffmpeg_exe(), "-hide_banner", "-y", *args], capture_output=True, text=True)
    if p.returncode != 0:
        raise RuntimeError("ffmpeg falló: " + p.stderr[-1500:])
    return p


def sha256(path: str | Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


_DUR = re.compile(r"Duration: (\d+):(\d+):(\d+\.\d+)")
_AUD = re.compile(r"Stream #\S+.*Audio: (\w+)")


def probe(path: str | Path) -> dict:
    """Metadatos básicos leyendo la cabecera con ffmpeg -i (imageio-ffmpeg no incluye ffprobe)."""
    p = subprocess.run([ffmpeg_exe(), "-hide_banner", "-i", str(path)], capture_output=True, text=True)
    txt = p.stderr
    info: dict = {"path": str(path)}
    m = _DUR.search(txt)
    if m:
        info["duration"] = int(m[1]) * 3600 + int(m[2]) * 60 + float(m[3])
    vline = next((ln for ln in txt.splitlines() if "Video:" in ln), None)
    if vline:
        tail = vline.split("Video:", 1)[1]
        info["video_codec"] = tail.split()[0].strip(",")
        pf = re.search(r"\b((?:yuv|yuvj|rgb|bgr|gray|nv)\w*)", tail)
        size = re.search(r"\b(\d{2,5})x(\d{2,5})\b", tail)
        fps = re.search(r"([\d.]+) fps", tail)
        info["pix_fmt"] = pf[1] if pf else None
        if size:
            info["width"], info["height"] = int(size[1]), int(size[2])
        if fps:
            info["fps"] = float(fps[1])
    a = _AUD.search(txt)
    info["audio_codec"] = a[1] if a else None
    info["faststart"] = _moov_before_mdat(path)
    return info


def _moov_before_mdat(path: str | Path) -> bool:
    with open(path, "rb") as f:
        head = f.read(1 << 16)
    i, j = head.find(b"moov"), head.find(b"mdat")
    return i != -1 and (j == -1 or i < j)


def count_frames(path: str | Path) -> int:
    p = subprocess.run([ffmpeg_exe(), "-hide_banner", "-i", str(path), "-map", "0:v:0", "-f", "null", "-"], capture_output=True, text=True)
    found = re.findall(r"frame=\s*(\d+)", p.stderr)
    return int(found[-1]) if found else 0


def safari_check(info: dict) -> list[str]:
    issues = []
    if info.get("video_codec") != "h264":
        issues.append(f"códec {info.get('video_codec')} (se requiere h264)")
    if info.get("pix_fmt") != "yuv420p":
        issues.append(f"pix_fmt {info.get('pix_fmt')} (se requiere yuv420p)")
    if info.get("audio_codec") not in (None, "aac"):
        issues.append(f"audio {info.get('audio_codec')} (se requiere aac)")
    if not info.get("faststart"):
        issues.append("sin faststart (moov al final)")
    return issues


def encode_safari(src: str | Path, dst: str | Path, *, width: int = 1080, height: int = 1920, fps: int | None = None,
                  fit: str = "cover", crf: int = 17, audio: str | Path | None = None, audio_offset: float = 0.0,
                  keep_audio: bool = True) -> dict:
    """Reencoda a vertical 1080×1920 H.264/AAC con faststart. fit: cover (recorta) o contain (barras)."""
    if fit == "cover":
        vf = f"scale={width}:{height}:force_original_aspect_ratio=increase:flags=lanczos,crop={width}:{height}"
    else:
        vf = f"scale={width}:{height}:force_original_aspect_ratio=decrease:flags=lanczos,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2"
    vf += ",setsar=1"
    if fps:
        vf += f",fps={fps}"
    args = ["-i", str(src)]
    if audio:
        args += ["-ss", f"{audio_offset:.3f}", "-i", str(audio)]
    args += ["-vf", vf, "-c:v", "libx264", "-profile:v", "high", "-level:v", "4.2", "-pix_fmt", "yuv420p",
             "-preset", "slow", "-crf", str(crf), "-movflags", "+faststart"]
    if audio:
        args += ["-map", "0:v:0", "-map", "1:a:0", "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-shortest"]
    elif keep_audio:
        args += ["-map", "0:v:0", "-map", "0:a?", "-c:a", "aac", "-b:a", "256k", "-ar", "48000"]
    else:
        args += ["-an"]
    run([*args, str(dst)])
    return probe(dst)


def concat(clips: list[str | Path], dst: str | Path, *, audio: str | Path | None = None, audio_offset: float = 0.0,
           width: int = 1080, height: int = 1920, fps: int = 30) -> dict:
    """Une escenas (normalizando tamaño y fps) y, si se indica, sustituye el audio por la canción completa."""
    inputs, filters = [], []
    for i, c in enumerate(clips):
        inputs += ["-i", str(c)]
        filters.append(f"[{i}:v:0]scale={width}:{height}:force_original_aspect_ratio=increase:flags=lanczos,"
                       f"crop={width}:{height},setsar=1,fps={fps},format=yuv420p[v{i}]")
    graph = ";".join(filters) + ";" + "".join(f"[v{i}]" for i in range(len(clips))) + f"concat=n={len(clips)}:v=1:a=0[v]"
    args = [*inputs]
    if audio:
        args += ["-ss", f"{audio_offset:.3f}", "-i", str(audio)]
    args += ["-filter_complex", graph, "-map", "[v]"]
    if audio:
        args += ["-map", f"{len(clips)}:a:0", "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-shortest"]
    else:
        args += ["-an"]
    args += ["-c:v", "libx264", "-profile:v", "high", "-level:v", "4.2", "-pix_fmt", "yuv420p", "-preset", "slow",
             "-crf", "17", "-movflags", "+faststart", str(dst)]
    run(args)
    return probe(dst)


def frames_to_mp4(frames: list[np.ndarray] | np.ndarray, dst: str | Path, fps: int) -> dict:
    """Escribe fotogramas RGB (uint8 o float 0–1) a MP4 H.264 sin pérdidas perceptibles."""
    import imageio_ffmpeg
    arr = [np.asarray(f) for f in frames]
    if arr[0].dtype != np.uint8:
        arr = [(np.clip(f, 0, 1) * 255).round().astype(np.uint8) for f in arr]
    h, w = arr[0].shape[:2]
    writer = imageio_ffmpeg.write_frames(str(dst), (w, h), fps=fps, codec="libx264", pix_fmt_out="yuv420p",
                                         output_params=["-crf", "12", "-preset", "slow", "-movflags", "+faststart"], macro_block_size=1)
    writer.send(None)
    for f in arr:
        writer.send(np.ascontiguousarray(f))
    writer.close()
    return probe(dst)


def read_frames(path: str | Path, *, every_s: float = 0.25, max_frames: int = 120, max_side: int = 720) -> list[tuple[float, np.ndarray]]:
    """Fotogramas muestreados (t, RGB uint8)."""
    import imageio_ffmpeg
    info = probe(path)
    dur = info.get("duration") or 0
    sample_fps = min(1 / every_s, max_frames / dur) if dur else 1 / every_s
    reader = imageio_ffmpeg.read_frames(str(path), output_params=["-vf", f"fps={sample_fps:.4f},scale='min({max_side},iw)':-2"])
    meta = next(reader)
    w, h = meta["size"]
    out = []
    for i, buf in enumerate(reader):
        out.append(((i + 0.5) / sample_fps, np.frombuffer(buf, np.uint8).reshape(h, w, 3).copy()))
        if len(out) >= max_frames:
            break
    reader.close()
    return out


def degenerate_frames(path: str | Path) -> dict:
    """Detecta salidas rotas (negro, blanco o imagen congelada; típico de desbordes en fp16)."""
    fr = read_frames(path, every_s=0.25, max_frames=40, max_side=256)
    if not fr:
        return {"ok": False, "reason": "sin fotogramas"}
    means = [float(f.mean()) for _, f in fr]
    stds = [float(f.std()) for _, f in fr]
    diffs = [float(np.abs(fr[i][1].astype(int) - fr[i - 1][1].astype(int)).mean()) for i in range(1, len(fr))]
    issues = []
    if sum(m < 8 for m in means) > len(means) * 0.2:
        issues.append("fotogramas negros")
    if sum(m > 247 for m in means) > len(means) * 0.2:
        issues.append("fotogramas blancos")
    if sum(s < 3 for s in stds) > len(stds) * 0.2:
        issues.append("fotogramas planos (sin imagen)")
    if diffs and max(diffs) < 0.2:
        issues.append("sin movimiento: imagen congelada")
    return {"ok": not issues, "issues": issues, "mean_luma": round(float(np.mean(means)), 1), "max_motion": round(max(diffs or [0]), 2)}


def last_frame(path: str | Path, dst: str | Path) -> Path:
    """Último fotograma a resolución completa (PNG sin pérdidas): punto de partida de la siguiente escena."""
    with tempfile.TemporaryDirectory() as td:
        pattern = str(Path(td) / "f%05d.png")
        run(["-sseof", "-0.5", "-i", str(path), "-vsync", "0", pattern])
        files = sorted(Path(td).glob("f*.png"))
        if not files:
            raise RuntimeError("No se pudo extraer el último fotograma")
        Image.open(files[-1]).save(dst)
    return Path(dst)


def first_frame(path: str | Path, dst: str | Path) -> Path:
    run(["-i", str(path), "-frames:v", "1", str(dst)])
    return Path(dst)


def slice_audio(src: str | Path, dst: str | Path, start: float, end: float) -> Path:
    run(["-ss", f"{start:.3f}", "-to", f"{end:.3f}", "-i", str(src), "-ac", "2", "-ar", "48000", str(dst)])
    return Path(dst)


def write_json(path: str | Path, data: dict) -> None:
    Path(path).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
