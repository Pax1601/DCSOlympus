import sys
import json
import inspect
import difflib
from slpp import slpp as lua

SEARCH_FOLDER = "D:\\Eagle Dynamics\\DCS World OpenBeta"

sys.path.append("..\..\..\dcs-master\dcs-master")

from dcs.vehicles import *
from dcs.ships import *
from dcs.planes import *
from dcs.helicopters import *
        
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
    with open(filename) as f:
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

            database[unit_name]["acquisitionRange"] = unitmap[found_name].detection_range
            database[unit_name]["engagementRange"] = unitmap[found_name].threat_range

        except Exception as e:
            print(f"Could not find data for aircraft of type {unit_name}: {e}, skipping...")

    # Dump everything in the database
    with open(filename, "w") as f:
        json.dump(database, f, indent=2)

# Done!
print("Done!")

    