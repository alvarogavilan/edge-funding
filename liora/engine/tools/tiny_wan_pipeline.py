"""Construye una canalización Wan 2.2 TI2V DIMINUTA con pesos aleatorios (misma arquitectura y clases de diffusers).

Sirve solo para validar en CPU la carga, el reparto de dispositivos, la exportación y el registro del motor sin
descargar 25 GB. Su salida es ruido: NO es una generación y nunca se presenta como tal.
Uso: python tools/tiny_wan_pipeline.py <carpeta_salida>
"""
import sys

import torch
from diffusers import AutoencoderKLWan, FlowMatchEulerDiscreteScheduler, WanPipeline, WanTransformer3DModel
from tokenizers import Tokenizer, models, pre_tokenizers
from transformers import PreTrainedTokenizerFast, UMT5Config, UMT5EncoderModel

out = sys.argv[1]
torch.manual_seed(0)
words = "<pad> </s> <unk> a the woman makeup brush cheek skin video photorealistic vertical hand she her with".split()
tk = Tokenizer(models.WordLevel({w: i for i, w in enumerate(words)}, unk_token="<unk>"))
tk.pre_tokenizer = pre_tokenizers.Whitespace()
tokenizer = PreTrainedTokenizerFast(tokenizer_object=tk, pad_token="<pad>", eos_token="</s>", unk_token="<unk>")
text_encoder = UMT5EncoderModel(UMT5Config(vocab_size=len(words), d_model=32, d_kv=8, d_ff=64, num_layers=1, num_heads=4))
transformer = WanTransformer3DModel(patch_size=(1, 2, 2), num_attention_heads=2, attention_head_dim=12, in_channels=48, out_channels=48,
                                    text_dim=32, freq_dim=16, ffn_dim=32, num_layers=1, cross_attn_norm=True,
                                    qk_norm="rms_norm_across_heads", rope_max_seq_len=32)
vae = AutoencoderKLWan(base_dim=12, decoder_base_dim=12, z_dim=48, dim_mult=[1, 1, 1, 1], num_res_blocks=1, temperal_downsample=[False, True, True],
                       latents_mean=[0.0] * 48, latents_std=[1.0] * 48, is_residual=True, in_channels=12, out_channels=12,
                       patch_size=2, scale_factor_temporal=4, scale_factor_spatial=16)
pipe = WanPipeline(tokenizer=tokenizer, text_encoder=text_encoder, vae=vae, scheduler=FlowMatchEulerDiscreteScheduler(shift=5.0),
                   transformer=transformer, expand_timesteps=True)
pipe.save_pretrained(out)
print("canalización diminuta guardada en", out)
