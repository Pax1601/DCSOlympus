import pandas as pd
import json

# Load data from an Excel file
df = pd.read_excel('data.xlsx')

# Group by 'Name', 'Fuel', 'Loadout Name', 'Role', and 'CLSID' and aggregate 'Items - Name' and 'Items - Quantity'
grouped = df.groupby(['Name', 'Fuel', 'Loadout Name', 'Role', 'CLSID'])['Items - Name', 'Items - Quantity'].agg(lambda x: list(x)).reset_index()

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
                    "roles": [row['Role']],
                    "CLSID": row['CLSID'],
                    "loadout_name": row['Loadout Name']
                }
            ]
        }
    else:
        found = False
        for loadout in result[name]["loadouts"]:
            if loadout["fuel"] == row['Fuel'] and loadout["CLSID"] == row['CLSID'] and loadout["loadout_name"] == row['Loadout Name']:
                loadout["items"].extend([
                    {
                        "name": item,
                        "quantity": quantity
                    } for item, quantity in zip(row['Items - Name'], row['Items - Quantity'])
                ])
                loadout["roles"].append(row['Role'])
                found = True
                break
        if not found:
            result[name]["loadouts"].append({
                "fuel": row['Fuel'],
                "items": [
                    {
                        "name": item,
                        "quantity": quantity
                    } for item, quantity in zip(row['Items - Name'], row['Items - Quantity'])
                ],
                "roles": [row['Role']],
                "CLSID": row['CLSID'],
                "loadout_name": row['Loadout Name']
            })

# Print the result with the correct indents
print(json.dumps(result, indent=2))
