import pandas as pd
import json

# pip3 install pandas, if pandas hasn't been installed yet
# Load data from an Excel file
df = pd.read_excel('data.xlsx')

# Group by 'Name', 'Fuel', and 'Roles' and aggregate 'Items - Name' and 'Items - Quantity'
grouped = df.groupby(['Name', 'Fuel', 'Roles'])['Items - Name', 'Items - Quantity'].agg(lambda x: list(x)).reset_index()

# Convert the grouped data into the desired format
result = {}
for index, row in grouped.iterrows():
    name = row['Name']
    if name not in result:
        result[name] = {
            "name": row['Name'],
            "label": row['Name'],
            "loadouts": [
                {
                    "fuel": row['Fuel'],
                    "items": [
                        {
                            "name": item,
                            "quantity": quantity
                        } for item, quantity in zip(row['Items - Name'], row['Items - Quantity'])
                    ],
                    "roles": [row['Roles']]
                }
            ]
        }
    else:
        loadouts = result[name]["loadouts"]
        loadout = next((l for l in loadouts if l["roles"][0] == row['Roles']), None)
        if loadout:
            loadout["items"] += [
                {
                    "name": item,
                    "quantity": quantity
                } for item, quantity in zip(row['Items - Name'], row['Items - Quantity'])
            ]
        else:
            result[name]["loadouts"].append({
                "fuel": row['Fuel'],
                "items": [
                    {
                        "name": item,
                        "quantity": quantity
                    } for item, quantity in zip(row['Items - Name'], row['Items - Quantity'])
                ],
                "roles": [row['Roles']]
            })

# Print the result with the correct indents, kinda cough
print(json.dumps(result, indent=2))
