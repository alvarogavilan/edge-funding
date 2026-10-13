"""Real published aggregate scenarios only. No synthetic pulls or predictive signals."""
from math import sqrt
# Source: https://packspy.com/sites/phygitals/pulls?game=onepiece&window=all
# These are overlapping windows, NOT independent samples.
samples=[
 {"pack":"Starter One Piece","n":83,"price_usd":25,"nominal_pct":187,"beat_price_pct":30,"max_hit_usd":503},
 {"pack":"Elite One Piece","n":48,"price_usd":50,"nominal_pct":143,"beat_price_pct":33,"max_hit_usd":682},
 {"pack":"Pirate Pack","n":16,"price_usd":10,"nominal_pct":167,"beat_price_pct":63,"max_hit_usd":32},
]
def wilson(k,n,z=1.9599639845):
 p=k/n; den=1+z*z/n
 return ((p+z*z/(2*n)-z*sqrt(p*(1-p)/n+z*z/(4*n*n)))/den,
         (p+z*z/(2*n)+z*sqrt(p*(1-p)/n+z*z/(4*n*n)))/den)
for d in samples:
 n=d["n"]; cost=d["price_usd"]; nominal=d["nominal_pct"]/100
 approximate_hits=round(n*d["beat_price_pct"]/100) # percent displayed rounded
 l,u=wilson(approximate_hits,n)
 break_even_multiple=1/.85
 max_possible_cash_positive_pct=d["beat_price_pct"] # necessary but not sufficient at buyback .85
 total_nominal=n*cost*nominal
 no_max_nominal=(total_nominal-d["max_hit_usd"])/((n-1)*cost)
 print({
  "pack":d["pack"],"n_observed_not_full_population":n,
  "reported_rate_nominal_at_least_cost_pct":d["beat_price_pct"],
  "approximate_wilson_95pct":tuple(round(100*x,2) for x in (l,u)),
  "required_nominal_multiple_for_cash_profit_at_85pct_buyback":round(break_even_multiple,4),
  "maximum_cash_profit_frequency_if_85pct_buyback_and_no_fees_pct":max_possible_cash_positive_pct,
  "cash_return_from_sample_average_if_85pct":round(100*nominal*.85,2),
  "cash_return_excluding_one_top_hit_if_85pct":round(100*no_max_nominal*.85,2),
  "eligible_to_trigger_buy_signal":False,
 })
print("WARNING: no verification of 85% buyback for specific pulls, feed coverage or real cash exits.")
