"""Genera vault-universe.js: universo de cartas Pokémon (inglés) que el radar de Card Vault consulta.

Fuente de identidad: repositorio público tcgdex/cards-database (carpeta data/).
Uso: python3 tools/build_vault_universe.py <ruta-al-clon-de-cards-database> > vault-universe.js
Solo selecciona rarezas con valor de reventa plausible; los precios NO se guardan aquí:
la app los consulta en directo a la API pública de TCGdex desde el navegador.
"""
import glob, json, os, re, sys

root = sys.argv[1]
GROUPS = {
    "vintage": {"series": ["Base", "Gym", "Neo", "Legendary Collection", "E-Card"],
                "label": "Vintage WotC (Base, Jungle, Fossil, Rocket, Gym, Neo, Legendary, e-Card)"},
    "ex": {"series": ["EX", "POP"], "label": "Era EX, Gold Star y Delta Species"},
    "dp": {"series": ["Diamond & Pearl", "Platinum", "HeartGold & SoulSilver", "Call of Legends"],
           "label": "Diamond & Pearl, Platinum y HeartGold SoulSilver"},
    "bwxysm": {"series": ["Black & White", "XY", "Sun & Moon"], "label": "Black & White, XY y Sun & Moon"},
    "swsh": {"series": ["Sword & Shield"], "label": "Sword & Shield (Alt Art, VMAX, Secret)"},
    "sv": {"series": ["Scarlet & Violet", "Mega Evolution"], "label": "Scarlet & Violet y Mega Evolution (IR, SIR, Hyper)"},
}
VALUABLE = {"Holo Rare", "Rare Holo", "Secret Rare", "Ultra Rare", "Shiny rare", "Illustration rare",
            "Special illustration rare", "Hyper rare", "Holo Rare V", "Holo Rare VMAX", "Holo Rare VSTAR",
            "Rare Holo LV.X", "Rare PRIME", "LEGEND", "Shiny Ultra Rare", "Amazing Rare", "Shiny rare V",
            "Shiny rare VMAX", "Mega Hyper Rare", "Mega Attack Rare", "Full Art Trainer", "Crown",
            "Black White Rare", "Radiant Rare", "ACE SPEC Rare"}

def field(s, pat):
    m = re.search(pat, s, re.S)
    return m.group(1) if m else None

out, counts = [], {}
for gid, g in GROUPS.items():
    n = 0
    for serie in g["series"]:
        serie_file = os.path.join(root, "data", serie + ".ts")
        if not os.path.exists(serie_file):
            continue
        serie_id = field(open(serie_file, encoding="utf-8").read(), r'id:\s*"([^"]+)"')
        for set_file in sorted(glob.glob(os.path.join(root, "data", serie, "*.ts"))):
            st = open(set_file, encoding="utf-8").read()
            set_id = field(st, r'\n\tid:\s*"([^"]+)"')
            set_name = field(st, r'name:\s*\{[^}]*?en:\s*"([^"]+)"')
            official = field(st, r'official:\s*(\d+)')
            if not set_id or not set_name or "promo" in set_name.lower():
                continue
            card_dir = set_file[:-3]
            for cf in sorted(glob.glob(os.path.join(card_dir, "*.ts"))):
                cs = open(cf, encoding="utf-8").read()
                name = field(cs, r'name:\s*\{[^}]*?en:\s*"((?:[^"\\]|\\.)*)"')
                if not name:
                    continue
                rarity = field(cs, r'rarity:\s*"([^"]+)"') or ""
                suffix = field(cs, r'suffix:\s*"([^"]+)"') or ""
                holo = bool(re.search(r'holo:\s*true|type:\s*"holo"', cs))
                local = os.path.basename(cf)[:-3]
                keep = rarity in VALUABLE or "★" in name or "Star" == suffix
                if gid in ("vintage", "ex", "dp") and rarity == "Rare" and (holo or suffix in ("ex", "EX", "Star", "LV.X")):
                    keep = True
                if not keep:
                    continue
                out.append([set_id + "-" + local, name.replace("\\'", "'"), set_name, local, official or "", rarity, serie_id, gid])
                n += 1
    counts[gid] = n

meta = {"source": "tcgdex/cards-database (GitHub)", "groups": {k: {"label": v["label"], "count": counts[k]} for k, v in GROUPS.items()}}
print("/* Generado por tools/build_vault_universe.py. Identidad de cartas: tcgdex/cards-database. Sin precios. */")
print("window.CV_UNIVERSE=" + json.dumps({"meta": meta, "cards": out}, ensure_ascii=False, separators=(",", ":")) + ";")
