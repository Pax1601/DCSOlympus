import { OlympusApp } from "../olympusapp";
import { Manager } from "./manager";

export abstract class EventsManager extends Manager {

    constructor( olympusApp:OlympusApp ) {
        super( olympusApp );
    }

}