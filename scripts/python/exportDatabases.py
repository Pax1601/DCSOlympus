import json

base = '..\\..\\client\\public\\databases\\units\\'
filenames = [f'{base}aircraftdatabase.json', f'{base}helicopterdatabase.json', f'{base}groundunitdatabase.json', f'{base}navyunitdatabase.json']

lines = []

for filename in filenames:
    # Loads the database 
    with open(filename, encoding="utf8") as f:
        database = json.load(f)

    for key in database:
        acquisition_range = ""
        engagement_range = ""
        abilities = ""
        description = ""
        unit_type = ""
        database_type = ""

        if filename == f'{base}aircraftdatabase.json':
            unit_type = "Aircraft"
            database_type = "Aircraft"
        elif filename == f'{base}helicopterdatabase.json':
            unit_type = "Helicopter"
            database_type = "Helicopter"
        elif filename == f'{base}groundunitdatabase.json':
            unit_type = database[key]["type"]
            database_type = "Ground Unit"
        else:
            unit_type = database[key]["type"]
            database_type = "Navy Unit"

        if "acquisitionRange" in database[key]:
            acquisition_range = database[key]["acquisitionRange"]

        if "engagementRange" in database[key]:
            engagement_range = database[key]["engagementRange"]

        if "abilities" in database[key]:
            abilities = database[key]["abilities"]

        if "description" in database[key]:
            description = database[key]["description"]
               
        line = f"{database[key]['name']}\t{database_type}\t{unit_type}\t{database[key]['label']}\t{database[key]['shortLabel']}\t{database[key]['coalition']}\t{database[key]['era']}\t{acquisition_range}\t{engagement_range}\t{description}\t{abilities}\n"
               
        lines.append(line)

with open("new.csv", "w") as f:
    f.writelines(lines)

print("Done!")