import sys
import json
import inspect
import difflib
from slpp import slpp as lua

SEARCH_FOLDER = "D:\\Eagle Dynamics\\DCS World OpenBeta"

sys.path.append("..\\..\\..\\dcs-master\\dcs-master")

from dcs.vehicles import *

with open("gundata.h", "w") as f:
    for unit in vehicle_map.values():
        if unit in Artillery.__dict__.values() or unit in Armor.__dict__.values() or unit in Infantry.__dict__.values():
            f.write('{"' + unit.id + '", {0.9, 860}}, \n')
            
# Done!
print("Done!")

    