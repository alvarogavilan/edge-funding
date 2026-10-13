"""Laboratorio Phygitals: simulación Monte Carlo de sobres.

Datos de partida: auditoría on-chain de RipIndex (rip-index.com/sites/phygitals,
sept. 2026). La tabla de tramos es ilustrativa y está calibrada para que su media
coincida con el edge teórico auditado; sustitúyela por la que muestra la app.

Uso: python3 tools/phygitals_lab.py [millones_de_sobres]
"""
import sys
import numpy as np

# (probabilidad, valor medio del tramo en USD) — sobre Pokémon Rookie $25
TRAMOS_25 = [(0.65, 13), (0.22, 24), (0.09, 45), (0.03, 110), (0.009, 350), (0.001, 2000)]
PRECIO = 25.0


def ev(tramos):
    return sum(p * v for p, v in tramos)


def simular(tramos, precio, buyback, n_sobres, sesiones, rng):
    p = np.array([t[0] for t in tramos]); p = p / p.sum()
    v = np.array([t[1] for t in tramos], dtype=float)
    # dispersión dentro de cada tramo (lognormal, media preservada)
    idx = rng.choice(len(v), size=(sesiones, n_sobres), p=p)
    ruido = rng.lognormal(-0.125, 0.5, size=idx.shape)
    pagos = v[idx] * ruido * buyback
    return (pagos - precio).sum(axis=1)


def main():
    millones = float(sys.argv[1]) if len(sys.argv) > 1 else 100
    rng = np.random.default_rng()
    e = ev(TRAMOS_25)
    print(f"EV teórico sobre $25: ${e:.2f} ({(e / PRECIO - 1) * 100:+.1f}%)")
    for bb in (0.85, 0.90, 0.92, 1.00):
        print(f"  buyback {bb:.0%}: EV al vender ${e * bb:.2f} ({(e * bb / PRECIO - 1) * 100:+.1f}%)")
    print(f"  buyback de equilibrio: {PRECIO / e:.1%}\n")

    total = 0
    for bb in (0.85, 0.90, 1.00):
        print(f"== buyback {bb:.0%} ==")
        for n in (10, 50, 200, 1000):
            sesiones = max(1000, int(millones * 1e6 / n / 3 / 4))
            r = simular(TRAMOS_25, PRECIO, bb, n, sesiones, rng)
            total += sesiones * n
            print(f"  {n:>5} sobres (${n * PRECIO:,.0f}): P(ganar)={np.mean(r > 0):6.1%}  "
                  f"mediana={np.median(r):+9.0f}$  media={r.mean():+9.0f}$  "
                  f"peor 5%={np.percentile(r, 5):+9.0f}$")
    print(f"\nSobres simulados: {total:,}")


if __name__ == "__main__":
    main()
