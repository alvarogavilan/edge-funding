"""LIORA IDENTITY LOCK · lado Python (Liora Engine y mantenimiento). Espejo de identity-lock.js.

Sin imágenes: el manifiesto solo guarda la huella SHA-256 del maestro privado, su procedencia y los derivados.
Uso de mantenimiento (aplicar el sello generado en el iPhone, una sola vez):
    python identity/identity_lock.py verify
    python identity/identity_lock.py seal liora-sello-identidad.json
    python identity/identity_lock.py check-file <imagen>
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

LOCK_PATH = Path(__file__).resolve().parent / "identity-lock.json"
FORMAT, SEAL_FORMAT = "liora-identity-lock-v1", "liora-identity-seal-v1"
AUSENTE, VERIFICADA, SUSTITUCION, PENDIENTE_SELLO = "REFERENCIA_AUSENTE", "REFERENCIA_VERIFICADA", "SUSTITUCION_BLOQUEADA", "PENDIENTE_DE_SELLAR"
RENDER_PENDIENTE, RENDER_APROBADO, RENDER_RECHAZADO = "RENDER_PENDIENTE", "RENDER_APROBADO", "RENDER_RECHAZADO"
STRONG, DOUBTFUL = 0.45, 0.55


class IdentityLockError(ValueError):
    pass


def sha256_file(path: str | Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def canonical(value) -> str:
    # Igual que canonical() de identity-lock.js: claves ordenadas, sin espacios, sin escapar no-ASCII.
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def lock_digest(lock: dict) -> str:
    return hashlib.sha256(canonical({"identity_id": lock.get("identity_id"), "master": lock.get("master")}).encode("utf-8")).hexdigest()


def load(path: str | Path = LOCK_PATH) -> dict:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def validate(lock: dict) -> list[str]:
    p = []
    if lock.get("format") != FORMAT:
        p.append("formato desconocido")
    if not re.fullmatch(r"LIORA-VALE-\d{4}", lock.get("identity_id") or ""):
        p.append("identificador permanente inválido")
    master = lock.get("master")
    if master:
        if not re.fullmatch(r"[0-9a-f]{64}", master.get("sha256") or ""):
            p.append("SHA-256 del maestro inválido")
        if not (master.get("provenance") or {}).get("source"):
            p.append("falta la procedencia del maestro")
        if lock.get("lock_sha256") != lock_digest(lock):
            p.append("lock_sha256 no coincide: el maestro o el identificador se han modificado sin un sello nuevo")
    elif lock.get("status") != AUSENTE:
        p.append("sin maestro el estado solo puede ser REFERENCIA_AUSENTE")
    for d in lock.get("derivatives") or []:
        if d.get("state") not in (RENDER_PENDIENTE, RENDER_APROBADO, RENDER_RECHAZADO):
            p.append(f"derivado {str(d.get('sha256'))[:12]}: estado inválido")
        if master and d.get("master_sha256") != master.get("sha256"):
            p.append(f"derivado {str(d.get('sha256'))[:12]}: procede de otra referencia")
    return p


def reference_state(lock: dict, local_sha: str | None) -> str:
    master = lock.get("master")
    if not master:
        return PENDIENTE_SELLO if local_sha else AUSENTE
    if not local_sha:
        return AUSENTE
    return VERIFICADA if local_sha == master["sha256"] else SUSTITUCION


def require_master(official_image: str | Path, path: str | Path = LOCK_PATH) -> dict:
    """Puerta del motor: solo se genera contenido facial de Liora desde el maestro sellado."""
    lock = load(path)
    issues = validate(lock)
    if issues:
        raise IdentityLockError("Identity Lock no íntegro: " + "; ".join(issues))
    if not lock.get("master"):
        raise IdentityLockError("REFERENCIA_AUSENTE: la fotografía maestra de Liora no está sellada; no se genera contenido facial oficial")
    state = reference_state(lock, sha256_file(official_image))
    if state != VERIFICADA:
        raise IdentityLockError(f"{state}: la imagen del trabajo no es el maestro sellado de {lock['identity_id']}")
    return lock


def render_verdict(lock: dict, master_sha256: str | None, identity_distance: float | None, human_approved: bool) -> str:
    master = lock.get("master")
    if not master:
        return RENDER_PENDIENTE
    if master_sha256 != master["sha256"]:
        return RENDER_RECHAZADO
    if not isinstance(identity_distance, (int, float)) or identity_distance < 0:
        return RENDER_PENDIENTE
    if identity_distance > DOUBTFUL:
        return RENDER_RECHAZADO
    return RENDER_APROBADO if human_approved else RENDER_PENDIENTE


def apply_seal(lock: dict, seal: dict) -> dict:
    if seal.get("format") != SEAL_FORMAT or seal.get("identity_id") != lock.get("identity_id"):
        raise IdentityLockError("Sello no válido para esta identidad")
    if lock.get("master") and lock["master"]["sha256"] != seal.get("sha256"):
        raise IdentityLockError("La identidad ya está sellada con otro archivo: sustitución bloqueada")
    if not re.fullmatch(r"[0-9a-f]{64}", seal.get("sha256") or ""):
        raise IdentityLockError("Sello sin SHA-256 válido")
    nxt = dict(lock, status=VERIFICADA, master={
        "sha256": seal["sha256"], "bytes": seal.get("bytes"), "mime": seal.get("mime"), "width": seal.get("width"), "height": seal.get("height"),
        "sealed_at": seal.get("sealed_at"),
        "provenance": {"source": seal.get("source"), "method": "Liora Studio · Sellar identidad oficial (archivo privado, no publicado)"}})
    nxt["lock_sha256"] = lock_digest(nxt)
    return nxt


def save(lock: dict, path: str | Path = LOCK_PATH) -> None:
    Path(path).write_text(json.dumps(lock, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main(argv: list[str]) -> int:
    cmd = argv[0] if argv else "verify"
    lock = load()
    if cmd == "verify":
        issues = validate(lock)
        print(json.dumps({"identity_id": lock["identity_id"], "status": lock["status"], "integro": not issues, "problemas": issues,
                          "maestro_sha256": (lock.get("master") or {}).get("sha256")}, ensure_ascii=False, indent=2))
        return 0 if not issues else 1
    if cmd == "seal" and len(argv) == 2:
        save(apply_seal(lock, json.loads(Path(argv[1]).read_text(encoding="utf-8"))))
        print("Identidad sellada. Ejecuta «verify» y confirma la huella con la que muestra el Studio.")
        return 0
    if cmd == "check-file" and len(argv) == 2:
        print(reference_state(lock, sha256_file(argv[1])))
        return 0
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
