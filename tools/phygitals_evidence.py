#!/usr/bin/env python3
"""Phygitals · evidencia real y pruebas reproducibles.

Uso:  python3 tools/phygitals_evidence.py
Entradas: research/phygitals-data/raw/*.tsv|json y research/phygitals-data/ripranks/*.csv
Salidas:  research/phygitals-data/out/ (CSV de aperturas, JSON de pruebas, JSON para la app)

Nada de lo que hace este script es una simulación presentada como dato real:
- Las aperturas individuales proceden de feeds públicos transcritos (sin tx, tiempo relativo).
- Los recuentos por nivel y las series diarias proceden de agregados públicos de RipRanks.
- Las pruebas usan semilla fija; los p-valores por permutación son estimaciones Monte Carlo.
"""
import csv, json, math, os, re, sys
from pathlib import Path
import numpy as np
from scipy import stats

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / 'research/phygitals-data/raw'
RR = ROOT / 'research/phygitals-data/ripranks'
OUT = ROOT / 'research/phygitals-data/out'
OUT.mkdir(parents=True, exist_ok=True)
RNG = np.random.default_rng(20261014)
N_PERM = 20000
CAPTURE_UTC = '2026-10-14T00:00:00Z'  # capturas realizadas entre 23:45 y 00:10 UTC

# Precio por pack (USD). Fuente: catálogo oficial, PackSpy y RipRanks (coinciden).
PACK_PRICE = {
    'Trainer Pack': 10, 'Rookie Pack': 25, 'Vintage Starter Pack': 15, 'Elite Pack': 50,
    'Legend Pack': 250, 'Platinum Pack': 500, 'Pirate Pack': 10, 'Starter One Piece Pack': 25,
    'Elite One Piece Pack': 50, 'East Blue Pack': 80, 'Black Pack One Piece': 2500,
    'Pro Sport Pack': 100, 'Rookie Sport Pack': 25, 'Boost Sport Pack': 5,
    'Starter Baseball Pack': 25, 'Rookie Yugioh Pack': 25,
}
# Recompra mostrada en la ficha pública del pack (www.phygitals.com/claw/<slug>), consultada 2026-10-14.
BUYBACK_PAGE = {'trainer-pack': 1.0, 'pirate-pack': 1.0, 'starter-one-piece-pack': 0.85, 'starter-pack-q4pux3': 0.85}
RR_META = {  # slug: (nombre, precio USD, juego)
    'trainer-pack': ('Trainer Pack · Pokémon', 10, 'pokemon'),
    'rookie-pack': ('Rookie Pack · Pokémon', 25, 'pokemon'),
    'elite-pack': ('Elite Pack · Pokémon', 50, 'pokemon'),
    'boost-sport-pack': ('Boost Sport Pack', 5, 'sport'),
    'starter-one-piece-pack': ('Starter Pack · One Piece', 25, 'onepiece'),
    'pirate-pack': ('Pirate Pack · One Piece', 10, 'onepiece'),
    'starter-sport-pack': ('Starter Pack · Fútbol americano', 10, 'sport'),
    'rookie-sport-pack': ('Rookie Pack · Fútbol americano', 25, 'sport'),
    'elite-one-piece-pack': ('Elite Pack · One Piece', 50, 'onepiece'),
    'starter-pack-q4pux3': ('Starter Pack · Baloncesto', 50, 'sport'),
    'elite-riftbound-pack': ('Elite Pack · Riftbound', 50, 'riftbound'),
}


def age_to_hours(a):
    m = re.fullmatch(r'(\d+)\s*([mhd])', a.strip())
    if not m:
        return None
    v, u = int(m.group(1)), m.group(2)
    return v / 60 if u == 'm' else v if u == 'h' else v * 24


