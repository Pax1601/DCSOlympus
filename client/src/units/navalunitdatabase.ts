import { UnitDatabase } from "./unitdatabase"

export class NavalDatabase extends UnitDatabase {
   constructor() {
      super();
      this.blueprints = {
            "CVN-70 Carl Vinson": {
                "name": "CVN-70 Carl Vinson",
                "class": "Aircraft Carrier",
                "era": ["Mid Cold War"],
                "label": "CVN-70 Carl Vinson",
                "shortLabel": "CVN-70 Carl Vinson",
                "range": "Short",
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
      }
   }
}

export var navalDatabase = new NavalDatabase();
