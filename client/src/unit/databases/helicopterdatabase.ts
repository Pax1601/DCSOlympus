import { getApp } from "../..";
import { GAME_MASTER } from "../../constants/constants";
import { UnitDatabase } from "./unitdatabase"

export class HelicopterDatabase extends UnitDatabase {
    constructor() {
        super('databases/units/helicopterdatabase');
    }

    getSpawnPointsByName(name: string) {
        if (getApp().getMissionManager().getCommandModeOptions().commandMode == GAME_MASTER || !getApp().getMissionManager().getCommandModeOptions().restrictSpawns) 
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

	getCategory() {
		return "Helicopter";
	}
}

export var helicopterDatabase = new HelicopterDatabase();

