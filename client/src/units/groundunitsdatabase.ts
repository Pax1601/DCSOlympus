import { UnitDatabase } from "./unitdatabase"

export class GroundUnitsDatabase extends UnitDatabase {
    constructor() {
        super();
        this.blueprints = {
            "SA-2 SAM Battery": {
                "name": "SA-2 SAM Battery",
                "era": ["Early Cold War"],
                "label": "SA-2 SAM Battery",
                "shortLabel": "SA-2 SAM Battery",
                "range": "Long",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                        ],
                        "roles": [
                            "Template"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "SA-3 SAM Battery": {
                "name": "SA-3 SAM Battery",
                "era": ["Early Cold War"],
                "label": "SA-3 SAM Battery",
                "shortLabel": "SA-3 SAM Battery",
                "range": "Medium",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [],
                        "roles": [
                            "Template"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "SA-6 SAM Battery": {
                "name": "SA-6 SAM Battery",
                "era": ["Mid Cold War"],
                "label": "SA-6 SAM Battery",
                "shortLabel": "SA-6 SAM Battery",
                "range": "Medium",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [],
                        "roles": [
                            "Template"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "SA-10 SAM Battery": {
                "name": "SA-10 SAM Battery",
                "era": ["Late Cold War"],
                "label": "SA-10 SAM Battery",
                "shortLabel": "SA-10 SAM Battery",
                "range": "Long",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [],
                        "roles": [
                            "Template"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "SA-11 SAM Battery": {
                "name": "SA-11 SAM Battery",
                "era": ["Late Cold War"],
                "label": "SA-11 SAM Battery",
                "shortLabel": "SA-11 SAM Battery",
                "range": "Medium",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [],
                        "roles": [
                            "Template"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Patriot site": {
                "name": "Patriot site",
                "era": ["Late Cold War"],
                "label": "Patriot site",
                "shortLabel": "Patriot site",
                "range": "Long",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [],
                        "roles": [
                            "Template"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Hawk SAM Battery": {
                "name": "Hawk SAM Battery",
                "era": ["Early Cold War"],
                "label": "Hawk SAM Battery",
                "shortLabel": "Hawk SAM Battery",
                "range": "Medium",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [],
                        "roles": [
                            "Template"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "2B11 mortar": {
                "name": "2B11 mortar",
                "era": ["Late Cold War"],
                "label": "2B11 mortar",
                "shortLabel": "2B11 mortar",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "120mm Mortar Tube",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            }

                        ],
                        "roles": [
                            "Gun Artillery"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "SAU Gvozdika": {
                "name": "SAU Gvozdika",
                "era": ["Mid Cold War"],
                "label": "SAU Gvozdika",
                "shortLabel": "SAU Gvozdika",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "122mm Howitzer",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Hard)"
                            }

                        ],
                        "roles": [
                            "Gun Artillery"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "SAU Msta": {
                "name": "SAU Msta",
                "era": ["Late Cold War"],
                "label": "SAU Msta",
                "shortLabel": "SAU Msta",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "152mm Howitzer",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Hard)"
                            }
                        ],
                        "roles": [
                            "Gun Artillery"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "SAU Akatsia": {
                "name": "SAU Akatsia",
                "era": ["Mid Cold War"],
                "label": "SAU Akatsia",
                "shortLabel": "SAU Akatsia",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "152mm Howitzer",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Hard)"
                            }
                        ],
                        "roles": [
                            "Gun Artillery"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "SAU 2-C9": {
                "name": "SAU 2-C9",
                "era": ["Mid Cold War"],
                "label": "SAU Nona",
                "shortLabel": "SAU Nona",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "120mm Mortar",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            }
                        ],
                        "roles": [
                            "Gun Artillery"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "M-109": {
                "name": "M-109",
                "era": ["Early Cold War"],
                "label": "M-109 Paladin",
                "shortLabel": "M-109",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "155mm Howitzer",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Hard)"
                            }
                        ],
                        "roles": [
                            "Gun Artillery"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "AAV7": {
                "name": "AAV7",
                "era": ["Mid Cold War"],
                "label": "AAV7",
                "shortLabel": "AAV7",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "12.7mm M2 HMG",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            }
                        ],
                        "roles": [
                            "APC"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "BMD-1": {
                "name": "BMD-1",
                "era": ["Mid Cold War"],
                "label": "BMD-1",
                "shortLabel": "BMD-1",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "73mm Gun",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            },
                            {
                            "name": "7.62mm PKT GPMG",
                            "quantity": 3,
                            "effectiveAgainst": "Surface (Soft)"
                            },
                            {
                            "name": "AT-3 Sagger ATGM",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Hard)"
                            }
                        ],
                        "roles": [
                            "IFV"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "BMP-1": {
                "name": "BMP-1",
                "era": ["Mid Cold War"],
                "label": "BMP-1",
                "shortLabel": "BMP-1",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "73mm Gun",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            },
                            {
                            "name": "7.62mm PKT GPMG",
                            "quantity": 3,
                            "effectiveAgainst": "Surface (Soft)"
                            },
                            {
                            "name": "AT-3 Sagger ATGM",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Hard)"
                            }
                        ],
                        "roles": [
                            "IFV"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "BMP-2": {
                "name": "BMP-2",
                "era": ["Mid Cold War"],
                "label": "BMP-2",
                "shortLabel": "BMP-2",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "30mm Autocannon",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            },
                            {
                            "name": "7.62mm PKT GPMG",
                            "quantity": 3,
                            "effectiveAgainst": "Surface (Soft)"
                            },
                            {
                            "name": "AT-5 Konkurs ATGM",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Hard)"
                            }
                        ],
                        "roles": [
                            "IFV"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "BMP-3": {
                "name": "BMP-3",
                "era": ["Late Cold War"],
                "label": "BMP-3",
                "shortLabel": "BMP-3",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "100mm Gun",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Hard)"
                            },
                            {
                            "name": "30mm Autocannon",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            },
                            {
                            "name": "7.62mm PKT GPMG",
                            "quantity": 3,
                            "effectiveAgainst": "Surface (Soft)"
                            },
                            {
                            "name": "AT-10 Stabber ATGM",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Hard)"
                            }
                        ],
                        "roles": [
                            "IFV"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Boman": {
                "name": "Boman",
                "era": ["Late Cold War"],
                "label": "Grad Fire Direction Manager",
                "shortLabel": "Boman",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "7.62mm PKMB GPMG",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            },
                            {
                            "name": "RPG-7",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Hard)"
                            }
                        ],
                        "roles": [
                            "Reconnaissance"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "BRDM-2": {
                "name": "BRDM-2",
                "era": ["Early Cold War"],
                "label": "BRDM-2",
                "shortLabel": "BRDM-2",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "14.5mm KPVT HMG",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            },
                            {
                            "name": "7.62mm PKT GPMG",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            }
                        ],
                        "roles": [
                            "Reconnaissance"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "BTR-80": {
                "name": "BTR-80",
                "era": ["Late Cold War"],
                "label": "BTR-80",
                "shortLabel": "BTR-80",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "14.5mm KPVT HMG",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            },
                            {
                            "name": "7.62mm PKT GPMG",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            }
                        ],
                        "roles": [
                            "APC"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "BTR_D": {
                "name": "BTR_D",
                "era": ["Mid Cold War"],
                "label": "BTR_D",
                "shortLabel": "BTR_D",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "7.62mm PKT GPMG",
                            "quantity": 2,
                            "effectiveAgainst": "Surface (Soft)"
                            },
                            {
                            "name": "AT-5 Konkurs ATGM",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Hard)"
                            }
                        ],
                        "roles": [
                            "APC"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Bunker": {
                "name": "Bunker",
                "label": "Bunker",
                "shortLabel": "Bunker",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Static"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Cobra": {
                "name": "Cobra",
                "era": ["Modern"],
                "label": "Otokar Cobra",
                "shortLabel": "Cobra",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "12.7mm HMG",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            }
                        ],
                        "roles": [
                            "Reconnaissance"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "LAV-25": {
                "name": "LAV-25",
                "era": ["Late Cold War"],
                "label": "LAV-25",
                "shortLabel": "LAV-25",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "25mm M242 Autocannon",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            },
                            {
                            "name": "7.62mm M240 GPMG",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            }
                        ],
                        "roles": [
                            "IFV"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "M1043 HMMWV Armament": {
                "name": "M1043 HMMWV Armament",
                "era": ["Late Cold War"],
                "label": "HMMWV M2 Browning",
                "shortLabel": "HMMWV M2",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "12.7mm M2 HMG",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            }
                        ],
                        "roles": [
                            "Reconnaissance"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "M1045 HMMWV TOW": {
                "name": "M1045 HMMWV TOW",
                "era": ["Late Cold War"],
                "label": "HMMWV TOW",
                "shortLabel": "HMMWV TOW",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "BGM-71 TOW ATGM",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Hard)"
                            }
                        ],
                        "roles": [
                            "Reconnaissance"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "M1126 Stryker ICV": {
                "name": "M1126 Stryker ICV",
                "era": [""Modern"],
                "label": "Stryker MG",
                "shortLabel": "Stryker MG",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "12.7mm M2 HMG",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            }
                        ],
                        "roles": [
                            "APC"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "M-113": {
                "name": "M-113",
                "era": ["Early Cold War"],
                "label": "M-113",
                "shortLabel": "M-113",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "12.7mm M2 HMG",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            }
                        ],
                        "roles": [
                            "APC"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "M1134 Stryker ATGM": {
                "name": "M1134 Stryker ATGM",
                "era": ["Modern"],
                "label": "Stryker ATGM",
                "shortLabel": "Stryker ATGM",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "12.7mm M2 HMG",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            },
                            {
                            "name": "BGM-71 TOW",
                            "quantity": 2,
                            "effectiveAgainst": "Surface (Hard)"
                            }
                        ],
                        "roles": [
                            "IFV"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "M-2 Bradley": {
                "name": "M-2 Bradley",
                "era": ["Late Cold War"],
                "label": "M-2A2 Bradley",
                "shortLabel": "M-2 Bradley",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "25mm M242 Autocannon",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            },
                            {
                            "name": "BGM-71 TOW",
                            "quantity": 2,
                            "effectiveAgainst": "Surface (Hard)"
                            },
                            {
                            "name": "7.62mm M240 GPMG",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            }
                        ],
                        "roles": [
                            "IFV"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Marder": {
                "name": "Marder",
                "era": ["Late Cold War"],
                "label": "Marder",
                "shortLabel": "Marder",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "20mm MK 20 Rh 202 Autocannon",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            },
                            {
                            "name": "7.62mm MG3 GPMG",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            }
                        ],
                        "roles": [
                            "IFV"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "MCV-80": {
                "name": "MCV-80",
                "era": ["Late Cold War"],
                "label": "Warrior IFV",
                "shortLabel": "Warrior",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "30mm L21A1 Autocannon",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            },
                            {
                            "name": "7.62mm L94A1 GPMG",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            }
                        ],
                        "roles": [
                            "IFV"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "MTLB": {
                "name": "MTLB",
                "era": ["Mid Cold War"],
                "label": "MT-LB",
                "shortLabel": "MT-LB",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "7.62mm PKT GPMG",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            }
                        ],
                        "roles": [
                            "APC"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Paratrooper RPG-16": {
                "name": "Paratrooper RPG-16",
                "era": ["Modern"],
                "label": "Paratrooper RPG-16",
                "shortLabel": "Paratrooper RPG-16",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "RPG-16",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Hard)"
                            }
                        ],
                        "roles": [
                            "Infantry"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Paratrooper AKS-74": {
                "name": "Paratrooper AKS-74",
                "era": ["Modern"],
                "label": "Paratrooper AKS-74",
                "shortLabel": "Paratrooper AKS-74",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "5.45mm AKS-74",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            }
                        ],
                        "roles": [
                            "Infantry"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Sandbox": {
                "name": "Sandbox",
                "label": "Sandbox",
                "shortLabel": "Sandbox",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Static"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Soldier AK": {
                "name": "Soldier AK",
                "era": ["Early Cold War"],
                "label": "Soldier AK",
                "shortLabel": "Soldier AK",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "5.45mm AK-74",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            }
                        ],
                        "roles": [
                            "Infantry"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Infantry AK": {
                "name": "Infantry AK",
                "era": ["Mid Cold War"],
                "label": "Infantry AK",
                "shortLabel": "Infantry AK",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "5.45mm AK-74",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            }
                        ],
                        "roles": [
                            "Infantry"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Soldier M249": {
                "name": "Soldier M249",
                "era": ["Late Cold War"],
                "label": "Soldier M249",
                "shortLabel": "Soldier M249",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "5.56mm M249 SAW",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            }
                        ],
                        "roles": [
                            "Infantry"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Soldier M4": {
                "name": "Soldier M4",
                "era": ["Mid Cold War"],
                "label": "Soldier M4",
                "shortLabel": "Soldier M4",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "5.56mm M4",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            }
                        ],
                        "roles": [
                            "Infantry"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Soldier M4 GRG": {
                "name": "Soldier M4 GRG",
                "era": ["Mid Cold War"],
                "label": "Soldier M4 GRG",
                "shortLabel": "Soldier M4 GRG",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "5.56mm M4",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            }
                        ],
                        "roles": [
                            "Infantry"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Soldier RPG": {
                "name": "Soldier RPG",
                "era": ["Mid Cold War"],
                "label": "Soldier RPG",
                "shortLabel": "Soldier RPG",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "RPG-16",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Hard)"
                            }
                        ],
                        "roles": [
                            "Infantry"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "TPZ": {
                "name": "TPZ",
                "era": ["Late Cold War"],
                "label": "TPz Fuchs",
                "shortLabel": "TPz Fuchs",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "7.62mm M3 GPMG",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (soft)"
                            }
                        ],
                        "roles": [
                            "APC"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Grad-URAL": {
                "name": "Grad-URAL",
                "era": ["Mid Cold War"],
                "label": "Grad",
                "shortLabel": "Grad",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "122mm Grad 9M21 Rocket",
                            "quantity": 40,
                            "effectiveAgainst": "Surface (Hard)"
                            }
                        ],
                        "roles": [
                            "Rocket Artillery"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Uragan_BM-27": {
                "name": "Uragan_BM-27",
                "era": ["Late Cold War"],
                "label": "Uragan",
                "shortLabel": "Uragan",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "220mm Uragan 9M27 Rocket",
                            "quantity": 16,
                            "effectiveAgainst": "Surface (Hard)"
                            }
                        ],
                        "roles": [
                            "Rocket Artillery"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Smerch": {
                "name": "Smerch",
                "era": ["Late Cold War"],
                "label": "Smerch",
                "shortLabel": "Smerch",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "300mm Smerch 9M55 Rocket",
                            "quantity": 12,
                            "effectiveAgainst": "Surface (Hard)"
                            }
                        ],
                        "roles": [
                            "Rocket Artillery"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "MLRS": {
                "name": "MLRS",
                "era": ["Late Cold War"],
                "label": "M270",
                "shortLabel": "M270",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "227mm with 644 DPICM Submunitions",
                            "quantity": 12,
                            "effectiveAgainst": "Surface (Hard)"
                            }
                        ],
                        "roles": [
                            "Rocket Artillery"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "2S6 Tunguska": {
                "name": "2S6 Tunguska",
                "era": ["Late Cold War"],
                "label": "SA-19 Tunguska",
                "shortLabel": "SA-19",
                "range": "Short",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "Twin Barrel 30mm 2A38M Autocannons",
                            "quantity": 2,
                            "effectiveAgainst": "Surface (Soft), Aircraft"
                            },
                            {
                            "name": "9M311 SAM (Radio Command Guidance)",
                            "quantity": 4,
                            "effectiveAgainst": "Surface (Soft), Aircraft"
                            }
                        ],
                        "roles": [
                            "AAA/SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Kub 2P25 ln": {
                "name": "Kub 2P25 ln",
                "era": ["Late Cold War"],
                "label": "SA-6 Kub 2P25 ln",
                "shortLabel": "Kub 2P25 ln",
                "range": "Medium",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "3M9M SAM (SARH)",
                            "quantity": 3,
                            "effectiveAgainst": "Aircraft"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "5p73 s-125 ln": {
                "name": "5p73 s-125 ln",
                "era": ["Early Cold War"],
                "label": "SA-3 5p73 s-125 ln",
                "shortLabel": "5p73 s-125 ln",
                "range": "Medium",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "SA-3 3M9M SAM (RF CLOS)",
                            "quantity": 3,
                            "effectiveAgainst": "Aircraft"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "S-300PS 5P85C ln": {
                "name": "S-300PS 5P85C ln",
                "era": ["Late Cold War"],
                "label": "SA-10 S-300PS 5P85C ln",
                "shortLabel": "S-300PS 5P85C ln",
                "range": "Long",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "48N6 SAM (SARH)",
                            "quantity": 2,
                            "effectiveAgainst": "Aircraft"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "S-300PS 5P85D ln": {
                "name": "S-300PS 5P85D ln",
                "era": ["Late Cold War"],
                "label": "SA-10 S-300PS 5P85D ln",
                "shortLabel": "S-300PS 5P85D ln",
                "range": "Long",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "48N6 SAM (SARH)",
                            "quantity": 4,
                            "effectiveAgainst": "Aircraft"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "SA-11 Buk LN 9A310M1": {
                "name": "SA-11 Buk LN 9A310M1",
                "era": ["Late Cold War"],
                "label": "SA-11 Buk LN 9A310M1",
                "shortLabel": "SA-11 Buk LN 9A310M1",
                "range": "Medium",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "9M38M1 SAM (SARH)",
                            "quantity": 4,
                            "effectiveAgainst": "Aircraft"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Osa 9A33 ln": {
                "name": "Osa 9A33 ln",
                "era": ["Mid Cold War"],
                "label": "SA-8 Osa 9A33 ln",
                "shortLabel": "Osa 9A33 ln",
                "range": "Short",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "9M33 SAM (SARH)",
                            "quantity": 4,
                            "effectiveAgainst": "Aircraft"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Tor 9A331": {
                "name": "Tor 9A331",
                "era": ["Late Cold War"],
                "label": "SA-15 Tor 9A331",
                "shortLabel": "Tor 9A331",
                "range": "Medium",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "9M330 SAM (Radio Command Guidance)",
                            "quantity": 8,
                            "effectiveAgainst": "Aircraft"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Strela-10M3": {
                "name": "Strela-10M3",
                "era": ["Late Cold War"],
                "label": "SA-13 Strela-10M3",
                "shortLabel": "Strela-10M3",
                "range": "Short",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "9M333 SAM (IR)",
                            "quantity": 4,
                            "effectiveAgainst": "Aircraft"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Strela-1 9P31": {
                "name": "Strela-1 9P31",
                "era": ["Late Cold War"],
                "label": "SA-9 Strela-1 9P31",
                "shortLabel": "Strela-1 9P31",
                "range": "Short",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "9M31 SAM (IR)",
                            "quantity": 4,
                            "effectiveAgainst": "Aircraft"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "SA-11 Buk CC 9S470M1": {
                "name": "SA-11 Buk CC 9S470M1",
                "era": ["Late Cold War"],
                "label": "SA-11 Buk CC 9S470M1",
                "shortLabel": "SA-11 Buk CC 9S470M1",
                "range": "Medium",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "Command Post",
                            "quantity": 1,
                            "effectiveAgainst": "None"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "SA-8 Osa LD 9T217": {
                "name": "SA-8 Osa LD 9T217",
                "era": ["Late Cold War"],
                "label": "SA-8 Osa LD 9T217",
                "shortLabel": "SA-8 Osa LD 9T217",
                "range": "Short",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "Transloader",
                            "quantity": 1,
                            "effectiveAgainst": "None"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Patriot AMG": {
                "name": "Patriot AMG",
                "era": ["Modern"],
                "label": "Patriot AMG",
                "shortLabel": "Patriot AMG",
                "range": "Long",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "Antenna Mast Group",
                            "quantity": 1,
                            "effectiveAgainst": "None"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Patriot ECS": {
                "name": "Patriot ECS",
                "era": ["Modern"],
                "label": "Patriot ECS",
                "shortLabel": "Patriot ECS",
                "range": "Long",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "Engagement Control Station",
                            "quantity": 1,
                            "effectiveAgainst": "None"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Gepard": {
                "name": "Gepard",
                "era": ["Late Cold War", "Modern"],
                "label": "Gepard",
                "shortLabel": "Gepard",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "35mm KDA Autocannon",
                            "quantity": 2,
                            "effectiveAgainst": "Surface (Soft), Aircraft"
                            }
                        ],
                        "roles": [
                            "AAA"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Hawk pcp": {
                "name": "Hawk pcp",
                "era": ["Late Cold War"],
                "label": "Hawk pcp",
                "shortLabel": "Hawk pcp",
                "range": "Medium",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "Command Post",
                            "quantity": 1,
                            "effectiveAgainst": "None"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "SA-18 Igla manpad": {
                "name": "SA-18 Igla manpad",
                "era": ["Late Cold War"],
                "label": "SA-18 Igla manpad",
                "shortLabel": "SA-18 Igla manpad",
                "range": "Short",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "9K38 SAM (IR)",
                            "quantity": 1,
                            "effectiveAgainst": "Aircraft"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Igla manpad INS": {
                "name": "Igla manpad INS",
                "era": ["Late Cold War"],
                "label": "SA-18 Igla manpad INS",
                "shortLabel": "Igla manpad INS",
                "range": "Short",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "9K38 SAM (IR)",
                            "quantity": 1,
                            "effectiveAgainst": "Aircraft"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "SA-18 Igla-S manpad": {
                "name": "SA-18 Igla-S manpad",
                "era": ["Late Cold War"],
                "label": "SA-18 Igla-S manpad",
                "shortLabel": "SA-18 Igla-S manpad",
                "range": "Short",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "9K338 SAM (IR)",
                            "quantity": 1,
                            "effectiveAgainst": "Aircraft"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Vulcan": {
                "name": "Vulcan",
                "era": ["Late Cold War"],
                "label": "Vulcan",
                "shortLabel": "Vulcan",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "M168 20mm Vulcan",
                            "quantity": 1,
                            "effectiveAgainst": "Aircraft"
                            }
                        ],
                        "roles": [
                            "AAA"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Hawk ln": {
                "name": "Hawk ln",
                "era": ["Late Cold War"],
                "label": "Hawk ln",
                "shortLabel": "Hawk ln",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "MIM 23B SAM (SARH)",
                            "quantity": 3,
                            "effectiveAgainst": "Aircraft"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "M48 Chaparral": {
                "name": "M48 Chaparral",
                "era": ["Late Cold War"],
                "label": "M48 Chaparral",
                "shortLabel": "M48 Chaparral",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "MIM-72G SAM (IR)",
                            "quantity": 4,
                            "effectiveAgainst": "Aircraft"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "M6 Linebacker": {
                "name": "M6 Linebacker",
                "era": ["Late Cold War"],
                "label": "M6 Linebacker",
                "shortLabel": "M6 Linebacker",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "M242 25mm Autocannon",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            },
                            {
                            "name": "7.62mm M240C GPMG",
                            "quantity": 4,
                            "effectiveAgainst": "Surface (Soft)"
                            },
                            {
                            "name": "Stinger SAM (IR)",
                            "quantity": 4,
                            "effectiveAgainst": "Aircraft"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Patriot ln": {
                "name": "Patriot ln",
                "era": ["Late Cold War"],
                "label": "Patriot ln",
                "shortLabel": "Patriot ln",
                "range": "Long",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "MIM-104 SAM (SARH)",
                            "quantity": 4,
                            "effectiveAgainst": "Aircraft"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "M1097 Avenger": {
                "name": "M1097 Avenger",
                "era": ["Modern"],
                "label": "M1097 Avenger",
                "shortLabel": "M1097 Avenger",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "12.7mm M2 HMG",
                            "quantity": 2,
                            "effectiveAgainst": "Surface (Soft)"
                            },
                            {
                            "name": "Stinger SAM (IR)",
                            "quantity": 4,
                            "effectiveAgainst": "Aircraft"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Patriot EPP": {
                "name": "Patriot EPP",
                "era": ["Late Cold War"],
                "label": "Patriot EPP",
                "shortLabel": "Patriot EPP",
                "range": "Long",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "Diesel-Electric Generator",
                            "quantity": 1,
                            "effectiveAgainst": "None"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Patriot cp": {
                "name": "Patriot cp",
                "era": ["Late Cold War"],
                "label": "Patriot cp",
                "shortLabel": "Patriot cp",
                "range": "Long",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "Command Post",
                            "quantity": 1,
                            "effectiveAgainst": "None"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Roland ADS": {
                "name": "Roland ADS",
                "era": ["Late Cold War"],
                "label": "Roland ADS",
                "shortLabel": "Roland ADS",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "MIM-115 SAM (Radio Command Guidance)",
                            "quantity": 2,
                            "effectiveAgainst": "Aircraft"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "S-300PS 54K6 cp": {
                "name": "S-300PS 54K6 cp",
                "era": ["Late Cold War"],
                "label": "SA-10 S-300PS 54K6 cp",
                "shortLabel": "S-300PS 54K6 cp",
                "range": "Long",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "Command Post",
                            "quantity": 1,
                            "effectiveAgainst": "None"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Stinger manpad GRG": {
                "name": "Stinger manpad GRG",
                "era": ["Late Cold War"],
                "label": "Stinger manpad GRG",
                "shortLabel": "Stinger manpad GRG",
                "range": "Short",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "Stinger SAM (IR)",
                            "quantity": 1,
                            "effectiveAgainst": "Aircraft"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Stinger manpad dsr": {
                "name": "Stinger manpad dsr",
                "era": ["Late Cold War"],
                "label": "Stinger manpad dsr",
                "shortLabel": "Stinger manpad dsr",
                "range": "Short",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "Stinger SAM (IR)",
                            "quantity": 1,
                            "effectiveAgainst": "Aircraft"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Stinger comm dsr": {
                "name": "Stinger comm dsr",
                "era": ["Late Cold War"],
                "label": "Stinger comm dsr",
                "shortLabel": "Stinger comm dsr",
                "range": "Short",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "Commander",
                            "quantity": 1,
                            "effectiveAgainst": "None"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Stinger manpad": {
                "name": "Stinger manpad",
                "era": ["Late Cold War"],
                "label": "Stinger manpad",
                "shortLabel": "Stinger manpad",
                "range": "Short",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "Stinger SAM (IR)",
                            "quantity": 1,
                            "effectiveAgainst": "Aircraft"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Stinger comm": {
                "name": "Stinger comm",
                "era": ["Late Cold War"],
                "label": "Stinger comm",
                "shortLabel": "Stinger comm",
                "range": "Short",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "Commander",
                            "quantity": 1,
                            "effectiveAgainst": "None"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "ZSU-23-4 Shilka": {
                "name": "ZSU-23-4 Shilka",
                "era": ["Late Cold War"],
                "label": "ZSU-23-4 Shilka",
                "shortLabel": "ZSU-23-4 Shilka",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "23mm AZP-23M Autocannon",
                            "quantity": 4,
                            "effectiveAgainst": "Surface (Soft), Aircraft"
                            }
                        ],
                        "roles": [
                            "AAA"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "ZU-23 Emplacement Closed": {
                "name": "ZU-23 Emplacement Closed",
                "era": ["Late Cold War"],
                "label": "ZU-23 Emplacement Closed",
                "shortLabel": "ZU-23 Emplacement Closed",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "23mm 2A14 Autocannon",
                            "quantity": 4,
                            "effectiveAgainst": "Surface (Soft), Aircraft"
                            }
                        ],
                        "roles": [
                            "AAA"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "ZU-23 Emplacement": {
                "name": "ZU-23 Emplacement",
                "era": ["Late Cold War"],
                "label": "ZU-23 Emplacement",
                "shortLabel": "ZU-23 Emplacement",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "23mm 2A14 Autocannon",
                            "quantity": 4,
                            "effectiveAgainst": "Surface (Soft), Aircraft"
                            }
                        ],
                        "roles": [
                            "AAA"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "ZU-23 Closed Insurgent": {
                "name": "ZU-23 Closed Insurgent",
                "era": ["Late Cold War"],
                "label": "ZU-23 Closed Insurgent",
                "shortLabel": "ZU-23 Closed Insurgent",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "23mm 2A14 Autocannon",
                            "quantity": 4,
                            "effectiveAgainst": "Surface (Soft), Aircraft"
                            }
                        ],
                        "roles": [
                            "AAA"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Ural-375 ZU-23 Insurgent": {
                "name": "Ural-375 ZU-23 Insurgent",
                "era": ["Late Cold War"],
                "label": "Ural-375 ZU-23 Insurgent",
                "shortLabel": "Ural-375 ZU-23 Insurgent",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "23mm 2A14 Autocannon",
                            "quantity": 4,
                            "effectiveAgainst": "Surface (Soft), Aircraft"
                            }
                        ],
                        "roles": [
                            "AAA"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "ZU-23 Insurgent": {
                "name": "ZU-23 Insurgent",
                "era": ["Late Cold War"],
                "label": "ZU-23 Insurgent",
                "shortLabel": "ZU-23 Insurgent",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "23mm 2A14 Autocannon",
                            "quantity": 4,
                            "effectiveAgainst": "Surface (Soft), Aircraft"
                            }
                        ],
                        "roles": [
                            "AAA"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Ural-375 ZU-23": {
                "name": "Ural-375 ZU-23",
                "era": ["Late Cold War"],
                "label": "Ural-375 ZU-23",
                "shortLabel": "Ural-375 ZU-23",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "23mm 2A14 Autocannon",
                            "quantity": 4,
                            "effectiveAgainst": "Surface (Soft), Aircraft"
                            }
                        ],
                        "roles": [
                            "AAA"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "1L13 EWR": {
                "name": "1L13 EWR",
                "era": ["Late Cold War"],
                "label": "1L13 EWR",
                "shortLabel": "1L13 EWR",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "Early Warning Radar",
                            "quantity": 1,
                            "effectiveAgainst": "None"
                            }
                        ],
                        "roles": [
                            "Radar"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Kub 1S91 str": {
                "name": "Kub 1S91 str",
                "era": ["Mid Cold War"],
                "label": "SA-6 Kub 1S91 str",
                "shortLabel": "Kub 1S91 str",
                "range": "Medium",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "Search and Track Radar",
                            "quantity": 1,
                            "effectiveAgainst": "None"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "S-300PS 40B6M tr": {
                "name": "S-300PS 40B6M tr",
                "era": ["Late Cold War"],
                "label": "SA-10 S-300PS 40B6M tr",
                "shortLabel": "S-300PS 40B6M tr",
                "range": "Long",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "Track Radar",
                            "quantity": 1,
                            "effectiveAgainst": "None"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "S-300PS 40B6MD sr": {
                "name": "S-300PS 40B6MD sr",
                "era": ["Late Cold War"],
                "label": "SA-10 S-300PS 40B6MD sr",
                "shortLabel": "S-300PS 40B6MD sr",
                "range": "Long",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "Search Radar",
                            "quantity": 1,
                            "effectiveAgainst": "None"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "55G6 EWR": {
                "name": "55G6 EWR",
                "era": ["Early Cold War"],
                "label": "55G6 EWR",
                "shortLabel": "55G6 EWR",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "Early Warning Radar",
                            "quantity": 1,
                            "effectiveAgainst": "None"
                            }
                        ],
                        "roles": [
                            "Radar"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "S-300PS 64H6E sr": {
                "name": "S-300PS 64H6E sr",
                "era": ["Late Cold War"],
                "label": "SA-10 S-300PS 64H6E sr",
                "shortLabel": "S-300PS 64H6E sr",
                "range": "Long",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "Search Radar",
                            "quantity": 1,
                            "effectiveAgainst": "None"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "SA-11 Buk SR 9S18M1": {
                "name": "SA-11 Buk SR 9S18M1",
                "era": ["Mid Cold War"],
                "label": "SA-11 Buk SR 9S18M1",
                "shortLabel": "SA-11 Buk SR 9S18M1",
                "range": "Long",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "Search Radar",
                            "quantity": 1,
                            "effectiveAgainst": "None"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Dog Ear radar": {
                "name": "Dog Ear radar",
                "era": ["Mid Cold War"],
                "label": "Dog Ear radar",
                "shortLabel": "Dog Ear radar",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "Search Radar",
                            "quantity": 1,
                            "effectiveAgainst": "None"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Hawk tr": {
                "name": "Hawk tr",
                "era": ["Early Cold War"],
                "label": "Hawk tr",
                "shortLabel": "Hawk tr",
                "range": "Medium",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "Track Radar",
                            "quantity": 1,
                            "effectiveAgainst": "None"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Hawk sr": {
                "name": "Hawk sr",
                "era": ["Early Cold War"],
                "label": "Hawk sr",
                "shortLabel": "Hawk sr",
                "range": "Long",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "Search Radar",
                            "quantity": 1,
                            "effectiveAgainst": "None"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Patriot str": {
                "name": "Patriot str",
                "era": ["Late Cold War"],
                "label": "Patriot str",
                "shortLabel": "Patriot str",
                "range": "Medium",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "Search and Track Radar",
                            "quantity": 1,
                            "effectiveAgainst": "None"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Hawk cwar": {
                "name": "Hawk cwar",
                "era": ["Early Cold War"],
                "label": "Hawk cwar",
                "shortLabel": "Hawk cwar",
                "range": "Long",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "Search and Track Radar",
                            "quantity": 1,
                            "effectiveAgainst": "None"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "p-19 s-125 sr": {
                "name": "p-19 s-125 sr",
                "era": ["Mid Cold War"],
                "label": "SA-3 p-19 s-125 sr",
                "shortLabel": "p-19 s-125 sr",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "Search Radar",
                            "quantity": 1,
                            "effectiveAgainst": "None"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Roland Radar": {
                "name": "Roland Radar",
                "era": ["Mid Cold War"],
                "label": "Roland Radar",
                "shortLabel": "Roland Radar",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "Search Radar",
                            "quantity": 1,
                            "effectiveAgainst": "None"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "snr s-125 tr": {
                "name": "snr s-125 tr",
                "era": ["Early Cold War"],
                "label": "SA-3 snr s-125 tr",
                "shortLabel": "snr s-125 tr",
                "range": "Medium",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "Track Radar",
                            "quantity": 1,
                            "effectiveAgainst": "None"
                            }
                        ],
                        "roles": [
                            "SAM"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "house1arm": {
                "name": "house1arm",
                "label": "house1arm",
                "shortLabel": "house1arm",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Structure"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "house2arm": {
                "name": "house2arm",
                "label": "house2arm",
                "shortLabel": "house2arm",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Structure"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "outpost_road": {
                "name": "outpost_road",
                "label": "outpost_road",
                "shortLabel": "outpost_road",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Structure"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "outpost": {
                "name": "outpost",
                "label": "outpost",
                "shortLabel": "outpost",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Structure"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "houseA_arm": {
                "name": "houseA_arm",
                "label": "houseA_arm",
                "shortLabel": "houseA_arm",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Structure"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Challenger2": {
                "name": "Challenger2",
                "era": ["Modern"],
                "label": "Challenger2",
                "shortLabel": "Challenger2",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "120mm L30A1 Gun",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Hard)"
                            },
                            {
                            "name": "7.62mm L94A1 GPMG",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            },
                            {
                            "name": "7.62mm L37A2 GPMG",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            }
                        ],
                        "roles": [
                            "Tank"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Leclerc": {
                "name": "Leclerc",
                "era": ["Modern"],
                "label": "Leclerc",
                "shortLabel": "Leclerc",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "120mm F1 Gun",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Hard)"
                            },
                            {
                            "name": "12.7mm M2HB HMG",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            }
                        ],
                        "roles": [
                            "Tank"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Leopard1A3": {
                "name": "Leopard1A3",
                "era": ["Mid Cold War"],
                "label": "Leopard1A3",
                "shortLabel": "Leopard1A3",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "105mm L7A3 Gun",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Hard)"
                            },
                            {
                            "name": "7.62mm MG3 GPMG",
                            "quantity": 2,
                            "effectiveAgainst": "Surface (Soft)"
                            }
                        ],
                        "roles": [
                            "Tank"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Leopard-2": {
                "name": "Leopard-2",
                "era": ["Late Cold War"],
                "label": "Leopard-2",
                "shortLabel": "Leopard-2",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "120mm Rh L/44 Gun",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Hard)"
                            },
                            {
                            "name": "7.62mm MG3 GPMG",
                            "quantity": 2,
                            "effectiveAgainst": "Surface (Soft)"
                            }
                        ],
                        "roles": [
                            "Tank"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "M-60": {
                "name": "M-60",
                "era": ["Early Cold War"],
                "label": "M-60",
                "shortLabel": "M-60",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "105mm M68 Gun",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Hard)"
                            },
                            {
                            "name": "7.62mm M73 GPMG",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            },
                            {
                            "name": "12.7mm M85 HMG",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            }
                        ],
                        "roles": [
                            "Tank"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "M1128 Stryker MGS": {
                "name": "M1128 Stryker MGS",
                "era": ["Modern"],
                "label": "M1128 Stryker MGS",
                "shortLabel": "M1128 Stryker MGS",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "105mm M68 Gun",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Hard)"
                            },
                            {
                            "name": "7.62mm M240 GPMG",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            }
                        ],
                        "roles": [
                            "SPG"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "M-1 Abrams": {
                "name": "M-1 Abrams",
                "era": ["Late Cold War"],
                "label": "M-1 Abrams",
                "shortLabel": "M-1 Abrams",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "120mm Rh L/44 Gun",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Hard)"
                            },
                            {
                            "name": "7.62mm M240 GPMG",
                            "quantity": 2,
                            "effectiveAgainst": "Surface (Soft)"
                            },
                            {
                            "name": "12.7mm M2 HMG",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            }
                        ],
                        "roles": [
                            "Tank"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "T-55": {
                "name": "T-55",
                "era": ["Early Cold War"],
                "label": "T-55",
                "shortLabel": "T-55",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "100mm D-10T Gun",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Hard)"
                            },
                            {
                            "name": "7.62mm SGMT GPMG",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            },
                            {
                            "name": "12.7mm DShK HMG",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            }
                        ],
                        "roles": [
                            "Tank"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "T-72B": {
                "name": "T-72B",
                "era": ["Mid Cold War"],
                "label": "T-72B",
                "shortLabel": "T-72B",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "125mm 2A46M Gun",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Hard)"
                            },
                            {
                            "name": "7.62mm PKT GPMG",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            },
                            {
                            "name": "12.7mm NSVT HMG",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            }
                        ],
                        "roles": [
                            "Tank"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "T-80UD": {
                "name": "T-80UD",
                "era": ["Mid Cold War"],
                "label": "T-80UD",
                "shortLabel": "T-80UD",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "125mm 2A46M Gun",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Hard)"
                            },
                            {
                            "name": "7.62mm PKT GPMG",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            },
                            {
                            "name": "12.7mm NSVT HMG",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            }
                        ],
                        "roles": [
                            "Tank"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "T-90": {
                "name": "T-90",
                "era": ["Late Cold War"],
                "label": "T-90",
                "shortLabel": "T-90",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                            "name": "125mm 2A46M-5 Gun",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Hard)"
                            },
                            {
                            "name": "7.62mm PKT GPMG",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            },
                            {
                            "name": "12.7mm NSVT HMG",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Soft)"
                            },
                             {
                            "name": "9K119M ATGM",
                            "quantity": 1,
                            "effectiveAgainst": "Surface (Hard)"
                            }
                        ],
                        "roles": [
                            "Tank"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Ural-4320 APA-5D": {
                "name": "Ural-4320 APA-5D",
                "era": ["Early Cold War"],
                "label": "Ural-4320 APA-5D",
                "shortLabel": "Ural-4320 APA-5D",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Unarmed"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "ATMZ-5": {
                "name": "ATMZ-5",
                "era": ["Early Cold War"],
                "label": "ATMZ-5",
                "shortLabel": "ATMZ-5",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Unarmed"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "ATZ-10": {
                "name": "ATZ-10",
                "era": ["Early Cold War"],
                "label": "ATZ-10",
                "shortLabel": "ATZ-10",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Unarmed"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "GAZ-3307": {
                "name": "GAZ-3307",
                "era": ["Early Cold War"],
                "label": "GAZ-3307",
                "shortLabel": "GAZ-3307",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Unarmed"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "GAZ-3308": {
                "name": "GAZ-3308",
                "era": ["Early Cold War"],
                "label": "GAZ-3308",
                "shortLabel": "GAZ-3308",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Unarmed"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "GAZ-66": {
                "name": "GAZ-66",
                "era": ["Early Cold War"],
                "label": "GAZ-66",
                "shortLabel": "GAZ-66",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Unarmed"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "M978 HEMTT Tanker": {
                "name": "M978 HEMTT Tanker",
                "era": ["Mid Cold War"],
                "label": "M978 HEMTT Tanker",
                "shortLabel": "M978 HEMTT Tanker",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Unarmed"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "HEMTT TFFT": {
                "name": "HEMTT TFFT",
                "era": ["Late Cold War"],
                "label": "HEMTT TFFT",
                "shortLabel": "HEMTT TFFT",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Unarmed"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "IKARUS Bus": {
                "name": "IKARUS Bus",
                "era": ["Mid Cold War"],
                "label": "IKARUS Bus",
                "shortLabel": "IKARUS Bus",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Unarmed"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "KAMAZ Truck": {
                "name": "KAMAZ Truck",
                "era": ["Mid Cold War"],
                "label": "KAMAZ Truck",
                "shortLabel": "KAMAZ Truck",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Unarmed"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "LAZ Bus": {
                "name": "LAZ Bus",
                "era": ["Early Cold War"],
                "label": "LAZ Bus",
                "shortLabel": "LAZ Bus",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Unarmed"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Hummer": {
                "name": "Hummer",
                "era": ["Mid Cold War"],
                "label": "Hummer",
                "shortLabel": "Hummer",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Unarmed"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "M 818": {
                "name": "M 818",
                "era": ["Early Cold War"],
                "label": "M 818",
                "shortLabel": "M 818",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Unarmed"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "MAZ-6303": {
                "name": "MAZ-6303",
                "era": ["Mid Cold War"],
                "label": "MAZ-6303",
                "shortLabel": "MAZ-6303",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Unarmed"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Predator GCS": {
                "name": "Predator GCS",
                "era": ["Late Cold War"],
                "label": "Predator GCS",
                "shortLabel": "Predator GCS",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Unarmed"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Predator TrojanSpirit": {
                "name": "Predator TrojanSpirit",
                "era": ["Late Cold War"],
                "label": "Predator TrojanSpirit",
                "shortLabel": "Predator TrojanSpirit",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Unarmed"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Suidae": {
                "name": "Suidae",
                "era": ["Late Cold War"],
                "label": "Suidae",
                "shortLabel": "Suidae",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Unarmed"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Tigr_233036": {
                "name": "Tigr_233036",
                "era": ["Late Cold War"],
                "label": "Tigr_233036",
                "shortLabel": "Tigr_233036",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Unarmed"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Trolley bus": {
                "name": "Trolley bus",
                "era": ["Late Cold War"],
                "label": "Trolley bus",
                "shortLabel": "Trolley bus",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Unarmed"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "UAZ-469": {
                "name": "UAZ-469",
                "era": ["Mid Cold War"],
                "label": "UAZ-469",
                "shortLabel": "UAZ-469",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Unarmed"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Ural ATsP-6": {
                "name": "Ural ATsP-6",
                "era": ["Mid Cold War"],
                "label": "Ural ATsP-6",
                "shortLabel": "Ural ATsP-6",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Unarmed"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Ural-375 PBU": {
                "name": "Ural-375 PBU",
                "era": ["Mid Cold War"],
                "label": "Ural-375 PBU",
                "shortLabel": "Ural-375 PBU",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Unarmed"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Ural-375": {
                "name": "Ural-375",
                "era": ["Mid Cold War"],
                "label": "Ural-375",
                "shortLabel": "Ural-375",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Unarmed"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Ural-4320-31": {
                "name": "Ural-4320-31",
                "era": ["Late Cold War"],
                "label": "Ural-4320-31",
                "shortLabel": "Ural-4320-31",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Unarmed"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "Ural-4320T": {
                "name": "Ural-4320T",
                "era": ["Late Cold War"],
                "label": "Ural-4320T",
                "shortLabel": "Ural-4320T",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Unarmed"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "VAZ Car": {
                "name": "VAZ Car",
                "era": ["Early Cold War"],
                "label": "VAZ Car",
                "shortLabel": "VAZ Car",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Unarmed"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "ZiL-131 APA-80": {
                "name": "ZiL-131 APA-80",
                "era": ["Early Cold War"],
                "label": "ZiL-131 APA-80",
                "shortLabel": "ZiL-131 APA-80",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Unarmed"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "SKP-11": {
                "name": "SKP-11",
                "era": ["Early Cold War"],
                "label": "SKP-11",
                "shortLabel": "SKP-11",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Unarmed"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "ZIL-131 KUNG": {
                "name": "ZIL-131 KUNG",
                "era": ["Early Cold War"],
                "label": "ZIL-131 KUNG",
                "shortLabel": "ZIL-131 KUNG",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Unarmed"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            },
            "ZIL-4331": {
                "name": "ZIL-4331",
                "era": ["Early Cold War"],
                "label": "ZIL-4331",
                "shortLabel": "ZIL-4331",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Unarmed"
                        ],
                        "code": "",
                        "name": "Default"
                    }
                ],
                "filename": ""
            }
        }
    }
}

export var groundUnitsDatabase = new GroundUnitsDatabase();
