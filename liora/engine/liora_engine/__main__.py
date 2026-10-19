"""CLI: python -m liora_engine <orden> …"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from . import media, pipeline, probe
from .backends import catalog, get


def _print(d) -> None:
    print(json.dumps(d, ensure_ascii=False, indent=2, default=str))


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="liora_engine", description="Liora Engine · presupuesto 0 € · modelos abiertos")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("probe", help="Mide CPU/RAM/disco/GPU/red y la viabilidad de cada motor")
    p.add_argument("--bench", action="store_true")
    p.add_argument("--out")

    sub.add_parser("models", help="Catálogo de motores con licencia y comprobación previa")

    p = sub.add_parser("identity-enroll")
    p.add_argument("--pack", required=True)
    p.add_argument("--image", required=True)
    p.add_argument("--angle", default="frontal")
    p.add_argument("--official", action="store_true")

    p = sub.add_parser("identity-check")
    p.add_argument("--pack", required=True)
    p.add_argument("--video", required=True)
    p.add_argument("--stage", type=int, default=0)

    p = sub.add_parser("continuity")
    p.add_argument("--video", required=True)
    p.add_argument("--stage", required=True, help="clave de etapa: inicial, piel, base, ojos, delineado, labios, caracterizacion, final")
    p.add_argument("--prev-end", help="JSON con el color final de la escena anterior (campo «end» de un informe previo)")

    p = sub.add_parser("plan", help="Crea un trabajo con las 8 etapas")
    p.add_argument("--official", required=True)
    p.add_argument("--pack", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--scenes", type=int)
    p.add_argument("--seconds", type=float)
    p.add_argument("--steps", type=int, default=40)
    p.add_argument("--width", type=int, default=704)
    p.add_argument("--height", type=int, default=1280)
    p.add_argument("--seed", type=int, default=20261019)

    p = sub.add_parser("render", help="Genera las escenas del trabajo con el motor elegido")
    p.add_argument("--job", required=True)
    p.add_argument("--work", required=True)
    p.add_argument("--backend", default="wan22-ti2v-5b")
    p.add_argument("--only", type=int, help="Generar solo las N primeras escenas")
    p.add_argument("--no-identity", action="store_true")
    p.add_argument("--no-continuity", action="store_true")

    p = sub.add_parser("assemble", help="Une las escenas aceptadas y añade la canción")
    p.add_argument("--manifest", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--song")
    p.add_argument("--offset", type=float, default=0.0)

    p = sub.add_parser("smoke", help="Prueba P0: escena real de texto→vídeo con mujer ficticia y evidencia completa")
    p.add_argument("--work", required=True)
    p.add_argument("--backend", default="wan22-ti2v-5b")
    p.add_argument("--seconds", type=float, default=3.5)
    p.add_argument("--steps", type=int, default=30)
    p.add_argument("--width", type=int, default=704)
    p.add_argument("--height", type=int, default=1280)
    p.add_argument("--seed", type=int, default=20261019)
    p.add_argument("--fps", type=int, default=24, help="24 para Wan 2.2; 16 para Wan 2.1 VACE")
    p.add_argument("--fallback", default="wan21-vace-1.3b", help="Motor de reserva si el principal falla ('' para desactivar)")
    p.add_argument("--image", help="Imagen SINTÉTICA de partida (imagen→vídeo). No usar la foto oficial fuera de entornos privados")

    p = sub.add_parser("escena001", help="ESCENA 001 de la auténtica Liora (requiere el maestro sellado y GPU)")
    p.add_argument("--official", required=True, help="Archivo maestro PRIVADO; su SHA-256 debe coincidir con el Identity Lock")
    p.add_argument("--pack", required=True)
    p.add_argument("--work", required=True)
    p.add_argument("--backend", default="wan21-vace-1.3b")
    p.add_argument("--seconds", type=float, default=5.0)
    p.add_argument("--steps", type=int, default=30)
    p.add_argument("--width", type=int, default=480)
    p.add_argument("--height", type=int, default=832)
    p.add_argument("--fps", type=int, default=16)

    p = sub.add_parser("conform", help="Convierte cualquier vídeo a MP4 1080×1920 compatible con Safari")
    p.add_argument("src")
    p.add_argument("dst")
    p.add_argument("--fit", choices=["cover", "contain"], default="cover")
    p.add_argument("--song", help="Pista de audio que sustituye al sonido del clip (p. ej. la instrumental original)")
    p.add_argument("--offset", type=float, default=0.0)

    a = ap.parse_args(argv)

    if a.cmd == "probe":
        rep = probe.capacity(bench=a.bench)
        rep["backends"] = {}
        for b in catalog()["backends"]:
            try:
                rep["backends"][b["id"]] = get(b["id"]).preflight().as_dict()
            except Exception as e:  # noqa: BLE001
                rep["backends"][b["id"]] = {"ok": False, "issues": [f"{type(e).__name__}: {e}"]}
        if a.out:
            media.write_json(a.out, rep)
        _print(rep)
        return 0
    if a.cmd == "models":
        c = catalog()
        for b in c["backends"]:
            pre = get(b["id"]).preflight()
            print(f"{b['id']:<26} {b['role']:<8} {b['license']['spdx']:<11} {b['status']:<9} {'LISTO' if pre.ok else 'BLOQUEADO: ' + '; '.join(pre.issues)}")
        print("\nExcluidos por licencia o coste:")
        for e in c["excluded"]:
            print(f"  - {e['model']}: {e['reason']}")
        return 0
    if a.cmd == "identity-enroll":
        from .identity import IdentityPack, enroll
        pack = IdentityPack.load(a.pack) if Path(a.pack).exists() else IdentityPack()
        ref = enroll(pack, a.image, angle=a.angle, official=a.official)
        pack.save(a.pack)
        _print({k: v for k, v in ref.items() if k != "descriptor"})
        return 0 if ref.get("accepted") else 3
    if a.cmd == "identity-check":
        from .identity import IdentityPack, check_video
        r = check_video(IdentityPack.load(a.pack), a.video, stage_index=a.stage)
        _print({k: v for k, v in r.items() if k != "series"})
        return {"pass": 0, "review": 0}.get(r["verdict"], 3)
    if a.cmd == "continuity":
        from .continuity import evaluate, profile
        prev = json.loads(Path(a.prev_end).read_text())["end"] if a.prev_end else None
        r = evaluate(a.stage, profile(a.video), prev)
        _print(r)
        return 0 if r["verdict"] != "fail" else 3
    if a.cmd == "plan":
        job = pipeline.plan(a.official, a.pack, scenes=a.scenes, seconds=a.seconds, steps=a.steps, width=a.width, height=a.height, seed=a.seed)
        media.write_json(a.out, job)
        print(f"Trabajo con {len(job['scenes'])} escenas → {a.out}")
        return 0
    if a.cmd == "render":
        job = json.loads(Path(a.job).read_text(encoding="utf-8"))
        m = pipeline.render(job, a.work, a.backend, only=a.only, check_identity=not a.no_identity, check_continuity=not a.no_continuity)
        print(f"Estado: {m['status']} · manifiesto: {Path(a.work) / 'manifest.json'}")
        return 0 if m["status"] == "completed" else 2
    if a.cmd == "assemble":
        _print(pipeline.assemble(a.manifest, a.out, song=a.song, offset=a.offset))
        return 0
    if a.cmd == "smoke":
        ev = pipeline.smoke_with_fallback(a.work, a.backend, (a.fallback or None) if a.fallback != a.backend else None, seconds=a.seconds, steps=a.steps, width=a.width, height=a.height, fps=a.fps, seed=a.seed, start_image=a.image)
        _print({k: ev.get(k) for k in ("status", "generated", "total_s", "mp4", "params", "model_revision", "frame_health", "error")})
        return 0 if ev.get("generated") else 2
    if a.cmd == "escena001":
        m = pipeline.scene001(a.official, a.pack, a.work, a.backend, seconds=a.seconds, width=a.width, height=a.height, fps=a.fps, steps=a.steps)
        print(f"Estado: {m['status']} · manifiesto: {Path(a.work) / 'manifest.json'}")
        return 0 if m["status"] == "completed" else 2
    if a.cmd == "conform":
        info = media.encode_safari(a.src, a.dst, fit=a.fit, audio=a.song, audio_offset=a.offset)
        _print({**info, "safari_issues": media.safari_check(info), "sha256": media.sha256(a.dst)})
        return 0
    return 1


if __name__ == "__main__":
    sys.exit(main())
