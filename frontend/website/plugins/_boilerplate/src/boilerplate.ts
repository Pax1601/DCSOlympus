import { OlympusPlugin } from "interfaces";
import { OlympusApp } from "olympusapp";


export class BoilerplatePlugin implements OlympusPlugin {
    #app!: OlympusApp;
    
    constructor() {
    }

    /**
     * @param app <OlympusApp>
     * 
     * @returns boolean on success/fail
     */

    initialize(app: OlympusApp) : boolean {
        this.#app = app;

        return true;  //  Return true on success
    }

    getName() {
        return "Boilerplate";
    }

}