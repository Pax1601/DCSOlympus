import csv
import sys
import json

# Read CSV file
with open("data.csv") as fp:
    reader = csv.reader(fp, delimiter=",", quotechar='"')
    data_read = [row for row in reader]

base = '..\\..\\client\\public\\databases\\units\\'
filenames = [f'{base}aircraftdatabase.json', f'{base}helicopterdatabase.json', f'{base}groundunitdatabase.json', f'{base}navyunitdatabase.json']

lines = []

for filename in filenames:
    # Loads the database 
    with open(filename, encoding="utf8") as f:
        database = json.load(f)

    for row in data_read:
        if row[0] in database:
            name = row[0]

            if row[1] == "yes":
                database[name]["enabled"] = True 
            else:
                database[name]["enabled"] = False

            database[name]["type"] = row[3]
            database[name]["label"] = row[4]
            database[name]["shortLabel"] = row[5]
            database[name]["coalition"] = row[6]
            database[name]["era"] = row[7]

            if row[8] != "":
                database[name]["acquisitionRange"] = int(row[8])

            if row[9] != "":
                database[name]["engagementRange"] = int(row[9])
                
            database[name]["description"] = row[10]
            database[name]["abilities"] = row[11]

    # Dump everything in the database
    with open(filename, "w") as f:
        json.dump(database, f, indent=2)

# Done!
print("Done!")
