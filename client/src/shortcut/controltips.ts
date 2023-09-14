import { OlympusApp } from "../olympusapp";
import { ShortcutManager } from "../shortcut/shortcutmanager";
import { Unit } from "../unit/unit";


export class ControlTips {

    #element:HTMLElement;
    #cursorIsHoveringOverUnit:boolean = false;
    #olympusApp:OlympusApp;
    #shortcutManager:ShortcutManager;

    constructor( ID:string, olympusApp:OlympusApp ) {

        this.#element = <HTMLElement>document.getElementById( ID );

        this.#olympusApp = olympusApp;

        this.#shortcutManager = this.#olympusApp.getShortcutManager();

        this.#shortcutManager.onKeyDown( () => {
            this.#updateTips()
        });

        this.#shortcutManager.onKeyUp( () => {
            this.#updateTips()
        });

        document.addEventListener( "unitDeselection", ( ev:CustomEvent ) => {
            this.#updateTips();
        });

        document.addEventListener( "unitMouseover", ( ev:CustomEventInit ) => {
            this.#cursorIsHoveringOverUnit = true;
            this.#updateTips();
        });

        document.addEventListener( "unitMouseout", ( ev:CustomEventInit ) => {
            this.#cursorIsHoveringOverUnit = false;
            this.#updateTips();
        });

        document.addEventListener( "unitSelection", ( ev:CustomEvent ) => {
            this.#updateTips()
        });

        this.#updateTips();

    }

    getElement() {
        return this.#element;
    }

    #getOlympusApp() {
        return this.#olympusApp;
    }

    toggle( bool?:boolean ) {
        this.getElement().classList.toggle( "hide", bool );
        this.#olympusApp.getFeatureSwitches().savePreference( "controlTips", !this.getElement().classList.contains( "hide" ) );
    }

    #updateTips() {

        const combos:Array<object> = [
            {
                "keys": [],
                "tips": [
                    {
                        "key": `W/A/S/D`,
                        "action": `Pan map`,
                        "showIfUnitSelected": false
                    },
                    {
                        "key": `SHIFT`,
                        "action": `Box select`,
                        "showIfUnitSelected": false
                    },
                    {
                        "key": `Mouse1`,
                        "action": `Deselect`,
                        "showIfUnitSelected": true
                    },
                    {
                        "key": `Mouse1+drag`,
                        "action": `Move map`,
                        "showIfUnitSelected": false
                    },
                    {
                        "key": `Mouse2`,
                        "action": `Spawn menu`,
                        "showIfUnitSelected": false
                    },
                    {
                        "key": `Mouse2`,
                        "action": `Set first waypoint`,
                        "showIfUnitSelected": true,
                        "unitsMustBeControlled": true
                    },
                    {
                        "key": `Delete`,
                        "action": `Delete unit`,
                        "showIfUnitSelected": true
                    },
                    {
                        "key": "CTRL",
                        "action": " (more...)"
                    }
                ]
            },
            {
                "keys": [ "ControlLeft" ],
                "tips": [
                    {
                        "key": `Mouse1`,
                        "action": "Toggle pin",
                        "showIfUnitSelected": false,
                        "showIfHoveringOverUnit": false
                    },
                    {
                        "key": `Mouse1`,
                        "action": "Toggle selection",
                        "showIfUnitSelected": true,
                        "showIfHoveringOverUnit": true
                    },
                    {
                        "key": `Mouse2`,
                        "action": `Add waypoint`,
                        "showIfUnitSelected": true
                    }
                ]
            },
            {
                "keys": [ "ShiftLeft" ],
                "tips": [
                    {
                        "key": `mouse1+drag`,
                        "action": "Box select"
                    }
                ]
            }
        ];

        const currentCombo:any = combos.find( (combo:any) => this.#shortcutManager.keyComboMatches( combo.keys ) ) || combos[0];

        const element = this.getElement();

        element.innerHTML = "";

        const a = this.#getOlympusApp();

        let numSelectedUnits = 0;
        let unitSelectionContainsControlled = false;

        if ( this.#getOlympusApp().getUnitsManager() ) {
            let selectedUnits = Object.values( this.#getOlympusApp().getUnitsManager().getSelectedUnits() );
            numSelectedUnits = selectedUnits.length;
            unitSelectionContainsControlled = selectedUnits.some( (unit:Unit) => unit.getControlled() );
        }


        currentCombo.tips.forEach( ( tip:any ) => {

            if ( numSelectedUnits > 0 ) {
                if ( tip.showIfUnitSelected === false ) {
                    return;
                }

                if ( tip.unitsMustBeControlled === true && unitSelectionContainsControlled === false ) {
                    return;
                }
            }

            if ( numSelectedUnits === 0 && tip.showIfUnitSelected === true ) {
                return;
            }

           // console.log( tip.action, "state:", this.#cursorIsHoveringOverUnit, "typeof", typeof tip.showIfHoveringOverUnit, "logic", tip.showIfHoveringOverUnit !== this.#cursorIsHoveringOverUnit );

            if ( typeof tip.showIfHoveringOverUnit === "boolean" && tip.showIfHoveringOverUnit !== this.#cursorIsHoveringOverUnit ) {
                return;
            }

            element.innerHTML += `<div><span class="key">${tip.key}</span><span class="action">${tip.action}</span></div>`

        });
        
        //  console.log( "----" );

    }

}