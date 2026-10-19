"""Genera el material de lanzamiento de @lioravalemakeup: teaser vertical «La Reina del Eclipse» y portadas.

Pieza GRÁFICA original (animación procedural de un eclipse con tipografía), no vídeo generado con IA ni imagen de
Liora: no se inventa su rostro. Música: instrumental original de Liora Studio (js/music-original.js) exportada a WAV.
Uso: python generar_lanzamiento.py --wav eclipse.wav --out .
Fuentes: Caladea (Apache-2.0) e Inter (OFL), instaladas en el sistema.
"""
import argparse
import hashlib
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "engine"))
from liora_engine import media  # noqa: E402

W, H, FPS, SECONDS = 1080, 1920, 30, 12
SERIF = "/usr/share/fonts/truetype/crosextra/Caladea-Regular.ttf"
SERIF_I = "/usr/share/fonts/truetype/crosextra/Caladea-Italic.ttf"
SANS = "/usr/share/fonts/opentype/inter/Inter-Light.otf"

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
rng = np.random.default_rng(20261019)
STARS = np.c_[rng.uniform(0, W, 420), rng.uniform(0, H * 0.75, 420), rng.uniform(0.3, 1.0, 420), rng.uniform(0, 6.28, 420)]
DUST = np.c_[rng.uniform(0, W, 160), rng.uniform(0, H, 160), rng.uniform(1.0, 3.2, 160), rng.uniform(8, 30, 160)]
SUN = np.array([W * 0.5, H * 0.38])
R = 190.0


def ease(t):
    t = min(max(t, 0.0), 1.0)
    return t * t * (3 - 2 * t)


def background():
    g = (yy / H)[..., None]
    top, bottom = np.array([7, 6, 14], np.float32), np.array([30, 16, 46], np.float32)
    bg = top * (1 - g) + bottom * g
    d = np.hypot(xx - SUN[0], yy - SUN[1])[..., None]
    bg += np.array([60, 40, 90], np.float32) * np.exp(-(d / 700) ** 2)  # halo nocturno violeta
    return bg


BG = background()


def frame(t):
    img = BG.copy()
    # estrellas que titilan
    for x, y, b, ph in STARS:
        tw = 0.55 + 0.45 * math.sin(t * 2.2 + ph)
        xi, yi = int(x), int(y)
        img[max(0, yi - 1):yi + 2, max(0, xi - 1):xi + 2] += 140 * b * tw
    # posición de la luna: entra desde arriba a la izquierda y cubre el sol entre 1,5 s y 6,5 s
    k = ease((t - 1.5) / 5.0)
    moon = SUN + (1 - k) * np.array([-420.0, -300.0])
    d_sun = np.hypot(xx - SUN[0], yy - SUN[1])
    d_moon = np.hypot(xx - moon[0], yy - moon[1])
    cover = ease((t - 4.5) / 2.0)
    # corona: más intensa cuanto más tapado el sol
    corona = np.exp(-np.clip(d_sun - R, 0, None) / (60 + 120 * cover)) * (0.35 + 0.9 * cover)
    ang = np.arctan2(yy - SUN[1], xx - SUN[0])
    rays = (np.sin(ang * 7 + t * 0.3) * 0.5 + np.sin(ang * 13 + 1.7 - t * 0.2) * 0.3 + np.sin(ang * 29 + 0.4) * 0.2)
    corona *= 0.85 + 0.15 * rays * np.clip((d_sun - R) / 120, 0, 1)
    img += corona[..., None] * np.array([200, 205, 235], np.float32)
    # disco solar visible donde no lo tapa la luna
    sun_disk = (d_sun < R) & (d_moon >= R * 1.02)
    img[sun_disk] = img[sun_disk] * 0.2 + np.array([255, 236, 200]) * (1.0 - 0.85 * cover)
    # luna (negra, con borde plateado sutil)
    moon_disk = d_moon < R * 1.02
    img[moon_disk] = np.array([4, 3, 8])
    rim = np.exp(-np.abs(d_moon - R * 1.02) / 3.0) * cover
    img += rim[..., None] * np.array([170, 175, 210])
    # «anillo de diamante» al completarse el eclipse
    ring_t = math.exp(-((t - 6.6) / 0.35) ** 2)
    if ring_t > 0.01:
        p = SUN + np.array([R * 0.7, -R * 0.7])
        dr = np.hypot(xx - p[0], yy - p[1])
        img += (np.exp(-(dr / 28) ** 2) * 255 * ring_t)[..., None]
        img += (np.exp(-(dr / 220) ** 2) * 90 * ring_t)[..., None]
        inner = d_moon < R * 0.98
        img[inner] = np.minimum(img[inner], np.array([8, 7, 14]) + 120 * ring_t * np.exp(-(dr[inner] / 28) ** 2)[..., None])
    # polvo plateado que asciende
    for x, y, s, sp in DUST:
        yd = (y - t * sp) % H
        xd = x + 14 * math.sin(t * 0.7 + y)
        a = 0.5 + 0.5 * math.sin(t * 3 + x)
        xi, yi = int(xd), int(yd)
        r = int(s)
        img[max(0, yi - r):yi + r, max(0, xi - r):xi + r] += 90 * a
    return np.clip(img, 0, 255).astype(np.uint8)


