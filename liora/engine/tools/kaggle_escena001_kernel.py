# ESCENA 001 de Liora en la GPU gratuita de Kaggle (kernel privado). Este archivo se empuja con
# tools/kaggle_escena001.py; NO contiene datos privados: el maestro llega como dataset privado del
# propietario y se verifica por su huella SHA-256 antes de generar nada.
import hashlib
import json
import pathlib
import subprocess
import time

MASTER_SHA = "42a10b1fd68f8d3801fbfae2cf8eac56037bacf68e796d699fe27e96853e43d9"
REPO = "Wan-AI/Wan2.1-VACE-1.3B-diffusers"
PARAMS_INLINE = None  # tools/kaggle_escena001.py sustituye esta línea por los parámetros reales al empujar
P = {"frames": 81, "steps": 30, "guidance": 5.0, "width": 480, "height": 832, "seed": 20261112, "fps": 12,
     "prompt": "", "negative": "", **(PARAMS_INLINE or {})}
if not P["prompt"]:
    raise SystemExit("Parámetros no incrustados: empuja este kernel con tools/kaggle_escena001.py")
WORK = pathlib.Path("/kaggle/working")
t0 = time.time()
ev = {"format": "liora-escena001-kaggle-v1", "params": P, "master_sha256": MASTER_SHA}


def log(*a):
    print(f"[{time.time() - t0:7.1f}s]", *a, flush=True)


# 0) Maestro sellado: localizar por huella; sin él NO se genera nada (Identity Lock)
master_path = None
for f in pathlib.Path("/kaggle/input").rglob("*"):
    if f.is_file() and f.stat().st_size < 30e6:
        if hashlib.sha256(f.read_bytes()).hexdigest() == MASTER_SHA:
            master_path = f
            break
if not master_path:
    ev["status"] = "bloqueado_identidad"
    ev["error"] = "El maestro sellado de LIORA-VALE-0001 no está en /kaggle/input: no se genera contenido facial"
    (WORK / "evidence.json").write_text(json.dumps(ev, ensure_ascii=False, indent=2))
    raise SystemExit(ev["error"])
log("maestro verificado por huella:", master_path.name)

subprocess.run(["pip", "install", "-q", "-U", "diffusers", "transformers", "accelerate", "ftfy", "imageio[ffmpeg]"], check=True)
import imageio  # noqa: E402
import numpy as np  # noqa: E402
import torch  # noqa: E402
from PIL import Image, ImageOps  # noqa: E402

torch.manual_seed(P["seed"])

# 1) texto → embeddings con UMT5 en CPU bfloat16 (~11,5 GB de RAM; mismo camino probado en CPU);
#    mismo relleno a cero que WanPipeline._get_t5_prompt_embeds
from transformers import AutoTokenizer, UMT5EncoderModel  # noqa: E402

tok = AutoTokenizer.from_pretrained(REPO, subfolder="tokenizer")
te = UMT5EncoderModel.from_pretrained(REPO, subfolder="text_encoder", torch_dtype=torch.bfloat16).eval()
embs = {}
for k, text in (("prompt", P["prompt"]), ("negative", P["negative"])):
    ids = tok([text], padding="max_length", max_length=512, truncation=True, add_special_tokens=True, return_attention_mask=True, return_tensors="pt")
    with torch.no_grad():
        h = te(ids.input_ids, ids.attention_mask).last_hidden_state.float()
    h[:, int(ids.attention_mask.sum()):] = 0
    embs[k] = h.to(torch.float16)
del te
log("embeddings listos")

# 2) canalización VACE en fp16 sobre la GPU (VAE en fp32 para evitar NaN)
from diffusers import UniPCMultistepScheduler, WanVACEPipeline  # noqa: E402

pipe = WanVACEPipeline.from_pretrained(REPO, text_encoder=None, tokenizer=None, torch_dtype=torch.float16)
pipe.scheduler = UniPCMultistepScheduler.from_config(pipe.scheduler.config, flow_shift=3.0)
pipe.to("cuda")
pipe.vae.to(dtype=torch.float32)
ev["model"] = {"repo": REPO, "dtype": "float16 (VAE float32)"}
log("canalización en GPU")

nf, w, hgt = P["frames"], P["width"], P["height"]
master = Image.open(master_path).convert("RGB")
grey = Image.new("RGB", (w, hgt), (128, 128, 128))
video = [grey] * nf  # identidad solo por referencia: toda la escena es acción
mask = [Image.new("L", (w, hgt), 255)] * nf


def on_step(p, i, t, kw):
    log(f"paso {i + 1}/{P['steps']}")
    return kw


gen = torch.Generator("cuda").manual_seed(P["seed"])
frames = pipe(video=video, mask=mask, reference_images=[master], prompt_embeds=embs["prompt"].to("cuda"),
              negative_prompt_embeds=embs["negative"].to("cuda"), height=hgt, width=w, num_frames=nf,
              num_inference_steps=P["steps"], guidance_scale=P["guidance"], generator=gen,
              output_type="np", callback_on_step_end=on_step).frames[0]
ev["generation_s"] = round(time.time() - t0, 1)
log("difusión completa")

arr = [(np.clip(f, 0, 1) * 255).astype(np.uint8) for f in frames]
imageio.mimwrite(WORK / "escena001-gpu-raw.mp4", arr, fps=P.get("fps", 12), codec="libx264", quality=9, pixelformat="yuv420p")
Image.fromarray(arr[-1]).save(WORK / "ultimo-fotograma.png")
ev["raw_sha256"] = hashlib.sha256((WORK / "escena001-gpu-raw.mp4").read_bytes()).hexdigest()
ev["frames"] = len(arr)
ev["status"] = "GENERADO_BRUTO"  # la verificación de identidad y la exportación final se hacen en Liora Studio
(WORK / "evidence.json").write_text(json.dumps(ev, ensure_ascii=False, indent=2))
log("ESTADO:", ev["status"], ev["raw_sha256"][:16])
