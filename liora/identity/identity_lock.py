"""LIORA IDENTITY LOCK · lado Python (Liora Engine y mantenimiento). Espejo de identity-lock.js.

Sin imágenes: el manifiesto solo guarda la huella SHA-256 del maestro privado, su procedencia y los derivados.
Uso de mantenimiento (aplicar el sello generado en el iPhone, una sola vez):
    python identity/identity_lock.py verify
    python identity/identity_lock.py seal liora-sello-identidad.json
    python identity/identity_lock.py passport liora-pasaporte-identidad.json   (solo guarda su huella)
    python identity/identity_lock.py check-file <imagen>
"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
import re
import sys
from pathlib import Path

LOCK_PATH = Path(__file__).resolve().parent / "identity-lock.json"
FORMAT, SEAL_FORMAT = "liora-identity-lock-v1", "liora-identity-seal-v1"
AUSENTE, VERIFICADA, SUSTITUCION, PENDIENTE_SELLO = "REFERENCIA_AUSENTE", "REFERENCIA_VERIFICADA", "SUSTITUCION_BLOQUEADA", "PENDIENTE_DE_SELLAR"
RENDER_PENDIENTE, RENDER_APROBADO, RENDER_RECHAZADO = "RENDER_PENDIENTE", "RENDER_APROBADO", "RENDER_RECHAZADO"
STRONG, DOUBTFUL = 0.45, 0.55
FRAME_COVERAGE, FRAME_MAX_RUN, FRAME_SPAN, FRAME_HARD_MARGIN = 0.8, 2, 0.9, 0.1


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
        hist = lock.get("history") or []
        if not hist:
            p.append("falta el historial de versiones")
        for i, e in enumerate(hist):
            if e.get("version") != i + 1:
                p.append(f"historial: versión {i + 1} fuera de orden")
        if hist and hist[-1].get("lock_sha256") != lock.get("lock_sha256"):
            p.append("historial: la última versión no corresponde al candado actual")
        ps = master.get("passport_sha256")
        if ps is not None and not re.fullmatch(r"[0-9a-f]{64}", ps):
            p.append("huella del pasaporte inválida")
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


def frame_continuity(series: list, duration: float | None = None, tolerance: float = 0.0) -> dict:
    """series: [(t, distancia | None), …] con TODOS los fotogramas muestreados. Igual que frameContinuity() en JS."""
    if not series:
        return {"ok": False, "problems": ["Sin fotogramas medidos."]}
    lim, problems = DOUBTFUL + tolerance, []
    measured = [d for _, d in series if isinstance(d, (int, float))]
    coverage = len(measured) / len(series)
    if coverage < FRAME_COVERAGE:
        problems.append(f"Rostro de Liora solo en el {round(coverage * 100)} % de los fotogramas (mínimo {FRAME_COVERAGE * 100:.0f} %).")
    span = series[-1][0] - series[0][0]
    if duration and span < FRAME_SPAN * duration - 0.5:
        problems.append(f"La medición cubre {span:.1f} s de {duration:.1f} s: hay que medir toda la escena.")
    run = worst = 0
    worst_at = max_at = None
    mx = 0.0
    for t, d in series:
        if not isinstance(d, (int, float)):
            continue
        if d > mx:
            mx, max_at = d, t
        run = run + 1 if d > lim else 0
        if run > worst:
            worst, worst_at = run, t
    if worst >= FRAME_MAX_RUN:
        problems.append(f"{worst} fotogramas seguidos con otro rostro (hasta {worst_at} s).")
    if mx > lim + FRAME_HARD_MARGIN:
        problems.append(f"Fotograma con rostro claramente distinto en {max_at} s (distancia {mx:.3f}).")
    return {"ok": not problems, "problems": problems, "coverage": round(coverage, 3), "worst_run": worst, "max": round(mx, 3), "sampled": len(series)}


def render_verdict(lock: dict, master_sha256: str | None, identity_distance: float | None, human_approved: bool, frames: dict | None = None) -> str:
    master = lock.get("master")
    if not master:
        return RENDER_PENDIENTE
    if master_sha256 != master["sha256"]:
        return RENDER_RECHAZADO
    if not isinstance(identity_distance, (int, float)) or identity_distance < 0:
        return RENDER_PENDIENTE
    if identity_distance > DOUBTFUL:
        return RENDER_RECHAZADO
    if frames is None:
        return RENDER_PENDIENTE
    if not frames["ok"]:
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
    return _with_version(nxt, "SELLO_MAESTRO")


def _with_version(nxt: dict, event: str) -> dict:
    nxt["lock_sha256"] = lock_digest(nxt)
    hist = list(nxt.get("history") or [])
    hist.append({"version": len(hist) + 1, "event": event, "at": datetime.now(timezone.utc).isoformat(), "lock_sha256": nxt["lock_sha256"]})
    nxt["history"] = hist
    return nxt


def attach_passport(lock: dict, passport_path: str | Path) -> dict:
    """Vincula el pasaporte biométrico privado al maestro: el candado solo guarda su huella."""
    if not lock.get("master"):
        raise IdentityLockError("Primero hay que sellar el maestro")
    pp = json.loads(Path(passport_path).read_text(encoding="utf-8"))
    if pp.get("format") != "liora-identity-passport-v1" or pp.get("master_sha256") != lock["master"]["sha256"]:
        raise IdentityLockError("El pasaporte no se ha obtenido del maestro sellado")
    event = "PASAPORTE_REVISADO" if lock["master"].get("passport_sha256") else "PASAPORTE"
    return _with_version(dict(lock, master=dict(lock["master"], passport_sha256=sha256_file(passport_path))), event)


def register_derivative(lock: dict, d: dict) -> dict:
    if not lock.get("master") or d.get("master_sha256") != lock["master"]["sha256"]:
        raise IdentityLockError("Derivado de otra referencia: no se registra")
    if d.get("state") != RENDER_APROBADO:
        raise IdentityLockError("Solo se registran como autorizados los renders aprobados")
    if not re.fullmatch(r"[0-9a-f]{64}", d.get("sha256") or ""):
        raise IdentityLockError("Huella del derivado inválida")
    if any(x.get("sha256") == d["sha256"] for x in lock.get("derivatives") or []):
        return lock
    return dict(lock, derivatives=[*(lock.get("derivatives") or []), d])


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
    if cmd == "passport" and len(argv) == 2:
        save(attach_passport(lock, argv[1]))
        print("Pasaporte vinculado (solo su huella). El archivo del pasaporte es privado: no lo subas al repositorio.")
        return 0
    if cmd == "check-file" and len(argv) == 2:
        print(reference_state(lock, sha256_file(argv[1])))
        return 0
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
