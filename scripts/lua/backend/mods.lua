-- Enter here any mods required by your mission as in the example below.
-- Possible categories are:
-- Aircraft
-- Helicopter
-- GroundUnit
-- NavyUnit

Olympus.modsList = {
	["A-4E-C"] = "Aircraft",
	["Bronco-OV-10A"] = "Aircraft"
}

-- Enter here any unitPayloads you want to use for your mods. Remember to add the payload to the database in mods.json!
-- DO NOT ADD PAYLOADS TO "ORIGINAL" DCS UNITS HERE! To add payloads to original DCS units, use the "unitPayload.lua" table instead and add them under the correct unit section.
-- Provided example is for the A-4E-C mod, with a payload of 76 FFAR Mk1 HE rockets and a 300 gallon fuel tank.

Olympus.modsUnitPayloads = {
    ["A-4E-C"] = {
        ["FFAR Mk1 HE *76, Fuel 300G"] = {
            [1] = {["CLSID"] = "{LAU3_FFAR_MK1HE}"},
            [2] = {["CLSID"] = "{LAU3_FFAR_MK1HE}"},
            [3] = {["CLSID"] = "{LAU3_FFAR_MK1HE}"},
            [4] = {["CLSID"] = "{LAU3_FFAR_MK1HE}"},
            [5] = {["CLSID"] = "{DFT-300gal}"}
        }
    }
}
