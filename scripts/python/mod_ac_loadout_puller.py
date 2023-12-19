import os

# save DCS.openbeta\\mods\\aircraft path as variable (you will need to put in the path to your own directory)
path = f"{os.environ['UserProfile']}\\Saved Games\\DCS.openbeta\\Mods\\aircraft"

# write everything to a working file - to be deleted after getting rid of unnecessary trailing commas
with open('working_file.lua', mode='w') as payload_file:

    payload_file.write('Olympus.unitPayloads = {\n')

    # iterate through everything in mod aircraft path
    for f in os.listdir(path):

        # modders are inconsistent with the lua filename, so grab that first file in the correct directory
        try:
            unitpayload_lua_dir = f"{path}\\{f}\\UnitPayloads"
            try:
                lua_filename = os.listdir(unitpayload_lua_dir)[0]
            except IndexError:
                pass
            unitpayload_lua_path = f"{unitpayload_lua_dir}\\{lua_filename}"

            # read the aircraft's payloads and write the relevant material into the working file
            with open(unitpayload_lua_path) as payload_lua_file:
                lines = payload_lua_file.readlines()
                for line in lines:
                    if line.startswith('	["name"]'):
                        ac_type = line.replace('	["name"] = "', '').replace('",', '').rstrip()
                        ac_type = f'["{ac_type}"] =' + r' {'
                        payload_file.write(ac_type + '\n')
                    elif line.startswith('			["name"]'):
                        loadout_name = line.replace('			["name"] = "', '').replace('",', '').rstrip()
                        loadout_name = f'["{loadout_name}"] =' + r' {'
                        payload_file.write(loadout_name + '\n')
                    elif line.startswith('					["CLSID"]'):
                        clsid = line.replace('					', '').replace(',', '').rstrip()
                        clsid = r'{' + f'{clsid}' + r'}' + ','
                    elif line.startswith('					["num"]'):
                        pylon = line.replace('					["num"] = ', '').replace(',', '').rstrip()
                        pylon = f'[{pylon}] = '
                        payload_file.write(pylon + clsid + '\n')
                    elif line.startswith('		},'):
                        payload_file.write('},\n')
                    elif line.startswith('}'):
                        payload_file.write('},\n')

        # skip directory if no directory or no file in directory
        except FileNotFoundError:
            pass

    payload_file.write('}')

# parse the working file, get rid of trailing commas when next line starts with a '}'.
with open("working_file.lua") as working_file:
    lines = working_file.readlines()
    prev_line = ''
    with open("payloads.lua", mode="w") as payload_file:
        for ind, line in enumerate(lines):
            try:
                if lines[ind + 1].startswith('}') and line.endswith('},\n'):
                    new_line = line.replace(',', '')
                    payload_file.write(f'{new_line}')
                else:
                    payload_file.write(line)
            except IndexError:
                payload_file.write(line)

# delete the working file
os.remove("working_file.lua")
