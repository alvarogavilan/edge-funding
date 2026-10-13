"""Modelo descriptivo de categorías Mythic. Sin llamadas ni compras a Phygitals.
Datos publicados observados 2026-10-13. No supone precios dentro de los tramos.
Uso: python tools/phygitals_lab.py [sorteos, máximo 100000000]
"""
import argparse
import json
import numpy as np


def simulate(draws=5_000_000, seed=20261013):
    if not isinstance(draws, int) or not 1 <= draws <= 100_000_000:
        raise ValueError('Entre 1 y 100.000.000 de sorteos.')
    rng = np.random.default_rng(seed)
    counts = np.zeros(4, dtype=np.int64)
    for start in range(0, draws, 100_000):
        counts += np.bincount(np.searchsorted([.80, .95, .99, 1.], rng.random(min(100_000, draws-start))), minlength=4)
    return {'model_only': True, 'seed': seed, 'draws': draws, 'counts': counts.tolist(),
            'probabilities': [.80, .15, .04, .01],
            'within_tier_values': 'unknown: no profit probability calculated',
            'conditional_expected_cash_usd': 1024*.90,
            'conditional_expected_result_before_fees_usd': 1024*.90-1000}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('draws', type=int, nargs='?', default=5_000_000)
    args = parser.parse_args()
    print(json.dumps(simulate(args.draws), indent=2))