def load_openings():
    rows = []
    src = {
        'packspy-pokemon-2026-10-14.tsv': 'https://packspy.com/sites/phygitals/pulls?game=pokemon&window=all',
        'packspy-onepiece-2026-10-14.tsv': 'https://packspy.com/sites/phygitals/pulls?game=onepiece&window=all',
        'packspy-all-2026-10-14.tsv': 'https://packspy.com/sites/phygitals/pulls?game=all&window=all',
    }
    for fn, url in src.items():
        with open(RAW / fn, newline='') as f:
            for i, r in enumerate(csv.DictReader(f, delimiter='\t')):
                price = PACK_PRICE.get(r['pack'])
                value = float(r['value'])
                h = age_to_hours(r['age'])
                rows.append({
                    'record_id': f'packspy:{fn.split("-")[1]}:{i+1:03d}',
                    'source': 'PackSpy (feed público de Phygitals)', 'source_url': url,
                    'observed_at_utc': CAPTURE_UTC, 'age_shown': r['age'],
                    'occurred_at_utc_approx_hours_before_capture': h,
                    'time_resolution': 'relativa, redondeada (minutos u horas); no es hora de servidor ni de asignación',
                    'pack': r['pack'], 'pack_price_usd': price, 'card': r['card'], 'grade': r['grade'],
                    'category': None, 'card_value_usd': value,
                    'multiple_shown': float(r['multiple']),
                    'rarity_tier': None, 'buyback_offer_usd': None, 'tx_signature': None,
                    'mint_address': None, 'position_selected': None,
                    'evidence_quality': 'C · registro individual de feed público, sin transacción ni hora absoluta',
                })
    with open(RAW / 'ripranks-live-2026-10-14.tsv', newline='') as f:
        for i, r in enumerate(csv.DictReader(f, delimiter='\t')):
            rows.append({
                'record_id': f'ripranks:live:{i+1:03d}', 'source': 'RipRanks (feed público de Phygitals)',
                'source_url': 'https://ripranks.com/card-rip-sites/phygitals/live',
                'observed_at_utc': CAPTURE_UTC, 'age_shown': None,
                'occurred_at_utc_approx_hours_before_capture': None,
                'time_resolution': 'sin hora por fila',
                'pack': None, 'pack_price_usd': None, 'card': r['card'], 'grade': None,
                'category': r['category'], 'card_value_usd': float(r['value']), 'multiple_shown': None,
                'rarity_tier': None, 'buyback_offer_usd': None, 'tx_signature': None, 'mint_address': None,
                'position_selected': None,
                'evidence_quality': 'D · registro individual sin pack, sin hora y sin transacción',
            })
    # Posibles duplicados entre vistas de PackSpy (misma carta, pack y valor). No se pueden
    # distinguir sin identificador: se marcan en vez de borrarse.
    seen = {}
    for r in rows:
        if r['source'].startswith('PackSpy'):
            k = (r['card'], r['pack'], r['card_value_usd'])
            seen.setdefault(k, []).append(r['record_id'])
    for r in rows:
        k = (r['card'], r['pack'], r['card_value_usd'])
        r['possible_duplicate_of'] = ';'.join(x for x in seen.get(k, []) if x != r['record_id']) or None
    return rows


def read_rr(slug):
    tiers, daily, block = [], [], None
    for line in open(RR / f'{slug}.csv'):
        line = line.strip()
        if not line:
            continue
        if line.startswith('tier,'):
            block = 't'; continue
        if line.startswith('date,'):
            block = 'd'; continue
        p = line.split(',')
        if block == 't':
            tiers.append({'tier': p[0], 'advertised_pct': float(p[1]), 'observed_pct': float(p[2]), 'count': int(p[3])})
        elif block == 'd':
            daily.append({'date': p[0], 'pulls': int(p[1]), 'ret': float(p[2])})
    return tiers, daily


def holm(pvals):
    order = np.argsort(pvals); m = len(pvals); adj = np.empty(m); run = 0.0
    for rank, i in enumerate(order):
        run = max(run, (m - rank) * pvals[i]); adj[i] = min(1.0, run)
    return adj.tolist()


