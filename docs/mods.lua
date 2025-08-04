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

Olympus.modsUnitPayloads = {
    ["A-4E-C"] = {
        ["FFAR Mk1 HE *76, Fuel 300G"] = {
            [5] = { ["CLSID"] = "{LAU3_FFAR_MK1HE}" },
            [4] = { ["CLSID"] = "{LAU3_FFAR_MK1HE}" },
            [2] = { ["CLSID"] = "{LAU3_FFAR_MK1HE}" },
            [1] = { ["CLSID"] = "{LAU3_FFAR_MK1HE}" },
            [3] = { ["CLSID"] = "{DFT-300gal}" }
        },
        ["Mk-82 SE *12"] = {
            [3] = { ["CLSID"] = "{Mk-82 Snakeye_MER_6_C}" },
            [2] = { ["CLSID"] = "{Mk-82 Snakeye_TER_2_L}" },
            [4] = { ["CLSID"] = "{Mk-82 Snakeye_TER_2_R}" },
            [1] = { ["CLSID"] = "{Mk82SNAKEYE}" },
            [5] = { ["CLSID"] = "{Mk82SNAKEYE}" }
        },
        ["Mk-82 *6, Fuel 150G *2"] = {
            [3] = { ["CLSID"] = "{Mk-82_MER_6_C}" },
            [4] = { ["CLSID"] = "{DFT-150gal}" },
            [2] = { ["CLSID"] = "{DFT-150gal}" }
        },
        ["Mk-82 SE *6, Fuel 150G *2"] = {
            [3] = { ["CLSID"] = "{Mk-82 Snakeye_MER_6_C}" },
            [4] = { ["CLSID"] = "{DFT-150gal}" },
            [2] = { ["CLSID"] = "{DFT-150gal}" }
        },
        ["Mk-83 *3, Fuel 300G *2"] = {
            [3] = { ["CLSID"] = "{Mk-83_TER_3_C}" },
            [2] = { ["CLSID"] = "{DFT-300gal_LR}" },
            [4] = { ["CLSID"] = "{DFT-300gal_LR}" }
        },
        ["Mk-84 *3"] = {
            [3] = { ["CLSID"] = "{AB8B8299-F1CC-4359-89B5-2172E0CF4A5A}" },
            [2] = { ["CLSID"] = "{AB8B8299-F1CC-4359-89B5-2172E0CF4A5A}" },
            [4] = { ["CLSID"] = "{AB8B8299-F1CC-4359-89B5-2172E0CF4A5A}" }
        },
        ["Mk-83 *5"] = {
            [3] = { ["CLSID"] = "{Mk-83_TER_3_C}" },
            [2] = { ["CLSID"] = "{7A44FF09-527C-4B7E-B42B-3F111CFE50FB}" },
            [4] = { ["CLSID"] = "{7A44FF09-527C-4B7E-B42B-3F111CFE50FB}" }
        },
        ["Mk-84 *3, Mk-82 *2"] = {
            [3] = { ["CLSID"] = "{AB8B8299-F1CC-4359-89B5-2172E0CF4A5A}" },
            [2] = { ["CLSID"] = "{AB8B8299-F1CC-4359-89B5-2172E0CF4A5A}" },
            [4] = { ["CLSID"] = "{AB8B8299-F1CC-4359-89B5-2172E0CF4A5A}" },
            [1] = { ["CLSID"] = "{BCE4E030-38E9-423E-98ED-24BE3DA87C32}" },
            [5] = { ["CLSID"] = "{BCE4E030-38E9-423E-98ED-24BE3DA87C32}" }
        },
        ["Mk-82 SE *8, Mk-81 SE *10"] = {
            [4] = { ["CLSID"] = "{Mk-81SE_MER_5_R}" },
            [2] = { ["CLSID"] = "{Mk-81SE_MER_5_L}" },
            [3] = { ["CLSID"] = "{Mk-82 Snakeye_MER_6_C}" },
            [1] = { ["CLSID"] = "{Mk82SNAKEYE}" },
            [5] = { ["CLSID"] = "{Mk82SNAKEYE}" }
        },
        ["Mk-81 *18"] = {
            [4] = { ["CLSID"] = "{Mk-81_MER_5_R}" },
            [2] = { ["CLSID"] = "{Mk-81_MER_5_L}" },
            [3] = { ["CLSID"] = "{Mk-81_MER_6_C}" },
            [1] = { ["CLSID"] = "{90321C8E-7ED1-47D4-A160-E074D5ABD902}" },
            [5] = { ["CLSID"] = "{90321C8E-7ED1-47D4-A160-E074D5ABD902}" }
        },
        ["Mk-77 mod 0 *2, Mk-77 mod 1 *4"] = {
            [5] = { ["CLSID"] = "{mk77mod1}" },
            [4] = { ["CLSID"] = "{mk77mod0}" },
            [2] = { ["CLSID"] = "{mk77mod0}" },
            [1] = { ["CLSID"] = "{mk77mod1}" },
            [3] = { ["CLSID"] = "{Mk-77 mod 1_TER_2_C}" }
        },
        ["Mk-82 *6, LAU-10 *4"] = {
            [3] = { ["CLSID"] = "{Mk-82_MER_6_C}" },
            [4] = { ["CLSID"] = "{F3EFE0AB-E91A-42D8-9CA2-B63C91ED570A}" },
            [2] = { ["CLSID"] = "{F3EFE0AB-E91A-42D8-9CA2-B63C91ED570A}" },
            [1] = { ["CLSID"] = "{F3EFE0AB-E91A-42D8-9CA2-B63C91ED570A}" },
            [5] = { ["CLSID"] = "{F3EFE0AB-E91A-42D8-9CA2-B63C91ED570A}" }
        },
        ["Mk-4 HIPEG *2, Fuel 300G"] = {
            [3] = { ["CLSID"] = "{DFT-400gal}" },
            [2] = { ["CLSID"] = "{Mk4 HIPEG}" },
            [4] = { ["CLSID"] = "{Mk4 HIPEG}" }
        },
        ["LAU-10 *2, FFAR Mk1 HE *38, Fuel 300G"] = {
            [5] = { ["CLSID"] = "{F3EFE0AB-E91A-42D8-9CA2-B63C91ED570A}" },
            [4] = { ["CLSID"] = "{LAU3_FFAR_MK1HE}" },
            [2] = { ["CLSID"] = "{LAU3_FFAR_MK1HE}" },
            [1] = { ["CLSID"] = "{F3EFE0AB-E91A-42D8-9CA2-B63C91ED570A}" },
            [3] = { ["CLSID"] = "{DFT-300gal}" }
        },
        ["FFAR Mk5 HEAT *76, Fuel 300G"] = {
            [5] = { ["CLSID"] = "{LAU3_FFAR_MK5HEAT}" },
            [4] = { ["CLSID"] = "{LAU3_FFAR_MK5HEAT}" },
            [2] = { ["CLSID"] = "{LAU3_FFAR_MK5HEAT}" },
            [1] = { ["CLSID"] = "{LAU3_FFAR_MK5HEAT}" },
            [3] = { ["CLSID"] = "{DFT-300gal}" }
        },
        ["AGM-45B *2, LAU-10 *2, Fuel 300G"] = {
            [2] = { ["CLSID"] = "{AGM_45A}" },
            [4] = { ["CLSID"] = "{AGM_45A}" },
            [5] = { ["CLSID"] = "{F3EFE0AB-E91A-42D8-9CA2-B63C91ED570A}" },
            [1] = { ["CLSID"] = "{F3EFE0AB-E91A-42D8-9CA2-B63C91ED570A}" },
            [3] = { ["CLSID"] = "{DFT-300gal}" }
        },
        ["AGM-45B *4, Fuel 300G"] = {
            [2] = { ["CLSID"] = "{AGM_45A}" },
            [4] = { ["CLSID"] = "{AGM_45A}" },
            [5] = { ["CLSID"] = "{AGM_45A}" },
            [1] = { ["CLSID"] = "{AGM_45A}" },
            [3] = { ["CLSID"] = "{DFT-300gal}" }
        },
        ["CBU-2/A *2, Fuel 300G"] = {
            [4] = { ["CLSID"] = "{CBU-2/A}" },
            [2] = { ["CLSID"] = "{CBU-2/A}" },
            [3] = { ["CLSID"] = "{DFT-300gal}" }
        },
        ["Mk-4 HIPEG *3, Mk-82SE *2"] = {
            [3] = { ["CLSID"] = "{Mk4 HIPEG}" },
            [2] = { ["CLSID"] = "{Mk4 HIPEG}" },
            [4] = { ["CLSID"] = "{Mk4 HIPEG}" },
            [1] = { ["CLSID"] = "{Mk82SNAKEYE}" },
            [5] = { ["CLSID"] = "{Mk82SNAKEYE}" }
        },
        ["Mk-81 SE *6, LAU-10 *2, Fuel 150G *2"] = {
            [4] = { ["CLSID"] = "{DFT-150gal}" },
            [2] = { ["CLSID"] = "{DFT-150gal}" },
            [3] = { ["CLSID"] = "{Mk-81SE_MER_6_C}" },
            [1] = { ["CLSID"] = "{F3EFE0AB-E91A-42D8-9CA2-B63C91ED570A}" },
            [5] = { ["CLSID"] = "{F3EFE0AB-E91A-42D8-9CA2-B63C91ED570A}" }
        },
        ["AGM-45B *4"] = {
            [2] = { ["CLSID"] = "{AGM_45A}" },
            [4] = { ["CLSID"] = "{AGM_45A}" },
            [5] = { ["CLSID"] = "{AGM_45A}" },
            [1] = { ["CLSID"] = "{AGM_45A}" }
        },
        ["Mk-83 *5, Mk-82 *2"] = {
            [3] = { ["CLSID"] = "{Mk-83_TER_3_C}" },
            [2] = { ["CLSID"] = "{7A44FF09-527C-4B7E-B42B-3F111CFE50FB}" },
            [4] = { ["CLSID"] = "{7A44FF09-527C-4B7E-B42B-3F111CFE50FB}" },
            [5] = { ["CLSID"] = "{BCE4E030-38E9-423E-98ED-24BE3DA87C32}" },
            [1] = { ["CLSID"] = "{BCE4E030-38E9-423E-98ED-24BE3DA87C32}" }
        },
        ["Mk-81 SE *18"] = {
            [4] = { ["CLSID"] = "{Mk-81SE_MER_5_R}" },
            [2] = { ["CLSID"] = "{Mk-81SE_MER_5_L}" },
            [3] = { ["CLSID"] = "{Mk-81SE_MER_6_C}" },
            [1] = { ["CLSID"] = "{MK-81SE}" },
            [5] = { ["CLSID"] = "{MK-81SE}" }
        },
        ["Mk-81 SE *12, Fuel 300G"] = {
            [3] = { ["CLSID"] = "{DFT-300gal}" },
            [2] = { ["CLSID"] = "{Mk-81SE_MER_5_L}" },
            [1] = { ["CLSID"] = "{MK-81SE}" },
            [4] = { ["CLSID"] = "{Mk-81SE_MER_5_R}" },
            [5] = { ["CLSID"] = "{MK-81SE}" }
        },
        ["Mk-84 *2, Fuel 300G"] = {
            [3] = { ["CLSID"] = "{DFT-300gal}" },
            [2] = { ["CLSID"] = "{AB8B8299-F1CC-4359-89B5-2172E0CF4A5A}" },
            [4] = { ["CLSID"] = "{AB8B8299-F1CC-4359-89B5-2172E0CF4A5A}" }
        },
        ["CBU-2/A *2, Mk-82 SE *2, Fuel 300G"] = {
            [4] = { ["CLSID"] = "{CBU-2/A}" },
            [2] = { ["CLSID"] = "{CBU-2/A}" },
            [3] = { ["CLSID"] = "{DFT-300gal}" },
            [5] = { ["CLSID"] = "{Mk82SNAKEYE}" },
            [1] = { ["CLSID"] = "{Mk82SNAKEYE}" }
        },
        ["Mk-4 HIPEG *3, LAU-10 *2"] = {
            [3] = { ["CLSID"] = "{Mk4 HIPEG}" },
            [2] = { ["CLSID"] = "{Mk4 HIPEG}" },
            [4] = { ["CLSID"] = "{Mk4 HIPEG}" },
            [1] = { ["CLSID"] = "{F3EFE0AB-E91A-42D8-9CA2-B63C91ED570A}" },
            [5] = { ["CLSID"] = "{F3EFE0AB-E91A-42D8-9CA2-B63C91ED570A}" }
        },
        ["Mk-81 SE *10, LAU-10 *2, Fuel 300G"] = {
            [4] = { ["CLSID"] = "{Mk-81SE_MER_5_R}" },
            [2] = { ["CLSID"] = "{Mk-81SE_MER_5_L}" },
            [3] = { ["CLSID"] = "{DFT-300gal}" },
            [1] = { ["CLSID"] = "{F3EFE0AB-E91A-42D8-9CA2-B63C91ED570A}" },
            [5] = { ["CLSID"] = "{F3EFE0AB-E91A-42D8-9CA2-B63C91ED570A}" }
        },
        ["AGM-45B *2"] = {
            [2] = { ["CLSID"] = "{AGM_45A}" },
            [4] = { ["CLSID"] = "{AGM_45A}" }
        },
        ["GAR-8 *2, Fuel 150G"] = {
            [2] = { ["CLSID"] = "{GAR-8}" },
            [4] = { ["CLSID"] = "{GAR-8}" },
            [3] = { ["CLSID"] = "{DFT-150gal}" }
        },
        ["AGM-45B *2, Fuel 300G *2"] = {
            [4] = { ["CLSID"] = "{DFT-300gal_LR}" },
            [2] = { ["CLSID"] = "{DFT-300gal_LR}" },
            [1] = { ["CLSID"] = "{AGM_45A}" },
            [5] = { ["CLSID"] = "{AGM_45A}" }
        },
        ["Mk-82 *12"] = {
            [3] = { ["CLSID"] = "{Mk-82_MER_6_C}" },
            [2] = { ["CLSID"] = "{Mk-82_TER_2_L}" },
            [4] = { ["CLSID"] = "{Mk-82_TER_2_R}" },
            [1] = { ["CLSID"] = "{BCE4E030-38E9-423E-98ED-24BE3DA87C32}" },
            [5] = { ["CLSID"] = "{BCE4E030-38E9-423E-98ED-24BE3DA87C32}" }
        },
        ["CBU-2/A *2, Mk-20 *2, Fuel 300G"] = {
            [4] = { ["CLSID"] = "{CBU-2/A}" },
            [2] = { ["CLSID"] = "{CBU-2/A}" },
            [3] = { ["CLSID"] = "{DFT-300gal}" },
            [5] = { ["CLSID"] = "{ADD3FAE1-EBF6-4EF9-8EFC-B36B5DDF1E6B}" },
            [1] = { ["CLSID"] = "{ADD3FAE1-EBF6-4EF9-8EFC-B36B5DDF1E6B}" }
        },
        ["Mk-4 HIPEG *3"] = {
            [3] = { ["CLSID"] = "{Mk4 HIPEG}" },
            [2] = { ["CLSID"] = "{Mk4 HIPEG}" },
            [4] = { ["CLSID"] = "{Mk4 HIPEG}" }
        },
        ["AGM-45B *2, LAU-10 *2"] = {
            [2] = { ["CLSID"] = "{AGM_45A}" },
            [4] = { ["CLSID"] = "{AGM_45A}" },
            [5] = { ["CLSID"] = "{F3EFE0AB-E91A-42D8-9CA2-B63C91ED570A}" },
            [1] = { ["CLSID"] = "{F3EFE0AB-E91A-42D8-9CA2-B63C91ED570A}" }
        },
        ["FFAR M156 WP *38, M257 Illumination *14, Fuel 300G"] = {
            [2] = { ["CLSID"] = "{LAU3_FFAR_WP156}" },
            [3] = { ["CLSID"] = "{DFT-300gal}" },
            [4] = { ["CLSID"] = "{LAU3_FFAR_WP156}" },
            [5] = { ["CLSID"] = "{647C5F26-BDD1-41e6-A371-8DE1E4CC0E94}" },
            [1] = { ["CLSID"] = "{647C5F26-BDD1-41e6-A371-8DE1E4CC0E94}" }
        },
        ["FFAR M156 WP *38, M257 Illumination *14, Mk-82 SE *6"] = {
            [2] = { ["CLSID"] = "{LAU3_FFAR_WP156}" },
            [3] = { ["CLSID"] = "{Mk-82 Snakeye_MER_6_C}" },
            [4] = { ["CLSID"] = "{LAU3_FFAR_WP156}" },
            [5] = { ["CLSID"] = "{647C5F26-BDD1-41e6-A371-8DE1E4CC0E94}" },
            [1] = { ["CLSID"] = "{647C5F26-BDD1-41e6-A371-8DE1E4CC0E94}" }
        },
        ["FFAR M156 WP *38, Mk-82 SE *2, Mk-4 HIPEG"] = {
            [2] = { ["CLSID"] = "{LAU3_FFAR_WP156}" },
            [3] = { ["CLSID"] = "{Mk4 HIPEG}" },
            [4] = { ["CLSID"] = "{LAU3_FFAR_WP156}" },
            [5] = { ["CLSID"] = "{Mk82SNAKEYE}" },
            [1] = { ["CLSID"] = "{Mk82SNAKEYE}" }
        },
        ["Mk-4 HIPEG *2, FFAR M156 WP *19, LAU-10, M257 Illumination *7"] = {
            [2] = { ["CLSID"] = "{LAU3_FFAR_WP156}" },
            [3] = { ["CLSID"] = "{Mk4 HIPEG}" },
            [4] = { ["CLSID"] = "{Mk4 HIPEG}" },
            [5] = { ["CLSID"] = "{647C5F26-BDD1-41e6-A371-8DE1E4CC0E94}" },
            [1] = { ["CLSID"] = "{F3EFE0AB-E91A-42D8-9CA2-B63C91ED570A}" }
        },
        ["Fuel 300G *3 (Ferry)"] = {
            [4] = { ["CLSID"] = "{DFT-300gal_LR}" },
            [3] = { ["CLSID"] = "{DFT-300gal}" },
            [2] = { ["CLSID"] = "{DFT-300gal_LR}" }
        },
        ["CBU-2/A *2, LAU-10 *2, Fuel 300G"] = {
            [4] = { ["CLSID"] = "{CBU-2/A}" },
            [2] = { ["CLSID"] = "{CBU-2/A}" },
            [3] = { ["CLSID"] = "{DFT-300gal}" },
            [5] = { ["CLSID"] = "{F3EFE0AB-E91A-42D8-9CA2-B63C91ED570A}" },
            [1] = { ["CLSID"] = "{F3EFE0AB-E91A-42D8-9CA2-B63C91ED570A}" }
        },
        ["Mk-82 *8, Fuel 150G *2"] = {
            [3] = { ["CLSID"] = "{Mk-82_MER_6_C}" },
            [4] = { ["CLSID"] = "{DFT-150gal}" },
            [2] = { ["CLSID"] = "{DFT-150gal}" },
            [5] = { ["CLSID"] = "{BCE4E030-38E9-423E-98ED-24BE3DA87C32}" },
            [1] = { ["CLSID"] = "{BCE4E030-38E9-423E-98ED-24BE3DA87C32}" }
        },
        ["Mk-82 SE *8, Fuel 150G *2"] = {
            [3] = { ["CLSID"] = "{Mk-82 Snakeye_MER_6_C}" },
            [4] = { ["CLSID"] = "{DFT-150gal}" },
            [2] = { ["CLSID"] = "{DFT-150gal}" },
            [5] = { ["CLSID"] = "{Mk82SNAKEYE}" },
            [1] = { ["CLSID"] = "{Mk82SNAKEYE}" }
        },
        ["GAR-8 *2, Fuel 300G"] = {
            [2] = { ["CLSID"] = "{GAR-8}" },
            [4] = { ["CLSID"] = "{GAR-8}" },
            [3] = { ["CLSID"] = "{DFT-300gal}" }
        }
    }
}
