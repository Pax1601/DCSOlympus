import { getUnitsManager } from "..";
import { GAME_MASTER } from "../constants/constants";
import { UnitDatabase } from "./unitdatabase"

export class NavyUnitDatabase extends UnitDatabase {
    constructor() {
        super();
        
        this.blueprints = {
            "Type_052B": {
                "name": "Type_052B",
                "coalition": "red",
                "type": "Destroyer",
                "era": "Modern",
                "label": "052B DDG-168 Guangzhou",
                "shortLabel": "Type 52B",
                "range": "Short",
                "filename": ""
            },
            "Type_052C": {
                "name": "Type_052C",
                "coalition": "red",
                "type": "Destroyer",
                "era": "Modern",
                "label": "052C DDG-171 Haikou",
                "shortLabel": "Type 52C",
                "range": "Short",
                "filename": ""
            },
            "Type_054A": {
                "name": "",
                "coalition": "red",
                "type": "Frigate",
                "era": "Modern",
                "label": "054A FFG-538 Yantai",
                "shortLabel": "Type 54A",
                "range": "Medium",
                "filename": ""
            },
            "Type_071": {
                "name": "Type_071",
                "coalition": "red",
                "type": "Transport",
                "era": "Modern",
                "label": "Type 071",
                "shortLabel": "Type 071",
                "range": "",
                "filename": ""
            },
            "Type_093": {
                "name": "Type_093",
                "coalition": "red",
                "type": "Submarine",
                "era": "Modern",
                "label": "Type 093",
                "shortLabel": "Type 093",
                "range": "",
                "filename": ""
            },
            "santafe": {
                "name": "santafe",
                "coalition": "",
                "type": "Submarine",
                "era": "Early Cold War",
                "label": "ARA Santa Fe S-21",
                "shortLabel": "ARA Santa",
                "range": "",
                "filename": ""
            },
            "ara_vdm": {
                "name": "ara_vdm",
                "coalition": "",
                "type": "Aircraft Carrier",
                "era": "Mid Cold War",
                "label": "ARA Vienticinco de Mayo",
                "shortLabel": "ARA Vienticinco de Mayo",
                "range": "",
                "filename": ""
            },
            "kuznecow": {
                "name": "kuznecow",
                "coalition": "red",
                "type": "Aircraft Carrier",
                "era": "Late Cold War",
                "label": "Admiral Kuznetsov",
                "shortLabel": "Admiral Kuznetsov",
                "range": "Medium",
                "filename": ""
            },
            "albatros": {
                "name": "albatros",
                "coalition": "red",
                "type": "Aircraft Carrier",
                "era": "Early Cold War",
                "label": "Albatros (Grisha-5)",
                "shortLabel": "Albatros",
                "range": "",
                "filename": ""
            },
            "leander-gun-condell": {
                "name": "leander-gun-condell",
                "coalition": "",
                "type": "Frigate",
                "era": "Mid Cold War",
                "label": "Almirante Condell PFG-06",
                "shortLabel": "Almirante Condell",
                "range": "",
                "filename": ""
            },
            "Boat Armed Hi-Speed": {
                "name": "Boat Armed Hi-Speed",
                "coalition": "",
                "type": "Fast Attack Craft",
                "era": "Mid Cold War",
                "label": "Boat Armed Hi-Speed",
                "shortLabel": "Boat Armed Hi-Speed",
                "range": "",
                "filename": ""
            },
            "HandyWind": {
                "name": "HandyWind",
                "coalition": "blue",
                "type": "Cargoship",
                "era": "Late Cold War",
                "label": "Bulker Handy Wind",
                "shortLabel": "Bulker Handy Wind",
                "range": "",
                "filename": ""
            },
            "CV_1143_5": {
                "name": "CV_1143_5",
                "coalition": "red",
                "type": "Aircraft Carrier",
                "era": "Modern",
                "label": "CV Admiral Kuznetsov(2017)",
                "shortLabel": "Admiral Kuznetsov(2017)",
                "range": "Medium",
                "filename": ""
            },
            "CV_59": {
                "name": "CV_59",
                "coalition": "blue",
                "type": "Aircraft Carrier",
                "era": "Early Cold War",
                "label": "CV-59 Forrestal",
                "shortLabel": "CV-59",
                "range": "Short",
                "filename": ""
            },
            "CVN_71": {
                "name": "CVN_71",
                "coalition": "blue",
                "type": "Super Aircraft Carrier",
                "era": "Late Cold War",
                "label": "CVN-71 Theodore Roosevelt",
                "shortLabel": "CVN-71",
                "range": "Short",
                "filename": ""
            },
            "CVN_72": {
                "name": "CVN_72",
                "coalition": "blue",
                "type": "Super Aircraft Carrier",
                "era": "Late Cold War",
                "label": "CVN-72 Abraham Lincoln",
                "shortLabel": "CVN-72",
                "range": "Short",
                "filename": ""
            },
            "CVN_73": {
                "name": "CVN_73",
                "coalition": "blue",
                "type": "Super Aircraft Carrier",
                "era": "Late Cold War",
                "label": "CVN-73 George Washington",
                "shortLabel": "CVN-73",
                "range": "Medium",
                "filename": ""
            },
            "Stennis": {
                "name": "Stennis",
                "coalition": "blue",
                "type": "Aircraft Carrier",
                "era": "Late Cold War",
                "label": "CVN-74 John C. Stennis",
                "shortLabel": "CVN-74",
                "range": "Medium",
                "filename": ""
            },
            "CVN_75": {
                "name": "CVN_75",
                "coalition": "blue",
                "type": "Aircraft Carrier",
                "era": "Late Cold War",
                "label": "CVN-75 Harry S. Truman",
                "shortLabel": "CVN-75",
                "range": "Medium",
                "filename": ""
            },
            "CastleClass_01": {
                "name": "CastleClass_01",
                "coalition": "blue",
                "type": "Patrol",
                "era": "Mid Cold War",
                "label": "HMS Leeds Castle (P-258)",
                "shortLabel": "HMS Leeds Castle (P-258)",
                "range": "",
                "filename": ""
            },
            "USS_Arleigh_Burke_IIa": {
                "name": "USS_Arleigh_Burke_IIa",
                "coalition": "blue",
                "type": "Destroyer",
                "era": "Late Cold War",
                "label": "DDG Arleigh Burke lla",
                "shortLabel": "DDG Arleigh Burke",
                "range": "Medium",
                "filename": ""
            },
            "barge-1": {
                "name": "barge-1",
                "coalition": "red",
                "type": "Cargoship",
                "era": "Late Cold War",
                "label": "Dry cargo ship Ivanov",
                "shortLabel": "Dry cargo ship Ivanov",
                "range": "",
                "filename": ""
            },
            "barge-2": {
                "name": "barge-2",
                "coalition": "red",
                "type": "Cargoship",
                "era": "Late Cold War",
                "label": "Dry cargo ship Yakushev",
                "shortLabel": "Dry cargo ship Yakushev",
                "range": "",
                "filename": ""
            },
            "elnya": {
                "name": "elnya",
                "coalition": "red",
                "type": "Tanker",
                "era": "Late Cold War",
                "label": "Elnya tanker",
                "shortLabel": "Elnya tanker",
                "range": "",
                "filename": ""
            },
            "La_Combattante_II": {
                "name": "La_Combattante_II",
                "coalition": "blue",
                "type": "Fast Attack Craft",
                "era": "Mid Cold War",
                "label": "FAC La Combattante lla",
                "shortLabel": "FAC La Combattante",
                "range": "",
                "filename": ""
            },
            "leander-gun-achilles": {
                "name": "leander-gun-achilles",
                "coalition": "blue",
                "type": "Frigate",
                "era": "Mid Cold War",
                "label": "HMS Achilles (F12)",
                "shortLabel": "HMS Achilles",
                "range": "",
                "filename": ""
            },
            "leander-gun-andromeda": {
                "name": "leander-gun-andromeda",
                "coalition": "blue",
                "type": "Frigate",
                "era": "Mid Cold War",
                "label": "HMS Andromeda (F57)",
                "shortLabel": "HMS Andromeda",
                "range": "",
                "filename": ""
            },
            "leander-gun-ariadne": {
                "name": "leander-gun-ariadne",
                "coalition": "blue",
                "type": "Frigate",
                "era": "Mid Cold War",
                "label": "HMS Ariadne (F72)",
                "shortLabel": "HMS Ariadne",
                "range": "",
                "filename": ""
            },
            "leander-gun-lynch": {
                "name": "leander-gun-lynch",
                "coalition": "",
                "type": "Frigate",
                "era": "Mid Cold War",
                "label": "CNS Almirante Lynch (PFG-07)",
                "shortLabel": "CNS Almirante Lynch",
                "range": "",
                "filename": ""
            },
            "hms_invincible": {
                "name": "hms_invincible",
                "coalition": "blue",
                "type": "Aircraft Carrier",
                "era": "Mid Cold War",
                "label": "HMS Invincible (R05)",
                "shortLabel": "HMS Invincible",
                "range": "",
                "filename": ""
            },
            "HarborTug": {
                "name": "HarborTug",
                "coalition": "",
                "type": "Tug",
                "era": "Mid Cold War",
                "label": "Harbor Tug",
                "shortLabel": "Harbor Tug",
                "range": "",
                "filename": ""
            },
            "kilo_636": {
                "name": "kilo_636",
                "coalition": "red",
                "type": "Submarine",
                "era": "Late Cold War",
                "label": "Project 636 Varshavyanka Improved",
                "shortLabel": "Varshavyanka Improved",
                "range": "Medium",
                "filename": ""
            },
            "kilo": {
                "name": "kilo",
                "coalition": "red",
                "type": "Submarine",
                "era": "Late Cold War",
                "label": "Project 636 Varshavyanka Basic",
                "shortLabel": "Varshavyanka Basic",
                "range": "Medium",
                "filename": ""
            },
            "LHA_Tarawa": {
                "name": "LHA_Tarawa",
                "coalition": "blue",
                "type": "Aircraft Carrier",
                "era": "Mid Cold War",
                "label": "LHA-1 Tarawa",
                "shortLabel": "LHA-1 Tarawa",
                "range": "Short",
                "filename": ""
            },
            "BDK-775": {
                "name": "BDK-775",
                "coalition": "blue",
                "type": "Landing Craft",
                "era": "Mid Cold War",
                "label": "LS Ropucha",
                "shortLabel": "LS Ropucha",
                "range": "",
                "filename": ""
            },
            "molniya": {
                "name": "molniya",
                "coalition": "",
                "type": "Fast Attack Craft",
                "era": "Late Cold War",
                "label": "Molniya (Tarantul-3)",
                "shortLabel": "Molniya",
                "range": "Short",
                "filename": ""
            },
            "moscow": {
                "name": "moscow",
                "coalition": "red",
                "type": "Cruiser",
                "era": "Late Cold War",
                "label": "Moscow",
                "shortLabel": "Moscow",
                "range": "Medium",
                "filename": ""
            },
            "neustrash": {
                "name": "neustrash",
                "coalition": "red",
                "type": "Frigate",
                "era": "Late Cold War",
                "label": "Neustrashimy",
                "shortLabel": "Neustrashimy",
                "range": "Short",
                "filename": ""
            },
            "perry": {
                "name": "perry",
                "coalition": "blue",
                "type": "Frigate",
                "era": "Mid Cold War",
                "label": "Oliver H. Perry",
                "shortLabel": "Oliver H. Perry",
                "range": "Medium",
                "filename": ""
            },
            "piotr_velikiy": {
                "name": "piotr_velikiy",
                "coalition": "red",
                "type": "Cruiser",
                "era": "Late Cold War",
                "label": "Pyotr Velikiy",
                "shortLabel": "Pyotr Velikiy",
                "range": "Medium",
                "filename": ""
            },
            "rezky": {
                "name": "Rezky (Krivak-2)",
                "coalition": "red",
                "type": "Frigate",
                "era": "Early Cold War",
                "label": "Rezky (Krivak-2)",
                "shortLabel": "Rezky",
                "range": "Short",
                "filename": ""
            },
            "Ship_Tilde_Supply": {
                "name": "Ship_Tilde_Supply",
                "coalition": "blue",
                "type": "Transport",
                "era": "Late Cold War",
                "label": "Supply Ship MV Tilde",
                "shortLabel": "Supply Ship Tilde",
                "range": "",
                "filename": ""
            },
            "Seawise_Giant": {
                "name": "Seawise_Giant",
                "coalition": "blue",
                "type": "Tanker",
                "era": "Late Cold War",
                "label": "Tanker Seawise Giant",
                "shortLabel": "Seawise Giant",
                "range": "",
                "filename": ""
            },
            "TICONDEROG": {
                "name": "TICONDEROG",
                "coalition": "blue",
                "type": "Cruiser",
                "era": "Late Cold War",
                "label": "Ticonderoga",
                "shortLabel": "Ticonderoga",
                "range": "Medium",
                "filename": ""
            },
            "zwezdny": {
                "name": "zwezdny",
                "coalition": "",
                "type": "Civilian Boat",
                "era": "Modern",
                "label": "Zwezdny",
                "shortLabel": "Zwezdny",
                "range": "",
                "filename": ""
            }
        }
    }

    getSpawnPointsByName(name: string) {
        if (getUnitsManager().getCommandMode() == GAME_MASTER) 
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
        return "NavyUnit";
    }
}

export var navyUnitDatabase = new NavyUnitDatabase();
