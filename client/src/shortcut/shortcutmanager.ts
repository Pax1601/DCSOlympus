import { OlympusApp } from "../olympusapp";
import { Manager } from "../other/manager";
import { Shortcut } from "./shortcut";

export class ShortcutManager extends Manager {

    #keysBeingHeld:string[] = [];
    #keyDownCallbacks:CallableFunction[] = [];
    #keyUpCallbacks:CallableFunction[] = [];

    constructor( olympusApp:OlympusApp ) {
        
        super( olympusApp );

        document.addEventListener( "keydown", ( ev:KeyboardEvent ) => {
            if ( this.#keysBeingHeld.indexOf( ev.code ) < 0 ) {
                this.#keysBeingHeld.push( ev.code )
            }
            this.#keyDownCallbacks.forEach( callback => callback( ev ) );
        });

        document.addEventListener( "keyup", ( ev:KeyboardEvent ) => {
            this.#keysBeingHeld = this.#keysBeingHeld.filter( held => held !== ev.code );
            this.#keyUpCallbacks.forEach( callback => callback( ev ) );
        });

    }

    add( name:string, shortcut:Shortcut ) {
        super.add( name, shortcut );
        return this;
    }

    getKeysBeingHeld() {
        return this.#keysBeingHeld;
    }

    keyComboMatches( combo:string[] ) {

        const heldKeys = this.getKeysBeingHeld();

        if ( combo.length !== heldKeys.length ) {
            return false;
        }

        return combo.every( key => heldKeys.indexOf( key ) > -1 );

    }

    onKeyDown( callback:CallableFunction ) {
        this.#keyDownCallbacks.push( callback );
    }

    onKeyUp( callback:CallableFunction ) {
        this.#keyUpCallbacks.push( callback );
    }

}