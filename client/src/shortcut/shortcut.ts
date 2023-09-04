import { keyEventWasInInput } from "../other/utils";

interface IShortcut {
    altKey?:boolean;
    callback:CallableFunction;
    ctrlKey?:boolean;
    name?:string;
    shiftKey?:boolean;
}

interface IShortcutKeyboard extends IShortcut {
    code:string;
    event?:"keydown"|"keyup";
}

interface IShortcutMouse extends IShortcut {
    button:number;
    event:"mousedown"|"mouseup";
}

export abstract class Shortcut {

    #config:IShortcut

    constructor( config:IShortcut ) {
        this.#config = config;
    }

    getConfig() {
        return this.#config;
    }

}

export class ShortcutKeyboard extends Shortcut {

    constructor( config:IShortcutKeyboard ) {

        config.event = config.event || "keyup";
        
        super( config );

        document.addEventListener( config.event, ( ev:any ) => {

            if ( ev instanceof KeyboardEvent === false || keyEventWasInInput( ev )) {
                return;
            }

            if ( config.code !== ev.code ) {
                return;
            }

            if ( ( ( typeof config.altKey !== "boolean" ) || ( typeof config.altKey === "boolean" && ev.altKey === config.altKey ) )
                && ( ( typeof config.ctrlKey !== "boolean" ) || ( typeof config.ctrlKey === "boolean" && ev.ctrlKey === config.ctrlKey ) )
                &&  ( ( typeof config.shiftKey !== "boolean" ) || ( typeof config.shiftKey === "boolean" && ev.shiftKey === config.shiftKey ) ) ) {
                    config.callback( ev );
            }
        });

    }

}

export class ShortcutMouse extends Shortcut {

    constructor( config:IShortcutMouse ) {
        super( config );
    }

}