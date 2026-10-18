"""Ejecución de trabajos: escenas encadenadas con identidad y continuidad obligatorias.

Escena N parte del último fotograma de la escena N-1 aceptada. Cada intento se normaliza a MP4
compatible con Safari y se mide; si la identidad o el corte fallan se reintenta con otra semilla.
Un clip aceptado aquí queda en REVISIÓN: la aprobación final es humana (Liora Studio).
"""
from __future__ import annotations

import json
import platform
import shutil
import time
from datetime import datetime, timezone
from importlib import metadata as md
from pathlib import Path

from . import __version__, media
from .backends import BackendError, GenerationRequest, get

STAGES_FILE = Path(__file__).resolve().parent / "stages.json"


def build_prompt(identity_text: str, setting: str, stage: dict, previous: list[dict]) -> str:
    parts = [f"Photorealistic vertical smartphone beauty video of the SAME woman shown in the start image: {identity_text}.",
             f"Setting: {setting}.",
             (f"Continue exactly from the start image; makeup already applied and unchanged: {', '.join(p['name'].lower() for p in previous)}."
              if previous else "She starts with a bare face."),
             f"Action: she {stage['action']}."]
    if stage.get("tool") and stage["tool"] != "none":
        parts.append(f"Real makeup tools touching the skin: {stage['tool']}; product appears only where the tool touches.")
    parts.append("Anatomically correct hands with five fingers, natural skin pores, stable identity, static camera, no text, no watermark.")
    return " ".join(parts)


def plan(official_image: str, identity_pack: str, *, project: str = "Liora", scenes: int | None = None, seconds: float | None = None,
         width: int = 704, height: int = 1280, fps: int = 24, steps: int = 40, guidance: float = 5.0, seed: int = 20261019,
         max_attempts: int = 3) -> dict:
    cfg = json.loads(STAGES_FILE.read_text(encoding="utf-8"))
    stages = cfg["stages"][:scenes] if scenes else cfg["stages"]
    job_scenes = []
    for i, st in enumerate(stages):
        job_scenes.append({"key": st["key"], "name": st["name"], "seconds": seconds or st["seconds"],
                           "prompt": build_prompt(cfg["identity_text"], cfg["setting"], st, stages[:i]),
                           "negative_prompt": cfg["negative_prompt"]})
    return {"format": "liora-job-v1", "project": project, "official_image": official_image, "identity_pack": identity_pack,
            "width": width, "height": height, "fps": fps, "steps": steps, "guidance": guidance, "seed": seed,
            "max_attempts": max_attempts, "scenes": job_scenes, "song": None}


def _versions() -> dict:
    out = {"liora_engine": __version__, "python": platform.python_version()}
    for pkg in ("torch", "diffusers", "transformers", "dlib-bin", "mediapipe", "imageio-ffmpeg"):
        try:
            out[pkg] = md.version(pkg)
        except md.PackageNotFoundError:
            pass
    return out