def bh(pvals):
    p = np.asarray(pvals); m = len(p); order = np.argsort(p); adj = np.empty(m); prev = 1.0
    for rank in range(m - 1, -1, -1):
        i = order[rank]; prev = min(prev, p[i] * m / (rank + 1)); adj[i] = prev
    return adj.tolist()


def weighted_mean(rets, w):
    return float(np.sum(rets * w) / np.sum(w))


def block_bootstrap_ci(rets, w, B=20000):
    n = len(rets); idx = RNG.integers(0, n, size=(B, n))
    m = np.sum(rets[idx] * w[idx], axis=1) / np.sum(w[idx], axis=1)
    return float(np.percentile(m, 2.5)), float(np.percentile(m, 97.5))


def resid(rets, w):
    """Desviación diaria estandarizada: (r - media) * sqrt(pulls). Corrige heterocedasticidad por tamaño."""
    mu = weighted_mean(rets, w)
    return (rets - mu) * np.sqrt(w)


def lag1(x):
    if len(x) < 4:
        return float('nan')
    return float(np.corrcoef(x[:-1], x[1:])[0, 1])


def perm_lag1_p(x, two_sided=True):
    obs = lag1(x)
    sims = np.array([lag1(RNG.permutation(x)) for _ in range(4000)])
    if two_sided:
        return float((np.sum(np.abs(sims) >= abs(obs)) + 1) / (len(sims) + 1))
    return float((np.sum(sims * np.sign(obs) >= abs(obs)) + 1) / (len(sims) + 1))


def weekday_effect(dates, x):
    wd = np.array([np.datetime64(d).astype('datetime64[D]').item().weekday() for d in dates])
    means = {k: float(np.mean(x[wd == k])) for k in range(7) if np.sum(wd == k) >= 2}
    return wd, means


def max_split_break(rets, w, min_seg=7):
    """Cambio de régimen: mayor diferencia estandarizada de medias entre dos tramos contiguos.
    p-valor por permutación del estadístico máximo (corrige la búsqueda del punto de corte)."""
    n = len(rets)
    def stat(r, ww):
        best, k_best = 0.0, None
        for k in range(min_seg, n - min_seg + 1):
            a, b = slice(0, k), slice(k, n)
            ma, mb = weighted_mean(r[a], ww[a]), weighted_mean(r[b], ww[b])
            ra, rb = resid(r[a], ww[a]), resid(r[b], ww[b])
            s2 = (np.sum(ra ** 2) + np.sum(rb ** 2)) / max(1, n - 2)
            se = math.sqrt(s2 * (1 / np.sum(ww[a]) + 1 / np.sum(ww[b])))
            t = abs(ma - mb) / se if se > 0 else 0
            if t > best:
                best, k_best = t, k
        return best, k_best
    obs, k = stat(rets, w)
    if k is None:
        return None
    count = 0
    for _ in range(1000):
        p = RNG.permutation(n)
        if stat(rets[p], w[p])[0] >= obs:
            count += 1
    return {'split_index': k, 't_max': obs, 'p_perm': (count + 1) / 1001}


