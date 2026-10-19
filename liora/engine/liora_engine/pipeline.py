"""Ejecución de trabajos: escenas encadenadas con identidad y continuidad obligatorias.

Escena N parte del último fotograma de la escena N-1 aceptada. Cada intento se normaliza a MP4
compatible con Safari y se mide; si la identidad o el corte fallan se reintenta con otra semilla.
Un clip aceptado aquí queda en REVISIÓN: la aprobación final es humana (Liora Studio).
"""
from __future__ import annotations

import json
import os
import platform
import shutil
import time
from datetime import datetime, timezone
from importlib import metadata as md
from pathlib import Path

from . import __version__, media
from .backends import BackendError, GenerationRequest, get

STAGES_FILE = Path(__file__).resolve().parent / "stages.json"
IDENTITY_LOCK = Path(__file__).resolve().parents[2] / "identity" / "identity-lock.json"


def _identity_lock():
    """Carga liora/identity/identity_lock.py (LIORA IDENTITY LOCK), fuera del paquete del motor."""
    import importlib.util
    import sys
    if "liora_identity_lock" not in sys.modules:
        spec = importlib.util.spec_from_file_location("liora_identity_lock", IDENTITY_LOCK.parent / "identity_lock.py")
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        sys.modules["liora_identity_lock"] = mod
    return sys.modules["liora_identity_lock"]


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
           check_continuity: bool = True, backend=None, identity_lock: str | Path = IDENTITY_LOCK, log=print) -> dict:
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
        # Identity Lock: sin maestro sellado (o con otra imagen) no se genera contenido facial de Liora.
        lock = _identity_lock().require_master(job["official_image"], identity_lock)
        manifest["identity_lock"] = {"identity_id": lock["identity_id"], "master_sha256": lock["master"]["sha256"], "lock_sha256": lock["lock_sha256"]}
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
            refs = [Path(job["official_image"])] if "reference-images" in getattr(be, "spec", {}).get("capabilities", []) else []
            req = GenerationRequest(out_path=raw, prompt=sc["prompt"], negative_prompt=sc.get("negative_prompt", ""), start_image=start_image, ref_images=refs,
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
                # Identity Lock: la identidad debe mantenerse en todos los fotogramas, no solo en el primero.
                att["identity"]["frames"] = _identity_lock().frame_continuity(
                    [(x["t"], x.get("distance")) for x in idr.get("series", [])], duration=info.get("duration"), tolerance=idr.get("tolerance", 0.0))
                ok &= idr["verdict"] != "fail" and att["identity"]["frames"]["ok"]
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
    export_for_studio(manifest, work / "studio")
    return manifest


def export_for_studio(manifest: dict, dest: str | Path) -> dict | None:
    """Clips aceptados con nombres fijos + studio-manifest.json para «Importar render del motor» en Liora Studio."""
    accepted = [s for s in manifest["scenes"] if s.get("clip")]
    if not accepted:
        return None
    dest = Path(dest)
    dest.mkdir(parents=True, exist_ok=True)
    scenes = []
    for s in accepted:
        name = f"liora-{s['index'] + 1:02d}-{s['key']}.mp4"
        shutil.copyfile(s["clip"], dest / name)
        att = next(a for a in s["attempts"] if a.get("accepted"))
        scenes.append({"index": s["index"], "key": s["key"], "file": name, "sha256": s["clip_sha256"],
                       "model": att.get("params", {}).get("model"), "seed": att["seed"], "generation_s": att.get("generation_s"),
                       "identity": att.get("identity", {}).get("verdict"), "continuity": att.get("continuity", {}).get("verdict"),
                       "frames": att.get("frames"), "duration": att.get("probe", {}).get("duration")})
    out = {"format": "liora-studio-import-v1", "backend": manifest["backend"], "project": manifest["job"].get("project"),
           "created_at": datetime.now(timezone.utc).isoformat(), "scenes": scenes}
    media.write_json(dest / "studio-manifest.json", out)
    return out


def assemble(manifest_path: str | Path, out: str | Path, *, song: str | None = None, offset: float = 0.0) -> dict:
    m = json.loads(Path(manifest_path).read_text(encoding="utf-8"))
    clips = [s["clip"] for s in m["scenes"] if s.get("status") == "REVISIÓN"]
    if not clips or len(clips) != len(m["job"]["scenes"]):
        raise ValueError(f"Faltan escenas: {len(clips)}/{len(m['job']['scenes'])} con clip")
    info = media.concat(clips, out, audio=song, audio_offset=offset)
    return {"file": str(out), "sha256": media.sha256(out), "probe": info, "safari_issues": media.safari_check(info), "clips": clips}


SMOKE_PROMPT = ("Photorealistic vertical smartphone video, close-up of a fictional young woman with wavy dark hair sitting at a softly lit "
                "makeup vanity. She holds a fluffy makeup brush in her right hand and sweeps blush onto her cheek in slow, physically "
                "convincing strokes; the bristles visibly press and bend against the skin and pink powder appears only where the brush "
                "touches. Anatomically correct hand with five fingers, natural skin texture with pores, static camera, soft warm light.")


def _model_revision(model_id: str) -> str | None:
    """Commit del snapshot de Hugging Face si el modelo está en la caché local."""
    p = Path(model_id)
    if "snapshots" in p.parts:
        return p.parts[p.parts.index("snapshots") + 1]
    try:
        from huggingface_hub import scan_cache_dir
        for repo in scan_cache_dir().repos:
            if repo.repo_id == model_id:
                return sorted(repo.revisions, key=lambda r: r.last_modified)[-1].commit_hash
    except Exception:  # noqa: BLE001
        pass
    return None


def smoke(workdir: str | Path, backend_id: str = "wan22-ti2v-5b", *, seconds: float = 3.5, width: int = 704, height: int = 1280,
          fps: int = 24, steps: int = 30, guidance: float = 5.0, seed: int = 20261019, prompt: str = SMOKE_PROMPT,
          start_image: str | Path | None = None, backend=None, log=print) -> dict:
    """Prueba P0: escena real con una mujer ficticia. Sin imagen: texto→vídeo; con imagen sintética: imagen→vídeo.
    Nunca debe recibir la foto oficial de Liora en servicios sin privacidad verificada."""
    from . import probe
    work = Path(workdir)
    work.mkdir(parents=True, exist_ok=True)
    lines: list[str] = []

    def say(msg: str):
        stamp = datetime.now(timezone.utc).strftime("%H:%M:%S")
        lines.append(f"{stamp} {msg}")
        log(msg)
        (work / "run.log").write_text("\n".join(lines) + "\n", encoding="utf-8")

    be = backend or get(backend_id)
    ev = {"format": "liora-smoke-evidence-v1", "started_at": datetime.now(timezone.utc).isoformat(), "backend": be.id,
          "license": be.license, "budget_eur": 0, "prompt": prompt, "versions": _versions(), "hardware": probe.capacity(), "generated": False}
    say(f"Liora Engine smoke · motor {be.id}")
    pre = be.preflight()
    ev["preflight"] = pre.as_dict()
    if not pre.ok:
        say("BLOQUEADO: " + "; ".join(pre.issues))
        ev["status"] = "blocked"
        media.write_json(work / "evidence.json", ev)
        return ev
    raw, out = work / "smoke-raw.mp4", work / "liora-smoke.mp4"
    if start_image:
        ev["start_image"] = {"file": Path(start_image).name, "sha256": media.sha256(start_image)}
    req = GenerationRequest(out_path=raw, prompt=prompt, start_image=Path(start_image) if start_image else None, negative_prompt=json.loads(STAGES_FILE.read_text(encoding="utf-8"))["negative_prompt"],
                            seconds=seconds, width=width, height=height, fps=fps, seed=seed, steps=steps, guidance=guidance)
    say(f"Generando {seconds} s a {width}×{height}, {steps} pasos, semilla {seed}…")
    t0 = time.time()
    try:
        res = be.generate(req)
    except Exception as e:  # noqa: BLE001
        say(f"ERROR: {type(e).__name__}: {e}")
        ev.update(status="failed", error=f"{type(e).__name__}: {e}", total_s=round(time.time() - t0, 1))
        media.write_json(work / "evidence.json", ev)
        return ev
    say(f"Generación terminada en {res.elapsed_s} s; normalizando para Safari…")
    info = media.encode_safari(raw, out, width=width, height=height, keep_audio=False)
    health = media.degenerate_frames(out)
    test_only = bool(pre.facts.get("cpu_test_mode"))
    status = "pipeline_test_only" if test_only else ("generated" if health["ok"] else "invalid_output")
    ev.update(status=status, generated=health["ok"] and not test_only, test_mode=test_only, total_s=round(time.time() - t0, 1),
              generation_s=res.elapsed_s, params=res.params, environment=res.environment,
              model_revision=_model_revision(res.params.get("model", "")),
              raw={"file": raw.name, "sha256": media.sha256(raw), "frames": media.count_frames(raw), "probe": media.probe(raw)},
              mp4={"file": out.name, "sha256": media.sha256(out), "frames": media.count_frames(out), "probe": info,
                   "safari_issues": media.safari_check(info)},
              frame_health=health, finished_at=datetime.now(timezone.utc).isoformat())
    say(f"MP4 {out.name}: {info.get('width')}×{info.get('height')}, {info.get('duration')} s, sha256 {ev['mp4']['sha256'][:16]}… · "
        f"fotogramas {'válidos' if health['ok'] else 'INVÁLIDOS: ' + ', '.join(health['issues'])}"
        + (" · MODO PRUEBA DE CANALIZACIÓN (modelo diminuto aleatorio): NO es una generación" if test_only else ""))
    media.write_json(work / "evidence.json", ev)
    return ev


def _free_disk_for_fallback(log=print, need_gb: float = 20.0) -> None:
    """Si falta disco para los pesos de reserva, borra de la caché de Hugging Face los de Wan 2.2 (ya fallidos)."""
    primary = os.environ.get("LIORA_WAN22_TI2V", "")
    cache = Path(os.environ.get("HF_HOME", Path.home() / ".cache" / "huggingface"))
    if shutil.disk_usage(cache if cache.exists() else Path.home()).free / 1024 ** 3 >= need_gb:
        return
    repo_dir = next((p for p in Path(primary).parents if p.name.startswith("models--Wan-AI--Wan2.2")), None) if primary else None
    if repo_dir and repo_dir.is_dir():
        log(f"Disco insuficiente: se eliminan de la caché los pesos de Wan 2.2 ({repo_dir}) para descargar el motor de reserva.")
        shutil.rmtree(repo_dir, ignore_errors=True)


def _ensure_weights(spec: dict, log=print) -> dict:
    """Descarga los pesos oficiales del motor de reserva si no están en disco y registra licencia y commit de la ficha."""
    env = spec.get("model_env")
    current = os.environ.get(env, "") if env else ""
    if current and Path(current).is_dir():
        return {"path": current, "downloaded": False}
    from huggingface_hub import model_info, snapshot_download
    t0 = time.time()
    log(f"Descargando pesos oficiales de {spec['model']}…")
    path = snapshot_download(spec["model"])
    info = model_info(spec["model"])
    if env:
        os.environ[env] = path
    return {"path": path, "downloaded": True, "download_s": round(time.time() - t0, 1), "hub_commit": info.sha,
            "card_license": getattr(info.card_data, "license", None) if info.card_data else None}


def smoke_with_fallback(workdir: str | Path, backend_id: str = "wan22-ti2v-5b", fallback_id: str | None = "wan21-vace-1.3b",
                        log=print, **kw) -> dict:
    """Ejecuta smoke con el motor principal y, si queda bloqueado, falla o da fotogramas inválidos, repite con el motor
    de reserva en la misma sesión. evidence.json/liora-smoke.mp4 quedan con el resultado válido; el intento fallido se
    conserva como evidence-<motor>.json para el informe."""
    work = Path(workdir)
    ev = smoke(work, backend_id, log=log, **kw)
    if ev.get("generated") or not fallback_id or ev.get("test_mode"):
        return ev
    if ev.get("status") == "blocked" and "No hay GPU CUDA" in " ".join(ev.get("preflight", {}).get("issues", [])):
        return ev  # sin GPU el motor de reserva tampoco puede ejecutarse
    failed = work / f"evidence-{backend_id}.json"
    shutil.copyfile(work / "evidence.json", failed)
    log(f"{backend_id} no produjo un MP4 válido ({ev.get('status')}: {ev.get('error') or ev.get('preflight', {}).get('issues')}). "
        f"Se prueba el motor de reserva {fallback_id}.")
    # liberar la memoria del motor principal (RAM y GPU) antes de cargar el de reserva
    import gc
    gc.collect()
    try:
        import torch
        torch.cuda.empty_cache()
    except Exception:  # noqa: BLE001
        pass
    _free_disk_for_fallback(log)
    from .backends import specs
    spec = specs()[fallback_id]
    try:
        weights = _ensure_weights(spec, log)
    except Exception as e:  # noqa: BLE001
        ev["fallback"] = {"backend": fallback_id, "error": f"No se pudieron obtener los pesos: {type(e).__name__}: {e}"}
        media.write_json(work / "evidence.json", ev)
        return ev
    d = spec.get("defaults", {})
    kw2 = dict(kw)
    if (kw.get("width", 704), kw.get("height", 1280), kw.get("fps", 24)) == (704, 1280, 24):
        # resolución por defecto de Wan 2.2 → resolución nativa del motor de reserva (480×832 a 16 fps en VACE)
        kw2.update(width=d.get("width", 704), height=d.get("height", 1280), fps=d.get("fps", 24))
    ev2 = smoke(work, fallback_id, log=log, **kw2)
    ev2["fallback_from"] = {"backend": backend_id, "status": ev.get("status"), "error": ev.get("error"),
                            "issues": ev.get("preflight", {}).get("issues"), "evidence_file": failed.name}
    ev2["weights"] = weights
    media.write_json(work / "evidence.json", ev2)
    return ev2
