import sys
import json
import inspect
import difflib
from slpp import slpp as lua

SEARCH_FOLDER = sys.argv[2]

from dcs.vehicles import *
from dcs.ships import *
from dcs.planes import *
from dcs.helicopters import *

# The database file on which to operate is the first standard argument of the call
if len(sys.argv) > 1:
    if (sys.argv[1] == "aircraft"):
        filename = '..\\..\\databases\\units\\aircraftdatabase.json' 
        units_map = plane_map
    elif (sys.argv[1] == "helicopter"):
        filename = '..\\..\\databases\\units\\helicopterdatabase.json' 
        units_map = helicopter_map
    elif (sys.argv[1] == "groundunit"):
        filename = '..\\..\\databases\\units\\groundunitdatabase.json' 
        units_map = vehicle_map
    elif (sys.argv[1] == "navyunit"):
        filename = '..\\..\\databases\\units\\navyunitdatabase.json'
        units_map = ship_map 

    # Loads the database 
    with open(filename, encoding="utf-8") as f:
        database = json.load(f)

    for unit in units_map.values():
        if unit.id not in database:
            database[unit.id] = {
                "name": unit.id,
                "coalition": "",
                "era": "",
                "label": unit.livery_name if hasattr(unit, "livery_name") else unit.name,
                "shortLabel": unit.livery_name if hasattr(unit, "livery_name") else unit.name,
                "type": unit.__qualname__.split(".")[0],
                "enabled": False,
                "liveries": {},
                "category": sys.argv[1] 
            }
            print("Added missing unit " + unit.id)

    to_remove = []
    to_change_case = {}
    for id in database:
        found = False
        for unit in units_map.values():
            if unit.id == id:
                found = True
            elif unit.id.lower() == id.lower() :
                to_change_case[unit.id] = database[id]
                
        if not found:
            to_remove.append(id)

    for id in to_remove:
        if database[id]["type"] == "SAM Site":
            print("Skipping " + id + ", it is a SAM Site") 
        else:
            del database[id]
            print("Removed unit " + id) 

    for id in to_change_case:
        database[id] = to_change_case[id]
        print("Changed case of unit " + id) 

    # Dump everything in the database
    with open(filename, "w", encoding='utf-8') as f:
        json.dump(database, f, indent='\t', ensure_ascii=False)

print("Done!")