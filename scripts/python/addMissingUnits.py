import sys
import json
import inspect
import difflib
from slpp import slpp as lua

SEARCH_FOLDER = "D:\\Eagle Dynamics\\DCS World OpenBeta"

sys.path.append("D:\\Documents\\dcs")

from dcs.vehicles import *
from dcs.ships import *
from dcs.planes import *
from dcs.helicopters import *

# The database file on which to operate is the first standard argument of the call
if len(sys.argv) > 1:
    if (sys.argv[1] == "aircraft"):
        filename = '..\\..\\client\\public\\databases\\units\\aircraftdatabase.json' 
        units_map = plane_map
    elif (sys.argv[1] == "helicopter"):
        filename = '..\\..\\client\\public\\databases\\units\\helicopterdatabase.json' 
        units_map = helicopter_map
    elif (sys.argv[1] == "groundunit"):
        filename = '..\\..\\client\\public\\databases\\units\\groundunitdatabase.json' 
        units_map = vehicle_map
    elif (sys.argv[1] == "navyunit"):
        filename = '..\\..\\client\\public\\databases\\units\\navyunitdatabase.json'
        units_map = ship_map 

    # Loads the database 
    with open(filename) as f:
        database = json.load(f)

    for unit in units_map.values():
        if unit.id not in database:
            database[unit.id] = {
                "name": unit.id,
                "coalition": "",
                "era": "",
                "label": unit.name,
                "shortLabel": unit.name,
                "type": unit.__qualname__.split(".")[0],
                "enabled": True,
                "liveries": {}
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
    with open(filename, "w") as f:
        json.dump(database, f, indent=2)

print("Done!")