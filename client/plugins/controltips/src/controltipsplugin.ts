const SHOW_CONTROL_TIPS = "Show control tips"

export class ControlTipsPlugin implements OlympusPlugin {
    #element: HTMLElement;
    #app: any;
    #shortcutManager: any;
    #cursorIsHoveringOverUnit: boolean = false;
    #cursorIsHoveringOverAirbase: boolean = false;
    #mouseoverElement!: HTMLElement;
    
    constructor() {
        this.#element = document.createElement("div");
        this.#element.id = "control-tips-panel";
        document.body.appendChild(this.#element);
    }

    getName() {
        return "Control Tips Plugin"
    }

    initialize(app: any) {
        this.#app = app;

        this.#shortcutManager = this.#app.getShortcutManager();

        this.#shortcutManager.onKeyDown(() => {
           this.#updateTips()
        });

        this.#shortcutManager.onKeyUp(() => {
           this.#updateTips()
        });

        document.addEventListener("airbaseMouseover", (ev: CustomEventInit) => {
            this.#cursorIsHoveringOverAirbase = true;
            this.#updateTips();
        });

        document.addEventListener("airbaseMouseout", (ev: CustomEventInit) => {
            this.#cursorIsHoveringOverAirbase = false;
            this.#updateTips();
        });

        document.addEventListener("unitDeselection", (ev: CustomEvent) => {
            this.#updateTips();
        });

        document.addEventListener("unitMouseover", (ev: CustomEventInit) => {
            this.#cursorIsHoveringOverUnit = true;
            this.#updateTips();
        });

        document.addEventListener("unitMouseout", (ev: CustomEventInit) => {
            this.#cursorIsHoveringOverUnit = false;
            this.#updateTips();
        });

        document.addEventListener("unitSelection", (ev: CustomEvent) => {
            this.#updateTips();
        });

        document.addEventListener("mapVisibilityOptionsChanged", () => {
            this.toggle( !this.#app.getMap().getVisibilityOptions()[SHOW_CONTROL_TIPS] );
        });

        document.addEventListener( "mouseover", ( ev: MouseEvent ) => {
            if ( ev.target instanceof HTMLElement ) {
                this.#mouseoverElement = <HTMLElement>ev.target;
            }
            this.#updateTips();
        });

        this.#updateTips();

        this.#app.getMap().addVisibilityOption(SHOW_CONTROL_TIPS, true);

        return true;
    }

    getElement() {
        return this.#element;
    }

    toggle(bool?: boolean) {
        this.getElement().classList.toggle("hide", bool);
    }

    #updateTips() {
        const combos: Array<object> = [
            {
                "keys": [],
                "tips": [
                    {
                        "key": `SHIFT`,
                        "action": `Box select`,
                        "showIfHoveringOverAirbase": false,
                        "showIfHoveringOverUnit": false,
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
                        "showIfHoveringOverAirbase": false,
                        "showIfHoveringOverUnit": false,
                        "showIfUnitSelected": false
                    },
                    {
                        "key": `Mouse2`,
                        "action": `Spawn menu`,
                        "showIfUnitSelected": false,
                        "showIfHoveringOverAirbase": false,
                        "showIfHoveringOverUnit": false
                    },
                    {
                        "key": `Mouse2`,
                        "action": `Quick options`,
                        "showIfUnitSelected": false,
                        "showIfHoveringOverAirbase": false,
                        "showIfHoveringOverUnit": true
                    },
                    {
                        "key": `Mouse2`,
                        "action": `Airbase menu`,
                        "showIfUnitSelected": false,
                        "showIfHoveringOverAirbase": true,
                        "showIfHoveringOverUnit": false
                    },
                    {
                        "key": `Mouse2`,
                        "action": `Set first waypoint`,
                        "showIfHoveringOverAirbase": false,
                        "showIfUnitSelected": true,
                        "unitsMustBeControlled": true
                    },
                    {
                        "key": "CTRL+Mouse2",
                        "action": "Add waypoint",
                        "showIfUnitSelected": true,
                        "showIfHoveringOverAirbase": false,
                        "unitsMustBeControlled": true
                    },
                    {
                        "key": `Mouse2 (hold)`,
                        "action": `Point operations`,
                        "showIfUnitSelected": true,
                        "showIfHoveringOverAirbase": false,
                        "showIfHoveringOverUnit": false,
                        "unitsMustBeControlled": true
                    },
                    {
                        "key": "CTRL",
                        "action": " Pin tool",
                        "showIfUnitSelected": false,
                        "showIfHoveringOverAirbase": false,
                        "showIfHoveringOverUnit": false,
                        "unitsMustBeControlled": true
                    },
                    {
                        "key": "CTRL+Mouse2",
                        "action": " Airbase menu",
                        "showIfUnitSelected": true,
                        "showIfHoveringOverAirbase": true,
                        "unitsMustBeControlled": true
                    },
                    {
                        "key": `Delete`,
                        "action": `Delete unit`,
                        "showIfHoveringOverAirbase": false,
                        "showIfUnitSelected": true
                    },
                    {
                        "key": `mouse1`,
                        "action": "Toggle Blue/Red",
                        "mouseoverSelector": "#coalition-switch .ol-switch-fill"
                    },
                    {
                        "key": `mouse2`,
                        "action": "Set Neutral",
                        "mouseoverSelector": "#coalition-switch .ol-switch-fill"
                    }
                ]
            },
            {
                "keys": ["ControlLeft"],
                "tips": [
                    {
                        "key": `Mouse1`,
                        "action": "Toggle pin",
                        "showIfUnitSelected": false,
                        "showIfHoveringOverAirbase": false,
                        "showIfHoveringOverUnit": false
                    },
                    {
                        "key": `Mouse1`,
                        "action": "Toggle selection",
                        "showIfUnitSelected": true,
                        "showIfHoveringOverAirbase": false,
                        "showIfHoveringOverUnit": true
                    },
                    {
                        "key": `Mouse2`,
                        "action": `Add waypoint`,
                        "showIfHoveringOverAirbase": false,
                        "showIfUnitSelected": true,
                        "unitsMustBeControlled": true
                    },
                    {
                        "key": `Mouse2`,
                        "action": `Airbase menu`,
                        "showIfHoveringOverAirbase": true,
                        "showIfUnitSelected": true,
                        "unitsMustBeControlled": true
                    }
                ]
            },
            {
                "keys": ["ShiftLeft"],
                "tips": [
                    {
                        "key": `mouse1+drag`,
                        "action": "Box select"
                    }
                ]
            }
        ];

        const currentCombo: any = combos.find((combo: any) => this.#shortcutManager.keyComboMatches(combo.keys)) || combos[0];

        const element = this.getElement();

        element.innerHTML = "";

        let numSelectedUnits = 0;
        let unitSelectionContainsControlled = false;

        if (this.#app.getUnitsManager()) {
            let selectedUnits = Object.values(this.#app.getUnitsManager().getSelectedUnits());
            numSelectedUnits = selectedUnits.length;
            unitSelectionContainsControlled = selectedUnits.some((unit: any) => unit.getControlled());
        }

        const tipsIncludesActiveMouseover = ( currentCombo.tips.some( ( tip:any ) => {
            if ( !tip.mouseoverSelector ) {
                return false;
            }

            if ( this.#mouseoverElement instanceof HTMLElement === false ) {
                return false;
            }

            if ( !this.#mouseoverElement.matches( tip.mouseoverSelector ) ) {
                return false;
            }

            return true;
        }));

        currentCombo.tips.filter((tip: any) => {
            if (numSelectedUnits > 0) {
                if (tip.showIfUnitSelected === false) {
                    return false;
                }

                if (tip.unitsMustBeControlled === true && unitSelectionContainsControlled === false) {
                    return false;
                }
            }

            if (numSelectedUnits === 0 && tip.showIfUnitSelected === true) {
                return false;
            }

            if (typeof tip.showIfHoveringOverAirbase === "boolean") {
                if (tip.showIfHoveringOverAirbase !== this.#cursorIsHoveringOverAirbase) {
                    return false;
                }
            }

            if (typeof tip.showIfHoveringOverUnit === "boolean") {
                if (tip.showIfHoveringOverUnit !== this.#cursorIsHoveringOverUnit) {
                    return false;
                }
            }

            if ( tipsIncludesActiveMouseover && typeof tip.mouseoverSelector !== "string" && !this.#mouseoverElement.matches( tip.mouseoverSelector ) ) {
                return false;
            }

            if ( !tipsIncludesActiveMouseover && typeof tip.mouseoverSelector === "string" ) {
                return false;
            }

            return true;

        }).forEach( (tip:any) => {
            element.innerHTML += `<div><span class="key">${tip.key}</span><span class="action">${tip.action}</span></div>`
        });
    }
}