"""Add a "type" entry to each loadout item in an aircraft/helicopter database JSON.

Usage: run from repository root (or adjust paths) using python.
Creates a backup of the file before overwriting.
"""
import json
from pathlib import Path
import shutil
import re

# Paths to database files to process (aircraft + helicopter)
DB_PATHS = [
    Path(r"c:\Users\dpass\Documents\GitHub\DCSOlympus\mock-dcs\Mods\Services\Olympus\databases\units\aircraftdatabase.json"),
    Path(r"c:\Users\dpass\Documents\GitHub\DCSOlympus\mock-dcs\Mods\Services\Olympus\databases\units\helicopterdatabase.json"),
]
BACKUP_SUFFIX = ".bak"
MAP_PATH = Path(r"c:\Users\dpass\Documents\GitHub\DCSOlympus\scripts\python\loadout_type_map.json")

# Simple keyword -> type mapping. Order matters: first match wins.
TYPE_MAP = [
    # Expanded A/A missiles (common and many variants)
    (r"\bAIM-?\d+\b|Sidewinder|AIM-9|R-73|R-27|R-60|R-77|R-24R|R-24T|R-33|R-40RD|R-40TD|R530|R530F|SD-10A|SD-10|MICA|Matra|Magic|Super\s*530|PL-5|PL-8|PL-5E|PL-8B|R550|S530D|S530F|RVV|AA-", "A/A missile"),
    # A/G / anti-ship missiles
    (r"\bAGM-?\d+\b|Maverick|ASM|Anti-ship|Harpoon|Kh-35|Kh-31|Exocet|AGM-65|AGM-84|Kh-22|Kh-25MPU|Kh-58U|Kh-66|YJ-12|YJ-83|YJ-83K|C-802|CM802|KD-20|KD-63|KG-600", "A/G missile"),
    # Guided bombs / glide weapons
    (r"\bGBU-?\d+\b|JDAM|Laser Guided Bomb|GBU|JSOW|LS-6|MPRL|BROACH", "Guided bomb"),
    # General purpose bombs and mk-series
    (r"\bMk-?\d+\b|\bFAB-?\d+\b|500lb|2000lb|GP Bomb|GP Bombs|Bomb|MC Mk|S.A.P\.|GP Mk", "General purpose bomb"),
    # Cluster bombs
    (r"\bCBU-?\d+\b|Cluster Bomb|BLU-|SFW|CEM", "Cluster bomb"),
    # Practice / training munitions
    (r"\bBDU-?\w*\b|Practice Bomb|Captive Trg|CAP-?\d+|CATM-?\b", "Practice/Training munition"),
    # Unguided rockets and rocket pods
    (r"\bLAU-?\d+\b|Hydra|Hydra 70|70 mm|M156|M151|MK151|APKWS|S-5M|S-8|S-13|S-25|UB-16|UB-32|RP-3|B-13L|ORO-57K|R-?|RP-3|R-?P-?3", "Unguided rocket"),
    # Targeting pods and cameras
    (r"\bAN/AAQ-?\d+\b|AN/ASQ-?\d+|Laser Spot Tracker|LST/SCAM|Targeting Pod|LITENING|TGP|TGM-?\d+|LANTIRN|FLIR|Pod", "Targeting pod"),
    # ECM and jammer pods
    (r"\bALQ-?\d+\b|ECM Pod|ECM|Jammer|U22/A|U22A", "ECM pod"),
    # Flares and dispensers (chaff/flares/countermeasures)
    (r"\bALE-?40\b|BOZ-107|Dispenser|Disperser|Countermeasure Dispenser|BOZ|ALE-40|SUU-?\d+|flares|Flare|LUU-2|Flare|Dispenser\(Empty\)", "Flares/Dispensers"),
    # Training rounds / captive
    (r"\bCATM|CAP-?9|TGM-?\d+|CATM", "Training/trg round"),
    (r"\bTGM-?\d+|TGM|CATM", "Training/trg round"),
    # Fuel tanks (various naming conventions)
    (r"\bFuel Tank\b|Fuel tank|Drop Tank|External[- ]?tank|Auxiliary Drop Tank|Sargent Fletcher Fuel Tank|RP35 Pylon Fuel Tank|RPL \d+|Cylindrical Tip Tank|Elliptic Tip Tank|\b\d+\s*(?:gal|gallons|liters|litres|L|lt)\b|1150L|1400L|2000L|3000L", "Fuel tank"),
    # Practice of captive or other small categories
    (r"\bMk-82 AIR Ballute|Ballute", "General purpose bomb"),
    # Misc / smoke / oil tanks / containers
    (r"\bSmoke\b|Smoke Generator|Smoke System|White Smoke|red colorant|yellow colorant|Color Oil Tank|White Oil Tank", "Misc"),
    # Pylons, containers and luggage
    (r"\bPYLON|Pylon|MPS-410|CLB4-PYLON|Luggage Container|Container", "Pylon"),
    # Guns and cannon mounts
    (r"\bDEFA-553|Browning|7.62mm|12.7mm|GPMG|Gun|Cannon", "Gun"),
    # Fallback guided bomb entries covered specifically
    (r"\bGBU-12|GBU-10|GBU-31|GBU-38", "Guided bomb"),
]

# Default type when no pattern matches
DEFAULT_TYPE = "unknown"


def detect_type(item_name: str) -> str:
    name = item_name or ""
    # normalize
    s = name
    # 1) try mapping file exact match
    if MAP_PATH.exists():
        try:
            with MAP_PATH.open('r', encoding='utf-8') as mf:
                mapping = json.load(mf)
        except Exception:
            mapping = {}
        # exact name match (case-sensitive), then case-insensitive key match
        if name in mapping and mapping[name]:
            return mapping[name]
        # case-insensitive exact
        lower_map = {k.lower(): v for k, v in mapping.items() if v}
        if name.lower() in lower_map:
            return lower_map[name.lower()]
        # substring mapping: if a mapping key is contained in the name, use it
        for k, v in mapping.items():
            if not v:
                continue
            if k.lower() in name.lower():
                return v

    for pattern, t in TYPE_MAP:
        if re.search(pattern, s, re.IGNORECASE):
            return t
    return DEFAULT_TYPE


def process_db(db_path: Path):
    if not db_path.exists():
        print(f"Database file not found: {db_path}")
        return

    backup_path = db_path.with_suffix(db_path.suffix + BACKUP_SUFFIX)
    shutil.copy2(db_path, backup_path)
    print(f"Created backup: {backup_path}")

    with db_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    total_items = 0
    updated_items = 0
    type_counts = {}

    # data is a dict of vehicles (aircraft or helicopter)
    for ac_name, ac in data.items():
        loadouts = ac.get("loadouts")
        if not isinstance(loadouts, list):
            continue
        for loadout in loadouts:
            items = loadout.get("items")
            if not isinstance(items, list):
                continue
            for item in items:
                total_items += 1
                name = item.get("name", "")
                t = detect_type(name)
                prev = item.get("type")
                if prev != t:
                    item["type"] = t
                    updated_items += 1
                type_counts[t] = type_counts.get(t, 0) + 1

    # write back
    with db_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

    print(f"Processed {total_items} loadout items, updated {updated_items} entries for {db_path.name}.")
    print("Type counts:")
    for k, v in sorted(type_counts.items(), key=lambda x: -x[1]):
        print(f"  {k}: {v}")


def main():
    for p in DB_PATHS:
        process_db(p)


if __name__ == '__main__':
    main()
