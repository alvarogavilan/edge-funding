"""Pruebas reales del motor (CPU). Requieren FACE_IMG=<retrato de prueba de uso libre>.
Ejecutar: FACE_IMG=astronaut.png python -m unittest discover -s tests -v"""
import json
import os
import tempfile
import unittest
from pathlib import Path

import numpy as np
from PIL import Image

from liora_engine import media, pipeline
from liora_engine.backends import get, specs
from liora_engine.backends.wan22 import frames_for

FACE = os.environ.get("FACE_IMG")
TMP = Path(tempfile.mkdtemp(prefix="liora-engine-test-"))


def tone(path, seconds=12):
    media.run(["-f", "lavfi", "-i", f"sine=frequency=440:duration={seconds}", "-ac", "2", str(path)])
    return path


class Media(unittest.TestCase):
    def test_frames_to_safari_mp4(self):
        frames = [np.full((1280, 704, 3), i * 4, np.uint8) for i in range(48)]
        info = media.frames_to_mp4(frames, TMP / "f.mp4", fps=24)
        self.assertEqual((info["width"], info["height"], info["video_codec"], info["pix_fmt"]), (704, 1280, "h264", "yuv420p"))
        self.assertTrue(info["faststart"])
        self.assertEqual(media.count_frames(TMP / "f.mp4"), 48)
        out = media.encode_safari(TMP / "f.mp4", TMP / "f1080.mp4", audio=tone(TMP / "t.wav", 2))
        self.assertEqual((out["width"], out["height"], out["audio_codec"]), (1080, 1920, "aac"))
        self.assertEqual(media.safari_check(out), [])

    def test_degenerate_outputs_detected(self):
        media.frames_to_mp4([np.zeros((256, 144, 3), np.uint8)] * 24, TMP / "negro.mp4", fps=24)
        self.assertIn("fotogramas negros", media.degenerate_frames(TMP / "negro.mp4")["issues"])
        still = np.random.default_rng(0).integers(0, 255, (256, 144, 3), dtype=np.uint8)
        media.frames_to_mp4([still] * 24, TMP / "quieto.mp4", fps=24)
        self.assertIn("sin movimiento: imagen congelada", media.degenerate_frames(TMP / "quieto.mp4")["issues"])

    def test_wan_frame_rule(self):
        self.assertEqual(frames_for(5, 24), 121)
        self.assertEqual((frames_for(3.4, 24) - 1) % 4, 0)


@unittest.skipUnless(FACE, "FACE_IMG no definido")
class Identity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from tests.fixtures import portrait
        from liora_engine.identity import FaceEncoder, IdentityPack, enroll
        cls.enc = FaceEncoder()
        cls.official = portrait(FACE, TMP / "oficial.png")
        cls.pack = IdentityPack()
        enroll(cls.pack, cls.official, official=True, encoder=cls.enc)
        cls.pack.save(TMP / "pack.json")

    def test_angle_same_person_accepted(self):
        from liora_engine.identity import enroll
        im = Image.open(FACE).convert("RGB").rotate(8, expand=True).resize((400, 400))
        im.save(TMP / "angulo.png")
        ref = enroll(self.pack, TMP / "angulo.png", angle="tres-cuartos", encoder=self.enc)
        self.assertTrue(ref["accepted"], ref)

    def test_no_face_rejected(self):
        from liora_engine.identity import enroll
        Image.new("RGB", (400, 400), (90, 120, 160)).save(TMP / "vacio.png")
        with self.assertRaises(ValueError):
            enroll(self.pack, TMP / "vacio.png", encoder=self.enc)

    def test_official_is_immutable(self):
        from liora_engine.identity import enroll
        Image.open(FACE).convert("RGB").transpose(Image.FLIP_LEFT_RIGHT).save(TMP / "otra.png")
        with self.assertRaises(ValueError):
            enroll(self.pack, TMP / "otra.png", official=True, encoder=self.enc)

    def test_pack_has_no_images(self):
        txt = (TMP / "pack.json").read_text()
        self.assertNotIn("base64", txt)
        self.assertEqual(len(json.loads(txt)["refs"][0]["descriptor"]), 128)


