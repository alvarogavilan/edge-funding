"""Mide el coste real de un paso de Wan 2.2 TI2V-5B en CPU (arquitectura real, pesos aleatorios, 1 bloque).

No genera vídeo ni lo pretende: cronometra un bloque del transformador con el número de tokens de un clip
y extrapola al modelo completo (30 bloques × 2 pasadas por guía CFG × pasos). Uso:
  python tools/cpu_feasibility.py --frames 121 --height 704 --width 1280 --steps 40
"""
import argparse, json, os, time
import torch
from diffusers import WanTransformer3DModel

ap = argparse.ArgumentParser()
ap.add_argument("--frames", type=int, default=121)
ap.add_argument("--height", type=int, default=704)
ap.add_argument("--width", type=int, default=1280)
ap.add_argument("--steps", type=int, default=40)
ap.add_argument("--dtype", default="bfloat16")
a = ap.parse_args()
dt = getattr(torch, a.dtype)
torch.set_num_threads(os.cpu_count())
# Configuración publicada de Wan2.2-TI2V-5B (transformer/config.json), con 1 bloque en lugar de 30.
cfg = dict(patch_size=(1, 2, 2), num_attention_heads=24, attention_head_dim=128, in_channels=48, out_channels=48, text_dim=4096,
           freq_dim=256, ffn_dim=14336, num_layers=1, cross_attn_norm=True, qk_norm="rms_norm_across_heads", eps=1e-6, rope_max_seq_len=1024)
m = WanTransformer3DModel(**cfg).to(dt).eval()
params_block = sum(p.numel() for b in m.blocks for p in b.parameters())
lat_t, lat_h, lat_w = (a.frames - 1) // 4 + 1, a.height // 16, a.width // 16
x = torch.randn(1, 48, lat_t, lat_h, lat_w, dtype=dt)
tokens = lat_t * (lat_h // 2) * (lat_w // 2)
ctx = torch.randn(1, 512, 4096, dtype=dt)
t = torch.tensor([500])
with torch.no_grad():
    t0 = time.time(); m(hidden_states=x, timestep=t, encoder_hidden_states=ctx, return_dict=False); one = time.time() - t0
total_s = one * 30 * 2 * a.steps
print(json.dumps({"tokens": tokens, "latent": [lat_t, lat_h, lat_w], "params_per_block_M": round(params_block / 1e6, 1),
                  "threads": torch.get_num_threads(), "dtype": a.dtype, "one_block_forward_s": round(one, 1),
                  "estimated_full_generation_h": round(total_s / 3600, 1), "estimate_formula": "bloque × 30 bloques × 2 (CFG) × pasos; sin VAE ni codificador de texto"}, indent=2))
