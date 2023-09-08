import { getMissionHandler } from "../..";
import { GAME_MASTER } from "../../constants/constants";
import { UnitDatabase } from "./unitdatabase"

export class AircraftDatabase extends UnitDatabase {
    constructor() {
        super('databases/units/aircraftdatabase.json');
    }

	getCategory() {
		return "Aircraft";
    }

    getSpawnPointsByName(name: string) {
        if (getMissionHandler().getCommandModeOptions().commandMode == GAME_MASTER || !getMissionHandler().getCommandModeOptions().restrictSpawns) 
            return 0;

        const blueprint = this.getByName(name);
        if (blueprint?.cost != undefined)
            return blueprint?.cost; 
            
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
}

export var aircraftDatabase = new AircraftDatabase();

