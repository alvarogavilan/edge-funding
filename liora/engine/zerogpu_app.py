# Liora Engine — prueba ZeroGPU gratuita
# Copiar este directorio a un Hugging Face Space Gradio con ZeroGPU,
# SOLO cuando haya cuenta apta y condiciones verificadas.
# Este script no utiliza servicios de pago, ni claves, ni genera un vídeo simulado.
import json
import hashlib
import os
import subprocess
import sys
import tempfile
from pathlib import Path
import gradio as gr
import spaces

WAN_PATH = Path(os.environ.get("WAN_REPO", "/app/Wan2.2"))
MODEL_PATH = Path(os.environ.get("WAN_MODEL_DIR", "/app/Wan2.2-TI2V-5B"))
FRAMES = 49  # 2 segundos @24fps aproximadamente; primera prueba de viabilidad
SIZE = "704*1280"

def requirements_check():
    import shutil
    import torch
    return {
        "cuda": torch.cuda.is_available(),
        "nvidia": shutil.which("nvidia-smi") is not None,
        "wan_code": (WAN_PATH / "generate.py").is_file(),
        "wan_weights": MODEL_PATH.is_dir() and any(MODEL_PATH.iterdir()),
        "ffprobe": shutil.which("ffprobe") is not None,
    }

@spaces.GPU(duration=300)
def render(image_path, prompt):
    # ZeroGPU cuota compartida; 300 segundos es un máximo solicitado, NO una garantía.
    # Foto original enviada a este runtime externo: usar únicamente espacios PRIVADOS,
    # acceso protegido y licencia y términos autorizados.
    if os.environ.get('LIORA_PRIVATE_RUNTIME') != '1':
        raise gr.Error('Bloqueado: no se ha autorizado un entorno privado. No uses la fotografía oficial en un Space público.')
    if not image_path:
        raise gr.Error("Falta una imagen de referencia.")
    if not prompt or len(prompt.strip()) < 12:
        raise gr.Error("Describe la acción real que debe realizar Liora.")
    state = requirements_check()
    if not all(state.values()):
        raise gr.Error("Infraestructura no lista: " + json.dumps(state))
    with tempfile.TemporaryDirectory(prefix="liora_") as td:
        output = Path(td) / "scene.mp4"
        cmd = [
            sys.executable, str(WAN_PATH / "generate.py"), "--task", "ti2v-5B",
            "--size", SIZE, "--frame_num", str(FRAMES), "--ckpt_dir",
            str(MODEL_PATH), "--offload_model", "True", "--convert_model_dtype",
            "--t5_cpu", "--image", str(image_path), "--prompt", prompt.strip(),
            "--save_file", str(output)
        ]
        result = subprocess.run(cmd, cwd=WAN_PATH, timeout=280, capture_output=True, text=True)
        if result.returncode != 0 or not output.exists():
            raise gr.Error("Wan no pudo generar vídeo: " + (result.stderr or result.stdout)[-800:])
        probe = subprocess.run([
            "ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
            "stream=codec_name,width,height", "-of", "json", str(output)
        ], capture_output=True, text=True)
        if probe.returncode or not json.loads(probe.stdout).get("streams"):
            raise gr.Error("El MP4 producido no contiene vídeo verificable.")
        # Gradio necesita el archivo fuera del directorio temporal.
        import shutil
        fd, export_name = tempfile.mkstemp(prefix="liora_verified_", suffix=".mp4")
        os.close(fd)
        exported = Path(export_name)
        shutil.copyfile(output, exported)
        digest = hashlib.sha256(exported.read_bytes()).hexdigest()
        return str(exported), "MP4 real generado; SHA-256: " + digest + ". Falta revisión visual y autorización comercial."

with gr.Blocks(title="Liora — prueba ZeroGPU 0 €") as demo:
    gr.Markdown("# Prueba experimental de vídeo real — Liora Engine\nNo garantiza GPU, privacidad de Space público ni generación dentro de cuota. No usar fotografía maestra confidencial hasta asegurar el acceso.")
    image = gr.Image(type="filepath", label="Imagen autorizada para la prueba")
    prompt = gr.Textbox(value="The fictional woman applies a makeup brush slowly to her cheek, realistic brush contact with skin, fixed identity, natural face motion, static camera.", label="Movimiento")
    check = gr.Button("Diagnóstico gratuito (sin GPU ni imagen)")
    diagnostics = gr.JSON(label="Dependencias detectadas")
    check.click(requirements_check, inputs=[], outputs=[diagnostics])
    run = gr.Button("Intentar generar vídeo sin pago")
    video = gr.Video(label="Vídeo real generado (si hay capacidad)")
    status = gr.Textbox(label="Resultado")
    run.click(render, inputs=[image, prompt], outputs=[video, status], concurrency_limit=1)

if __name__ == "__main__":
    demo.launch()
