"""ESCENA 001 de Liora en la GPU gratuita de Kaggle, de principio a fin y sin pasos manuales.

Flujo: verifica el Identity Lock y el maestro local → comprueba que el dataset PRIVADO del
propietario con el maestro existe en Kaggle (con --upload-master lo crea, previa autorización
expresa del propietario) → empuja el kernel privado con GPU → espera → descarga el bruto →
exporta a 1080×1920 H.264 compatible con iPhone → verifica identidad fotograma a fotograma
(dlib + Identity Lock) → evidence.json con REVISION o RECHAZADO.

Credenciales: el token de la API va SOLO en ~/.kaggle/access_token (nunca en el repositorio).
Uso: python tools/kaggle_escena001.py [--frames 81 --steps 30 --seed N] [--upload-master]
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))
from liora_engine import media, pipeline  # noqa: E402

PRIV = HERE.parent / "identity" / "private"
KERNEL_SRC = Path(__file__).with_name("kaggle_escena001_kernel.py")
DATASET_SLUG, KERNEL_SLUG = "liora-privado", "liora-escena-001-gpu"


def kaggle(*args: str, check: bool = True) -> subprocess.CompletedProcess:
    p = subprocess.run([sys.executable, "-m", "kaggle", *args], capture_output=True, text=True)
    if check and p.returncode != 0:
        raise RuntimeError(f"kaggle {' '.join(args)} → {p.returncode}: {(p.stderr or p.stdout)[-600:]}")
    return p


def username() -> str:
    out = kaggle("kernels", "list", "-m", "-v").stdout.strip().splitlines()
    for row in out[1:]:
        ref = row.split(",")[0]
        if "/" in ref:
            return ref.split("/")[0]
    raise RuntimeError("No se pudo deducir el usuario de Kaggle (¿token sin kernels?)")


def log(work: Path, *a) -> None:
    line = f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] " + " ".join(str(x) for x in a)
    print(line, flush=True)
    with open(work / "run-gpu.log", "a", encoding="utf-8") as f:
        f.write(line + "\n")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--work", default=str(PRIV / "escena001-gpu"))
    ap.add_argument("--master", default=str(PRIV / "liora-vale-0001-maestro.png"))
    ap.add_argument("--pack", default=str(PRIV / "liora-identity-pack.json"))
    ap.add_argument("--frames", type=int, default=81)
    ap.add_argument("--steps", type=int, default=30)
    ap.add_argument("--guidance", type=float, default=5.0)
    ap.add_argument("--fps", type=int, default=12)
    ap.add_argument("--seed", type=int, default=20261112)
    ap.add_argument("--upload-master", action="store_true",
                    help="Crea el dataset privado con el maestro si no existe (solo con autorización expresa del propietario)")
    a = ap.parse_args()
    work = Path(a.work)
    work.mkdir(parents=True, exist_ok=True)
    ev = {"format": "liora-escena001-gpu-v1", "started_at": datetime.now(timezone.utc).isoformat(), "generated": False,
          "budget_eur": 0, "params": vars(a)}

    def finish(status: str, **kw) -> int:
        ev.update(status=status, finished_at=datetime.now(timezone.utc).isoformat(), **kw)
        media.write_json(work / "evidence.json", ev)
        log(work, "ESTADO:", status, kw.get("error", ""))
        return 0 if status == "REVISION" else 2

    # 0) Identity Lock local: solo el maestro sellado
    IL = pipeline._identity_lock()
    try:
        lock = IL.require_master(a.master)
    except Exception as e:  # noqa: BLE001
        return finish("bloqueado_identidad", error=str(e))
    ev["identity_lock"] = {"identity_id": lock["identity_id"], "master_sha256": lock["master"]["sha256"], "lock_sha256": lock["lock_sha256"]}

    user = username()
    ds = f"{user}/{DATASET_SLUG}"
    st = kaggle("datasets", "status", ds, check=False)
    if "ready" not in (st.stdout + st.stderr).lower():
        if not a.upload_master:
            return finish("bloqueado_dataset", error=f"El dataset privado {ds} con el maestro no existe en Kaggle. "
                          "Crearlo exige la autorización expresa del propietario: vuelve a ejecutar con --upload-master.")
        dsdir = work / "dataset"
        dsdir.mkdir(exist_ok=True)
        shutil.copyfile(a.master, dsdir / "liora-vale-0001-maestro.png")
        (dsdir / "dataset-metadata.json").write_text(json.dumps({"title": DATASET_SLUG, "id": ds, "licenses": [{"name": "other"}]}, indent=2))
        out = kaggle("datasets", "create", "-p", str(dsdir)).stdout
        log(work, "dataset privado creado:", out.strip()[-120:])
        shutil.rmtree(dsdir)
        for _ in range(30):
            if "ready" in kaggle("datasets", "status", ds, check=False).stdout.lower():
                break
            time.sleep(10)

    # 1) kernel privado con GPU
    cfg = json.loads(pipeline.STAGES_FILE.read_text(encoding="utf-8"))
    prompt = pipeline.SCENE001_PROMPT.format(identity=cfg["identity_text"])
    ev.update(prompt=prompt, negative_prompt=cfg["negative_prompt"])
    kdir = work / "kernel"
    kdir.mkdir(exist_ok=True)
    params = {"frames": a.frames, "steps": a.steps, "guidance": a.guidance, "fps": a.fps, "seed": a.seed,
              "width": 480, "height": 832, "prompt": prompt, "negative": cfg["negative_prompt"]}
    src = KERNEL_SRC.read_text(encoding="utf-8")
    marker = "PARAMS_INLINE = None"
    if marker not in src:
        return finish("error_generacion", error="El kernel no tiene el marcador PARAMS_INLINE")
    # un script de Kaggle solo sube su propio archivo: los parámetros van incrustados en el código
    (kdir / "kernel.py").write_text(src.replace(marker, "PARAMS_INLINE = json.loads(" + repr(json.dumps(params, ensure_ascii=False)) + ")", 1), encoding="utf-8")
    (kdir / "kernel-metadata.json").write_text(json.dumps({
        "id": f"{user}/{KERNEL_SLUG}", "title": KERNEL_SLUG, "code_file": "kernel.py", "language": "python",
        "kernel_type": "script", "is_private": True, "enable_gpu": True, "enable_internet": True,
        "dataset_sources": [ds], "competition_sources": [], "kernel_sources": []}, indent=2))
    log(work, kaggle("kernels", "push", "-p", str(kdir)).stdout.strip())

    ref = f"{user}/{KERNEL_SLUG}"
    t0 = time.time()
    while True:
        s = (kaggle("kernels", "status", ref, check=False).stdout or "").lower()
        if "complete" in s:
            break
        if "error" in s or "cancel" in s:
            kaggle("kernels", "output", ref, "-p", str(work / "salida"), "--force", check=False)
            return finish("error_generacion", error=f"Kernel terminó mal: {s.strip()[-120:]} (registro en salida/)")
        if time.time() - t0 > 3600 * 3:
            return finish("error_generacion", error="Kernel sin terminar tras 3 h")
        log(work, "esperando al kernel…", s.strip()[-60:])
        time.sleep(45)
    kaggle("kernels", "output", ref, "-p", str(work / "salida"), "--force")
    raw = work / "salida" / "escena001-gpu-raw.mp4"
    kev_p = work / "salida" / "evidence.json"
    if not raw.exists():
        return finish("error_generacion", error="El kernel no produjo escena001-gpu-raw.mp4 (ver salida/)")
    kev = json.loads(kev_p.read_text(encoding="utf-8")) if kev_p.exists() else {}
    ev["kernel"] = kev
    if kev.get("raw_sha256") and kev["raw_sha256"] != media.sha256(raw):
        return finish("error_generacion", error="La huella del bruto descargado no coincide con la del kernel")

    # 2) exportación final y verificación local (idéntica a la de CPU)
    final = work / "liora-escena-001-mi-primer-maquillaje.mp4"
    info = media.encode_safari(raw, final)
    ev["mp4"] = {"file": final.name, "sha256": media.sha256(final), "frames": media.count_frames(final), "probe": info,
                 "safari_issues": media.safari_check(info), "frame_health": media.degenerate_frames(final)}
    ev["generated"] = ev["mp4"]["frame_health"]["ok"]
    from liora_engine.identity import IdentityPack, check_video
    idr = check_video(IdentityPack.load(a.pack), final, stage_index=1)
    frames_ok = IL.frame_continuity([(x["t"], x.get("distance")) for x in idr.get("series", [])], duration=info.get("duration"), tolerance=idr.get("tolerance", 0.0))
    ev["identity"] = {**{k: v for k, v in idr.items() if k != "series"}, "frames": frames_ok}
    try:
        from liora_engine.continuity import evaluate, profile
        ev["continuity"] = {k: v for k, v in evaluate("piel", profile(final), None).items() if k != "start"}
    except Exception as e:  # noqa: BLE001
        ev["continuity"] = {"verdict": "unavailable", "reason": str(e)}
    media.last_frame(final, work / "portada-escena-001.png")
    ok = ev["generated"] and not ev["mp4"]["safari_issues"] and idr["verdict"] != "fail" and frames_ok["ok"]
    return finish("REVISION" if ok else "RECHAZADO",
                  note="Pendiente de revisión visual humana (manos, ojos, piel y pincel)" if ok else "No cumple los criterios: no se presenta como Liora oficial")


if __name__ == "__main__":
    raise SystemExit(main())