@unittest.skipUnless(FACE, "FACE_IMG no definido")
class Continuity(unittest.TestCase):
    """Clips construidos pintando de verdad los labios sobre la malla facial detectada."""

    @classmethod
    def setUpClass(cls):
        from tests.fixtures import portrait
        from liora_engine.landmarks import REGIONS, FaceMesh, region_mask
        cls.mesh = FaceMesh()
        rgb = np.asarray(Image.open(portrait(FACE, TMP / "c.png")).convert("RGB"))
        pts = cls.mesh.points(rgb)
        assert pts is not None, "MediaPipe no detecta la cara de prueba"
        mask = region_mask(rgb.shape[:2], pts, REGIONS["lips"])
        plum = np.array([110, 30, 70], float)

        def clip(name, alphas):
            frames = []
            for a in alphas:
                f = rgb.astype(float).copy()
                f[mask] = f[mask] * (1 - a) + plum * a
                frames.append(f.astype(np.uint8))
            media.frames_to_mp4(frames, TMP / name, fps=24)
            return TMP / name
        cls.gradual = clip("labios-gradual.mp4", np.linspace(0, 0.7, 96))
        cls.magic = clip("labios-magico.mp4", [0.0] * 48 + [0.7] * 48)
        cls.static = clip("estatico.mp4", [0.0] * 72)

    def test_gradual_lipstick_passes(self):
        from liora_engine.continuity import evaluate, profile
        r = evaluate("labios", profile(self.gradual, mesh=self.mesh), None)
        self.assertEqual(r["verdict"], "pass", r["issues"])
        self.assertGreater(r["change_delta_e"]["lips"], 10)

    def test_magic_lipstick_flagged(self):
        from liora_engine.continuity import evaluate, profile
        r = evaluate("labios", profile(self.magic, mesh=self.mesh), None)
        self.assertNotEqual(r["verdict"], "pass")
        self.assertTrue(any("bruscos" in i for i in r["issues"]))

    def test_cut_jump_fails(self):
        from liora_engine.continuity import evaluate, profile
        end_of_previous = evaluate("labios", profile(self.gradual, mesh=self.mesh), None)["end"]
        r = evaluate("final", profile(self.static, mesh=self.mesh), end_of_previous)
        self.assertEqual(r["verdict"], "fail")

    def test_no_work_in_focus_flagged(self):
        from liora_engine.continuity import evaluate, profile
        r = evaluate("labios", profile(self.static, mesh=self.mesh), None)
        self.assertEqual(r["verdict"], "review")


@unittest.skipUnless(FACE, "FACE_IMG no definido")
class Pipeline(unittest.TestCase):
    def test_chain_identity_continuity_assemble(self):
        from tests.fixtures import FixtureZoomBackend, portrait
        from liora_engine.identity import IdentityPack, enroll
        off = portrait(FACE, TMP / "p-oficial.png")
        pack = IdentityPack()
        enroll(pack, off, official=True)
        pack.save(TMP / "p-pack.json")
        job = pipeline.plan(str(off), str(TMP / "p-pack.json"), scenes=2, seconds=2, steps=1)
        m = pipeline.render(job, TMP / "work", "fixture", backend=FixtureZoomBackend())
        self.assertEqual(m["status"], "completed", json.dumps(m["scenes"], default=str)[:1500])
        s1, s2 = m["scenes"]
        self.assertEqual(s2["start_image"], s1["last_frame"])
        self.assertEqual(s1["attempts"][0]["identity"]["verdict"], "pass")
        self.assertEqual(s1["attempts"][0]["safari_issues"], [])
        out = pipeline.assemble(TMP / "work" / "manifest.json", TMP / "master.mp4", song=str(tone(TMP / "song.wav")))
        self.assertEqual(out["safari_issues"], [])
        self.assertEqual((out["probe"]["width"], out["probe"]["height"]), (1080, 1920))
        self.assertAlmostEqual(out["probe"]["duration"], 4.0, delta=0.2)

    def test_blocked_backend_writes_blocked_manifest(self):
        from tests.fixtures import FixtureZoomBackend
        m = pipeline.render({"scenes": [], "official_image": "", "identity_pack": ""}, TMP / "blk", "fixture",
                            backend=FixtureZoomBackend(ok=False), check_identity=False, check_continuity=False)
        self.assertEqual(m["status"], "blocked")
        self.assertTrue((TMP / "blk" / "manifest.json").exists())

    def test_imagen_oficial_distinta_rechazada(self):
        from tests.fixtures import FixtureZoomBackend
        if not (TMP / "p-pack.json").exists():
            self.skipTest("depende de la prueba de cadena")
        Image.open(TMP / "p-oficial.png").convert("RGB").transpose(Image.FLIP_LEFT_RIGHT).save(TMP / "suplantada.png")
        job = pipeline.plan(str(TMP / "suplantada.png"), str(TMP / "p-pack.json"), scenes=1)
        with self.assertRaises(ValueError):
            pipeline.render(job, TMP / "w2", "fixture", backend=FixtureZoomBackend())


class Catalog(unittest.TestCase):
    def test_all_backends_load_and_preflight(self):
        for bid in specs():
            pre = get(bid).preflight()
            self.assertIsInstance(pre.ok, bool)

    def test_licenses_commercial(self):
        for b in specs().values():
            self.assertTrue(b["license"]["commercial_use"], b["id"])

    def test_command_template(self):
        from liora_engine.backends.base import GenerationRequest
        be = get("wan22-ti2v-5b-official")
        cmd = be.build_command(GenerationRequest(out_path=Path("/tmp/x.mp4"), prompt="p", start_image=Path("/tmp/a.png"), seconds=5, seed=7))
        self.assertIn("ti2v-5B", cmd)
        self.assertEqual(cmd[cmd.index("--frame_num") + 1], "121")
        self.assertEqual(cmd[cmd.index("--size") + 1], "704*1280")


if __name__ == "__main__":
    unittest.main()
