import { UnitDatabase } from "./unitdatabase"

export class AircraftDatabase extends UnitDatabase {
   constructor() {
      super();
      this.blueprints = {
         "A-10C_2": {
            "name": "A-10C_2",
            "era": ["Late Cold War", "Modern"],
            "label": "A-10C Warthog",
            "shortLabel": "10",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "Mk-84",
                        "quantity": 2
                     },
                     {
                        "name": "ECM",
                        "quantity": 1
                     },
                     {
                        "name": "AIM-9M",
                        "quantity": 2
                     },
                     {
                        "name": "Mk-82",
                        "quantity": 6
                     }
                  ],
                  "roles": [
                     "CAS"
                  ],
                  "code": "Mk-82*6,Mk-84*2,AIM-9*2,ECM",
                  "name": "Heavy / Mk-84 / Short Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "AGM-65D",
                        "quantity": 4
                     },
                     {
                        "name": "CBU-97",
                        "quantity": 4
                     },
                     {
                        "name": "TGP",
                        "quantity": 1
                     },
                     {
                        "name": "ECM",
                        "quantity": 1
                     },
                     {
                        "name": "AIM-9",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAS"
                  ],
                  "code": "AGM-65D*4, CBU-97*4,TGP, ECM, AIM-9*2",
                  "name": "Heavy / AGM-65D / Short Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "GBU-12",
                        "quantity": 6
                     },
                     {
                        "name": "GBU-10",
                        "quantity": 2
                     },
                     {
                        "name": "TGP",
                        "quantity": 1
                     },
                     {
                        "name": "AIM-9",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAS"
                  ],
                  "code": "GBU-12*6,GBU-10*2,TGP, AIM-9*2",
                  "name": "Heavy / GBU-12 / Short Range"
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
            "filename": "a-10.png"
         },
         "AJS37": {
            "name": "AJS37",
            "label": "AJS37 Viggen",
            "era": ["Mid Cold War", "Late Cold War"],
            "shortLabel": "37",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "BK90",
                        "quantity": 2
                     },
                     {
                        "name": "RB-74",
                        "quantity": 2
                     },
                     {
                        "name": "XT",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "Strike: BK90 (MJ1)*2, RB-74*2, XT",
                  "name": "Heavy / BK90 / Long Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "ARAK M70 HE",
                        "quantity": 4
                     },
                     {
                        "name": "XT",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "CAS"
                  ],
                  "code": "CAS: ARAK M70 HE*4, XT",
                  "name": "Heavy / ARAK M79 HE / Long Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "RB05",
                        "quantity": 2
                     },
                     {
                        "name": "RB74",
                        "quantity": 2
                     },
                     {
                        "name": "XT",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "Anti-Ship"
                  ],
                  "code": "Anti-ship (RB05): RB-05A*2, RB-74*2, XT",
                  "name": "Heavy / RB05 / Long Range"
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
            "filename": "viggen.png"
         },
         "AV8BNA": {
            "name": "AV8BNA",
            "label": "AV8BNA Harrier",
            "era": ["Late Cold War", "Modern"],
            "shortLabel": "8",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "GBU-38",
                        "quantity": 2
                     },
                     {
                        "name": "AIM-9M",
                        "quantity": 1
                     },
                     {
                        "name": "AGM-122 Sidearm",
                        "quantity": 1
                     },
                     {
                        "name": "Fuel 300",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "H-M-H 3",
                  "name": "Heavy / GBU-38 / Long Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "AGM-65F",
                        "quantity": 4
                     },
                     {
                        "name": "AIM-9M",
                        "quantity": 2
                     },
                     {
                        "name": "GAU-12",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "CAS"
                  ],
                  "code": "Anti Armor",
                  "name": "Heavy / AGM-65F / Short Range"
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
            "filename": "av8bna.png"
         },
         "C-101CC": {
            "name": "C-101CC",
            "label": "C-101CC",
            "era": ["Late Cold War", "Modern"],
            "shortLabel": "101",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "AIM-9M",
                        "quantity": 2
                     },
                     {
                        "name": "DEFA 553 CANNON (I)",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "2*AIM-9M, DEFA 553 CANNON (I)",
                  "name": "Light / Fox 2 / Short Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "AIM-9M",
                        "quantity": 2
                     },
                     {
                        "name": "BELOUGA",
                        "quantity": 2
                     },
                     {
                        "name": "BIN-200",
                        "quantity": 2
                     },
                     {
                        "name": "AN-M3 CANNON",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "2*AIM-9M ,2*BELOUGA,2*BIN-200, AN-M3 CANNON",
                  "name": "Heavy / BELOUGA, BIN-200 / Short Range"
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
            "filename": "c-101.png"
         },
         "H-6J": {
            "name": "H-6J",
            "label": "H-6J Badger",
            "era": ["Mid Cold War, Late Cold War", "Modern"],
            "shortLabel": "H6",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "250-3 LD Bomb",
                        "quantity": 36
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "250-3 LD Bomb x 36",
                  "name": "Heavy / Bombs / Long Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "KD-20",
                        "quantity": 4
                     }
                  ],
                  "roles": [
                     "Anti-Ship"
                  ],
                  "code": "KD-20 x 4",
                  "name": "Heavy / KD-20 / Long Range"
               }
            ],
            "filename": "h-6.png"
         },
         "J-11A": {
            "name": "J-11A",
            "label": "J-11A Flaming Dragon",
            "era": ["Modern"],
            "shortLabel": "11",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "FAB-500",
                        "quantity": 8
                     },
                     {
                        "name": "R-73",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "FAB-500x8,R-73x2,ECM",
                  "name": "Heavy / Fox 2 / Long Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-77",
                        "quantity": 2
                     },
                     {
                        "name": "R-73",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "R-77x2, R-73x2",
                  "name": "Light / Fox 3 / Long Range"
               },
                              {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-27ER",
                        "quantity": 2
                     },
                     {
                        "name": "R-73",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "R-27ERx2, R-73x2",
                  "name": "Light / Fox 1 / Long Range"
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
            "filename": "su-27.png"
         },
         "JF-17": {
            "name": "JF-17",
            "label": "JF-17 Thunder",
            "era": ["Modern"],
            "shortLabel": "17",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "PL-5E2",
                        "quantity": 2
                     },
                     {
                        "name": "C802AK",
                        "quantity": 2
                     },
                     {
                        "name": "800L Tank",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "Anti-Ship"
                  ],
                  "code": "PL-5Ex2, C802AKx2, 800L Tank",
                  "name": "Heavy / C802AK ASM / Short Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "PL-5E2",
                        "quantity": 2
                     },
                     {
                        "name": "GBU-12",
                        "quantity": 2
                     },
                     {
                        "name": "800L Tank",
                        "quantity": 1
                     },
                     {
                        "name": "WMD7",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "Anti-Ship"
                  ],
                  "code": "PL-5Ex2, 2*GBU-12x2, 800L Tank, WMD7",
                  "name": "Heavy / C802AK ASM / Short Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "PL-5E2",
                        "quantity": 2
                     },
                     {
                        "name": "SD-10",
                        "quantity": 2
                     },
                     {
                        "name": "1100L Tank",
                        "quantity": 2
                     },
                     {
                        "name": "WMD7",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "PL-5Ex2, SD-10x2, 1100L Tankx2, WMD7",
                  "name": "Heavy / Fox 3 / Long Range"
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
            "filename": "jf-17.png"
         },
         "F-16C_50": {
            "name": "F-16C_50",
            "label": "F-16C Viper",
            "era": ["Late Cold War", "Modern"],
            "shortLabel": "16",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "fuel",
                        "quantity": 3
                     },
                     {
                        "name": "AIM-120C",
                        "quantity": 2
                     },
                     {
                        "name": "AIM-9X",
                        "quantity": 4
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "AIM-120C*2, AIM-9X*4, FUEL*2",
                  "name": "Heavy / Fox 3 / Long Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "fuel",
                        "quantity": 2
                     },
                     {
                        "name": "AIM-120C",
                        "quantity": 2
                     },
                     {
                        "name": "AIM-9X",
                        "quantity": 2
                     },
                     {
                        "name": "ECM",
                        "quantity": 1
                     },
                     {
                        "name": "TGP",
                        "quantity": 1
                     },
                     {
                        "name": "AGM-65D",
                        "quantity": 4
                     }
                  ],
                  "roles": [
                     "CAS"
                  ],
                  "code": "AIM-120C*2, AIM-9X*2, AGM-65D*4, FUEL*2, ECM, TGP",
                  "name": "Heavy / Fox 3, AGM-65D / Long Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "fuel",
                        "quantity": 2
                     },
                     {
                        "name": "AIM-120C",
                        "quantity": 2
                     },
                     {
                        "name": "AIM-9X",
                        "quantity": 2
                     },
                     {
                        "name": "ECM",
                        "quantity": 1
                     },
                     {
                        "name": "TGP",
                        "quantity": 1
                     },
                     {
                        "name": "GBU-10",
                        "quantity": 4
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "AIM-120C*2, AIM-9X*2, GBU-10*2, FUEL*2, ECM, TGP",
                  "name": "Heavy / Fox 3, GBU-10 / Long Range"
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
            "filename": "f-16c.png"
         },
         "F-5E-3": {
            "name": "F-5E-3",
            "label": "F-5E Tiger",
            "era": ["Mid Cold War", "Late Cold War"],
            "shortLabel": "5",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "Fuel 275",
                        "quantity": 3
                     },
                     {
                        "name": "AIM-9P5",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "AIM-9P5*2, Fuel 275*3",
                  "name": "Heavy / Fox 2 / Long Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "Mk-82",
                        "quantity": 4
                     },
                     {
                        "name": "AIM-9P5",
                        "quantity": 2
                     },
                     {
                        "name": "Fuel 275",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "Mk-82LD*4,AIM-9P*2,Fuel 275",
                  "name": "Heavy / Fox 2 / Short Range"
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
            "filename": "f-5.png"
         },
         "F-86F Sabre": {
            "name": "F-86F Sabre",
            "label": "F-86F Sabre",
            "era": ["Early Cold War, Mid Cold War"],
            "shortLabel": "86",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "120gal Fuel",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "120gal Fuel*2",
                  "name": "Light / Guns / Short Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "HVAR",
                        "quantity": 16
                     }
                  ],
                  "roles": [
                     "CAS"
                  ],
                  "code": "HVAR*16",
                  "name": "Light / HVAR / Short Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "AN-M64",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "AN-M64*2",
                  "name": "Light / AN-M64 / Short Range"
               },
               {
                  "fuel": 1,
                  "items": [

                  ],
                  "roles": [
                     ""
                  ],
                  "code": "",
                  "name": "Light / Guns / Short Range"
               }
            ],
            "filename": "f-5.png"
         },
         "F-14A-135-GR": {
            "name": "F-14A-135-GR",
            "label": "F-14A-135-GR Tomcat",
            "era": ["Mid Cold War", "Late Cold War", "Modern"],
            "shortLabel": "14A",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "fuel",
                        "quantity": 2
                     },
                     {
                        "name": "AIM-54A",
                        "quantity": 2
                     },
                     {
                        "name": "AIM-7F",
                        "quantity": 1
                     },
                     {
                        "name": "AIM-9L",
                        "quantity": 4
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "AIM-54A-MK47*2, AIM-7F*1, AIM-9L*4, XT*2",
                  "name": "Heavy / Fox 3 / Long Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "fuel",
                        "quantity": 2
                     },
                     {
                        "name": "AIM-7F",
                        "quantity": 4
                     },
                     {
                        "name": "AIM-9L",
                        "quantity": 4
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "AIM-7F*4, AIM-9L*4, XT*2",
                  "name": "Heavy / Fox 1 / Long Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "fuel",
                        "quantity": 2
                     },
                     {
                        "name": "AIM-7M",
                        "quantity": 1
                     },
                     {
                        "name": "AIM-9M",
                        "quantity": 2
                     },
                     {
                        "name": "GBU-12",
                        "quantity": 2
                     },
                     {
                        "name": "LANTIRN",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "AIM-7M*1, AIM-9M*2, XT*2, GBU-12*2, LANTIRN",
                  "name": "Heavy / Fox 3, GBU-12 / Long Range"
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
            "filename": "f-14.png"
         },
         "F-14B": {
            "name": "F-14B",
            "label": "F-14B Tomcat",
            "era": ["Late Cold War", "Modern"],
            "shortLabel": "14B",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "fuel",
                        "quantity": 2
                     },
                     {
                        "name": "AIM-54C",
                        "quantity": 2
                     },
                     {
                        "name": "AIM-7M",
                        "quantity": 3
                     },
                     {
                        "name": "AIM-9M",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "AIM-54C-MK47*2, AIM-7M*3, AIM-9M*2, XT*2",
                  "name": "Heavy / Fox 3 / Long Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "fuel",
                        "quantity": 2
                     },
                     {
                        "name": "AIM-7M",
                        "quantity": 6
                     },
                     {
                        "name": "AIM-9M",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "AIM-7M*6, AIM-9M*2, XT*2",
                  "name": "Heavy / Fox 1 / Long Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "fuel",
                        "quantity": 2
                     },
                     {
                        "name": "AIM-7M",
                        "quantity": 1
                     },
                     {
                        "name": "AIM-9M",
                        "quantity": 2
                     },
                     {
                        "name": "GBU-12",
                        "quantity": 2
                     },
                     {
                        "name": "LANTIRN",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "AIM-7M*1, AIM-9M*2, XT*2, GBU-12*2, LANTIRN",
                  "name": "Heavy / Fox 3, GBU-12 / Long Range"
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
            "filename": "f-14.png"
         },
         "FA-18C_hornet": {
            "name": "FA-18C_hornet",
            "era": ["Late Cold War", "Modern"],
            "label": "F/A-18C",
            "shortLabel": "18",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "fuel",
                        "quantity": 3
                     },
                     {
                        "name": "AIM-120C-5",
                        "quantity": 6
                     },
                     {
                        "name": "AIM-9X",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "AIM-9X*2, AIM-120C-5*6, FUEL*3",
                  "name": "Heavy / Fox 3 / Long Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "fuel",
                        "quantity": 3
                     },
                     {
                        "name": "AIM-7M",
                        "quantity": 4
                     },
                     {
                        "name": "AIM-9M",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "AIM-9M*2, AIM-7M*4, FUEL*3",
                  "name": "Heavy / Fox 1 / Long Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "fuel",
                        "quantity": 1
                     },
                     {
                        "name": "AIM-120C-5",
                        "quantity": 1
                     },
                     {
                        "name": "AIM-9X",
                        "quantity": 2
                     },
                     {
                        "name": "AGM-88C",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "SEAD"
                  ],
                  "code": "AIM-9X*2, AIM-120C-5*2, AGM-88C*2, FUEL",
                  "name": "Heavy / Fox 3, AGM-88C / Short Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "fuel",
                        "quantity": 1
                     },
                     {
                        "name": "AIM-120C-5",
                        "quantity": 1
                     },
                     {
                        "name": "AIM-9M",
                        "quantity": 2
                     },
                     {
                        "name": "AGM-84D",
                        "quantity": 4
                     }
                  ],
                  "roles": [
                     "Anti-Ship"
                  ],
                  "code": "AIM-9M*2, AIM-120C-5*1, AGM-84D*4, ATFLIR, FUEL",
                  "name": "Heavy / Fox 3, AGM-84D / Short Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "fuel",
                        "quantity": 1
                     },
                     {
                        "name": "AIM-120C-5",
                        "quantity": 1
                     },
                     {
                        "name": "AIM-9X",
                        "quantity": 2
                     },
                     {
                        "name": "GBU-12",
                        "quantity": 4
                     },
                     {
                        "name": "GBU-38",
                        "quantity": 4
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "AIM-9X*2, AIM-120C-5*1, GBU-38*4, GBU-12*4, ATFLIR, FUEL",
                  "name": "Heavy / Fox 3, GBU-12, GBU-38 / Short Range"
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
            "filename": "fa-18c.png"
         },
         "I-16": {
            "name": "I-16",
            "label": "I-16",
            "era": ["WW2"],
            "shortLabel": "I16",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [

                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "",
                  "name": "Empty Loadout"
               }
            ],
            "filename": "i-16.png"
         },
         "L-39ZA": {
            "name": "L-39ZA",
            "label": "L-39ZA",
            "era": ["Mid Cold War", "Late Cold War"],
            "shortLabel": "39",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "S-5KO",
                        "quantity": 32
                     }
                  ],
                  "roles": [
                     "CAS"
                  ],
                  "code": "S-5KOx32",
                  "name": "Heavy / S-5KO / Short Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "FAB-100",
                        "quantity": 4
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "FAB-100x4",
                  "name": "Heavy / FAB-100 / Short Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-60M",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "R-60Mx2",
                  "name": "Light / Fox 2 / Short Range"
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
            "filename": "l-39.png"
         },
         "M-2000C": {
            "name": "M-2000C",
            "label": "M-2000C Mirage",
            "era": ["Late Cold War", "Modern"],
            "shortLabel": "M2KC",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "Matra Magic II",
                        "quantity": 2
                     },
                     {
                        "name": "Super 530D",
                        "quantity": 2
                     },
                     {
                        "name": "Eclair",
                        "quantity": 1
                     },
                     {
                        "name": "fuel",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "Fox / S530D / Magic / Eclair",
                  "name": "Heavy / Fox 1 / Long Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "Matra Magic II",
                        "quantity": 2
                     },
                     {
                        "name": "Mk82",
                        "quantity": 4
                     },
                     {
                        "name": "fuel",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "Kilo / 4xMk-82 / Magic",
                  "name": "Heavy / Mk 82 / Long Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "Matra Magic II",
                        "quantity": 2
                     },
                     {
                        "name": "BAP-100",
                        "quantity": 18
                     },
                     {
                        "name": "fuel",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "Runway Strike"
                  ],
                  "code": "Bravo / BAP-100 / Magic",
                  "name": "Heavy / BAP-100 / Long Range"
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
            "filename": "m2000.png"
         },
         "MB-339A": {
            "name": "MB-339A",
            "label": "MB-339A",
            "era": ["Mid Cold War", "Late Cold War"],
            "shortLabel": "339A",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "320L TipTanks",
                        "quantity": 2
                     },
                     {
                        "name": "DEFA 553 GunPods",
                        "quantity": 2
                     },
                     {
                        "name": "Mk83",
                        "quantity": 2
                     },
                     {
                        "name": "Mk81",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "A - 2*320L TipTanks + 2*DEFA-553 GunPods + 2*Mk.83 + 2*Mk.81 ",
                  "name": "Heavy / Mk81, Mk83 / Medium Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "320L TipTanks",
                        "quantity": 2
                     },
                     {
                        "name": "DEFA GunPods",
                        "quantity": 2
                     },
                     {
                        "name": "LAU-10(Zuni Rockets)",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAS"
                  ],
                  "code": "AA - 2*320L TipTanks + 2*DEFA-553 GunPods + 2*LAU-10(Zuni Rockets) [ARMADA]",
                  "name": "Heavy / Mk 82 / Medium Range"
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
            "filename": "c-101.png"
         },
         "MiG-19P": {
            "name": "MiG-19P",
            "label": "MiG-19 Farmer",
            "era": ["Early Cold War", "Mid Cold War"],
            "shortLabel": "19",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "K-13A Atoll",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "K-13A x 2",
                  "name": "Light / Fox-2 / Short range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "K-13A Atoll",
                        "quantity": 2
                     },
                     {
                        "name": "167 gal tanks",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "K-13A x 2, PTB-760 x 2",
                  "name": "Medium / Fox-2 / Medium range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "FAB-250",
                        "quantity": 2
                     },
                     {
                        "name": "ORO-57K",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "FAB-250 x 2, ORO-57K x 2",
                  "name": "Medium / FAB250, ORO57K / Short range"
               },
               {
                  "fuel": 1,
                  "items": [

                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "",
                  "name": "Light / Guns / Short range"
               }
            ],
            "filename": "mig-19.png"
         },
         "MiG-21Bis": {
            "name": "MiG-21Bis",
            "label": "MiG-21 Fishbed",
            "era": ["Mid Cold War", "Late Cold War"],
            "shortLabel": "21",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-3 Atoll",
                        "quantity": 2
                     },
                     {
                        "name": "R-60 Aphid",
                        "quantity": 2
                     },
                     {
                        "name": "130 gal tanks",
                        "quantity": 1
                     },
                     {
                        "name": "ASO-2 Countermeasures",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "Patrol, short range",
                  "name": "Light / Fox-2 / Short range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-3 Atoll",
                        "quantity": 2
                     },
                     {
                        "name": "R-60 Aphid",
                        "quantity": 2
                     },
                     {
                        "name": "210 gal tanks",
                        "quantity": 1
                     },
                     {
                        "name": "ASO-2 Countermeasures",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "Patrol, medium range",
                  "name": "Medium / Fox-2 / Medium range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-3R Atoll",
                        "quantity": 2
                     },
                     {
                        "name": "210 gal tanks",
                        "quantity": 1
                     },
                     {
                        "name": "ASO-2 Countermeasures",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "Patrol, R-3R Only",
                  "name": "Medium / Fox-1 / Medium range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "GROM",
                        "quantity": 2
                     },
                     {
                        "name": "FAB-250",
                        "quantity": 2
                     },
                     {
                        "name": "210 gal tanks",
                        "quantity": 1
                     },
                     {
                        "name": "ASO-2 Countermeasures",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "Few big targets, GROM + BOMBS",
                  "name": "Heavy / GROM, FAB250 / Medium range"
               },
               {
                  "fuel": 1,
                  "items": [

                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "",
                  "name": "Empty Loadout"
               }
            ],
            "filename": "mig-21.png"
         },
         "Mirage-F1EE": {
            "name": "Mirage-F1EE",
            "label": "Mirage-F1EE",
            "era": ["Mid Cold War", "Late Cold War"],
            "shortLabel": "F1EE",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "AIM-9JULI",
                        "quantity": 2
                     },
                     {
                        "name": "R530EM",
                        "quantity": 2
                     },
                     {
                        "name": "1137L Fuel Tank",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "2*AIM9-JULI, 2*R530EM, 1*Fuel Tank",
                  "name": "Medium / Fox 1 / Medium Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "AIM-9JULI",
                        "quantity": 2
                     },
                     {
                        "name": "SAMP 400 LD",
                        "quantity": 8
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "2*AIM-9JULI, 8*SAMP 400 LD",
                  "name": "Heavy / SAMP400 / Short Range"
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
            "filename": "f-5.png"
         },
         "A-20G": {
            "name": "A-20G",
            "label": "A-20G Havoc",
            "era": ["WW2"],
            "shortLabel": "A20",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "12.7mm M2 HMG",
                        "quantity": 6
                     },
                     {
                        "name": "500lb Bomb LD",
                        "quantity": 4
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "500 lb GP bomb LD*4",
                  "name": "Medium / Bombs / Medium Range"
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
            "filename": "a-20.png"
         },
         "Bf-109K-4": {
            "name": "Bf-109K-4",
            "label": "Bf-109K-4 Fritz",
            "era": ["WW2"],
            "shortLabel": "109",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "30mm MK108 Gun",
                        "quantity": 1
                     },
                     {
                        "name": "13mm MG131 Gun",
                        "quantity": 2
                     },
                     {
                        "name": "SC500",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "500 lb GP bomb LD*4",
                  "name": "Medium / Bombs / Short Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "30mm MK108 Gun",
                        "quantity": 1
                     },
                     {
                        "name": "13mm MG131 Gun",
                        "quantity": 2
                     },
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "",
                  "name": "Light / Guns / Short Range"
               }
            ],
            "filename": "bf109.png"
         },
         "FW-190A8": {
            "name": "FW-190A8",
            "label": "FW-190A8 Bosch",
            "era": ["WW2"],
            "shortLabel": "190A8",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "20mm MG151 Gun",
                        "quantity": 4
                     },
                     {
                        "name": "13mm MG131 Gun",
                        "quantity": 2
                     },
                     {
                        "name": "SD500",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "SD 500 A",
                  "name": "Medium / Bombs / Short Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "20mm MG151 Gun",
                        "quantity": 4
                     },
                     {
                        "name": "13mm MG131 Gun",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "",
                  "name": "Light / Guns / Short Range"
               }
            ],
            "filename": "fw190.png"
         },
         "FW-190D9": {
            "name": "FW-190D9",
            "label": "FW-190D9 Jerry",
            "era": ["WW2"],
            "shortLabel": "190D9",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "20mm MG151 Gun",
                        "quantity": 4
                     },
                     {
                        "name": "13mm MG131 Gun",
                        "quantity": 2
                     },
                     {
                        "name": "SC500",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "SD 500 A",
                  "name": "Medium / Bombs / Short Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "20mm MG151 Gun",
                        "quantity": 4
                     },
                     {
                        "name": "13mm MG131 Gun",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "",
                  "name": "Light / Guns / Short Range"
               }
            ],
            "filename": "fw190.png"
         },
         "MosquitoFBMkVI": {
            "name": "MosquitoFBMkVI",
            "label": "Mosquito FB MkVI",
            "era": ["WW2"],
            "shortLabel": "Mosquito",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "20mm Hispano Gun",
                        "quantity": 4
                     },
                     {
                        "name": "7.7mm MG",
                        "quantity": 4
                     },
                     {
                        "name": "500 lb GP Mk.V",
                        "quantity": 2
                     },
                     {
                        "name": "500 lb GP Short tail",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "500 lb GP Mk.V*2, 500 lb GP Short tail*2",
                  "name": "Medium / Bombs / Medium Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "20mm Hispano Gun",
                        "quantity": 4
                     },
                     {
                        "name": "7.7mm MG",
                        "quantity": 4
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "",
                  "name": "Light / Guns / Medium Range"
               }
            ],
            "filename": "mosquito.png"
         },
         "P-47D-40": {
            "name": "P-47D-40",
            "label": "P-47D Thunderbolt",
            "era": ["WW2"],
            "shortLabel": "P47",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "12.7mm HMG",
                        "quantity": 8
                     },
                     {
                        "name": "AN-M65",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "AN-M65*2",
                  "name": "Medium / Bombs / Medium Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "12.7mm HMG",
                        "quantity": 8
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "",
                  "name": "Light / Guns / Medium Range"
               }
            ],
            "filename": "p-47.png"
         },
         "P-51D-30-NA": {
            "name": "P-51D-30-NA",
            "label": "P-51D Mustang",
            "era": ["WW2", "Early Cold War"],
            "shortLabel": "P51",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "12.7mm HMG",
                        "quantity": 6
                     },
                     {
                        "name": "HVAR",
                        "quantity": 10
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "HVAR*10",
                  "name": "Medium / Rockets / Medium Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "12.7mm HMG",
                        "quantity": 6
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "",
                  "name": "Light / Guns / Medium Range"
               }
            ],
            "filename": "p-51.png"
         },
         "A-50": {
            "name": "A-50",
            "label": "A-50 Mainstay",
            "era": ["Late Cold War", "Modern"],
            "shortLabel": "A50",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [

                  ],
                  "roles": [
                     "AWACS"
                  ],
                  "code": "",
                  "name": "Default AWACS"
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
            "filename": "a-50.png"
         },
         "An-26B": {
            "name": "An-26B",
            "label": "An-26B Curl",
            "era": ["Mid Cold War", "Late Cold War", "Modern"],
            "shortLabel": "26",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [

                  ],
                  "roles": [
                     "Transport"
                  ],
                  "code": "",
                  "name": "Default Transport"
               }
            ],
            "filename": "an-26.png"
         },
         "An-30M": {
            "name": "An-30M",
            "label": "An-30M Clank",
            "era": ["Mid Cold War", "Late Cold War", "Modern"],
            "shortLabel": "30",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [

                  ],
                  "roles": [
                     "Reconnaissance"
                  ],
                  "code": "",
                  "name": "Default Reconnaissance"
               }
            ],
            "filename": "a-50.png"
         },
         "B-1B": {
            "name": "B-1B",
            "label": "B-1B Lancer",
            "era": ["Late Cold War", "Modern"],
            "shortLabel": "1",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "Mk-84",
                        "quantity": 24
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "Mk-84*24",
                  "name": "Heavy / Mk-84 / Long Range"
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
            "filename": "b-1.png"
         },
         "B-52H": {
            "name": "B-52H",
            "label": "B-52H Stratofortress",
            "era": ["Early Cold War", "Mid Cold War", "Late Cold War", "Modern"],
            "shortLabel": "52",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "Mk-84",
                        "quantity": 18
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "Mk-84*18",
                  "name": "Heavy / Mk-84 / Long Range"
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
            "filename": "b-52.png"
         },
         "C-130": {
            "name": "C-130",
            "label": "C-130 Hercules",
            "era": ["Early Cold War", "Mid Cold War", "Late Cold War", "Modern"],
            "shortLabel": "130",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [

                  ],
                  "roles": [
                     "Transport"
                  ],
                  "code": "C-130",
                  "name": "Default Transport"
               }
            ],
            "filename": "c-130.png"
         },
         "C-17A": {
            "name": "C-17A",
            "label": "C-17A Globemaster",
            "era": ["Modern"],
            "shortLabel": "C17",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [

                  ],
                  "roles": [
                     "Transport"
                  ],
                  "code": "",
                  "name": "Default Transport"
               }
            ],
            "filename": "c-17.png"
         },
         "E-3A": {
            "name": "E-3A",
            "label": "E-3A Sentry",
            "era": ["Mid Cold War", "Late Cold War", "Modern"],
            "shortLabel": "E3",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [

                  ],
                  "roles": [
                     "AWACS"
                  ],
                  "code": "",
                  "name": "Blue Air Force AWACS"
               }
            ],
            "filename": "e-3.png"
         },
         "E-2C": {
            "name": "E-2C",
            "label": "E-2C Hawkeye",
            "era": ["Mid Cold War", "Late Cold War", "Modern"],
            "shortLabel": "2C",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [

                  ],
                  "roles": [
                     "AWACS"
                  ],
                  "code": "",
                  "name": "Blue Naval AWACS"
               }
            ],
            "filename": "e-2.png"
         },
         "F-117A": {
            "name": "F-117A",
            "label": "F-117A Nighthawk",
            "era": ["Late Cold War", "Modern"],
            "shortLabel": "117",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "GBU-10",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "GBU-10*2",
                  "name": "Heavy / GBU-10 / Long Range"
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
            "filename": "f-117.png"
         },
         "F-15C": {
            "name": "F-15C",
            "label": "F-15C Eagle",
            "era": ["Late Cold War", "Modern"],
            "shortLabel": "15",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "fuel",
                        "quantity": 3
                     },
                     {
                        "name": "AIM-120B",
                        "quantity": 6
                     },
                     {
                        "name": "AIM-9M",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "AIM-9*2,AIM-120*6,Fuel*3",
                  "name": "Heavy / Fox 3 / Long Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "fuel",
                        "quantity": 3
                     },
                     {
                        "name": "AIM-7",
                        "quantity": 4
                     },
                     {
                        "name": "AIM-9M",
                        "quantity": 4
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "AIM-9*4,AIM-7*4,Fuel",
                  "name": "Heavy / Fox 1 / Long Range"
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
            "filename": "f-15.png"
         },
         "F-15E": {
            "name": "F-15E",
            "label": "F-15E Strike Eagle",
            "era": ["Late Cold War", "Modern"],
            "shortLabel": "15",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "fuel",
                        "quantity": 3
                     },
                     {
                        "name": "AIM-120B",
                        "quantity": 2
                     },
                     {
                        "name": "AIM-9M",
                        "quantity": 2
                     },
                     {
                        "name": "Mk-84",
                        "quantity": 8
                     }
                  ],
                  "roles": [
                     "CAS"
                  ],
                  "code": "AIM-120B*2,AIM-9M*2,FUEL*3,Mk-84*8",
                  "name": "Heavy / Fox 3, Mk-84 / Long Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "fuel",
                        "quantity": 1
                     },
                     {
                        "name": "AIM-120B",
                        "quantity": 2
                     },
                     {
                        "name": "AIM-9M",
                        "quantity": 2
                     },
                     {
                        "name": "GBU-12",
                        "quantity": 4
                     },
                     {
                        "name": "GBU-38",
                        "quantity": 4
                     },
                     {
                        "name": "AGM-154C",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "AIM-120B*2,AIM-9M*2,FUEL,GBU-12*4,GBU-38*4,AGM-154C*2",
                  "name": "Heavy / Fox 3, GBU-12, GBU-38, AGM-154C / Long Range"
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
            "filename": "f-15.png"
         },
         "F-4E": {
            "name": "F-4E",
            "label": "F-4E Phantom II",
            "era": ["Mid Cold War", "Late Cold War"],
            "shortLabel": "4",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "fuel",
                        "quantity": 2
                     },
                     {
                        "name": "AIM-7M",
                        "quantity": 4
                     },
                     {
                        "name": "AIM-9M",
                        "quantity": 4
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "AIM-9*4,AIM-7*4,Fuel*2",
                  "name": "Heavy / Fox 1 / Long Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "ECM",
                        "quantity": 1
                     },
                     {
                        "name": "AIM-7M",
                        "quantity": 2
                     },
                     {
                        "name": "Mk-82",
                        "quantity": 18
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "Mk-82*18,AIM-7*2,ECM",
                  "name": "Heavy / Fox 1, Mk-82 / Short Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "ECM",
                        "quantity": 1
                     },
                     {
                        "name": "AIM-7M",
                        "quantity": 2
                     },
                     {
                        "name": "AGM-65K",
                        "quantity": 4
                     },
                     {
                        "name": "Fuel",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAS"
                  ],
                  "code": "AGM-65K*4,AIM-7*2,Fuel*2,ECM",
                  "name": "Heavy / Fox 1, AGM-65K / Long Range"
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
            "filename": "f-4.png"
         },
         "IL-76MD": {
            "name": "IL-76MD",
            "label": "IL-76MD Candid",
            "era": ["Mid Cold War", "Late Cold War", "Modern"],
            "shortLabel": "76",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [

                  ],
                  "roles": [
                     "Transport"
                  ],
                  "code": "",
                  "name": "Default Transport"
               }
            ],
            "filename": "il-76.png"
         },
         "IL-78M": {
            "name": "IL-78M",
            "label": "IL-78M Midas",
            "era": ["Late Cold War", "Modern"],
            "shortLabel": "78",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [

                  ],
                  "roles": [
                     "Tanker"
                  ],
                  "code": "",
                  "name": "Default Tanker"
               }
            ],
            "filename": "il-76.png"
         },
         "KC-135": {
            "name": "KC-135",
            "label": "KC-135 Stratotanker",
            "era": ["Early Cold War", "Mid Cold War", "Late Cold War", "Modern"],
            "shortLabel": "135",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [

                  ],
                  "roles": [
                     "Tanker"
                  ],
                  "code": "",
                  "name": "Default Tanker"
               }
            ],
            "filename": "kc-135.png"
         },
         "KC-135MPRS": {
            "name": "KC-135MPRS",
            "label": "KC-135 MPRS Stratotanker",
            "era": ["Early Cold War", "Mid Cold War", "Late Cold War", "Modern"],
            "shortLabel": "135M",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [

                  ],
                  "roles": [
                     "Tanker"
                  ],
                  "code": "",
                  "name": "Default Tanker"
               }
            ],
            "filename": "kc-135.png"
         },
         "MiG-15bis": {
            "name": "MiG-15bis",
            "label": "MiG-15 Fagot",
            "era": ["Early Cold War", "Mid Cold War"],
            "shortLabel": "M15",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "300L Fuel Tanks",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "2*300L",
                  "name": "Medium / Guns / Medium Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "FAB-100M",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "2*FAB-100M",
                  "name": "Medium / FAB-100M / Short Range"
               },
               {
                  "fuel": 1,
                  "items": [

                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "",
                  "name": "Light / Guns / Short Range"
               },
            ],
            "filename": "mig-15.png"
         },
         "MiG-23MLD": {
            "name": "MiG-23MLD",
            "label": "MiG-23 Flogger",
            "era": ["Mid Cold War", "Late Cold War"],
            "shortLabel": "23",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "Fuel-800",
                        "quantity": 1
                     },
                     {
                        "name": "R-60M",
                        "quantity": 4
                     },
                     {
                        "name": "R-24R",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "R-24R*2,R-60M*4,Fuel-800",
                  "name": "Heavy / Fox 1 / Long Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "Fuel-800",
                        "quantity": 1
                     },
                     {
                        "name": "FAB-500",
                        "quantity": 2
                     },
                     {
                        "name": "R-60M",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "FAB-500*2,R-60M*2,Fuel-800",
                  "name": "Heavy / FAB-500 / Long Range"
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
            "filename": "mig-23.png"
         },
         "MiG-25RBT": {
            "name": "MiG-25RBT",
            "label": "MiG-25RBT Foxbat",
            "era": ["Mid Cold War", "Late Cold War"],
            "shortLabel": "25",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-60M",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "Reconnaissance"
                  ],
                  "code": "R-60M*2",
                  "name": "Heavy / Fox 2 / Long Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "FAB-500",
                        "quantity": 2
                     },
                     {
                        "name": "R-60M",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "FAB-500x2_60x2",
                  "name": "Heavy / FAB-500 / Long Range"
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
            "filename": "mig-25.png"
         },
         "MiG-25PD": {
            "name": "MiG-25PD",
            "label": "MiG-25PD Foxbat",
            "era": ["Mid Cold War", "Late Cold War"],
            "shortLabel": "25",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-40R",
                        "quantity": 2
                     },
                     {
                        "name": "R-60M",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "R-40R*2,R-60M*2",
                  "name": "Heavy / Fox 1 / Long Range"
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
            "filename": "mig-25.png"
         },
         "MiG-27K": {
            "name": "MiG-27K",
            "label": "MiG-27K Flogger-D",
            "era": ["Mid Cold War", "Late Cold War"],
            "shortLabel": "27",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "B-8",
                        "quantity": 4
                     }
                  ],
                  "roles": [
                     "CAS"
                  ],
                  "code": "B-8*4",
                  "name": "Heavy / B-8 / Short Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "Kh-29L",
                        "quantity": 2
                     },
                     {
                        "name": "R-60M",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "Kh-29L*2,R-60M*2,Fuel",
                  "name": "Heavy / Fox 2, Kh-29L / Medium Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "FAB-250",
                        "quantity": 6
                     },
                     {
                        "name": "R-60M",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "FAB-250*6,R-60M*2,Fuel",
                  "name": "Heavy / Fox 2, FAB250 / Medium Range"
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
            "filename": "mig-23.png"
         },
         "MiG-29A": {
            "name": "MiG-29A",
            "label": "MiG-29A Fulcrum",
            "era": ["Late Cold War", "Modern"],
            "shortLabel": "29A",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-73",
                        "quantity": 4
                     },
                     {
                        "name": "R-27R",
                        "quantity": 2
                     },
                     {
                        "name": "Fuel-1500",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "R-73*2,R-27R*2,Fuel-1500",
                  "name": "Heavy / Fox 1, HOBS Fox 2 / Medium Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-60M",
                        "quantity": 4
                     },
                     {
                        "name": "R-27R",
                        "quantity": 2
                     },
                     {
                        "name": "Fuel-1500",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "R-60M*4,R-27R*2,Fuel-1500",
                  "name": "Heavy / Fox 1 / Medium Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-73",
                        "quantity": 2
                     },
                     {
                        "name": "FAB-500",
                        "quantity": 4
                     },
                     {
                        "name": "Fuel-1500",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "FAB-500*4,R-73*2,Fuel",
                  "name": "Heavy / Fox 2, FAB500 / Medium Range"
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
            "filename": "mig-29.png"
         },
         "MiG-29S": {
            "name": "MiG-29S",
            "label": "MiG-29S Fulcrum",
            "era": ["Late Cold War", "Modern"],
            "shortLabel": "29",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-73",
                        "quantity": 4
                     },
                     {
                        "name": "R-27R",
                        "quantity": 2
                     },
                     {
                        "name": "Fuel-1500",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "R-73*2,R-27R*2,Fuel-1500",
                  "name": "Heavy / Fox 1 / Medium Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-60M",
                        "quantity": 4
                     },
                     {
                        "name": "R-27R",
                        "quantity": 2
                     },
                     {
                        "name": "Fuel-1500",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "R-60M*4,R-27R*2",
                  "name": "Heavy / Fox 1 / Medium Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-73",
                        "quantity": 2
                     },
                     {
                        "name": "S-24",
                        "quantity": 4
                     },
                     {
                        "name": "Fuel-1500",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "CAS"
                  ],
                  "code": "S-24*4,R-73*2,Fuel",
                  "name": "Heavy / Fox 2, S-24 / Medium Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-73",
                        "quantity": 2
                     },
                     {
                        "name": "FAB-500",
                        "quantity": 4
                     },
                     {
                        "name": "Fuel-1500",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "FAB-500*4,R-73*2,Fuel",
                  "name": "Heavy / Fox 2, FAB500 / Medium Range"
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
            "filename": "mig-29.png"
         },
         "MiG-31": {
            "name": "MiG-31",
            "label": "MiG-31 Foxhound",
            "era": ["Late Cold War", "Modern"],
            "shortLabel": "31",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-33",
                        "quantity": 4
                     },
                     {
                        "name": "R-40T",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "R-40T*2,R-33*4",
                  "name": "Heavy / Fox 1 / Long Range"
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
            "filename": "mig-23.png"
         },
         "MQ-9 Reaper": {
            "name": "MQ-9 Reaper",
            "label": "MQ-9 Reaper",
            "era": ["Modern"],
            "shortLabel": "9",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "AGM-114K",
                        "quantity": 12
                     }
                  ],
                  "roles": [
                     "Drone"
                  ],
                  "code": "AGM-114K*12",
                  "name": "Default Drone"
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
            "filename": "i-16.png"
         },
         "Su-17M4": {
            "name": "Su-17M4",
            "label": "Su-17M4 Fitter",
            "era": ["Mid Cold War", "Late Cold War"],
            "shortLabel": "17M4",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-60M",
                        "quantity": 2
                     },
                     {
                        "name": "B-8",
                        "quantity": 4
                     },
                     {
                        "name": "fuel",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAS"
                  ],
                  "code": "B-8*4,R-60M*2,Fuel*2",
                  "name": "Heavy / B-8 / Long Range"
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
            "filename": "su-17.png"
         },
         "Su-24M": {
            "name": "Su-24M",
            "label": "Su-24M Fencer",
            "era": ["Mid Cold War", "Late Cold War", "Modern"],
            "shortLabel": "24",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-60M",
                        "quantity": 2
                     },
                     {
                        "name": "FAB-1500",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "FAB-1500*2,R-60M*2",
                  "name": "Heavy / FAB-500 / Short Range"
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
            "filename": "su-24.png"
         },
         "Su-25": {
            "name": "Su-25",
            "label": "Su-25A Frogfoot",
            "era": ["Late Cold War"],
            "shortLabel": "S25",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-60M",
                        "quantity": 2
                     },
                     {
                        "name": "UB-13",
                        "quantity": 6
                     },
                     {
                        "name": "fuel",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAS"
                  ],
                  "code": "UB-13*6,R-60M*2,Fuel*2",
                  "name": "Heavy / Rockets / Long Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-60M",
                        "quantity": 2
                     },
                     {
                        "name": "B-8MI",
                        "quantity": 2
                     },
                     {
                        "name": "RBK-500",
                        "quantity": 2
                     },
                     {
                        "name": "Kh-25ML",
                        "quantity": 2
                     },
                     {
                        "name": "2-25L",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAS"
                  ],
                  "code": "2-25L*2, KH-25ML*2, RBK-500*2, B-8MI*2, R-60M*2",
                  "name": "Heavy / Everything A-G / Medium Range"
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
            "filename": "su-25.png"
         },
         "Su-25T": {
            "name": "Su-25",
            "label": "Su-25T Frogfoot",
            "era": ["Late Cold War", "Modern"],
            "shortLabel": "S25T",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "Kh-29L",
                        "quantity": 2
                     },
                     {
                        "name": "Kh-25ML",
                        "quantity": 4
                     },
                     {
                        "name": "R-73",
                        "quantity": 2
                     },
                     {
                        "name": "Mercury LLTV Pod",
                        "quantity": 1
                     },
                     {
                        "name": "MPS-410",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAS"
                  ],
                  "code": "Kh-29L*2,Kh-25ML*4,R-73*2,Mercury LLTV Pod,MPS-410",
                  "name": "Heavy / Everything A-G / Medium Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-73",
                        "quantity": 2
                     },
                     {
                        "name": "APU-8 Vikhr-M",
                        "quantity": 2
                     },
                     {
                        "name": "Kh-25ML",
                        "quantity": 2
                     },
                     {
                        "name": "SPPU-22*2",
                        "quantity": 2
                     },
                     {
                        "name": "Mercury LLTV Pod",
                        "quantity": 1
                     },
                     {
                        "name": "MPS-410",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAS"
                  ],
                  "code": "APU-8 Vikhr-M*2,Kh-25ML,R-73*2,SPPU-22*2,Mercury LLTV Pod,MPS-410",
                  "name": "Heavy / Everything A-G / Medium Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "FAB-500",
                        "quantity": 6
                     },
                     {
                        "name": "R-60M",
                        "quantity": 2
                     },
                     {
                        "name": "Fuel",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "FAB-500*6,R-60M*2,Fuel*2",
                  "name": "Medium / FAB-500 / Long Range"
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
            "filename": "su-25.png"
         },
         "Su-27": {
            "name": "Su-27",
            "label": "Su-27 Flanker",
            "era": ["Late Cold War", "Modern"],
            "shortLabel": "27",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-73",
                        "quantity": 2
                     },
                     {
                        "name": "R-27ER",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "R-73*2,R-27ER*2,ECM",
                  "name": "Light / Fox 1 / Long Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-73",
                        "quantity": 2
                     },
                     {
                        "name": "R-27ER",
                        "quantity": 2
                     },
                     {
                        "name": "R-27ET",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "R-73*2,R-27ER*2,R-27ET*2,ECM",
                  "name": "Heavy / Fox 1 / Long Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-73",
                        "quantity": 2
                     },
                     {
                        "name": "R-27ET",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "R-73*2,R-27ET*2,ECM",
                  "name": "Heavy / Fox 2 / Long Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-73",
                        "quantity": 2
                     },
                     {
                        "name": "S-25",
                        "quantity": 4
                     },
                     {
                        "name": "FAB-500",
                        "quantity": 4
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "S-25*4, FAB-500*4, R-73*2, ECM",
                  "name": "Heavy / Fox 2, Bombs, Rockets / Long Range"
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
            "filename": "su-27.png"
         },
         "Su-30": {
            "name": "Su-30",
            "label": "Su-30 Super Flanker",
            "era": ["Modern"],
            "shortLabel": "30",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-73",
                        "quantity": 2
                     },
                     {
                        "name": "R-77",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "R-73*2,R-77*2",
                  "name": "Light / Fox 3 / Long Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-73",
                        "quantity": 2
                     },
                     {
                        "name": "R-77",
                        "quantity": 2
                     },
                     {
                        "name": "R-27ER",
                        "quantity": 2
                     },
                     {
                        "name": "ECM",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "R-73*2,R-77*2,R-27ER*2,ECM",
                  "name": "Heavy / Fox 3, Fox 1 / Long Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-73",
                        "quantity": 2
                     },
                     {
                        "name": "R-77",
                        "quantity": 2
                     },
                     {
                        "name": "FAB-1500",
                        "quantity": 2
                     },
                     {
                        "name": "ECM",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "FAB-1500*2,R-73*2,R-77*2,ECM",
                  "name": "Heavy / Fox 3, Bombs / Long Range"
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
            "filename": "su-34.png"
         },
         "Su-33": {
            "name": "Su-33",
            "label": "Su-33 Naval Flanker",
            "era": ["Late Cold War", "Modern"],
            "shortLabel": "33",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-73",
                        "quantity": 2
                     },
                     {
                        "name": "R-27ER",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "R-73*2, R-27ER*2",
                  "name": "Light / Fox 1 / Long Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-73",
                        "quantity": 2
                     },
                     {
                        "name": "R-73",
                        "quantity": 2
                     },
                     {
                        "name": "R-27ER",
                        "quantity": 2
                     },
                     {
                        "name": "ECM",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "R-73*2,R-27ET*2,R-27ER*2,ECM",
                  "name": "Heavy / Fox 1 / Long Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "S-25",
                        "quantity": 4
                     },
                     {
                        "name": "FAB-250",
                        "quantity": 4
                     },
                     {
                        "name": "R-73",
                        "quantity": 2
                     },
                     {
                        "name": "ECM",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "S-25*4,FAB-250*4,R-73*2,ECM",
                  "name": "Heavy / Rockets, Bombs / Long Range"
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
            "filename": "su-34.png"
         },
         "Su-34": {
            "name": "Su-34",
            "label": "Su-34 Hellduck",
            "era": ["Modern"],
            "shortLabel": "34",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-73",
                        "quantity": 2
                     },
                     {
                        "name": "FAB-250",
                        "quantity": 4
                     },
                     {
                        "name": "UB-13",
                        "quantity": 4
                     },
                     {
                        "name": "ECM",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "CAS"
                  ],
                  "code": "UB-13*4,FAB-250*4,R-73*2,ECM",
                  "name": "Heavy / Mixed Ground Ordinance / Short Range"
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
            "filename": "su-34.png"
         },
         "Tornado IDS": {
            "name": "Tornado IDS",
            "label": "Tornado IDS",
            "era": ["Late Cold War", "Modern"],
            "shortLabel": "IDS",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "AIM-9M",
                        "quantity": 2
                     },
                     {
                        "name": "fuel",
                        "quantity": 2
                     },
                     {
                        "name": "Mk-82",
                        "quantity": 4
                     }
                  ],
                  "roles": [
                     "CAS"
                  ],
                  "code": "Mk-82*4,AIM-9*2,Fuel*2",
                  "name": "Heavy / Mk-84 / Long Range"
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
            "filename": "tornado.png"
         },
         "Tornado GR4": {
            "name": "Tornado GR4",
            "label": "Tornado GR4",
            "era": ["Late Cold War", "Modern"],
            "shortLabel": "GR4",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "ALARM",
                        "quantity": 4
                     },
                     {
                        "name": "fuel",
                        "quantity": 2
                     },
                     {
                        "name": "ECM",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "SEAD"
                  ],
                  "code": "ALARM*4, Fuel*2, ECM",
                  "name": "Heavy / ALARM / Long Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "AIM-9M",
                        "quantity": 2
                     },
                     {
                        "name": "GBU-16",
                        "quantity": 2
                     },
                     {
                        "name": "fuel",
                        "quantity": 2
                     },
                     {
                        "name": "ECM",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "GBU-16*2, AIM-9M*2, Fuel*2, ECM",
                  "name": "Heavy / GBU-16 / Long Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "AIM-9M",
                        "quantity": 2
                     },
                     {
                        "name": "Sea Eagle",
                        "quantity": 2
                     },
                     {
                        "name": "fuel",
                        "quantity": 2
                     },
                     {
                        "name": "ECM",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "Anti-Ship"
                  ],
                  "code": "Sea Eagle*2, AIM-9M*2, Fuel*2, ECM",
                  "name": "Heavy / Sea Eagle / Long Range"
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
            "filename": "tornado.png"
         },
         "Tu-142": {
            "name": "Tu-142",
            "label": "Tu-142 Bear",
            "era": ["Mid Cold War", "Late Cold War", "Modern"],
            "shortLabel": "142",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "Kh-35",
                        "quantity": 6
                     }
                  ],
                  "roles": [
                     "Anti-Ship"
                  ],
                  "code": "Kh-35*6",
                  "name": "Heavy / Kh-35 / Long Range"
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
            "filename": "tu-95.png"
         },
         "Tu-160": {
            "name": "Tu-160",
            "label": "Tu-160 Blackjack",
            "era": ["Late Cold War", "Modern"],
            "shortLabel": "160",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "Kh-65",
                        "quantity": 12
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "Kh-65*12",
                  "name": "Heavy / Kh-65 / Long Range"
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
            "filename": "tu-160.png"
         },
         "Tu-22M3": {
            "name": "Tu-22M3",
            "label": "Tu-22M3 Backfire",
            "era": ["Late Cold War", "Modern"],
            "shortLabel": "T22",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "Kh-22n",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "Anti-Ship"
                  ],
                  "code": "Kh-22N*2",
                  "name": "Heavy / Kh-22N / Long Range"
               },
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "FAB-250",
                        "quantity": 69
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "FAB-250*69",
                  "name": "Heavy / Kh-22n / Long Range"
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
            "filename": "tu-22.png"
         },
         "Tu-95MS": {
            "name": "Tu-95MS",
            "label": "Tu-95MS Bear",
            "era": ["Mid Cold War", "Late Cold War", "Modern"],
            "shortLabel": "95",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "Kh-65",
                        "quantity": 6
                     }
                  ],
                  "roles": [
                     "Anti-Ship"
                  ],
                  "code": "Kh-65*6",
                  "name": "Heavy / Kh-65 / Long Range"
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
            "filename": "tu-95.png"
         }
      }
   }
}

export var aircraftDatabase = new AircraftDatabase();

