from slpp import slpp as lua
import sys
import os
import json
import logging

sys.path.append("..\..\..\dcs-master\dcs-master")

SEARCH_FOLDER = "D:\\Eagle Dynamics\\DCS World OpenBeta"

def dump_lua(data):
    if type(data) is str:
        return f'"{data}"'
    if type(data) in (int, float):
        return f'{data}'
    if type(data) is bool:
        return data and "true" or "false"
    if type(data) is list:
        l = "{"
        l += ",\n ".join([dump_lua(item) for item in data])
        l += "}"
        return l
    if type(data) is dict:
        t = "{"
        t += ",\n ".join([f'[{k}] = {dump_lua(v)}' if type(k) == int else f'["{k}"]={dump_lua(v)}' for k,v in data.items()])
        t += "}"
        return t

    logging.error(f"Unknown type {type(data)}")

filenames = [os.path.join(dp, f) for dp, dn, filenames in os.walk(SEARCH_FOLDER) for f in filenames if os.path.splitext(f)[1] == '.lua']

for filename in list(filenames):
    with open(filename, 'r') as f:
        try:
            if f.read().find("unitPayloads") == -1:
                filenames.remove(filename)
        except:
            filenames.remove(filename)
            logging.warning(f"{filename} skipped...")
            pass

names = {}
payloads = {}
roles = {}
for filename in filenames:
    with open(os.path.join(os.getcwd(), filename), 'r') as f: # open in readonly mode
        try:
            lines = f.read()
            searchString = "local unitPayloads = {"
            start = lines.find(searchString)
            end = lines.rfind("}")  
            tmp = lua.decode(lines[start + len(searchString) - 1: end + 1]) 
            if type(tmp['payloads']) == dict:
                src = tmp['payloads'].values()
            else:
                src = tmp['payloads']
            
            names[tmp['unitType']] = []
            roles[tmp['unitType']] = {}
            payloads[tmp['unitType']] = {}
            for payload in src:
                names[tmp['unitType']].append(payload['name'])
                roles[tmp['unitType']][payload['name']] = payload['tasks']
                if type(payload['pylons']) == dict:
                    payloads[tmp['unitType']][payload['name']] = {payload['pylons'][key]['num']: {"CLSID" : payload['pylons'][key]['CLSID']} for key in payload['pylons']}
                else:
                    payloads[tmp['unitType']][payload['name']] = {payload['pylons'][key]['num']: {"CLSID" : payload['pylons'][key]['CLSID']} for key in range(len(payload['pylons']))}
        except:
            pass
            
with open('payloadRoles.json', 'w') as f:
    json.dump(roles, f, ensure_ascii = False, indent = 2)

with open('../unitPayloads.lua', 'w') as f:
    f.write("Olympus.unitPayloads = " + dump_lua(payloads))
    
    


