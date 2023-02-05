import pandas as pd
import json

# Load data from an Excel file
df = pd.read_excel('data.xlsx')

# Group by 'Name', 'Fuel', 'Loadout Name', and 'Roles' and aggregate 'Items - Name' and 'Items - Quantity'
grouped = df.groupby(['Name', 'Fuel', 'Loadout Name', 'Roles'])['Items - Name', 'Items - Quantity'].agg(lambda x: list(x)).reset_index()

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
                    "roles": [row['Roles']],
                    "loadout_name": row['Loadout Name']
                }
            ]
        }
    else:
        loadouts = result[name]["loadouts"]
        loadout = next((l for l in loadouts if l["loadout_name"] == row['Loadout Name']), None)
        if loadout:
            loadout["items"] += [
                {
                    "name": item,
                    "quantity": quantity
                } for item, quantity in zip(row['Items - Name'], row['Items - Quantity'])
            ]
            loadout["roles"].append(row['Roles'])
        else:
            result[name]["loadouts"].append({
                "fuel": row['Fuel'],
                "items": [
                    {
                        "name": item,
                        "quantity": quantity
                    } for item, quantity in zip(row['Items - Name'], row['Items - Quantity'])
                ],
                "roles": [row['Roles']],
                "loadout_name": row['Loadout Name']
            })

# Print the result with the correct indents
print(json.dumps(result, indent=2))
