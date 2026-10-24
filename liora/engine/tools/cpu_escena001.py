"""ESCENA 001 de la auténtica Liora en CPU (sin GPU), con pesos oficiales de Wan 2.1 VACE 1.3B.

Pensado para este contenedor: 4 núcleos, 15 GB de RAM y ~14 GB de disco libre. Trabaja por fases para caber:
  1) espera, si se pide, a que huggingface.co sea accesible (--wait-hours);
  2) codifica el texto con UMT5 (11 GB), guarda los embeddings y BORRA el codificador;
  3) descarga transformador + VAE, genera con el maestro sellado como primer fotograma y referencia;
  4) verifica identidad fotograma a fotograma (dlib + Identity Lock), salud de fotogramas y continuidad;
  5) exporta MP4 1080×1920 H.264 compatible con iPhone y evidence.json con SHA-256.
Coste medido en este CPU (arquitectura real, 1 bloque): 65 fotogramas 480×832 ≈ 29 s por bloque y pasada (fp32).
Todo queda en liora/identity/private/escena001 (ignorado por git): la escena no se publica sin revisión humana.
Con --model-dir <canalización diminuta> se prueba el código sin descargar nada; esa salida es ruido y se marca test_only.
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))
from liora_engine import media, pipeline  # noqa: E402

REPO = "Wan-AI/Wan2.1-VACE-1.3B-diffusers"
PRIV = HERE.parent / "identity" / "private"


def log(work: Path, *a) -> None:
    line = f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] " + " ".join(str(x) for x in a)
    print(line, flush=True)
    with open(work / "run.log", "a", encoding="utf-8") as f:
        f.write(line + "\n")


def hf_reachable() -> bool:
    try:
        urllib.request.urlopen(f"https://huggingface.co/api/models/{REPO}", timeout=15)
        return True
    except Exception:  # noqa: BLE001
        return False


def free_gb(p: Path) -> float:
    return shutil.disk_usage(p).free / 1e9


def fit_cover(img, w: int, h: int):
    from PIL import ImageOps
    return ImageOps.fit(img.convert("RGB"), (w, h), centering=(0.5, 0.4))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--work", default=str(PRIV / "escena001"))
    ap.add_argument("--master", default=str(PRIV / "liora-vale-0001-maestro.png"))
    ap.add_argument("--pack", default=str(PRIV / "liora-identity-pack.json"))
    ap.add_argument("--seconds", type=float, default=4.0)
    ap.add_argument("--frames", type=int, default=49, help="Fotogramas generados (4n+1); se reproducen a --fps")
    ap.add_argument("--steps", type=int, default=14)
    ap.add_argument("--cfg-steps", type=int, default=8, help="Pasos iniciales con guía CFG (forma y movimiento); el resto sin CFG para ahorrar tiempo")
    ap.add_argument("--guidance", type=float, default=5.0)
    ap.add_argument("--width", type=int, default=480)
    ap.add_argument("--height", type=int, default=832)
    ap.add_argument("--fps", type=int, default=12)
    ap.add_argument("--seed", type=int, default=20261019)
    ap.add_argument("--wait-hours", type=float, default=0.0, help="Esperar hasta N horas a que huggingface.co sea accesible")
    ap.add_argument("--model-dir", help="Canalización local (pruebas): no descarga nada y la salida se marca test_only")
    a = ap.parse_args()
    work = Path(a.work)
    work.mkdir(parents=True, exist_ok=True)
    ev = {"format": "liora-escena001-cpu-v1", "started_at": datetime.now(timezone.utc).isoformat(), "generated": False,
          "test_only": bool(a.model_dir), "budget_eur": 0, "params": vars(a)}
    out_ev = work / "evidence.json"

    def finish(status: str, **kw) -> int:
        ev.update(status=status, finished_at=datetime.now(timezone.utc).isoformat(), **kw)
        media.write_json(out_ev, ev)
        log(work, "ESTADO:", status, kw.get("error", ""))
        return 0 if status == "REVISION" else 2

    # 0) Identity Lock: solo el maestro sellado, nunca otra cara
    IL = pipeline._identity_lock()
    try:
        lock = IL.require_master(a.master)
    except Exception as e:  # noqa: BLE001
        return finish("bloqueado_identidad", error=str(e))
    ev["identity_lock"] = {"identity_id": lock["identity_id"], "master_sha256": lock["master"]["sha256"], "lock_sha256": lock["lock_sha256"]}

    import torch
    torch.set_num_threads(os.cpu_count())
    torch.manual_seed(a.seed)
    from huggingface_hub import model_info, snapshot_download

    nf = a.frames or int(a.seconds * a.fps) // 4 * 4 + 1
    cfg = json.loads(pipeline.STAGES_FILE.read_text(encoding="utf-8"))
    prompt = pipeline.SCENE001_PROMPT.format(identity=cfg["identity_text"])
    negative = cfg["negative_prompt"]
    ev.update(prompt=prompt, negative_prompt=negative, num_frames=nf)

    if a.model_dir:
        model_dir = Path(a.model_dir)
    else:
        # 1) esperar a la red
        t_end = time.time() + a.wait_hours * 3600
        while not hf_reachable():
            if time.time() >= t_end:
                return finish("bloqueado_red", error="huggingface.co no es accesible desde este entorno (política de red): no hay pesos oficiales")
            log(work, "huggingface.co inaccesible; nuevo intento en 5 min")
            time.sleep(300)
        info = model_info(REPO)
        ev["model"] = {"repo": REPO, "commit": info.sha, "license": getattr(info.card_data, "license", None)}
        model_dir = work / "model"
        os.system("pip cache purge > /dev/null 2>&1")  # libera ~3 GB para los pesos

    emb_path = work / "prompt_embeds.pt"
    if not emb_path.exists():
        # 2) texto → embeddings con UMT5; después se borra el codificador para liberar disco y RAM
        if not a.model_dir:
            log(work, "Descargando codificador de texto y tokenizador; libre:", round(free_gb(work), 1), "GB")
            snapshot_download(REPO, local_dir=model_dir, allow_patterns=["text_encoder/*", "tokenizer/*", "model_index.json"])
        from transformers import AutoTokenizer, UMT5EncoderModel
        tok = AutoTokenizer.from_pretrained(model_dir / "tokenizer")
        te = UMT5EncoderModel.from_pretrained(model_dir / "text_encoder", torch_dtype=torch.bfloat16).eval()
        embs = {}
        for k, text in (("prompt", prompt), ("negative", negative)):
            ids = tok([text], padding="max_length", max_length=512, truncation=True, add_special_tokens=True, return_attention_mask=True, return_tensors="pt")
            with torch.no_grad():
                h = te(ids.input_ids, ids.attention_mask).last_hidden_state.float()
            n = int(ids.attention_mask.sum())
            h[:, n:] = 0  # mismo relleno a cero que WanPipeline._get_t5_prompt_embeds
            embs[k] = h
        torch.save(embs, emb_path)
        del te
        if not a.model_dir:
            shutil.rmtree(model_dir / "text_encoder", ignore_errors=True)
        log(work, "Embeddings guardados; codificador eliminado")
    embs = torch.load(emb_path)

    # 3) transformador + VAE oficiales y generación en CPU
    if not a.model_dir:
        log(work, "Descargando transformador y VAE; libre:", round(free_gb(work), 1), "GB")
        snapshot_download(REPO, local_dir=model_dir, allow_patterns=["transformer/*", "vae/*", "scheduler/*", "model_index.json"])
    from diffusers import UniPCMultistepScheduler, WanVACEPipeline
    from PIL import Image
    pipe = WanVACEPipeline.from_pretrained(model_dir, text_encoder=None, tokenizer=None, torch_dtype=torch.float32)
    pipe.scheduler = UniPCMultistepScheduler.from_config(pipe.scheduler.config, flow_shift=3.0)
    pipe.vae.enable_tiling() if hasattr(pipe.vae, "enable_tiling") else None
    master = Image.open(a.master)
    first = fit_cover(master, a.width, a.height)
    grey = Image.new("RGB", (a.width, a.height), (128, 128, 128))
    video = [first] + [grey] * (nf - 1)
    mask = [Image.new("L", (a.width, a.height), 0)] + [Image.new("L", (a.width, a.height), 255)] * (nf - 1)
    t0, step_t = time.time(), [time.time()]

    def on_step(p, i, t, kw):
        now = time.time()
        log(work, f"paso {i + 1}/{a.steps} · {now - step_t[0]:.0f} s · total {(now - t0) / 60:.1f} min")
        step_t[0] = now
        media.write_json(work / "progress.json", {"step": i + 1, "steps": a.steps, "elapsed_min": round((now - t0) / 60, 1)})
        if i + 1 >= a.cfg_steps and p._guidance_scale > 1:
            p._guidance_scale = 1.0  # CFG solo en los primeros pasos
            log(work, "CFG desactivada para los pasos restantes")
        return kw

    # 45 bloques (30 + 15 VACE); coste medido de 1 bloque fp32 en este CPU: 49 fotogramas ≈ 19,4 s, 65 ≈ 29,3 s, 81 ≈ 40,9 s
    block_s = {49: 19.4, 65: 29.3, 81: 40.9}.get(nf, 19.4 * nf / 49)
    est_h = block_s * 45 * (min(a.cfg_steps, a.steps) * (2 if a.guidance > 1 else 1) + max(0, a.steps - a.cfg_steps)) / 3600
    ev["estimated_hours"] = round(est_h, 1)
    log(work, f"Generando {nf} fotogramas {a.width}×{a.height} · {a.steps} pasos (CFG {a.guidance} en {a.cfg_steps}) · estimado {est_h:.1f} h")
    try:
        frames = pipe(video=video, mask=mask, reference_images=[master.convert("RGB")], prompt_embeds=embs["prompt"],
                      negative_prompt_embeds=embs["negative"] if a.guidance > 1 else None, height=a.height, width=a.width, num_frames=nf,
                      num_inference_steps=a.steps, guidance_scale=a.guidance, generator=torch.Generator("cpu").manual_seed(a.seed),
                      output_type="np", callback_on_step_end=on_step).frames[0]
    except Exception as e:  # noqa: BLE001
        return finish("error_generacion", error=f"{type(e).__name__}: {e}")
    ev["generation_s"] = round(time.time() - t0, 1)

    # 4) exportación y verificación
    import numpy as np
    raw = work / "escena001-raw.mp4"
    media.frames_to_mp4([(np.clip(f, 0, 1) * 255).astype(np.uint8) for f in frames], raw, fps=a.fps)
    final = work / "liora-escena-001-mi-primer-maquillaje.mp4"
    info = media.encode_safari(raw, final)
    ev["mp4"] = {"file": final.name, "sha256": media.sha256(final), "frames": media.count_frames(final), "probe": info,
                 "safari_issues": media.safari_check(info), "frame_health": media.degenerate_frames(final)}
    ev["generated"] = not a.model_dir and ev["mp4"]["frame_health"]["ok"]
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
    if a.model_dir:
        return finish("test_only", note="Canalización diminuta de pesos aleatorios: NO es una generación")
    return finish("REVISION" if ok else "RECHAZADO",
                  note="Pendiente de revisión visual humana (manos, ojos, piel y pincel)" if ok else "No cumple los criterios: no se presenta como Liora oficial")


if __name__ == "__main__":
    raise SystemExit(main())
