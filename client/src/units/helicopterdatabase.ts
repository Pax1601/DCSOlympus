import { getMissionHandler } from "..";
import { GAME_MASTER } from "../constants/constants";
import { UnitDatabase } from "./unitdatabase"

export class HelicopterDatabase extends UnitDatabase {
    constructor() {
        super();
        
        this.blueprints = {
            "AH-64D_BLK_II": {
                "name": "AH-64D_BLK_II",
                "coalition": "blue",
                "era": "Modern",
                "label": "AH-64D Apache",
                "shortLabel": "AH64",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                                "name": "AGM-114k Hellfire",
                                "quantity": 8
                            },
                            {
                                "name": "M151 Rocket Pod",
                                "quantity": 2
                            }
                        ],
                        "roles": [
                            "CAS"
                        ],
                        "code": "2 * M261: M151 (6PD), 2 * Hellfire station: 4*AGM-114K",
                        "name": "Gun / ATGM / Rocket"
                    },
                    {
                        "fuel": 1,
                        "items": [
                            {
                                "name": "AGM-114K Hellfire",
                                "quantity": 16
                            }
                        ],
                        "roles": [
                            "CAS"
                        ],
                        "code": "4 * Hellfire station: 4*AGM-114K",
                        "name": "Gun / ATGM"
                    },
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            ""
                        ],
                        "code": "",
                        "name": "Empty Loadout"
                    }
                ],
                "filename": "ah-64.png"
            },
            "Ka-50_3": {
                "name": "Ka-50_3",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "Ka-50 Hokum A",
                "shortLabel": "K50",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                                "name": "Igla",
                                "quantity": 4
                            }
                        ],
                        "roles": [
                            "CAP"
                        ],
                        "code": "4xIgla",
                        "name": "Gun / Fox 2"
                    },
                    {
                        "fuel": 1,
                        "items": [
                            {
                                "name": "Igla",
                                "quantity": 4
                            },
                            {
                                "name": "S-13",
                                "quantity": 10
                            },
                            {
                                "name": "Kh-25ML",
                                "quantity": 2
                            }
                        ],
                        "roles": [
                            "Anti-Ship"
                        ],
                        "code": "2xKh-25ML, 10xS-13, 4xIgla",
                        "name": "Gun / ASM / Rockets / Fox 2"
                    },
                    {
                        "fuel": 1,
                        "items": [
                            {
                                "name": "Igla",
                                "quantity": 4
                            },
                            {
                                "name": "S-80FP",
                                "quantity": 40
                            },
                            {
                                "name": "Vikhr-M",
                                "quantity": 12
                            }
                        ],
                        "roles": [
                            "CAS"
                        ],
                        "code": "12x9A4172, 40xS-8OFP, 4xIgla",
                        "name": "Gun / ATGM / Rockets / Fox 2"
                    },
                    {
                        "fuel": 1,
                        "items": [
                            {
                                "name": "Igla",
                                "quantity": 4
                            },
                            {
                                "name": "S-80FP",
                                "quantity": 40
                            },
                            {
                                "name": "Vikhr-M",
                                "quantity": 12
                            }
                        ],
                        "roles": [
                            "CAS"
                        ],
                        "code": "12x9A4172, 40xS-8OFP, 4xIgla",
                        "name": "Gun / ATGM"
                    },
                    {
                        "fuel": 1,
                        "items": [
                            {
                                "name": "Igla",
                                "quantity": 4
                            },
                            {
                                "name": "FAB-500",
                                "quantity": 2
                            },
                            {
                                "name": "S-13",
                                "quantity": 10
                            }
                        ],
                        "roles": [
                            "Strike"
                        ],
                        "code": "10xS-13, 2xFAB-500, 4xIgla",
                        "name": "Gun / Bombs / Rockets / Fox 2"
                    },
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            ""
                        ],
                        "code": "",
                        "name": "Empty Loadout"
                    }
                ],
                "filename": "ka-50.png"
            },
            "Mi-24P": {
                "name": "Mi-24P",
                "coalition": "red",
                "era": "Mid Cold War",
                "label": "Mi-24P Hind",
                "shortLabel": "Mi24",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                                "name": "S-8KOM",
                                "quantity": 40
                            },
                            {
                                "name": "9M114 ATGM",
                                "quantity": 8
                            }
                        ],
                        "roles": [
                            "CAS"
                        ],
                        "code": "2xB8V20 (S-8KOM)+8xATGM 9M114",
                        "name": "Gun / ATGM / Rockets"
                    },
                    {
                        "fuel": 1,
                        "items": [
                            {
                                "name": "S-24B",
                                "quantity": 4
                            },
                            {
                                "name": "9M114 ATGM",
                                "quantity": 4
                            }
                        ],
                        "roles": [
                            "Strike"
                        ],
                        "code": "4xS-24B+4xATGM 9M114",
                        "name": "Gun / ATGM / Rockets"
                    },
                    {
                        "fuel": 1,
                        "items": [
                            {
                                "name": "GUV-1 Grenade Launcher",
                                "quantity": 4
                            },
                            {
                                "name": "9M114 ATGM",
                                "quantity": 4
                            }
                        ],
                        "roles": [
                            "CAS"
                        ],
                        "code": "4xGUV-1 AP30+4xATGM 9M114",
                        "name": "Gun / ATGM / Grenade Launcher"
                    },
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            ""
                        ],
                        "code": "",
                        "name": "Empty Loadout"
                    }
                ],
                "filename": "mi-24.png"
            },
            "SA342L": {
                "name": "SA342L",
                "coalition": "blue",
                "era": "Mid Cold War",
                "label": "SA342L Gazelle",
                "shortLabel": "342",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                                "name": "20mm Cannon",
                                "quantity": 1
                            },
                            {
                                "name": "SNEB68",
                                "quantity": 8
                            }
                        ],
                        "roles": [
                            "Recon"
                        ],
                        "code": "M621, 8xSNEB68 EAP",
                        "name": "Gun / ATGM / Rockets"
                    }
                ],
                "filename": "sa-342.png"
            },
            "SA342M": {
                "name": "SA342M",
                "coalition": "blue",
                "era": "Mid Cold War",
                "label": "SA342M Gazelle",
                "shortLabel": "342",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                                "name": "HOT3",
                                "quantity": 4
                            }
                        ],
                        "roles": [
                            "CAS"
                        ],
                        "code": "HOT3x4",
                        "name": "ATGM"
                    }
                ],
                "filename": "sa-342.png"
            },
            "SA342Mistral": {
                "name": "SA342Mistral",
                "coalition": "blue",
                "era": "Mid Cold War",
                "label": "SA342Mistral Gazelle",
                "shortLabel": "342",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                                "name": "Mistral",
                                "quantity": 4
                            }
                        ],
                        "roles": [
                            "CAP"
                        ],
                        "code": "Mistral x 4",
                        "name": "Fox 2"
                    },
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            ""
                        ],
                        "code": "",
                        "name": "Empty Loadout"
                    }
                ],
                "filename": "sa-342.png"
            },
            "AH-1W": {
                "name": "AH-1W",
                "coalition": "blue",
                "era": "Mid Cold War",
                "label": "AH-1W Cobra",
                "shortLabel": "AH1",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                                "name": "BGM-71 TOW",
                                "quantity": 8
                            },
                            {
                                "name": "Hydra-70 WP",
                                "quantity": 38
                            }
                        ],
                        "roles": [
                            "CAS"
                        ],
                        "code": "8xBGM-71, 38xHYDRA-70 WP",
                        "name": "TOW / Hydra"
                    },
                    {
                        "fuel": 1,
                        "items": [
                            {
                                "name": "Hydra-70",
                                "quantity": 76
                            }
                        ],
                        "roles": [
                            "CAS"
                        ],
                        "code": "76xHYDRA-70",
                        "name": "Hydra"
                    },
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            ""
                        ],
                        "code": "",
                        "name": "Empty Loadout"
                    }
                ],
                "filename": "ah-1.png"
            },
            "Mi-26": {
                "name": "Mi-26",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "Mi-26 Halo",
                "shortLabel": "M26",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Transport"
                        ],
                        "code": "",
                        "name": "Empty Loadout"
                    }
                ],
                "filename": "mi-26.png"
            },
            "Mi-28N": {
                "name": "Mi-28N",
                "coalition": "red",
                "era": "Modern",
                "label": "Mi-28N Havoc",
                "shortLabel": "M28",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                                "name": "9M114 Shturm",
                                "quantity": 16
                            },
                            {
                                "name": "S-8",
                                "quantity": 40
                            }
                        ],
                        "roles": [
                            "CAS"
                        ],
                        "code": "16x9M114, 40xS-8",
                        "name": "ATGM / S-8"
                    },
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            ""
                        ],
                        "code": "",
                        "name": "Empty Loadout"
                    }
                ],
                "filename": "mi-28.png"
            },
            "Mi-8MT": {
                "name": "Mi-8MT",
                "coalition": "red",
                "era": "Mid Cold War",
                "label": "Mi-8MT Hip",
                "shortLabel": "Mi8",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                                "name": "UPK",
                                "quantity": 2
                            },
                            {
                                "name": "B8",
                                "quantity": 2
                            }
                        ],
                        "roles": [
                            "CAS"
                        ],
                        "code": "2 x UPK +2 x B8",
                        "name": "Rockets / Gunpods"
                    },
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Transport"
                        ],
                        "code": "",
                        "name": "Empty Loadout"
                    }
                ],
                "filename": "mi-8.png"
            },
            "SH-60B": {
                "name": "SH-60B",
                "coalition": "blue",
                "era": "Mid Cold War",
                "label": "SH-60B Seahawk",
                "shortLabel": "S60",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                                "name": "AGM-119 ASM",
                                "quantity": 1
                            }
                        ],
                        "roles": [
                            "CAS"
                        ],
                        "code": "AGM-119",
                        "name": "ASM"
                    },
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Transport"
                        ],
                        "code": "",
                        "name": "Empty Loadout"
                    }
                ],
                "filename": "uh-60.png"
            },
            "UH-60A": {
                "name": "UH-60A",
                "coalition": "blue",
                "era": "Mid Cold War",
                "label": "UH-60A Blackhawk",
                "shortLabel": "U60",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [

                        ],
                        "roles": [
                            "Transport"
                        ],
                        "code": "",
                        "name": "Empty Loadout"
                    }
                ],
                "filename": "uh-60.png"
            },
            "UH-1H": {
                "name": "UH-1H",
                "coalition": "blue",
                "era": "Early Cold War",
                "label": "UH-1H Huey",
                "shortLabel": "UH1",
                "loadouts": [
                    {
                        "fuel": 1,
                        "items": [
                            {
                                "name": "M134 Minigun",
                                "quantity": 2
                            },
                            {
                                "name": "XM-158",
                                "quantity": 2
                            }
                        ],
                        "roles": [
                            "CAS"
                        ],
                        "code": "M134 Minigun*2, XM158*2",
                        "name": "Miniguns / XM158"
                    },
                    {
                        "fuel": 1,
                        "items": [
                        ],
                        "roles": [
                            "Transport"
                        ],
                        "code": "",
                        "name": "Empty Loadout"
                    }
                ],
                "filename": "uh-1.png"
            }
        }
    }

    getSpawnPointsByName(name: string) {
        if (getMissionHandler().getCommandModeOptions().commandMode == GAME_MASTER || !getMissionHandler().getCommandModeOptions().restrictSpawns) 
            return 0;

        const blueprint = this.getByName(name);
        if (blueprint?.era == "WW2")
            return 20;
        else if (blueprint?.era == "Early Cold War")
            return 50;
        else if (blueprint?.era == "Mid Cold War")
            return 100;
        else if (blueprint?.era == "Late Cold War")
            return 200;
        else if (blueprint?.era == "Modern")
            return 400;
        return 0;
    }

	getCategory() {
		return "Helicopter";
	}
}

export var helicopterDatabase = new HelicopterDatabase();

