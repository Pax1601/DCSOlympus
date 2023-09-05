import { OlympusApp } from "../../olympusapp";
import { Plugin } from "../../plugin/plugin";
import { ShortcutManager } from "../../shortcut/shortcutmanager";


export class PluginHelloWorld extends Plugin {

    #element:HTMLElement;
    #shortcutManager:ShortcutManager;

    constructor( olympusApp:OlympusApp ) {
        
        super( olympusApp, "HelloWorld" );

        const templates = {
            bar: `<div id="shortcut-bar"
                        style="
                            background-color:var( --background-steel );
                            border-radius:var( --border-radius-md );
                            bottom:100px;
                            color:white;
                            display:flex;
                            font-size:12px;
                            justify-self:center;
                            line-height:28px;
                            padding:5px;
                            position:absolute;
                            z-index:999;"></div>`
        }

        document.body.insertAdjacentHTML( "beforeend", templates.bar );

        this.#element = <HTMLElement>document.getElementById( "shortcut-bar" );

        this.#shortcutManager = this.getOlympusApp().getShortcutManager();

        this.#shortcutManager.onKeyDown( () => {
            this.#updateText()
        });

        this.#shortcutManager.onKeyUp( () => {
            this.#updateText()
        });

        this.#updateText();

    }

    #matches( combo:string[], heldKeys:string[] ) {

        if ( combo.length !== heldKeys.length ) {
            return false;
        }

        return combo.every( key => heldKeys.indexOf( key ) > -1 );

    }

    #updateText() {

        const heldKeys = this.#shortcutManager.getKeysBeingHeld();

        const combos:Array<object> = [
            {
                "keys": [],
                "text": `[CTRL]: Pin tool | [SHIFT]: box select tool<br />[Mouse1+drag]: Move map | [Mouse2]: Spawn menu `
            },
            {
                "keys": [ "ControlLeft" ],
                "text": "Mouse1: drop pin"
            },
            {
                "keys": [ "ShiftLeft" ],
                "text": "Mouse1+drag: select units"
            }
        ];

        const currentCombo:any = combos.find( (combo:any) => this.#matches( combo.keys, heldKeys ) );

        if ( currentCombo ) {
            this.#element.innerHTML = currentCombo.text;
            this.#element.classList.remove( "hide" );
        } else {
            this.#element.classList.add( "hide" );
        }

    }

}