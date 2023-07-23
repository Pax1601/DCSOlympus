import { getMissionHandler} from "..";
import { GAME_MASTER } from "../constants/constants";
import { UnitDatabase } from "./unitdatabase"

export class GroundUnitDatabase extends UnitDatabase {
    constructor() {
        super();
        
        this.blueprints = {
            "SA-2 SAM Battery": {
                "name": "SA-2 SAM Battery",
                "coalition": "red",
                "era": "Early Cold War",
                "label": "SA-2 SAM Battery",
                "shortLabel": "SA-2 SAM Battery",
                "range": "Long",
                "filename": "",
                "type": "SAM Site"
            },
            "SA-3 SAM Battery": {
                "name": "SA-3 SAM Battery",
                "coalition": "red",
                "era": "Early Cold War",
                "label": "SA-3 SAM Battery",
                "shortLabel": "SA-3 SAM Battery",
                "range": "Medium",
                "filename": "",
                "type": "SAM Site"
            },
            "SA-6 SAM Battery": {
                "name": "SA-6 SAM Battery",
                "coalition": "red",
                "era": "Mid Cold War",
                "label": "SA-6 SAM Battery",
                "shortLabel": "SA-6 SAM Battery",
                "range": "Medium",
                "filename": "",
                "type": "SAM Site"
            },
            "SA-10 SAM Battery": {
                "name": "SA-10 SAM Battery",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "SA-10 SAM Battery",
                "shortLabel": "SA-10 SAM Battery",
                "range": "Long",
                "filename": "",
                "type": "SAM Site"
            },
            "SA-11 SAM Battery": {
                "name": "SA-11 SAM Battery",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "SA-11 SAM Battery",
                "shortLabel": "SA-11 SAM Battery",
                "range": "Medium",
                "filename": "",
                "type": "SAM Site"
            },
            "SA-5 SAM Battery": {
                "name": "SA-5 SAM Battery",
                "coalition": "Red",
                "era": "Mid Cold War",
                "label": "SA-5 SAM Battery",
                "shortLabel": "SA-5 SAM Battery",
                "range": "Long",
                "filename": "",
                "type": "SAM Site"
            },
            "Patriot site": {
                "name": "Patriot site",
                "coalition": "blue",
                "era": "Late Cold War",
                "label": "Patriot site",
                "shortLabel": "Patriot site",
                "range": "Long",
                "filename": "",
                "type": "SAM Site"
            },
            "Hawk SAM Battery": {
                "name": "Hawk SAM Battery",
                "coalition": "blue",
                "era": "Early Cold War",
                "label": "Hawk SAM Battery",
                "shortLabel": "Hawk SAM Battery",
                "range": "Medium",
                "filename": "",
                "type": "SAM Site"
            },
            "SNR_75V": {
                "name": "SNR_75V",
                "coalition": "Red",
                "era": "Early Cold War",
                "label": "SA-2 Fan Song",
                "shortLabel": "SNR 75V",
                "filename": "",
                "type": "SAM Track radar"
            },
            "S_75M_Volhov": {
                "name": "S_75M_Volhov",
                "coalition": "Red",
                "era": "Early Cold War",
                "label": "SA-2 Launcher",
                "shortLabel": "S75M Volhov",
                "filename": "",
                "type": "SAM Launcher"
            },
            "2B11 mortar": {
                "name": "2B11 mortar",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "2B11 mortar",
                "shortLabel": "2B11 mortar",
                "filename": "",
                "type": "Gun Artillery"
            },
            "SAU Gvozdika": {
                "name": "SAU Gvozdika",
                "coalition": "red",
                "era": "Mid Cold War",
                "label": "SAU Gvozdika",
                "shortLabel": "SAU Gvozdika",
                "filename": "",
                "type": "Gun Artillery"
            },
            "SAU Msta": {
                "name": "SAU Msta",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "SAU Msta",
                "shortLabel": "SAU Msta",
                "filename": "",
                "type": "Gun Artillery"
            },
            "SAU Akatsia": {
                "name": "SAU Akatsia",
                "coalition": "red",
                "era": "Mid Cold War",
                "label": "SAU Akatsia",
                "shortLabel": "SAU Akatsia",
                "filename": "",
                "type": "Gun Artillery"
            },
            "SAU 2-C9": {
                "name": "SAU 2-C9",
                "coalition": "red",
                "era": "Mid Cold War",
                "label": "SAU Nona",
                "shortLabel": "SAU Nona",
                "filename": "",
                "type": "Gun Artillery"
            },
            "M-109": {
                "name": "M-109",
                "coalition": "blue",
                "era": "Early Cold War",
                "label": "M-109 Paladin",
                "shortLabel": "M-109",
                "filename": "",
                "type": "Gun Artillery"
            },
            "AAV7": {
                "name": "AAV7",
                "coalition": "blue",
                "era": "Mid Cold War",
                "label": "AAV7",
                "shortLabel": "AAV7",
                "filename": "",
                "type": "APC"
            },
            "BMD-1": {
                "name": "BMD-1",
                "coalition": "red",
                "era": "Mid Cold War",
                "label": "BMD-1",
                "shortLabel": "BMD-1",
                "filename": "",
                "type": "IFV"
            },
            "BMP-1": {
                "name": "BMP-1",
                "coalition": "red",
                "era": "Mid Cold War",
                "label": "BMP-1",
                "shortLabel": "BMP-1",
                "filename": "",
                "type": "IFV"
            },
            "BMP-2": {
                "name": "BMP-2",
                "coalition": "red",
                "era": "Mid Cold War",
                "label": "BMP-2",
                "shortLabel": "BMP-2",
                "filename": "",
                "type": "IFV"
            },
            "BMP-3": {
                "name": "BMP-3",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "BMP-3",
                "shortLabel": "BMP-3",
                "filename": "",
                "type": "IFV"
            },
            "Boman": {
                "name": "Boman",
                "coalition": "blue",
                "era": "Late Cold War",
                "label": "Grad Fire Direction Manager",
                "shortLabel": "Boman",
                "filename": "",
                "type": "Reconnaissance"
            },
            "BRDM-2": {
                "name": "BRDM-2",
                "coalition": "red",
                "era": "Early Cold War",
                "label": "BRDM-2",
                "shortLabel": "BRDM-2",
                "filename": "",
                "type": "Reconnaissance"
            },
            "BTR-80": {
                "name": "BTR-80",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "BTR-80",
                "shortLabel": "BTR-80",
                "filename": "",
                "type": "APC"
            },
            "BTR_D": {
                "name": "BTR_D",
                "coalition": "red",
                "era": "Mid Cold War",
                "label": "BTR_D",
                "shortLabel": "BTR_D",
                "filename": "",
                "type": "APC"
            },
            "Bunker": {
                "name": "Bunker",
                "coalition": "",
                "era": "",
                "label": "Bunker",
                "shortLabel": "Bunker",
                "filename": "",
                "type": "Static"
            },
            "Cobra": {
                "name": "Cobra",
                "coalition": "blue",
                "era": "Modern",
                "label": "Otokar Cobra",
                "shortLabel": "Cobra",
                "filename": "",
                "type": "Reconnaissance"
            },
            "LAV-25": {
                "name": "LAV-25",
                "coalition": "blue",
                "era": "Late Cold War",
                "label": "LAV-25",
                "shortLabel": "LAV-25",
                "filename": "",
                "type": "IFV"
            },
            "M1043 HMMWV Armament": {
                "name": "M1043 HMMWV Armament",
                "coalition": "blue",
                "era": "Late Cold War",
                "label": "HMMWV M2 Browning",
                "shortLabel": "HMMWV M2",
                "filename": "",
                "type": "Reconnaissance"
            },
            "M1045 HMMWV TOW": {
                "name": "M1045 HMMWV TOW",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "HMMWV TOW",
                "shortLabel": "HMMWV TOW",
                "filename": "",
                "type": "Reconnaissance"
            },
            "M1126 Stryker ICV": {
                "name": "M1126 Stryker ICV",
                "coalition": "blue",
                "era": "Modern",
                "label": "Stryker MG",
                "shortLabel": "Stryker MG",
                "filename": "",
                "type": "APC"
            },
            "M-113": {
                "name": "M-113",
                "coalition": "blue",
                "era": "Early Cold War",
                "label": "M-113",
                "shortLabel": "M-113",
                "filename": "",
                "type": "APC"
            },
            "M1134 Stryker ATGM": {
                "name": "M1134 Stryker ATGM",
                "coalition": "blue",
                "era": "Modern",
                "label": "Stryker ATGM",
                "shortLabel": "Stryker ATGM",
                "filename": "",
                "type": "IFV"
            },
            "M-2 Bradley": {
                "name": "M-2 Bradley",
                "coalition": "blue",
                "era": "Late Cold War",
                "label": "M-2A2 Bradley",
                "shortLabel": "M-2 Bradley",
                "filename": "",
                "type": "IFV"
            },
            "Marder": {
                "name": "Marder",
                "coalition": "blue",
                "era": "Late Cold War",
                "label": "Marder",
                "shortLabel": "Marder",
                "filename": "",
                "type": "IFV"
            },
            "MCV-80": {
                "name": "MCV-80",
                "coalition": "blue",
                "era": "Late Cold War",
                "label": "Warrior IFV",
                "shortLabel": "Warrior",
                "filename": "",
                "type": "IFV"
            },
            "MTLB": {
                "name": "MTLB",
                "coalition": "red",
                "era": "Mid Cold War",
                "label": "MT-LB",
                "shortLabel": "MT-LB",
                "filename": "",
                "type": "APC"
            },
            "Paratrooper RPG-16": {
                "name": "Paratrooper RPG-16",
                "coalition": "red",
                "era": "Modern",
                "label": "Paratrooper RPG-16",
                "shortLabel": "Paratrooper RPG-16",
                "filename": "",
                "type": "Infantry"
            },
            "Paratrooper AKS-74": {
                "name": "Paratrooper AKS-74",
                "coalition": "red",
                "era": "Modern",
                "label": "Paratrooper AKS-74",
                "shortLabel": "Paratrooper AKS-74",
                "filename": "",
                "type": "Infantry"
            },
            "Sandbox": {
                "name": "Sandbox",
                "coalition": "",
                "era": "",
                "label": "Sandbox",
                "shortLabel": "Sandbox",
                "filename": "",
                "type": "Static"
            },
            "Soldier AK": {
                "name": "Soldier AK",
                "coalition": "red",
                "era": "Early Cold War",
                "label": "Soldier AK",
                "shortLabel": "Soldier AK",
                "filename": "",
                "type": "Infantry"
            },
            "Infantry AK": {
                "name": "Infantry AK",
                "coalition": "red",
                "era": "Mid Cold War",
                "label": "Infantry AK",
                "shortLabel": "Infantry AK",
                "filename": "",
                "type": "Infantry"
            },
            "Soldier M249": {
                "name": "Soldier M249",
                "coalition": "blue",
                "era": "Late Cold War",
                "label": "Soldier M249",
                "shortLabel": "Soldier M249",
                "filename": "",
                "type": "Infantry"
            },
            "Soldier M4": {
                "name": "Soldier M4",
                "coalition": "blue",
                "era": "Mid Cold War",
                "label": "Soldier M4",
                "shortLabel": "Soldier M4",
                "filename": "",
                "type": "Infantry"
            },
            "Soldier M4 GRG": {
                "name": "Soldier M4 GRG",
                "coalition": "blue",
                "era": "Mid Cold War",
                "label": "Soldier M4 GRG",
                "shortLabel": "Soldier M4 GRG",
                "filename": "",
                "type": "Infantry"
            },
            "Soldier RPG": {
                "name": "Soldier RPG",
                "coalition": "red",
                "era": "Mid Cold War",
                "label": "Soldier RPG",
                "shortLabel": "Soldier RPG",
                "filename": "",
                "type": "Infantry"
            },
            "TPZ": {
                "name": "TPZ",
                "coalition": "blue",
                "era": "Late Cold War",
                "label": "TPz Fuchs",
                "shortLabel": "TPz Fuchs",
                "filename": "",
                "type": "APC"
            },
            "Grad-URAL": {
                "name": "Grad-URAL",
                "coalition": "red",
                "era": "Mid Cold War",
                "label": "Grad",
                "shortLabel": "Grad",
                "filename": "",
                "type": "Rocket Artillery"
            },
            "Uragan_BM-27": {
                "name": "Uragan_BM-27",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "Uragan",
                "shortLabel": "Uragan",
                "filename": "",
                "type": "Rocket Artillery"
            },
            "Smerch": {
                "name": "Smerch",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "Smerch",
                "shortLabel": "Smerch",
                "filename": "",
                "type": "Rocket Artillery"
            },
            "MLRS": {
                "name": "MLRS",
                "coalition": "blue",
                "era": "Late Cold War",
                "label": "M270",
                "shortLabel": "M270",
                "filename": "",
                "type": "Rocket Artillery"
            },
            "2S6 Tunguska": {
                "name": "2S6 Tunguska",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "SA-19 Tunguska",
                "shortLabel": "SA-19",
                "range": "Short",
                "filename": "",
                "type": "AAA/SAM"
            },
            "Kub 2P25 ln": {
                "name": "Kub 2P25 ln",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "SA-6 Launcher",
                "shortLabel": "Kub 2P25 ln",
                "range": "Medium",
                "filename": "",
                "type": "SAM Launcher"
            },
            "5p73 s-125 ln": {
                "name": "5p73 s-125 ln",
                "coalition": "red",
                "era": "Early Cold War",
                "label": "SA-3 Launcher",
                "shortLabel": "5p73 s-125 ln",
                "range": "Medium",
                "filename": "",
                "type": "SAM Launcher"
            },
            "S-300PS 5P85C ln": {
                "name": "S-300PS 5P85C ln",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "SA-10 Launcher (5P85C)",
                "shortLabel": "S-300PS 5P85C ln",
                "range": "Long",
                "filename": "",
                "type": "SAM Launcher"
            },
            "S-300PS 5P85D ln": {
                "name": "S-300PS 5P85D ln",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "SA-10 Launcher (5P85D)",
                "shortLabel": "S-300PS 5P85D ln",
                "range": "Long",
                "filename": "",
                "type": "SAM Launcher"
            },
            "SA-11 Buk LN 9A310M1": {
                "name": "SA-11 Buk LN 9A310M1",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "SA-11 Launcher",
                "shortLabel": "SA-11 Buk LN 9A310M1",
                "range": "Medium",
                "filename": "",
                "type": "SAM Launcher"
            },
            "Osa 9A33 ln": {
                "name": "Osa 9A33 ln",
                "coalition": "red",
                "era": "Mid Cold War",
                "label": "SA-8 Launcher",
                "shortLabel": "Osa 9A33 ln",
                "range": "Short",
                "filename": "",
                "type": "SAM Launcher"
            },
            "Tor 9A331": {
                "name": "Tor 9A331",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "SA-15 Tor 9A331",
                "shortLabel": "Tor 9A331",
                "range": "Medium",
                "filename": "",
                "type": "SAM"
            },
            "Strela-10M3": {
                "name": "Strela-10M3",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "SA-13 Strela-10M3",
                "shortLabel": "Strela-10M3",
                "range": "Short",
                "filename": "",
                "type": "SAM"
            },
            "Strela-1 9P31": {
                "name": "Strela-1 9P31",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "SA-9 Strela-1 9P31",
                "shortLabel": "Strela-1 9P31",
                "range": "Short",
                "filename": "",
                "type": "SAM"
            },
            "SA-11 Buk CC 9S470M1": {
                "name": "SA-11 Buk CC 9S470M1",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "SA-11 Command Post",
                "shortLabel": "SA-11 Buk CC 9S470M1",
                "range": "Medium",
                "filename": "",
                "type": "SAM Support vehicle"
            },
            "SA-8 Osa LD 9T217": {
                "name": "SA-8 Osa LD 9T217",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "SA-8 Osa LD 9T217",
                "shortLabel": "SA-8 Osa LD 9T217",
                "range": "Short",
                "filename": "",
                "type": "SAM"
            },
            "Patriot AMG": {
                "name": "Patriot AMG",
                "coalition": "blue",
                "era": "Modern",
                "label": "Patriot Antenna Mast Group",
                "shortLabel": "Patriot AMG",
                "range": "Long",
                "filename": "",
                "type": "SAM Support vehicle"
            },
            "Patriot ECS": {
                "name": "Patriot ECS",
                "coalition": "blue",
                "era": "Modern",
                "label": "Patriot Engagement Control Station",
                "shortLabel": "Patriot ECS",
                "range": "Long",
                "filename": "",
                "type": "SAM Support vehicle"
            },
            "Gepard": {
                "name": "Gepard",
                "coalition": "blue",
                "era": "Late Cold War",
                "label": "Gepard",
                "shortLabel": "Gepard",
                "filename": "",
                "type": "AAA"
            },
            "Hawk pcp": {
                "name": "Hawk pcp",
                "coalition": "blue",
                "era": "Late Cold War",
                "label": "Hawk Platoon Command Post",
                "shortLabel": "Hawk pcp",
                "range": "Medium",
                "filename": "",
                "type": "SAM Support vehicle"
            },
            "SA-18 Igla manpad": {
                "name": "SA-18 Igla manpad",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "SA-18 Igla manpad",
                "shortLabel": "SA-18 Igla manpad",
                "range": "Short",
                "filename": "",
                "type": "MANPADS"
            },
            "Igla manpad INS": {
                "name": "Igla manpad INS",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "SA-18 Igla manpad INS",
                "shortLabel": "Igla manpad INS",
                "range": "Short",
                "filename": "",
                "type": "MANPADS"
            },
            "SA-18 Igla-S manpad": {
                "name": "SA-18 Igla-S manpad",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "SA-18 Igla-S manpad",
                "shortLabel": "SA-18 Igla-S manpad",
                "range": "Short",
                "filename": "",
                "type": "MANPADS"
            },
            "RPC_5N62V": {
                "name": "RPC_5N62V",
                "coalition": "Red",
                "era": "Mid Cold War",
                "label": "SA-5 Square Pair",
                "shortLabel": "RPC 5N62V",
                "range": "Long",
                "filename": "",
                "type": "SAM Track radar"
            },
            "RLS_19J6": {
                "name": "RLS_19J6",
                "coalition": "Red",
                "era": "Mid Cold War",
                "label": "SA-5 Thin Shield",
                "shortLabel": "RLS 19J6",
                "range": "Long",
                "filename": "",
                "type": "SAM Search radar"
            },
            "S-200_Launcher": {
                "name": "S-200_Launcher",
                "coalition": "Red",
                "era": "Mid Cold War",
                "label": "SA-5 Launcher",
                "shortLabel": "S-200 Launcher",
                "range": "Long",
                "filename": "",
                "type": "SAM Launcher"
            },
            "Vulcan": {
                "name": "Vulcan",
                "coalition": "blue",
                "era": "Late Cold War",
                "label": "Vulcan",
                "shortLabel": "Vulcan",
                "filename": "",
                "type": "AAA"
            },
            "Hawk ln": {
                "name": "Hawk ln",
                "coalition": "blue",
                "era": "Late Cold War",
                "label": "Hawk Launcher",
                "shortLabel": "Hawk ln",
                "filename": "",
                "type": "SAM Launcher"
            },
            "M48 Chaparral": {
                "name": "M48 Chaparral",
                "coalition": "blue",
                "era": "Late Cold War",
                "label": "M48 Chaparral",
                "shortLabel": "M48 Chaparral",
                "filename": "",
                "type": "SAM"
            },
            "M6 Linebacker": {
                "name": "M6 Linebacker",
                "coalition": "blue",
                "era": "Late Cold War",
                "label": "M6 Linebacker",
                "shortLabel": "M6 Linebacker",
                "filename": "",
                "type": "SAM"
            },
            "Patriot ln": {
                "name": "Patriot ln",
                "coalition": "blue",
                "era": "Late Cold War",
                "label": "Patriot Launcher",
                "shortLabel": "Patriot ln",
                "range": "Long",
                "filename": "",
                "type": "SAM Launcher"
            },
            "M1097 Avenger": {
                "name": "M1097 Avenger",
                "coalition": "blue",
                "era": "Modern",
                "label": "M1097 Avenger",
                "shortLabel": "M1097 Avenger",
                "filename": "",
                "type": "SAM"
            },
            "Patriot EPP": {
                "name": "Patriot EPP",
                "coalition": "blue",
                "era": "Late Cold War",
                "label": "Patriot Electric Power Plant",
                "shortLabel": "Patriot EPP",
                "range": "Long",
                "filename": "",
                "type": "SAM Support vehicle"
            },
            "Patriot cp": {
                "name": "Patriot cp",
                "coalition": "blue",
                "era": "Late Cold War",
                "label": "Patriot Command Post",
                "shortLabel": "Patriot cp",
                "range": "Long",
                "filename": "",
                "type": "SAM Support vehicle"
            },
            "Roland ADS": {
                "name": "Roland ADS",
                "coalition": "blue",
                "era": "Late Cold War",
                "label": "Roland ADS",
                "shortLabel": "Roland ADS",
                "filename": "",
                "type": "SAM"
            },
            "S-300PS 54K6 cp": {
                "name": "S-300PS 54K6 cp",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "SA-10 Command Post",
                "shortLabel": "S-300PS 54K6 cp",
                "range": "Long",
                "filename": "",
                "type": "SAM Support vehicle"
            },
            "Stinger manpad GRG": {
                "name": "Stinger manpad GRG",
                "coalition": "blue",
                "era": "Late Cold War",
                "label": "Stinger manpad GRG",
                "shortLabel": "Stinger manpad GRG",
                "range": "Short",
                "filename": "",
                "type": "MANPADS"
            },
            "Stinger manpad dsr": {
                "name": "Stinger manpad dsr",
                "coalition": "blue",
                "era": "Late Cold War",
                "label": "Stinger manpad dsr",
                "shortLabel": "Stinger manpad dsr",
                "range": "Short",
                "filename": "",
                "type": "MANPADS"
            },
            "Stinger comm dsr": {
                "name": "Stinger comm dsr",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "Stinger comm dsr",
                "shortLabel": "Stinger comm dsr",
                "range": "Short",
                "filename": "",
                "type": "MANPADS"
            },
            "Stinger manpad": {
                "name": "Stinger manpad",
                "coalition": "blue",
                "era": "Late Cold War",
                "label": "Stinger manpad",
                "shortLabel": "Stinger manpad",
                "range": "Short",
                "filename": "",
                "type": "MANPADS"
            },
            "Stinger comm": {
                "name": "Stinger comm",
                "coalition": "blue",
                "era": "Late Cold War",
                "label": "Stinger comm",
                "shortLabel": "Stinger comm",
                "range": "Short",
                "filename": "",
                "type": "MANPADS"
            },
            "ZSU-23-4 Shilka": {
                "name": "ZSU-23-4 Shilka",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "ZSU-23-4 Shilka",
                "shortLabel": "ZSU-23-4 Shilka",
                "filename": "",
                "type": "AAA"
            },
            "ZU-23 Emplacement Closed": {
                "name": "ZU-23 Emplacement Closed",
                "coalition": "red",
                "era": "Early Cold War",
                "label": "ZU-23 Emplacement Closed",
                "shortLabel": "ZU-23 Emplacement Closed",
                "filename": "",
                "type": "AAA"
            },
            "ZU-23 Emplacement": {
                "name": "ZU-23 Emplacement",
                "coalition": "red",
                "era": "Early Cold War",
                "label": "ZU-23 Emplacement",
                "shortLabel": "ZU-23 Emplacement",
                "filename": "",
                "type": "AAA"
            },
            "ZU-23 Closed Insurgent": {
                "name": "ZU-23 Closed Insurgent",
                "coalition": "red",
                "era": "Early Cold War",
                "label": "ZU-23 Closed Insurgent",
                "shortLabel": "ZU-23 Closed Insurgent",
                "filename": "",
                "type": "AAA"
            },
            "Ural-375 ZU-23 Insurgent": {
                "name": "Ural-375 ZU-23 Insurgent",
                "coalition": "red",
                "era": "Early Cold War",
                "label": "Ural-375 ZU-23 Insurgent",
                "shortLabel": "Ural-375 ZU-23 Insurgent",
                "filename": "",
                "type": "AAA"
            },
            "ZU-23 Insurgent": {
                "name": "ZU-23 Insurgent",
                "coalition": "red",
                "era": "Early Cold War",
                "label": "ZU-23 Insurgent",
                "shortLabel": "ZU-23 Insurgent",
                "filename": "",
                "type": "AAA"
            },
            "Ural-375 ZU-23": {
                "name": "Ural-375 ZU-23",
                "coalition": "red",
                "era": "Early Cold War",
                "label": "Ural-375 ZU-23",
                "shortLabel": "Ural-375 ZU-23",
                "filename": "",
                "type": "AAA"
            },
            "1L13 EWR": {
                "name": "1L13 EWR",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "Box Spring",
                "shortLabel": "1L13 EWR",
                "filename": "",
                "type": "Radar"
            },
            "Kub 1S91 str": {
                "name": "Kub 1S91 str",
                "coalition": "red",
                "era": "Mid Cold War",
                "label": "SA-6 Straight flush",
                "shortLabel": "Kub 1S91 str",
                "range": "Medium",
                "filename": "",
                "type": "SAM Search/Track radar"
            },
            "S-300PS 40B6M tr": {
                "name": "S-300PS 40B6M tr",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "SA-10 Tin Shield",
                "shortLabel": "S-300PS 40B6M tr",
                "range": "Long",
                "filename": "",
                "type": "SAM Track radar"
            },
            "S-300PS 40B6MD sr": {
                "name": "S-300PS 40B6MD sr",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "SA-10 Clam Shell",
                "shortLabel": "S-300PS 40B6MD sr",
                "range": "Long",
                "filename": "",
                "type": "SAM Search radar"
            },
            "55G6 EWR": {
                "name": "55G6 EWR",
                "coalition": "red",
                "era": "Early Cold War",
                "label": "Tall Rack",
                "shortLabel": "55G6 EWR",
                "filename": "",
                "type": "Radar"
            },
            "S-300PS 64H6E sr": {
                "name": "S-300PS 64H6E sr",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "SA-10 Big Bird",
                "shortLabel": "S-300PS 64H6E sr",
                "range": "Long",
                "filename": "",
                "type": "SAM Search radar"
            },
            "SA-11 Buk SR 9S18M1": {
                "name": "SA-11 Buk SR 9S18M1",
                "coalition": "red",
                "era": "Mid Cold War",
                "label": "SA-11 Snown Drift",
                "shortLabel": "SA-11 Buk SR 9S18M1",
                "range": "Long",
                "filename": "",
                "type": "SAM Search radar"
            },
            "Dog Ear radar": {
                "name": "Dog Ear radar",
                "coalition": "red",
                "era": "Mid Cold War",
                "label": "Dog Ear",
                "shortLabel": "Dog Ear radar",
                "filename": "",
                "type": "SAM Search radar"
            },
            "Hawk tr": {
                "name": "Hawk tr",
                "coalition": "blue",
                "era": "Early Cold War",
                "label": "Hawk Track radar",
                "shortLabel": "Hawk tr",
                "range": "Medium",
                "filename": "",
                "type": "SAM Track radar"
            },
            "Hawk sr": {
                "name": "Hawk sr",
                "coalition": "blue",
                "era": "Early Cold War",
                "label": "Hawk Search radar",
                "shortLabel": "Hawk sr",
                "range": "Long",
                "filename": "",
                "type": "SAM Search radar"
            },
            "Patriot str": {
                "name": "Patriot str",
                "coalition": "blue",
                "era": "Late Cold War",
                "label": "Patriot Search/Track radar",
                "shortLabel": "Patriot str",
                "range": "Medium",
                "filename": "",
                "type": "SAM Search/Track radar"
            },
            "Hawk cwar": {
                "name": "Hawk cwar",
                "coalition": "blue",
                "era": "Early Cold War",
                "label": "Hawk Continous Wave Acquisition Radar",
                "shortLabel": "Hawk cwar",
                "range": "Long",
                "filename": "",
                "type": "SAM Track radar"
            },
            "p-19 s-125 sr": {
                "name": "p-19 s-125 sr",
                "coalition": "red",
                "era": "Mid Cold War",
                "label": "SA-3 Flat Face B",
                "shortLabel": "Flat Face B",
                "filename": "",
                "type": "SAM Search radar"
            },
            "Roland Radar": {
                "name": "Roland Radar",
                "coalition": "blue",
                "era": "Mid Cold War",
                "label": "Roland Search radar",
                "shortLabel": "Roland Radar",
                "filename": "",
                "type": "SAM Search radar"
            },
            "snr s-125 tr": {
                "name": "snr s-125 tr",
                "coalition": "red",
                "era": "Early Cold War",
                "label": "SA-3 Low Blow",
                "shortLabel": "snr s-125 tr",
                "range": "Medium",
                "filename": "",
                "type": "SAM Track radar"
            },
            "house1arm": {
                "name": "house1arm",
                "coalition": "",
                "era": "",
                "label": "house1arm",
                "shortLabel": "house1arm",
                "filename": "",
                "type": "Structure"
            },
            "house2arm": {
                "name": "house2arm",
                "coalition": "",
                "era": "",
                "label": "house2arm",
                "shortLabel": "house2arm",
                "filename": "",
                "type": "Structure"
            },
            "outpost_road": {
                "name": "outpost_road",
                "coalition": "",
                "era": "",
                "label": "outpost_road",
                "shortLabel": "outpost_road",
                "filename": "",
                "type": "Structure"
            },
            "outpost": {
                "name": "outpost",
                "coalition": "",
                "era": "",
                "label": "outpost",
                "shortLabel": "outpost",
                "filename": "",
                "type": "Structure"
            },
            "houseA_arm": {
                "name": "houseA_arm",
                "coalition": "",
                "era": "",
                "label": "houseA_arm",
                "shortLabel": "houseA_arm",
                "filename": "",
                "type": "Structure"
            },
            "Challenger2": {
                "name": "Challenger2",
                "coalition": "blue",
                "era": "Modern",
                "label": "Challenger2",
                "shortLabel": "Challenger2",
                "filename": "",
                "type": "Tank"
            },
            "Leclerc": {
                "name": "Leclerc",
                "coalition": "blue",
                "era": "Modern",
                "label": "Leclerc",
                "shortLabel": "Leclerc",
                "filename": "",
                "type": "Tank"
            },
            "Leopard1A3": {
                "name": "Leopard1A3",
                "coalition": "blue",
                "era": "Mid Cold War",
                "label": "Leopard1A3",
                "shortLabel": "Leopard1A3",
                "filename": "",
                "type": "Tank"
            },
            "Leopard-2": {
                "name": "Leopard-2",
                "coalition": "blue",
                "era": "Late Cold War",
                "label": "Leopard-2",
                "shortLabel": "Leopard-2",
                "filename": "",
                "type": "Tank"
            },
            "M-60": {
                "name": "M-60",
                "coalition": "blue",
                "era": "Early Cold War",
                "label": "M-60",
                "shortLabel": "M-60",
                "filename": "",
                "type": "Tank"
            },
            "M1128 Stryker MGS": {
                "name": "M1128 Stryker MGS",
                "coalition": "blue",
                "era": "Modern",
                "label": "M1128 Stryker MGS",
                "shortLabel": "M1128 Stryker MGS",
                "filename": "",
                "type": "SPG"
            },
            "M-1 Abrams": {
                "name": "M-1 Abrams",
                "coalition": "blue",
                "era": "Late Cold War",
                "label": "M-1 Abrams",
                "shortLabel": "M-1 Abrams",
                "filename": "",
                "type": "Tank"
            },
            "T-55": {
                "name": "T-55",
                "coalition": "red",
                "era": "Early Cold War",
                "label": "T-55",
                "shortLabel": "T-55",
                "filename": "",
                "type": "Tank"
            },
            "T-72B": {
                "name": "T-72B",
                "coalition": "red",
                "era": "Mid Cold War",
                "label": "T-72B",
                "shortLabel": "T-72B",
                "filename": "",
                "type": "Tank"
            },
            "T-80UD": {
                "name": "T-80UD",
                "coalition": "red",
                "era": "Mid Cold War",
                "label": "T-80UD",
                "shortLabel": "T-80UD",
                "filename": "",
                "type": "Tank"
            },
            "T-90": {
                "name": "T-90",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "T-90",
                "shortLabel": "T-90",
                "filename": "",
                "type": "Tank"
            },
            "Ural-4320 APA-5D": {
                "name": "Ural-4320 APA-5D",
                "coalition": "red",
                "era": "Early Cold War",
                "label": "Ural-4320 APA-5D",
                "shortLabel": "Ural-4320 APA-5D",
                "filename": "",
                "type": "Unarmed"
            },
            "ATMZ-5": {
                "name": "ATMZ-5",
                "coalition": "red",
                "era": "Early Cold War",
                "label": "ATMZ-5",
                "shortLabel": "ATMZ-5",
                "filename": "",
                "type": "Unarmed"
            },
            "ATZ-10": {
                "name": "ATZ-10",
                "coalition": "red",
                "era": "Early Cold War",
                "label": "ATZ-10",
                "shortLabel": "ATZ-10",
                "filename": "",
                "type": "Unarmed"
            },
            "GAZ-3307": {
                "name": "GAZ-3307",
                "coalition": "red",
                "era": "Early Cold War",
                "label": "GAZ-3307",
                "shortLabel": "GAZ-3307",
                "filename": "",
                "type": "Unarmed"
            },
            "GAZ-3308": {
                "name": "GAZ-3308",
                "coalition": "red",
                "era": "Early Cold War",
                "label": "GAZ-3308",
                "shortLabel": "GAZ-3308",
                "filename": "",
                "type": "Unarmed"
            },
            "GAZ-66": {
                "name": "GAZ-66",
                "coalition": "red",
                "era": "Early Cold War",
                "label": "GAZ-66",
                "shortLabel": "GAZ-66",
                "filename": "",
                "type": "Unarmed"
            },
            "M978 HEMTT Tanker": {
                "name": "M978 HEMTT Tanker",
                "coalition": "blue",
                "era": "Mid Cold War",
                "label": "M978 HEMTT Tanker",
                "shortLabel": "M978 HEMTT Tanker",
                "filename": "",
                "type": "Unarmed"
            },
            "HEMTT TFFT": {
                "name": "HEMTT TFFT",
                "coalition": "blue",
                "era": "Late Cold War",
                "label": "HEMTT TFFT",
                "shortLabel": "HEMTT TFFT",
                "filename": "",
                "type": "Unarmed"
            },
            "IKARUS Bus": {
                "name": "IKARUS Bus",
                "coalition": "red",
                "era": "Mid Cold War",
                "label": "IKARUS Bus",
                "shortLabel": "IKARUS Bus",
                "filename": "",
                "type": "Unarmed"
            },
            "KAMAZ Truck": {
                "name": "KAMAZ Truck",
                "coalition": "red",
                "era": "Mid Cold War",
                "label": "KAMAZ Truck",
                "shortLabel": "KAMAZ Truck",
                "filename": "",
                "type": "Unarmed"
            },
            "LAZ Bus": {
                "name": "LAZ Bus",
                "coalition": "red",
                "era": "Early Cold War",
                "label": "LAZ Bus",
                "shortLabel": "LAZ Bus",
                "filename": "",
                "type": "Unarmed"
            },
            "Hummer": {
                "name": "Hummer",
                "coalition": "blue",
                "era": "Mid Cold War",
                "label": "Hummer",
                "shortLabel": "Hummer",
                "filename": "",
                "type": "Unarmed"
            },
            "M 818": {
                "name": "M 818",
                "coalition": "blue",
                "era": "Early Cold War",
                "label": "M 818",
                "shortLabel": "M 818",
                "filename": "",
                "type": "Unarmed"
            },
            "MAZ-6303": {
                "name": "MAZ-6303",
                "coalition": "red",
                "era": "Mid Cold War",
                "label": "MAZ-6303",
                "shortLabel": "MAZ-6303",
                "filename": "",
                "type": "Unarmed"
            },
            "Predator GCS": {
                "name": "Predator GCS",
                "coalition": "blue",
                "era": "Late Cold War",
                "label": "Predator GCS",
                "shortLabel": "Predator GCS",
                "filename": "",
                "type": "Unarmed"
            },
            "Predator TrojanSpirit": {
                "name": "Predator TrojanSpirit",
                "coalition": "blue",
                "era": "Late Cold War",
                "label": "Predator TrojanSpirit",
                "shortLabel": "Predator TrojanSpirit",
                "filename": "",
                "type": "Unarmed"
            },
            "Suidae": {
                "name": "Suidae",
                "coalition": "",
                "era": "Modern",
                "label": "Suidae",
                "shortLabel": "Suidae",
                "filename": "",
                "type": "Unarmed"
            },
            "Tigr_233036": {
                "name": "Tigr_233036",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "Tigr_233036",
                "shortLabel": "Tigr_233036",
                "filename": "",
                "type": "Unarmed"
            },
            "Trolley bus": {
                "name": "Trolley bus",
                "coalition": "blue",
                "era": "Late Cold War",
                "label": "Trolley bus",
                "shortLabel": "Trolley bus",
                "filename": "",
                "type": "Unarmed"
            },
            "UAZ-469": {
                "name": "UAZ-469",
                "coalition": "red",
                "era": "Mid Cold War",
                "label": "UAZ-469",
                "shortLabel": "UAZ-469",
                "filename": "",
                "type": "Unarmed"
            },
            "Ural ATsP-6": {
                "name": "Ural ATsP-6",
                "coalition": "red",
                "era": "Mid Cold War",
                "label": "Ural ATsP-6",
                "shortLabel": "Ural ATsP-6",
                "filename": "",
                "type": "Unarmed"
            },
            "Ural-375 PBU": {
                "name": "Ural-375 PBU",
                "coalition": "red",
                "era": "Mid Cold War",
                "label": "Ural-375 PBU",
                "shortLabel": "Ural-375 PBU",
                "filename": "",
                "type": "Unarmed"
            },
            "Ural-375": {
                "name": "Ural-375",
                "coalition": "red",
                "era": "Mid Cold War",
                "label": "Ural-375",
                "shortLabel": "Ural-375",
                "filename": "",
                "type": "Unarmed"
            },
            "Ural-4320-31": {
                "name": "Ural-4320-31",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "Ural-4320-31",
                "shortLabel": "Ural-4320-31",
                "filename": "",
                "type": "Unarmed"
            },
            "Ural-4320T": {
                "name": "Ural-4320T",
                "coalition": "red",
                "era": "Late Cold War",
                "label": "Ural-4320T",
                "shortLabel": "Ural-4320T",
                "filename": "",
                "type": "Unarmed"
            },
            "VAZ Car": {
                "name": "VAZ Car",
                "coalition": "red",
                "era": "Early Cold War",
                "label": "VAZ Car",
                "shortLabel": "VAZ Car",
                "filename": "",
                "type": "Unarmed"
            },
            "ZiL-131 APA-80": {
                "name": "ZiL-131 APA-80",
                "coalition": "red",
                "era": "Early Cold War",
                "label": "ZiL-131 APA-80",
                "shortLabel": "ZiL-131 APA-80",
                "filename": "",
                "type": "Unarmed"
            },
            "SKP-11": {
                "name": "SKP-11",
                "coalition": "red",
                "era": "Early Cold War",
                "label": "SKP-11",
                "shortLabel": "SKP-11",
                "filename": "",
                "type": "Unarmed"
            },
            "ZIL-131 KUNG": {
                "name": "ZIL-131 KUNG",
                "coalition": "red",
                "era": "Early Cold War",
                "label": "ZIL-131 KUNG",
                "shortLabel": "ZIL-131 KUNG",
                "filename": "",
                "type": "Unarmed"
            },
            "ZIL-4331": {
                "name": "ZIL-4331",
                "coalition": "red",
                "era": "Early Cold War",
                "label": "ZIL-4331",
                "shortLabel": "ZIL-4331",
                "filename": "",
                "type": "Unarmed"
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
        return "GroundUnit";
    }
}

export var groundUnitDatabase = new GroundUnitDatabase();