def render(job: dict, workdir: str | Path, backend_id: str, *, only: int | None = None, check_identity: bool = True,
           check_continuity: bool = True, backend=None, log=print) -> dict:
    work = Path(workdir)
    work.mkdir(parents=True, exist_ok=True)
    be = backend or get(backend_id)
    manifest = {"format": "liora-render-manifest-v1", "job": job, "backend": be.id, "started_at": datetime.now(timezone.utc).isoformat(),
                "versions": _versions(), "license": be.license, "scenes": [], "status": "running", "budget_eur": 0}
    pre = be.preflight()
    manifest["preflight"] = pre.as_dict()
    mpath = work / "manifest.json"
    if not pre.ok:
        manifest.update(status="blocked", finished_at=datetime.now(timezone.utc).isoformat())
        media.write_json(mpath, manifest)
        log("BLOQUEADO: " + "; ".join(pre.issues))
        return manifest

    pack = encoder = mesh = None
    if check_identity:
        from .identity import FaceEncoder, IdentityPack, check_video
        pack, encoder = IdentityPack.load(job["identity_pack"]), FaceEncoder()
        if media.sha256(job["official_image"]) != pack.official["sha256"]:
            raise ValueError("La imagen oficial del trabajo no coincide con la huella del paquete de identidad")
    if check_continuity:
        from .landmarks import FaceMesh
        mesh = FaceMesh()

    start_image = Path(job["official_image"])
    prev_end = None
    scenes = job["scenes"][:only] if only else job["scenes"]
    for i, sc in enumerate(scenes):
        sdir = work / f"scene-{i + 1:02d}-{sc['key']}"
        sdir.mkdir(exist_ok=True)
        rec = {"index": i, "key": sc["key"], "name": sc["name"], "start_image": str(start_image), "start_image_sha256": media.sha256(start_image),
               "attempts": [], "status": "PENDIENTE"}
        manifest["scenes"].append(rec)
        for a in range(job.get("max_attempts", 3)):
            seed = job["seed"] + i * 1000 + a
            raw, out = sdir / f"attempt-{a + 1}-raw.mp4", sdir / f"attempt-{a + 1}.mp4"
            att = {"attempt": a + 1, "seed": seed}
            rec["attempts"].append(att)
            req = GenerationRequest(out_path=raw, prompt=sc["prompt"], negative_prompt=sc.get("negative_prompt", ""), start_image=start_image,
                                    seconds=sc["seconds"], width=job["width"], height=job["height"], fps=job["fps"], seed=seed,
                                    steps=job["steps"], guidance=job["guidance"])
            log(f"[{sc['name']}] intento {a + 1} · semilla {seed} · generando con {be.id}…")
            t0 = time.time()
            try:
                res = be.generate(req)
            except BackendError as e:
                att.update(error=str(e))
                log(f"  error del motor: {e}")
                break
            att.update(generation_s=res.elapsed_s, params=res.params, environment=res.environment, raw_sha256=media.sha256(raw),
                       raw_frames=media.count_frames(raw))
            info = media.encode_safari(raw, out, width=job["width"], height=job["height"], fps=None, keep_audio=True)
            att.update(file=str(out), sha256=media.sha256(out), probe=info, safari_issues=media.safari_check(info), frames=media.count_frames(out))
            att["frame_health"] = media.degenerate_frames(out)
            ok = not att["safari_issues"] and att["frame_health"]["ok"]
            if check_identity:
                idr = check_video(pack, out, stage_index=i, encoder=encoder)
                att["identity"] = {k: v for k, v in idr.items() if k != "series"}
                ok &= idr["verdict"] != "fail"
            if check_continuity:
                from .continuity import evaluate, profile
                cont = evaluate(sc["key"], profile(out, mesh=mesh), prev_end)
                att["continuity"] = {k: v for k, v in cont.items() if k not in ("start",)}
                ok &= cont["verdict"] != "fail"
            att["total_s"] = round(time.time() - t0, 1)
            att["accepted"] = bool(ok)
            media.write_json(mpath, manifest)
            log(f"  identidad: {att.get('identity', {}).get('verdict', '—')} · continuidad: {att.get('continuity', {}).get('verdict', '—')} · "
                f"{'ACEPTADO para revisión humana' if ok else 'rechazado'}")
            if ok:
                rec.update(status="REVISIÓN", clip=str(out), clip_sha256=att["sha256"])
                last = sdir / "last-frame.png"
                media.last_frame(out, last)
                rec["last_frame"] = str(last)
                start_image = last
                prev_end = att.get("continuity", {}).get("end")
                break
        if rec["status"] != "REVISIÓN":
            rec["status"] = "RECHAZADO"
            manifest["status"] = "stopped"
            log(f"Escena «{sc['name']}» sin clip válido: se detiene la cadena (la siguiente necesita su último fotograma).")
            break
    else:
        manifest["status"] = "completed"
    manifest["finished_at"] = datetime.now(timezone.utc).isoformat()
    media.write_json(mpath, manifest)
    return manifest


def assemble(manifest_path: str | Path, out: str | Path, *, song: str | None = None, offset: float = 0.0) -> dict:
    m = json.loads(Path(manifest_path).read_text(encoding="utf-8"))
    clips = [s["clip"] for s in m["scenes"] if s.get("status") == "REVISIÓN"]
    if not clips or len(clips) != len(m["job"]["scenes"]):
        raise ValueError(f"Faltan escenas: {len(clips)}/{len(m['job']['scenes'])} con clip")
    info = media.concat(clips, out, audio=song, audio_offset=offset)
    return {"file": str(out), "sha256": media.sha256(out), "probe": info, "safari_issues": media.safari_check(info), "clips": clips}


def copy_for_studio(manifest_path: str | Path, dest: str | Path) -> list[str]:
    """Copia los clips con nombres legibles para subirlos en Liora Studio (Producción → subir clip)."""
    m = json.loads(Path(manifest_path).read_text(encoding="utf-8"))
    Path(dest).mkdir(parents=True, exist_ok=True)
    out = []
    for s in m["scenes"]:
        if s.get("clip"):
            target = Path(dest) / f"liora-{s['index'] + 1:02d}-{s['key']}.mp4"
            shutil.copyfile(s["clip"], target)
            out.append(str(target))
    return out
