import { OlympusApp } from "../olympusapp";
import { Manager } from "../other/manager";
import { Panel } from "./panel";

export class PanelsManager extends Manager {

    #panels: { [key:string]: Panel } = {}

    constructor( olympusApp:OlympusApp ) {
        super( olympusApp );
    }

    get( name:string ): Panel {
        return super.get( name );
    }

}