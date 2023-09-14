import sys
import json
import inspect
import difflib
from slpp import slpp as lua

SEARCH_FOLDER = "D:\\Eagle Dynamics\\DCS World OpenBeta"

sys.path.append("..\..\..\dcs-master\dcs-master")

from dcs.weapons_data import Weapons
from dcs.planes import *
from dcs.helicopters import *

# Known id mismatches (because reasons, ask ED)
mismatched_ids = {
    "A-10CII": "A-10C_2"
}

# Get the weapons ids from pydcs
weapon_ids = [a for a in dir(Weapons) if not a.startswith('__') and not callable(getattr(Weapons, a))]

# This function get the human readable name of a weapon from its CLSID
def find_weapon_name(clsid):
    for weapon_id in weapon_ids:
        if getattr(Weapons, weapon_id)["clsid"] == clsid:
            return getattr(Weapons, weapon_id)["name"]
        
# The database file on which to operate is the first standard argument of the call
if len(sys.argv) > 1:
    if (sys.argv[1] == "aircraft"):
        filename = '..\\..\\client\\public\\databases\\units\\aircraftdatabase.json' 
    elif (sys.argv[1] == "helicopter"):
        filename = '..\\..\\client\\public\\databases\\units\\helicopterdatabase.json' 
    elif (sys.argv[1] == "groundunit"):
        filename = '..\\..\\client\\public\\databases\\units\\groundunitdatabase.json' 
    elif (sys.argv[1] == "navyunit"):
        filename = '..\\..\\client\\public\\databases\\units\\navyunitdatabase.json' 

    # Loads the database 
    with open(filename) as f:
        database = json.load(f)
        for unit_name in database:
            database[unit_name]["enabled"] = True

    # Loads the loadout names
    with open('../unitPayloads.lua') as f:
        lines = f.readlines()
        unit_payloads = lua.decode("".join(lines).replace("Olympus.unitPayloads = ", "").replace("\n", "")) 

    # Loads the loadout roles
    with open('payloadRoles.json') as f:
        payloads_roles = json.load(f)
    
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

            # Create the loadouts table and add the empty loadout for the default task
            database[unit_name]["loadouts"] = []
            empty_loadout = {
                "items": [],
                "enabled": True,
                "code": "",
                "name": "Empty loadout",
                "roles": [cls.task_default.name]
            }
            database[unit_name]["loadouts"].append(empty_loadout)

            # Loop on all the loadouts for that unit
            for payload_name in unit_payloads[unit_name]:
                payload_weapons = {}
                # Get the names of all the weapons in the loadout and count how many there are for each
                for payload_idx in unit_payloads[unit_name][payload_name]:
                    payload_clsid = unit_payloads[unit_name][payload_name][payload_idx]["CLSID"]
                    weapon_name = find_weapon_name(payload_clsid)
                    if weapon_name in payload_weapons:
                        payload_weapons[weapon_name] += 1
                    else:
                        payload_weapons[weapon_name] = 1

                # Get the roles of this loadout. Some are numeric, some are string. Convert them to be all string
                payload_roles = []
                for role in payloads_roles[unit_name][payload_name].values():
                    if isinstance(role, int):
                        for name, obj in inspect.getmembers(task):
                            if inspect.isclass(obj) and issubclass(obj, task.MainTask):
                                if (obj.id == role):
                                    payload_roles.append(obj.name)
                    else:
                        for name, obj in inspect.getmembers(task):
                            if inspect.isclass(obj) and issubclass(obj, task.MainTask):
                                if (name == role):
                                    payload_roles.append(obj.name)

                # Create the loadout structure and append it to the table
                new_payload = {
                    "items": [{"name": weapon_name, "quantity": payload_weapons[weapon_name]} for weapon_name in payload_weapons],
                    "enabled": True,
                    "code": payload_name,
                    "name": payload_name,
                    "roles": payload_roles
                }
                database[unit_name]["loadouts"].append(new_payload)
        except Exception as e:
            print(f"Could not find data for aircraft of type {unit_name}: {e}, skipping...")

    # Dump everything in the database
    with open(filename, "w") as f:
        json.dump(database, f, indent=2)

    # Done!
    print("Done!")

    