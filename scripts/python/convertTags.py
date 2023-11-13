import sys
import json
import re


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

    for name in database:
        label = database[name]['label']
        print(label)
        res = re.findall("\((.*?)\)", label)
        for tag in res:
            label = label.replace(f"({tag})", "")
        label = database[name]['label'] = label
        if len(res) > 0:
            database[name]["tags"] = "".join([f'{tag}{", " if i < len(res) - 1 else ""}' for i, tag in enumerate(res)])

    # Dump everything in the database
    with open(filename, "w") as f:
        json.dump(database, f, indent=2)

print("Done!")