def font(path, size):
    return ImageFont.truetype(path, size)


def spaced(draw, text, y, f, fill, spacing):
    widths = [draw.textlength(c, font=f) for c in text]
    total = sum(widths) + spacing * (len(text) - 1)
    x = (W - total) / 2
    for c, w in zip(text, widths):
        draw.text((x, y), c, font=f, fill=fill)
        x += w + spacing


def titles(base: Image.Image, t: float) -> Image.Image:
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    a1 = ease((t - 6.8) / 1.2)
    a2 = ease((t - 8.0) / 1.2)
    a3 = ease((t - 9.2) / 1.0)
    if a1 > 0:
        spaced(d, "LIORA VALE", 1180, font(SERIF, 112), (238, 232, 248, int(255 * a1)), 18)
    if a2 > 0:
        f = font(SERIF_I, 64)
        txt = "La Reina del Eclipse"
        d.text(((W - d.textlength(txt, font=f)) / 2, 1330), txt, font=f, fill=(206, 196, 232, int(255 * a2)))
        d.line([(W / 2 - 160, 1440), (W / 2 + 160, 1440)], fill=(190, 190, 220, int(160 * a2)), width=2)
    if a3 > 0:
        f = font(SANS, 40)
        for i, txt in enumerate(["MUY PRONTO", "@lioravalemakeup"]):
            d.text(((W - d.textlength(txt, font=f)) / 2, 1490 + i * 64), txt, font=f, fill=(225, 220, 240, int(230 * a3)))
    glow = layer.filter(ImageFilter.GaussianBlur(14))
    out = Image.alpha_composite(base.convert("RGBA"), glow)
    return Image.alpha_composite(out, layer).convert("RGB")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--wav", required=True)
    ap.add_argument("--out", default=".")
    a = ap.parse_args()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    frames = []
    for i in range(FPS * SECONDS):
        t = i / FPS
        img = titles(Image.fromarray(frame(t)), t)
        fade = min(1.0, t / 0.8, (SECONDS - t) / 0.8)
        frames.append((np.asarray(img).astype(np.float32) * fade).astype(np.uint8))
    silent = out / "_teaser_sin_audio.mp4"
    media.frames_to_mp4(frames, silent, fps=FPS)
    teaser = out / "teaser-reina-del-eclipse.mp4"
    media.run(["-i", str(silent), "-i", a.wav, "-filter_complex", f"[1:a]atrim=0:{SECONDS},afade=t=in:d=0.8,afade=t=out:st={SECONDS - 1.5}:d=1.5[a]",
               "-map", "0:v", "-map", "[a]", "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p", "-crf", "16",
               "-preset", "slow", "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-movflags", "+faststart", "-shortest", str(teaser)])
    silent.unlink()
    # portadas: fotograma con títulos completos
    cover = titles(Image.fromarray(frame(10.5)), 10.5)
    cover.save(out / "portada-9x16.jpg", quality=93)
    crop = cover.crop((0, (H - 1350) // 2 + 120, W, (H - 1350) // 2 + 120 + 1350))
    crop.save(out / "portada-4x5.jpg", quality=93)
    info = media.probe(teaser)
    report = {"pieza": "Teaser gráfico original (animación procedural; no es vídeo generado con IA ni imagen de Liora)",
              "teaser": {"archivo": teaser.name, "sha256": media.sha256(teaser), "fotogramas": media.count_frames(teaser),
                         "probe": info, "safari": media.safari_check(info)},
              "portadas": {p: media.sha256(out / p) for p in ("portada-9x16.jpg", "portada-4x5.jpg")},
              "musica": "Instrumental original de Liora Studio (js/music-original.js), primeros 12 s",
              "fuentes": "Caladea (Apache-2.0), Inter (OFL)"}
    (out / "evidencia-lanzamiento.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