def main():
    openings = load_openings()
    fields = list(openings[0].keys())
    with open(OUT / 'phygitals-openings.csv', 'w', newline='') as f:
        wri = csv.DictWriter(f, fieldnames=fields); wri.writeheader(); wri.writerows(openings)

    catalog = json.load(open(RAW / 'catalog-api-vm-available-2026-10-13T2345Z.json'))
    cat = {p['slug']: p for p in catalog['packs']}

    packs = {}
    gof_p, train_tests = [], []
    for slug, (name, price, game) in RR_META.items():
        tiers, daily = read_rr(slug)
        counts = np.array([t['count'] for t in tiers], float)
        adv = np.array([t['advertised_pct'] for t in tiers]) / 100
        adv = adv / adv.sum()
        n = counts.sum()
        chi2, p = stats.chisquare(counts, adv * n)
        cramer = math.sqrt(chi2 / (n * (len(tiers) - 1)))
        per_tier = []
        for t, c, a in zip(tiers, counts, adv):
            ci = stats.binomtest(int(c), int(n)).proportion_ci(0.95, method='wilson')
            per_tier.append({**t, 'advertised_share': round(float(a), 5), 'observed_share': round(c / n, 5),
                             'ci95': [round(ci.low, 5), round(ci.high, 5)],
                             'advertised_inside_ci': bool(ci.low <= a <= ci.high)})
        d = [x for x in daily if x['pulls'] >= 20]  # días con muy pocas aperturas fuera
        dates = [x['date'] for x in d]
        rets = np.array([x['ret'] for x in d]) / 100
        w = np.array([x['pulls'] for x in d], float)
        mean_all = weighted_mean(rets, w); ci_all = block_bootstrap_ci(rets, w)
        last = slice(max(0, len(d) - 14), len(d))
        mean_14 = weighted_mean(rets[last], w[last]); ci_14 = block_bootstrap_ci(rets[last], w[last])
        half = len(d) // 2
        tr, va = slice(0, half), slice(half, len(d))
        x_tr, x_va = resid(rets[tr], w[tr]), resid(rets[va], w[va])
        # H-a: autocorrelación de un día (rachas / "tras un mal día viene uno bueno").
        r_tr = lag1(x_tr); p_tr = perm_lag1_p(x_tr)
        r_va = lag1(x_va); p_va_dir = perm_lag1_p(x_va, two_sided=False) if not math.isnan(r_tr) else 1.0
        same_sign = (r_tr * r_va) > 0
        train_tests.append({'pack': slug, 'hypothesis': 'autocorrelación diaria (rachas)',
                            'train_stat': r_tr, 'train_p': p_tr, 'validation_stat': r_va,
                            'validation_p_one_sided': p_va_dir if same_sign else 1.0,
                            'promoted_to_validation': p_tr < 0.05})
        # H-b: mejor día de la semana elegido en entrenamiento.
        wd_tr, means_tr = weekday_effect(dates[:half], x_tr)
        wd_va, _ = weekday_effect(dates[half:], x_va)
        best = max(means_tr, key=means_tr.get) if means_tr else None
        if best is not None and np.sum(wd_va == best) >= 2 and np.sum(wd_va != best) >= 2:
            a, b = x_va[wd_va == best], x_va[wd_va != best]
            obs = a.mean() - b.mean(); pool = np.concatenate([a, b]); k = len(a); cnt = 0
            for _ in range(N_PERM // 4):
                pp = RNG.permutation(pool)
                if pp[:k].mean() - pp[k:].mean() >= obs:
                    cnt += 1
            pv = (cnt + 1) / (N_PERM // 4 + 1)
        else:
            obs, pv = float('nan'), 1.0
        days_es = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
        train_tests.append({'pack': slug, 'hypothesis': f'mejor día de la semana en entrenamiento ({days_es[best] if best is not None else "n/d"})',
                            'train_stat': means_tr.get(best) if best is not None else None, 'train_p': None,
                            'validation_stat': float(obs) if not math.isnan(obs) else None,
                            'validation_p_one_sided': pv, 'promoted_to_validation': True})
        brk = max_split_break(rets, w)
        if brk:
            k = brk['split_index']
            brk.update({'date_from': dates[k], 'mean_before': weighted_mean(rets[:k], w[:k]),
                        'mean_after': weighted_mean(rets[k:], w[k:])})
        gof_p.append(p)
        c = cat.get(slug)
        bb = c['buyback_percent'] if c else BUYBACK_PAGE.get(slug)
        bb_source = ('API /vm/available' if c else ('ficha pública del pack' if slug in BUYBACK_PAGE else None))
        packs[slug] = {
            'slug': slug, 'name': name, 'price_usd': price, 'game': game,
            'buyback_percent': bb, 'buyback_source': bb_source,
            'tier_test': {'n': int(n), 'chi2': float(chi2), 'df': len(tiers) - 1, 'p': float(p),
                          'cramers_v': cramer, 'tiers': per_tier},
            'daily': {'days': len(d), 'first': dates[0], 'last': dates[-1], 'pulls': int(w.sum()),
                      'value_return_mean': mean_all, 'value_return_ci95': ci_all,
                      'value_return_last14': mean_14, 'value_return_last14_ci95': ci_14},
            'regime_break': brk,
            'catalog': ({'ev': c['ev'], 'buyback_percent': bb, 'ev_updated_at': c['ev_updated_at'],
                         'in_stock': c['in_stock'], 'num_pulls_7d': c['num_pulls_7d'],
                         'cash_return_from_ev': c['ev'] * bb / c['mint_price']} if c else None),
            'cash_return_observed': ({'mean': mean_all * bb, 'ci95': [ci_all[0] * bb, ci_all[1] * bb],
                                      'last14': mean_14 * bb, 'last14_ci95': [ci_14[0] * bb, ci_14[1] * bb]} if bb else None),
        }
    for slug, a, b in zip(RR_META, holm(gof_p), bh(gof_p)):
        packs[slug]['tier_test']['p_holm'] = a; packs[slug]['tier_test']['q_bh'] = b

    val_p = [t['validation_p_one_sided'] if t['promoted_to_validation'] else 1.0 for t in train_tests]
    for t, a in zip(train_tests, holm(val_p)):
        t['validation_p_holm'] = a
        t['passed'] = bool(t['promoted_to_validation'] and a < 0.05)
    breaks_p = [packs[s]['regime_break']['p_perm'] if packs[s]['regime_break'] else 1.0 for s in RR_META]
    for s, a in zip(RR_META, holm(breaks_p)):
        if packs[s]['regime_break']:
            packs[s]['regime_break']['p_holm'] = a

    # Coherencia entre fuentes: PackSpy (ventana ~3 días) frente a RipRanks (~50 días).
    packspy_vs_rr = []
    for pack, ps_n, ps_beat, slug in [('Elite Pack · Pokémon', 359, 0.49, 'elite-pack'),
                                     ('Rookie Pack · Pokémon', 1136, 0.15, 'rookie-pack'),
                                     ('Trainer Pack · Pokémon', 2078, 0.18, 'trainer-pack')]:
        rr_beat = {'elite-pack': 0.305, 'rookie-pack': 0.202, 'trainer-pack': 0.316}[slug]
        rr_n = packs[slug]['tier_test']['n']
        p1, p2 = ps_beat, rr_beat; pp = (p1 * ps_n + p2 * rr_n) / (ps_n + rr_n)
        z = (p1 - p2) / math.sqrt(pp * (1 - pp) * (1 / ps_n + 1 / rr_n))
        packspy_vs_rr.append({'pack': pack, 'packspy_n': ps_n, 'packspy_beat_price': p1,
                              'ripranks_n': rr_n, 'ripranks_beat_price': p2, 'z': z,
                              'p_two_sided': float(2 * stats.norm.sf(abs(z)))})

    # Descriptivo de las filas individuales (no inferencia de odds: el feed es una muestra).
    ps = [r for r in openings if r['source'].startswith('PackSpy') and r['pack_price_usd']]
    beat = sum(1 for r in ps if r['card_value_usd'] >= r['pack_price_usd'])
    dups = sum(1 for r in ps if r['possible_duplicate_of'])
    summary = {
        'generated_by': 'tools/phygitals_evidence.py', 'seed': 20261014,
        'openings': {'total_rows': len(openings), 'packspy_rows': len(ps),
                     'ripranks_rows': len(openings) - len(ps),
                     'rows_with_tx_signature': 0, 'rows_with_absolute_utc_second': 0,
                     'rows_with_position_selected': 0, 'packspy_rows_flagged_possible_duplicate': dups,
                     'packspy_value_at_least_price': beat,
                     'packspy_value_at_least_price_share': beat / len(ps)},
        'aggregate_pulls_covered': int(sum(p['tier_test']['n'] for p in packs.values())),
        'packs': packs, 'temporal_tests': train_tests, 'packspy_vs_ripranks': packspy_vs_rr,
    }
    json.dump(summary, open(OUT / 'phygitals-tests.json', 'w'), ensure_ascii=False, indent=1, default=float)

    # JSON compacto para la app (sin datos sintéticos).
    app = {'generated_at': CAPTURE_UTC, 'source_note': 'Agregados públicos de RipRanks (feed de Phygitals) + catálogo oficial transcrito. Sin transacciones verificadas.',
           'packs': [{'slug': s, 'name': p['name'], 'price_usd': p['price_usd'],
                      'n': p['tier_test']['n'], 'buyback_percent': p['buyback_percent'], 'buyback_source': p['buyback_source'],
                      'odds_p_holm_raw': p['tier_test']['p_holm'],
                      'top_tier': {'tier': p['tier_test']['tiers'][-1]['tier'], 'advertised': p['tier_test']['tiers'][-1]['advertised_share'],
                                   'observed': p['tier_test']['tiers'][-1]['observed_share'], 'ci95': p['tier_test']['tiers'][-1]['ci95']}, 'odds_p_holm': round(p['tier_test']['p_holm'], 6),
                      'odds_max_dev_pp': round(max(abs(t['observed_share'] - t['advertised_share']) for t in p['tier_test']['tiers']) * 100, 2),
                      'value_return': round(p['daily']['value_return_mean'], 4),
                      'value_return_ci95': [round(x, 4) for x in p['daily']['value_return_ci95']],
                      'value_return_last14': round(p['daily']['value_return_last14'], 4),
                      'value_return_last14_ci95': [round(x, 4) for x in p['daily']['value_return_last14_ci95']],
                      'window': [p['daily']['first'], p['daily']['last']],
                      'regime_break': ({'from': p['regime_break']['date_from'], 'before': round(p['regime_break']['mean_before'], 4),
                                        'after': round(p['regime_break']['mean_after'], 4), 'p_holm': round(p['regime_break']['p_holm'], 4)}
                                       if p['regime_break'] else None)} for s, p in packs.items()],
           'temporal_patterns_validated': [t['hypothesis'] + ' · ' + t['pack'] for t in train_tests if t['passed']]}
    json.dump(app, open(ROOT / 'phygitals-evidence-data.json', 'w'), ensure_ascii=False, indent=1)
    print(json.dumps({k: summary[k] for k in ('openings', 'aggregate_pulls_covered')}, indent=1, ensure_ascii=False))
    for s, p in packs.items():
        t = p['tier_test']; dd = p['daily']; rb = p['regime_break']
        print(f"{s:24s} n={t['n']:7d} chi2={t['chi2']:8.1f} p_holm={t['p_holm']:.2e} V={t['cramers_v']:.3f} "
              f"ret={dd['value_return_mean']:.3f} [{dd['value_return_ci95'][0]:.3f},{dd['value_return_ci95'][1]:.3f}] "
              f"14d={dd['value_return_last14']:.3f} cash={'%.3f' % p['cash_return_observed']['mean'] if p['cash_return_observed'] else 'n/d'} "
              f"break={rb['date_from'] if rb else '-'} p_holm={rb['p_holm'] if rb else '-':}")
    for t in train_tests:
        print(f"{t['pack']:24s} {t['hypothesis'][:45]:45s} train_p={t['train_p']} val_p_holm={t['validation_p_holm']:.3f} passed={t['passed']}")
    for x in packspy_vs_rr:
        print(x)


if __name__ == '__main__':
    main()
