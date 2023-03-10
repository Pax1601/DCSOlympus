import { similarity } from "../other/utils";
import { UnitDatabase } from "./unitdatabase"

export class AircraftDatabase extends UnitDatabase {
   constructor() {
      super();
      this.units = {

         "A-10C": {
            "name": "A-10C",
            "label": "A-10CII",
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
         "F-5E": {
            "name": "F-5E",
            "label": "F-5E",
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
                  "name": "Light / Fox 2 / Long Range"
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
         "A-50": {
            "name": "A-50",
            "label": "A-50",
            "shortLabel": "50",
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
            "label": "An-26B",
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
            "label": "An-30M",
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
            "label": "B-1B",
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
            "label": "B-52H",
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
            "label": "C-130",
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
            "label": "C-17A",
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
            "label": "E-3A",
            "shortLabel": "3",
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
               }
            ],
            "filename": "e-3.png"
         },
         "F-117A": {
            "name": "F-117A",
            "label": "F-117A",
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
         "F-14A": {
            "name": "F-14A",
            "label": "F-14A",
            "shortLabel": "14",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "fuel",
                        "quantity": 2
                     },
                     {
                        "name": "AIM-24C",
                        "quantity": 4
                     },
                     {
                        "name": "AIM-7",
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
                  "code": "AIM-54C*4,AIM-9*2,AIM-7*2",
                  "name": "Heavy / Fox 3 / Short Range"
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
         "F-15C": {
            "name": "F-15C",
            "label": "F-15C",
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
            "label": "F-15E",
            "shortLabel": "15",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "fuel",
                        "quantity": 2
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
         "F-16C bl.52d": {
            "name": "F-16C bl.52d",
            "label": "F-16C bl.52d",
            "shortLabel": "16",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "fuel",
                        "quantity": 2
                     },
                     {
                        "name": "AIM-120C",
                        "quantity": 4
                     },
                     {
                        "name": "AIM-9M",
                        "quantity": 2
                     },
                     {
                        "name": "ECM",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "AIM-120C*4,AIM-9M*2,ECM,Fuel*2",
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
                        "name": "ECM",
                        "quantity": 1
                     },
                     {
                        "name": "LIGHTNING",
                        "quantity": 1
                     },
                     {
                        "name": "Mk-84",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "Mk-84*2,AIM-120*2,ECM,Fuel*2,LIGHTNING",
                  "name": "Heavy / Fox 3, Mk-84 / Long Range"
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
         "F-4E": {
            "name": "F-4E",
            "label": "F-4E",
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
                        "name": "AIM-7",
                        "quantity": 2
                     },
                     {
                        "name": "Mk-82",
                        "quantity": 18
                     }
                  ],
                  "roles": [
                     "CAS"
                  ],
                  "code": "Mk-82*18,AIM-7*2,ECM",
                  "name": "Heavy / Fox 1, Mk-84 / Long Range"
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
         "FA-18C_hornet": {
            "name": "FA-18C_hornet",
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
                        "name": "AIM-120C",
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
                  "code": "AIM-120*4,AIM-9*2,Fuel*3",
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
                        "name": "GBU-10",
                        "quantity": 2
                     },
                     {
                        "name": "AIM-9M",
                        "quantity": 2
                     },
                     {
                        "name": "FLIR Pod",
                        "quantity": 1
                     },
                     {
                        "name": "AIM-7",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "Strike"
                  ],
                  "code": "GBU-10*2,AIM-9*2,AIM-7,FLIR Pod,Fuel*3",
                  "name": "Heavy / Fox 1, Mk-84 / Long Range"
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
         "IL-76MD": {
            "name": "IL-76MD",
            "label": "IL-76MD",
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
            "label": "IL-78M",
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
            "label": "KC-135",
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
         "MiG-23MLD": {
            "name": "MiG-23MLD",
            "label": "MiG-23MLD",
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
            "label": "MiG-25RBT",
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
                     "CAP"
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
         "MiG-27K": {
            "name": "MiG-27K",
            "label": "MiG-27K",
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
            "label": "MiG-29S",
            "shortLabel": "29",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-73M",
                        "quantity": 2
                     },
                     {
                        "name": "R-77",
                        "quantity": 4
                     },
                     {
                        "name": "Fuel-1500",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "R-73*2,R-60M*2,R-27R*2",
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
            "filename": "mig-29.png"
         },
         "MiG-31": {
            "name": "MiG-31",
            "label": "MiG-31",
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
                  "name": "Heavy / Fox 3 / Short Range"
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
         "Mirage 2000-5": {
            "name": "Mirage 2000-5",
            "label": "Mirage 2000-5",
            "shortLabel": "M2",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R 550",
                        "quantity": 2
                     },
                     {
                        "name": "SUPER 530F",
                        "quantity": 2
                     },
                     {
                        "name": "fuel",
                        "quantity": 1
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "R 550*2,SUPER 530F*2,Fuel",
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
            "filename": "m2000.png"
         },
         "MQ-9 Reaper": {
            "name": "MQ-9 Reaper",
            "label": "MQ-9 Reaper",
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
            "filename": "mig-29.png"
         },
         "Su-17M4": {
            "name": "Su-17M4",
            "label": "Su-17M4",
            "shortLabel": "17",
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
            "label": "Su-24M",
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
            "label": "Su-25",
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
                  "name": "Heavy / Rockets / Short Range"
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
            "label": "Su-27",
            "shortLabel": "27",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-73",
                        "quantity": 4
                     },
                     {
                        "name": "R-27ER",
                        "quantity": 6
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "R-73*4,R-27ER*6",
                  "name": "Heavy / Fox 3 / Short Range"
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
            "label": "Su-30",
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
                        "quantity": 4
                     },
                     {
                        "name": "R-27ER",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "R-40T*2,R-33*4",
                  "name": "Heavy / Fox 3 / Short Range"
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
            "label": "Su-33",
            "shortLabel": "33",
            "loadouts": [
               {
                  "fuel": 1,
                  "items": [
                     {
                        "name": "R-73",
                        "quantity": 4
                     },
                     {
                        "name": "R-27ER",
                        "quantity": 6
                     },
                     {
                        "name": "R-27R",
                        "quantity": 2
                     }
                  ],
                  "roles": [
                     "CAP"
                  ],
                  "code": "R-73*4,R-27R*2,R-27ER*6",
                  "name": "Heavy / Fox 3 / Short Range"
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
            "label": "Su-34",
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
         "Tu-142": {
            "name": "Tu-142",
            "label": "Tu-142",
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
                     "Strike"
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
            "filename": "tu-22.png"
         },
         "Tu-160": {
            "name": "Tu-160",
            "label": "Tu-160",
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
            "label": "Tu-22M3",
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
                     "Strike"
                  ],
                  "code": "Kh-22N*2",
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
            "label": "Tu-95MS",
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
                     "Strike"
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

