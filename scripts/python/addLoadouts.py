import sys
import json
import inspect
import difflib
from slpp import slpp as lua

SEARCH_FOLDER = sys.argv[2]

from dcs.weapons_data import Weapons
from dcs.planes import *
from dcs.helicopters import *

clsid_conversion = {
    'ExtFuelTankID'						: "{EFT_230GAL}"							,
    'InternalFuelTank100'				: "{IAFS_ComboPak_100}"						,
    'NURSLauncherID_MK151'				: "M261_MK151"								,
    'NURSLauncherID_M229'				: "{M261_M229}"								,
    'NURSLauncherID_M257'				: "{M261_M257}"								,
    'NURSLauncherID_M274'				: "{M261_M274}"								,
    'NURSLauncherID_M282'				: "{M261_M282}"								,
    'NURSLauncherID_M433'				: "{M261_M151_M433}"						,
    'NURSLauncherID_M151_M274_OUTBOARD'	: "{M261_OUTBOARD_AB_M151_E_M274}"			,
    'NURSLauncherID_M151_M257_OUTBOARD'	: "{M261_OUTBOARD_AB_M151_E_M257}"			,
    'NURSLauncherID_M274_M151_INBOARD'	: "{M261_INBOARD_DE_M151_C_M274}"			,
    'NURSLauncherID_M257_M151_INBOARD'	: "{M261_INBOARD_DE_M151_C_M257}"			,
    'HellfireLauncherID_AGM114K_0'		: "{M299_EMPTY}"							,
    'HellfireLauncherID_AGM114K_4'		: "{88D18A5E-99C8-4B04-B40B-1C02F2018B6E}"	,
    'HellfireLauncherID_AGM114K_3_L'	: "{M299_3xAGM_114K_OUTBOARD_PORT}"			,
    'HellfireLauncherID_AGM114K_3_R'	: "{M299_3xAGM_114K_OUTBOARD_STARBOARD}"	,
    'HellfireLauncherID_AGM114K_2'		: "{M299_2xAGM_114K}"						,
    'HellfireLauncherID_AGM114K_1_L'	: "{M299_1xAGM_114K_OUTBOARD_PORT}"			,
    'HellfireLauncherID_AGM114K_1_R'	: "{M299_1xAGM_114K_OUTBOARD_STARBOARD}"	,
    'HellfireLauncherID_AGM114L_4'		: "{M299_4xAGM_114L}"						,
    'HellfireLauncherID_AGM114L_3_L'	: "{M299_3xAGM_114L_OUTBOARD_PORT}"			,
    'HellfireLauncherID_AGM114L_3_R'	: "{M299_3xAGM_114L_OUTBOARD_STARBOARD}"	,
    'HellfireLauncherID_AGM114L_2'		: "{M299_2xAGM_114L}"						,
    'HellfireLauncherID_AGM114L_1_L'	: "{M299_1xAGM_114L_OUTBOARD_PORT}"			,
    'HellfireLauncherID_AGM114L_1_R'	: "{M299_1xAGM_114L_OUTBOARD_STARBOARD}"	,
    'HellfireLauncherID_AGM114_1K3L_L'	: "{M299_1xAGM_114K_3xAGM_114L_PRT}"		,
    'HellfireLauncherID_AGM114_1K3L_R'	: "{M299_1xAGM_114K_3xAGM_114L_STRBRD}"		,
    'HellfireLauncherID_AGM114_2K2L'	: "{M299_2xAGM_114K_2xAGM_114L}"			,
    'HellfireLauncherID_AGM114_3K1L_R'	: "{M299_3xAGM_114K_1xAGM_114L_STRBRD}"		,
    'HellfireLauncherID_AGM114_3K1L_L'	: "{M299_3xAGM_114K_1xAGM_114L_PRT}"		,
}

def rename_task(task_name):
    task_map = {
        "AFAC": "FAC-A",
        "Fighter Sweep": "CAP",
        "Ground Attack": "Strike",
        "Intercept": "CAP",
        "Pinpoint Strike": "Strike",
        "Refueling": "Tanker",
        "Nothing": "No task",
    }

    if task_name in task_map:
        return task_map[task_name]
    else:
        return task_name
    
def convert_role(role):
    other_roles = {
        "tAntiShip": "AntishipStrike",
        "tGndAttack": "GroundAttack",
        "tAFAC": "AFAC",
        "tRecon": "Reconnaissance",
        "tRwyAttack": "RunwayAttack",
        "tCAP": "CAP",
        "tCAS": "CAS",
        "tSEAD": "SEAD",
        "tPinpntStrike": "PinpointStike",
        "tIntercept": "Intercept",
        "tCAP": "CAP",
        "tFighterSweep": "FighterSweep",
        "tEscort": "CAP"
    }

    if role in other_roles:
        return other_roles[role]
    else:
        return role

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
        
    if clsid in clsid_conversion:
        return clsid_conversion[clsid]
        
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
                "roles": ["No task", rename_task(cls.task_default.name)]
            }
            database[unit_name]["loadouts"].append(empty_loadout)

            # Loop on all the loadouts for that unit
            for payload_name in unit_payloads[unit_name]:
                payload_weapons = {}
                # Get the names of all the weapons in the loadout and count how many there are for each
                for payload_idx in unit_payloads[unit_name][payload_name]:
                    payload_clsid = unit_payloads[unit_name][payload_name][payload_idx]["CLSID"]
                    weapon_name = find_weapon_name(payload_clsid)
                    if weapon_name is None:
                        weapon_name = payload_clsid
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
                                    payload_roles.append(rename_task(obj.name))
                    else:
                        for name, obj in inspect.getmembers(task):
                            if inspect.isclass(obj) and issubclass(obj, task.MainTask):
                                if (name == convert_role(role)):
                                    payload_roles.append(rename_task(obj.name))

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
            print(f"Could not find data for unitof type {unit_name}: {e}, skipping...")

    # Dump everything in the database
    with  open(filename, "w", encoding='utf8') as f:
        json.dump(database, f, indent='\t', ensure_ascii=False)

    # Done!
    print("Done!")

    