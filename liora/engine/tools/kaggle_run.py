"""Ejecuta el cuaderno P0 en Kaggle por API (versión privada en segundo plano, 2 × T4 + Internet),
espera a que termine, descarga la salida y verifica el MP4 de forma independiente.

Requisitos (nunca en el repositorio ni en el chat): variables de entorno KAGGLE_USERNAME y
KAGGLE_API_TOKEN (o KAGGLE_KEY), y acceso de red a www.kaggle.com y api.kaggle.com.
Uso: python tools/kaggle_run.py --out resultados_kaggle [--dry-run]
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))
from liora_engine import media  # noqa: E402

NOTEBOOK = HERE / "notebooks" / "liora_engine_kaggle.ipynb"
SLUG = "liora-engine-p0"


def kaggle(*args: str, check: bool = True) -> subprocess.CompletedProcess:
    p = subprocess.run([sys.executable, "-m", "kaggle", *args], capture_output=True, text=True)
    if check and p.returncode != 0:
        raise RuntimeError(f"kaggle {' '.join(args)} → {p.returncode}: {(p.stderr or p.stdout)[-800:]}")
    return p


def build_folder(dest: Path, user: str) -> Path:
    dest.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(NOTEBOOK, dest / NOTEBOOK.name)
    meta = {"id": f"{user}/{SLUG}", "title": "Liora Engine P0", "code_file": NOTEBOOK.name, "language": "python",
            "kernel_type": "notebook", "is_private": True, "enable_gpu": True, "enable_internet": True,
            "machine_shape": "NvidiaTeslaT4", "dataset_sources": [], "competition_sources": [], "kernel_sources": []}
    (dest / "kernel-metadata.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    return dest


def verify(out: Path) -> dict:
    evid = next(out.rglob("evidence.json"), None)
    clip = next((p for p in out.rglob("liora-smoke.mp4") if "i2v" not in p.parts), None)
    rep: dict = {"evidence_found": bool(evid), "mp4_found": bool(clip)}
    if evid:
        ev = json.loads(evid.read_text(encoding="utf-8"))
        rep.update(status=ev.get("status"), generated=bool(ev.get("generated")) and not ev.get("test_mode"), error=ev.get("error"),
                   params=ev.get("params"), environment=ev.get("environment"), generation_s=ev.get("generation_s"))
    if clip:
        info = media.probe(clip)
        rep["mp4"] = {"file": str(clip), "sha256": media.sha256(clip), "frames": media.count_frames(clip), "probe": info,
                      "safari_issues": media.safari_check(info), "frame_health": media.degenerate_frames(clip)}
        if evid and rep.get("generated"):
            rep["sha256_matches_evidence"] = rep["mp4"]["sha256"] == ev.get("mp4", {}).get("sha256")
    model = str((rep.get("params") or {}).get("model", ""))
    rep["real_wan22_weights"] = "Wan2.2-TI2V-5B" in model  # ruta de pesos reales (caché de Hugging Face), no el modelo diminuto
    rep["verified_real_mp4"] = bool(clip and rep.get("generated") and rep["real_wan22_weights"] and rep.get("sha256_matches_evidence")
                                    and rep["mp4"]["frame_health"]["ok"] and not rep["mp4"]["safari_issues"])
    return rep


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out")
    ap.add_argument("--verify-dir", help="Verificar una salida de Kaggle descargada a mano (no necesita credenciales)")
    ap.add_argument("--dry-run", action="store_true", help="Solo prepara la carpeta y comprueba credenciales")
    ap.add_argument("--max-hours", type=float, default=11.5)
    a = ap.parse_args()
    if a.verify_dir:
        rep = verify(Path(a.verify_dir))
        media.write_json(Path(a.verify_dir) / "verificacion.json", rep)
        print(json.dumps(rep, ensure_ascii=False, indent=2, default=str))
        return 0 if rep["verified_real_mp4"] else 1
    if not a.out:
        ap.error("--out es obligatorio salvo con --verify-dir")
    out = Path(a.out).resolve()
    out.mkdir(parents=True, exist_ok=True)
    report = {"started_at": datetime.now(timezone.utc).isoformat(), "budget_eur": 0}
    user = os.environ.get("KAGGLE_USERNAME")
    if not user or not (os.environ.get("KAGGLE_API_TOKEN") or os.environ.get("KAGGLE_KEY")):
        report["blocked"] = "Faltan KAGGLE_USERNAME y KAGGLE_API_TOKEN (o KAGGLE_KEY) en el entorno"
        print(json.dumps(report, ensure_ascii=False, indent=2))
        media.write_json(out / "kaggle-run-report.json", report)
        return 2
    folder = build_folder(out / "kernel", user)
    report["kernel"] = f"{user}/{SLUG}"
    if a.dry_run:
        print(f"Carpeta preparada: {folder}")
        return 0
    print(kaggle("kernels", "push", "-p", str(folder), "--accelerator", "NvidiaTeslaT4").stdout.strip())
    t0, last = time.time(), ""
    while time.time() - t0 < a.max_hours * 3600:
        st = kaggle("kernels", "status", report["kernel"], check=False)
        last = (st.stdout or st.stderr).strip()
        print(time.strftime("%H:%M:%S"), last, flush=True)
        if any(w in last.lower() for w in ("complete", "error", "cancel")):
            break
        time.sleep(60)
    report["final_status"] = last
    report["elapsed_min"] = round((time.time() - t0) / 60, 1)
    kaggle("kernels", "output", report["kernel"], "-p", str(out / "output"), "--force", check=False)
    report["verification"] = verify(out / "output")
    report["finished_at"] = datetime.now(timezone.utc).isoformat()
    media.write_json(out / "kaggle-run-report.json", report)
    print(json.dumps(report, ensure_ascii=False, indent=2, default=str))
    return 0 if report["verification"]["verified_real_mp4"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
