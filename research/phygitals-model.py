"""Descriptive model of published Mythic odds; no calls to Phygitals."""
import numpy as np
n = 5_000_000
rng = np.random.default_rng(20261013)
counts = np.bincount(np.searchsorted([.80, .95, .99, 1.], rng.random(n)), minlength=4)
print({'draws': n, 'counts': counts.tolist(), 'top_tier_frequency': counts[3]/n,
       'no_top_tier_20_independent': .99**20,
       'conditional_expected_buyback_usd': 1024*.90})
