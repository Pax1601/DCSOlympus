import sys
import json
import inspect
import difflib
from slpp import slpp as lua

SEARCH_FOLDER = "D:\\Eagle Dynamics\\DCS World OpenBeta"

sys.path.append("..\\..\\..\\dcs-master\\dcs-master")

from dcs.weapons_data import Weapons
from dcs.planes import *
from dcs.helicopters import *
from dcs.vehicles import *
from dcs.ships import *
from dcs.liveries.liveryscanner import LiveryScanner

livery_scanner = LiveryScanner()
livery_scanner.scan_dcs_installation(SEARCH_FOLDER)

# Known id mismatches (because reasons, ask ED)
mismatched_ids = {
    "A-10CII": "A-10C_2"
}

# The database file on which to operate is the first standard argument of the call
if len(sys.argv) > 1:
    if (sys.argv[1] == "aircraft"):
        filename = '..\\..\\databases\\units\\aircraftdatabase.json' 
    elif (sys.argv[1] == "helicopter"):
        filename = '..\\..\\databases\\units\\helicopterdatabase.json' 
    elif (sys.argv[1] == "groundunit"):
        filename = '..\\..\\databases\\units\\groundunitdatabase.json' 
    elif (sys.argv[1] == "navyunit"):
        filename = '..\\..\\databases\\units\\navyunitdatabase.json' 

    # Loads the database 
    with open(filename, encoding="utf-8") as f:
        database = json.load(f)
    
    # Loop on all the units in the database
    for unit_name in database:
        try:
            # Get the pydcs Python class for the unit
            if (sys.argv[1] == "aircraft"):
                unitmap = plane_map 
            elif (sys.argv[1] == "helicopter"):
                unitmap = helicopter_map 
            elif (sys.argv[1] == "groundunit"):
                unitmap = vehicle_map 
            elif (sys.argv[1] == "navyunit"):
                unitmap = ship_map 
            lowercase_keys = [key.lower() for key in unitmap.keys()]
            res = difflib.get_close_matches(unit_name.lower(), lowercase_keys)
            if len(res) > 0:
                found_name = list(unitmap.keys())[lowercase_keys.index(res[0])]
                cls = unitmap[found_name]
            else:
                print(f"Warning, could not find {unit_name} in classes list. Skipping...")
                continue

            # Add the liveries
            liveries = []
            if unit_name in livery_scanner.map:
                liveries = livery_scanner.map[unit_name]
            else:
                if (unit_name in mismatched_ids):
                    found_name = mismatched_ids[unit_name]
                else:
                    lowercase_keys = [key.lower() for key in livery_scanner.map.keys()]
                    res = difflib.get_close_matches(unit_name.lower(), lowercase_keys)
                    found_name = list(livery_scanner.map.keys())[lowercase_keys.index(res[0])]
                print(f"Warning, could not find {unit_name} in liveries list. Best match is {found_name}. Manual check required!")
                liveries = livery_scanner.map[found_name]

            database[unit_name]["liveries"] = {}
            for livery in liveries:
                database[unit_name]["liveries"][livery.id] = {
                    "name": livery.name,
                    "countries": [country for country in livery.countries] if livery.countries != None else "All"
                }
        except Exception as e:
            print(f"Could not find data for aircraft of type {unit_name}: {e}, skipping...")

    # Dump everything in the database
    with open(filename, "w") as f:
        json.dump(database, f, indent=2)

    # Done!
    print("Done!")

    