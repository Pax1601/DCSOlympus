from slpp import slpp as lua
import sys
import os
import json
import logging

sys.path.append("..\..\..\dcs-master\dcs-master")

SEARCH_FOLDER = "D:\\Eagle Dynamics\\DCS World OpenBeta"

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

def convert_clsid(clsid):
    if clsid in clsid_conversion:
        return clsid_conversion[clsid]
    else:
        return clsid

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

                # The Tomcats are a bit special
                if (tmp['unitType'] in ["F-14A-95-GR", "F-14A-135-GR", "F-14B"]):
                    pylonConversion = {
                        "pylon_1A": 1,
                        "pylon_1B": 2,
                        "pylon_2": 3, 
                        "pylon_3": 4, 
                        "pylon_4": 5, 
                        "pylon_5": 6, 
                        "pylon_6": 7, 
                        "pylon_7": 8, 
                        "pylon_8B": 9,
                        "pylon_8A": 10
                    }
                    if type(payload['pylons']) == dict:
                        payloads[tmp['unitType']][payload['name']] = {pylonConversion[payload['pylons'][key]['num']]: {"CLSID" : convert_clsid(payload['pylons'][key]['CLSID'])} for key in payload['pylons']}
                    else:
                        payloads[tmp['unitType']][payload['name']] = {pylonConversion[payload['pylons'][key]['num']]: {"CLSID" : convert_clsid(payload['pylons'][key]['CLSID'])} for key in range(len(payload['pylons']))}
                else:
                    if type(payload['pylons']) == dict:
                        payloads[tmp['unitType']][payload['name']] = {payload['pylons'][key]['num']: {"CLSID" : convert_clsid(payload['pylons'][key]['CLSID'])} for key in payload['pylons']}
                    else:
                        payloads[tmp['unitType']][payload['name']] = {payload['pylons'][key]['num']: {"CLSID" : convert_clsid(payload['pylons'][key]['CLSID'])} for key in range(len(payload['pylons']))}
        except:
            pass
            
with open('payloadRoles.json', 'w') as f:
    json.dump(roles, f, ensure_ascii = False, indent = 2)

with open('../unitPayloads.lua', 'w') as f:
    f.write("Olympus.unitPayloads = " + dump_lua(payloads))
    
    


