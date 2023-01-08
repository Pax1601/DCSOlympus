
var unitTypes = {};
/* NAVY */
unitTypes.navy = {};
unitTypes.navy.blue = [
    "VINSON",
    "PERRY",
    "TICONDEROG"
]

unitTypes.navy.red = [
    "ALBATROS",
    "KUZNECOW",
    "MOLNIYA",
    "MOSCOW",
    "NEUSTRASH",
    "PIOTR",
    "REZKY"
]

unitTypes.navy.civil = [
    "ELNYA",
    "Dry-cargo ship-2",
    "Dry-cargo ship-1",
    "ZWEZDNY"
]

unitTypes.navy.submarine = [
    "KILO",
    "SOM"
]

unitTypes.navy.speedboat = [
    "speedboat"
]

/* VEHICLES (GROUND) */
unitTypes.vehicles = []
unitTypes.vehicles.Howitzers = [
    "2B11 mortar",
    "SAU Gvozdika",
    "SAU Msta",
    "SAU Akatsia",
    "SAU 2-C9",
    "M-109"
]

unitTypes.vehicles.IFV = [
    "AAV7",
    "BMD-1",
    "BMP-1",
    "BMP-2",
    "BMP-3",
    "Boman",
    "BRDM-2",
    "BTR-80",
    "BTR_D",
    "Bunker",
    "Cobra",
    "LAV-25",
    "M1043 HMMWV Armament",
    "M1045 HMMWV TOW",
    "M1126 Stryker ICV",
    "M-113",
    "M1134 Stryker ATGM",
    "M-2 Bradley",
    "Marder",
    "MCV-80",
    "MTLB",
    "Paratrooper RPG-16",
    "Paratrooper AKS-74",
    "Sandbox",
    "Soldier AK",
    "Infantry AK",
    "Soldier M249",
    "Soldier M4",
    "Soldier M4 GRG",
    "Soldier RPG",
    "TPZ"
]

unitTypes.vehicles.MLRS = [
    "Grad-URAL",
    "Uragan_BM-27",
    "Smerch",
    "MLRS"
]

unitTypes.vehicles.SAM = [
    "2S6 Tunguska",
    "Kub 2P25 ln",
    "5p73 s-125 ln",
    "S-300PS 5P85C ln",
    "S-300PS 5P85D ln",
    "SA-11 Buk LN 9A310M1",
    "Osa 9A33 ln",
    "Tor 9A331",
    "Strela-10M3",
    "Strela-1 9P31",
    "SA-11 Buk CC 9S470M1",
    "SA-8 Osa LD 9T217",
    "Patriot AMG",
    "Patriot ECS",
    "Gepard",
    "Hawk pcp",
    "SA-18 Igla manpad",
    "SA-18 Igla comm",
    "Igla manpad INS",
    "SA-18 Igla-S manpad",
    "SA-18 Igla-S comm",
    "Vulcan",
    "Hawk ln",
    "M48 Chaparral",
    "M6 Linebacker",
    "Patriot ln",
    "M1097 Avenger",
    "Patriot EPP",
    "Patriot cp",
    "Roland ADS",
    "S-300PS 54K6 cp",
    "Stinger manpad GRG",
    "Stinger manpad dsr",
    "Stinger comm dsr",
    "Stinger manpad",
    "Stinger comm",
    "ZSU-23-4 Shilka",
    "ZU-23 Emplacement Closed",
    "ZU-23 Emplacement",
    "ZU-23 Closed Insurgent",
    "Ural-375 ZU-23 Insurgent",
    "ZU-23 Insurgent",
    "Ural-375 ZU-23"
]

unitTypes.vehicles.Radar = [
    "1L13 EWR",
    "Kub 1S91 str",
    "S-300PS 40B6M tr",
    "S-300PS 40B6MD sr",
    "55G6 EWR",
    "S-300PS 64H6E sr",
    "SA-11 Buk SR 9S18M1",
    "Dog Ear radar",
    "Hawk tr",
    "Hawk sr",
    "Patriot str",
    "Hawk cwar",
    "p-19 s-125 sr",
    "Roland Radar",
    "snr s-125 tr"
]

unitTypes.vehicles.Structures = [
    "house1arm",
    "house2arm",
    "outpost_road",
    "outpost",
    "houseA_arm"
]

unitTypes.vehicles.Tanks = [
    "Challenger2",
    "Leclerc",
    "Leopard1A3",
    "Leopard-2",
    "M-60",
    "M1128 Stryker MGS",
    "M-1 Abrams",
    "T-55",
    "T-72B",
    "T-80UD",
    "T-90"
]

unitTypes.vehicles.Unarmed = [
    "Ural-4320 APA-5D",
    "ATMZ-5",
    "ATZ-10",
    "GAZ-3307",
    "GAZ-3308",
    "GAZ-66",
    "M978 HEMTT Tanker",
    "HEMTT TFFT",
    "IKARUS Bus",
    "KAMAZ Truck",
    "LAZ Bus",
    "Hummer",
    "M 818",
    "MAZ-6303",
    "Predator GCS",
    "Predator TrojanSpirit",
    "Suidae",
    "Tigr_233036",
    "Trolley bus",
    "UAZ-469",
    "Ural ATsP-6",
    "Ural-375 PBU",
    "Ural-375",
    "Ural-4320-31",
    "Ural-4320T",
    "VAZ Car",
    "ZiL-131 APA-80",
    "SKP-11",
    "ZIL-131 KUNG",
    "ZIL-4331"
]

/* AIRPLANES */
unitTypes.air = {}

unitTypes.air.CAP = [
    "F-4E",
    "F/A-18C",
    "MiG-29S",
    "F-14A",
    "Su-27",
    "MiG-23MLD",
    "Su-33",
    "MiG-25RBT",
    "Su-30",
    "MiG-31",
    "Mirage 2000-5",
    "F-15C",
    "F-5E",
    "F-16C bl.52d",
]

unitTypes.air.CAS = [
    "Tornado IDS",
    "F-4E",
    "F/A-18C",
    "MiG-27K",
    "A-10C",
    "Su-25",
    "Su-34",
    "Su-17M4",
    "F-15E",
]

unitTypes.air.strike = [
    "Tu-22M3",
    "B-52H",
    "F-111F",
    "Tu-95MS",
    "Su-24M",
    "Tu-160",
    "F-117A",
    "B-1B",
    "Tu-142",
]

unitTypes.air.tank = [
    "S-3B Tanker",
    "KC-135",
    "IL-78M",
]

unitTypes.air.awacs = [
    "A-50",
    "E-3A",
    "E-2D",
]

unitTypes.air.drone = [
    "MQ-1A Predator",
    "MQ-9 Reaper",
]

unitTypes.air.transport = [
    "C-130",
    "An-26B",
    "An-30M",
    "C-17A",
    "IL-76MD",
]