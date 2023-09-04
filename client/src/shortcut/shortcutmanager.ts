import { OlympusApp } from "../olympusapp";
import { Manager } from "../other/manager";
import { Shortcut } from "./shortcut";

export class ShortcutManager extends Manager {

    constructor( olympusApp:OlympusApp ) {
        
        super( olympusApp );

    }

    add( name:string, shortcut:Shortcut ) {
        super.add( name, shortcut );
        return this;
    }

}