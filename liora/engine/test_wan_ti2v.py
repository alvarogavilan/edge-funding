#!/usr/bin/env python3
"""LIORA: prueba local/externa del motor Wan2.2 TI2V-5B.
No reserva GPU, no hace pagos y no simula fotogramas.
Requiere por separado el repositorio oficial Wan2.2, pesos y GPU real.
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path
from datetime import datetime, timezone


def main():
    ap = argparse.ArgumentParser(description="Liora: prueba verificable imagen-a-video con presupuesto 0 EUR")
    ap.add_argument("--wan-repo", type=Path, required=True, help="Ruta a Wan2.2 oficial clonado")
    ap.add_argument("--model-dir", type=Path, required=True, help="Ruta a pesos Wan2.2-TI2V-5B")
    ap.add_argument("--image", type=Path, required=True, help="Foto maestra autorizada, no se incluye en GitHub")
    ap.add_argument("--output-dir", type=Path, required=True)
    ap.add_argument("--prompt", default="An original fictional woman in a beauty studio, applying makeup with a brush in a physically convincing motion, consistent face, photorealistic close-up, static camera, natural skin texture.")
    ap.add_argument("--size", choices=["704*1280", "1280*704"], default="704*1280")
    ap.add_argument("--allow-execution", action="store_true", help="Ejecutar exclusivamente con infraestructura ya disponible sin facturación")
    args = ap.parse_args()

    issues = []
    generator = args.wan_repo / "generate.py"
    if not generator.is_file():
        issues.append("Falta generate.py del repositorio oficial Wan2.2")
    if not args.model_dir.is_dir():
        issues.append("No se han descargado los pesos del modelo")
    if not args.image.is_file():
        issues.append("Falta fotografía maestra verificable")
    if shutil.which("nvidia-smi") is None:
        issues.append("No se detecta controlador CUDA/NVIDIA; no se asegura que exista GPU")
    else:
        result = subprocess.run(["nvidia-smi", "--query-gpu=memory.total", "--format=csv,noheader,nounits"], text=True, capture_output=True, timeout=15)
        if result.returncode != 0:
            issues.append("nvidia-smi no responde correctamente")
        else:
            try:
                vram = max(int(line.strip()) for line in result.stdout.splitlines())
                if vram < 24576:
                    issues.append("GPU disponible con menos de 24 GiB; configuración oficial 5B no verificada")
            except ValueError:
                issues.append("No se pudo comprobar memoria VRAM")
    if not args.allow_execution:
        issues.append("Modo diagnóstico: ejecución no autorizada mediante --allow-execution")
    report = {"project": "Liora", "timestamp_utc": datetime.now(timezone.utc).isoformat(), "engine": "Wan2.2-TI2V-5B", "model_validated": False, "video_generated": False, "budget_eur": 0, "issues": issues}
    args.output_dir.mkdir(parents=True, exist_ok=True)
    report_path = args.output_dir / "engine-test-report.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    if issues:
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 2
    command = [
        sys.executable, str(generator), "--task", "ti2v-5B",
        "--size", args.size, "--ckpt_dir", str(args.model_dir.resolve()),
        "--offload_model", "True", "--convert_model_dtype",
        "--t5_cpu", "--image", str(args.image.resolve()), "--prompt", args.prompt,
        "--save_file", str((args.output_dir / "liora-test.mp4").resolve())
    ]
    print("Ejecutando generación auténtica. No existe fallback simulado.", flush=True)
    completed = subprocess.run(command, cwd=args.wan_repo)
    output = args.output_dir / "liora-test.mp4"
    report["video_generated"] = completed.returncode == 0 and output.is_file() and output.stat().st_size > 10000
    report["model_validated"] = report["video_generated"]
    report["video_file"] = str(output) if report["video_generated"] else None
    report["return_code"] = completed.returncode
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return 0 if report["video_generated"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
