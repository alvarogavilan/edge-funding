"""Utilidades SOLO para pruebas. FixtureZoomBackend NO genera contenido: anima la imagen de entrada con un
zoom de FFmpeg para poder probar el encadenado, la identidad, la continuidad y el montaje sin GPU."""
import time
from pathlib import Path

from liora_engine import media
from liora_engine.backends.base import Backend, GenerationResult, Preflight


class FixtureZoomBackend(Backend):
    id = "fixture-zoom-NO-GENERATIVO"
    role = "video"

    def __init__(self, ok=True):
        super().__init__({"license": {"spdx": "test-only"}})
        self.ok = ok

    def preflight(self):
        return Preflight(ok=self.ok, issues=[] if self.ok else ["fixture bloqueado a propósito"])

    def generate(self, req):
        t0 = time.time()
        n = int(req.seconds * req.fps)
        media.run(["-loop", "1", "-i", str(req.start_image), "-vf",
                   f"scale={req.width * 2}:{req.height * 2}:force_original_aspect_ratio=increase,crop={req.width * 2}:{req.height * 2},"
                   f"zoompan=z='1+0.0008*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s={req.width}x{req.height}:fps={req.fps}",
                   "-frames:v", str(n), "-c:v", "libx264", "-pix_fmt", "yuv420p", str(req.out_path)])
        return GenerationResult(path=Path(req.out_path), elapsed_s=round(time.time() - t0, 2), params={"fixture": True}, environment={})


def portrait(face_img, out, width=704, height=1280):
    """Retrato vertical con el rostro centrado arriba (como un plano de tocador)."""
    from PIL import Image
    im = Image.open(face_img).convert("RGB")
    canvas = Image.new("RGB", (width, height), (40, 32, 38))
    k = width * 0.95 / im.width
    im = im.resize((round(im.width * k), round(im.height * k)))
    canvas.paste(im, ((width - im.width) // 2, 250))
    canvas.save(out)
    return out
