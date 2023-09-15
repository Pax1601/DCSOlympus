(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _ControlTips_instances, _ControlTips_element, _ControlTips_app, _ControlTips_shortcutManager, _ControlTips_cursorIsHoveringOverUnit, _ControlTips_cursorIsHoveringOverAirbase, _ControlTips_updateTips;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControlTips = void 0;
class ControlTips {
    constructor() {
        _ControlTips_instances.add(this);
        _ControlTips_element.set(this, void 0);
        _ControlTips_app.set(this, void 0);
        _ControlTips_shortcutManager.set(this, void 0);
        _ControlTips_cursorIsHoveringOverUnit.set(this, false);
        _ControlTips_cursorIsHoveringOverAirbase.set(this, false);
        __classPrivateFieldSet(this, _ControlTips_element, document.createElement("div"), "f");
        __classPrivateFieldGet(this, _ControlTips_element, "f").id = "control-tips-panel";
        document.body.appendChild(__classPrivateFieldGet(this, _ControlTips_element, "f"));
        console.log("HELLO");
    }
    getName() {
        return "Control Tips Plugin";
    }
    initialize(app) {
        __classPrivateFieldSet(this, _ControlTips_app, app, "f");
        __classPrivateFieldSet(this, _ControlTips_shortcutManager, __classPrivateFieldGet(this, _ControlTips_app, "f").getShortcutManager(), "f");
        __classPrivateFieldGet(this, _ControlTips_shortcutManager, "f").onKeyDown(() => {
            __classPrivateFieldGet(this, _ControlTips_instances, "m", _ControlTips_updateTips).call(this);
        });
        __classPrivateFieldGet(this, _ControlTips_shortcutManager, "f").onKeyUp(() => {
            __classPrivateFieldGet(this, _ControlTips_instances, "m", _ControlTips_updateTips).call(this);
        });
        document.addEventListener("airbaseMouseover", (ev) => {
            __classPrivateFieldSet(this, _ControlTips_cursorIsHoveringOverAirbase, true, "f");
            __classPrivateFieldGet(this, _ControlTips_instances, "m", _ControlTips_updateTips).call(this);
        });
        document.addEventListener("airbaseMouseout", (ev) => {
            __classPrivateFieldSet(this, _ControlTips_cursorIsHoveringOverAirbase, false, "f");
            __classPrivateFieldGet(this, _ControlTips_instances, "m", _ControlTips_updateTips).call(this);
        });
        //document.addEventListener("unitDeselection", (ev: CustomEvent) => {
        //    this.#updateTips();
        //});
        document.addEventListener("unitMouseover", (ev) => {
            __classPrivateFieldSet(this, _ControlTips_cursorIsHoveringOverUnit, true, "f");
            __classPrivateFieldGet(this, _ControlTips_instances, "m", _ControlTips_updateTips).call(this);
        });
        document.addEventListener("unitMouseout", (ev) => {
            __classPrivateFieldSet(this, _ControlTips_cursorIsHoveringOverUnit, false, "f");
            __classPrivateFieldGet(this, _ControlTips_instances, "m", _ControlTips_updateTips).call(this);
        });
        //document.addEventListener("unitSelection", (ev: CustomEvent) => {
        //    this.#updateTips()
        //});
        __classPrivateFieldGet(this, _ControlTips_instances, "m", _ControlTips_updateTips).call(this);
        return true;
    }
    getElement() {
        return __classPrivateFieldGet(this, _ControlTips_element, "f");
    }
    toggle(bool) {
        this.getElement().classList.toggle("hide", bool);
    }
}
exports.ControlTips = ControlTips;
_ControlTips_element = new WeakMap(), _ControlTips_app = new WeakMap(), _ControlTips_shortcutManager = new WeakMap(), _ControlTips_cursorIsHoveringOverUnit = new WeakMap(), _ControlTips_cursorIsHoveringOverAirbase = new WeakMap(), _ControlTips_instances = new WeakSet(), _ControlTips_updateTips = function _ControlTips_updateTips() {
    const combos = [
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
    const currentCombo = combos.find((combo) => __classPrivateFieldGet(this, _ControlTips_shortcutManager, "f").keyComboMatches(combo.keys)) || combos[0];
    const element = this.getElement();
    element.innerHTML = "";
    let numSelectedUnits = 0;
    let unitSelectionContainsControlled = false;
    if (__classPrivateFieldGet(this, _ControlTips_app, "f").getUnitsManager()) {
        let selectedUnits = Object.values(__classPrivateFieldGet(this, _ControlTips_app, "f").getUnitsManager().getSelectedUnits());
        numSelectedUnits = selectedUnits.length;
        unitSelectionContainsControlled = selectedUnits.some((unit) => unit.getControlled());
    }
    currentCombo.tips.forEach((tip) => {
        if (numSelectedUnits > 0) {
            if (tip.showIfUnitSelected === false) {
                return;
            }
            if (tip.unitsMustBeControlled === true && unitSelectionContainsControlled === false) {
                return;
            }
        }
        if (numSelectedUnits === 0 && tip.showIfUnitSelected === true) {
            return;
        }
        if (typeof tip.showIfHoveringOverAirbase === "boolean") {
            if (tip.showIfHoveringOverAirbase !== __classPrivateFieldGet(this, _ControlTips_cursorIsHoveringOverAirbase, "f")) {
                return;
            }
        }
        if (typeof tip.showIfHoveringOverUnit === "boolean") {
            if (tip.showIfHoveringOverUnit !== __classPrivateFieldGet(this, _ControlTips_cursorIsHoveringOverUnit, "f")) {
                return;
            }
        }
        element.innerHTML += `<div><span class="key">${tip.key}</span><span class="action">${tip.action}</span></div>`;
    });
};

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const controltips_1 = require("./controltips");
globalThis.getOlympusPlugin = () => {
    return new controltips_1.ControlTips();
};

},{"./controltips":1}]},{},[2]);
