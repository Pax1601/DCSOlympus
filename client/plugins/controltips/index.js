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
var _ControlTipsPlugin_instances, _ControlTipsPlugin_element, _ControlTipsPlugin_app, _ControlTipsPlugin_shortcutManager, _ControlTipsPlugin_cursorIsHoveringOverUnit, _ControlTipsPlugin_cursorIsHoveringOverAirbase, _ControlTipsPlugin_mouseoverElement, _ControlTipsPlugin_updateTips;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControlTipsPlugin = void 0;
const SHOW_CONTROL_TIPS = "Show control tips";
class ControlTipsPlugin {
    constructor() {
        _ControlTipsPlugin_instances.add(this);
        _ControlTipsPlugin_element.set(this, void 0);
        _ControlTipsPlugin_app.set(this, void 0);
        _ControlTipsPlugin_shortcutManager.set(this, void 0);
        _ControlTipsPlugin_cursorIsHoveringOverUnit.set(this, false);
        _ControlTipsPlugin_cursorIsHoveringOverAirbase.set(this, false);
        _ControlTipsPlugin_mouseoverElement.set(this, void 0);
        __classPrivateFieldSet(this, _ControlTipsPlugin_element, document.createElement("div"), "f");
        __classPrivateFieldGet(this, _ControlTipsPlugin_element, "f").id = "control-tips-panel";
        document.body.appendChild(__classPrivateFieldGet(this, _ControlTipsPlugin_element, "f"));
    }
    getName() {
        return "Control Tips Plugin";
    }
    initialize(app) {
        __classPrivateFieldSet(this, _ControlTipsPlugin_app, app, "f");
        __classPrivateFieldSet(this, _ControlTipsPlugin_shortcutManager, __classPrivateFieldGet(this, _ControlTipsPlugin_app, "f").getShortcutManager(), "f");
        __classPrivateFieldGet(this, _ControlTipsPlugin_shortcutManager, "f").onKeyDown(() => {
            __classPrivateFieldGet(this, _ControlTipsPlugin_instances, "m", _ControlTipsPlugin_updateTips).call(this);
        });
        __classPrivateFieldGet(this, _ControlTipsPlugin_shortcutManager, "f").onKeyUp(() => {
            __classPrivateFieldGet(this, _ControlTipsPlugin_instances, "m", _ControlTipsPlugin_updateTips).call(this);
        });
        document.addEventListener("airbaseMouseover", (ev) => {
            __classPrivateFieldSet(this, _ControlTipsPlugin_cursorIsHoveringOverAirbase, true, "f");
            __classPrivateFieldGet(this, _ControlTipsPlugin_instances, "m", _ControlTipsPlugin_updateTips).call(this);
        });
        document.addEventListener("airbaseMouseout", (ev) => {
            __classPrivateFieldSet(this, _ControlTipsPlugin_cursorIsHoveringOverAirbase, false, "f");
            __classPrivateFieldGet(this, _ControlTipsPlugin_instances, "m", _ControlTipsPlugin_updateTips).call(this);
        });
        document.addEventListener("unitDeselection", (ev) => {
            __classPrivateFieldGet(this, _ControlTipsPlugin_instances, "m", _ControlTipsPlugin_updateTips).call(this);
        });
        document.addEventListener("unitMouseover", (ev) => {
            __classPrivateFieldSet(this, _ControlTipsPlugin_cursorIsHoveringOverUnit, true, "f");
            __classPrivateFieldGet(this, _ControlTipsPlugin_instances, "m", _ControlTipsPlugin_updateTips).call(this);
        });
        document.addEventListener("unitMouseout", (ev) => {
            __classPrivateFieldSet(this, _ControlTipsPlugin_cursorIsHoveringOverUnit, false, "f");
            __classPrivateFieldGet(this, _ControlTipsPlugin_instances, "m", _ControlTipsPlugin_updateTips).call(this);
        });
        document.addEventListener("unitSelection", (ev) => {
            __classPrivateFieldGet(this, _ControlTipsPlugin_instances, "m", _ControlTipsPlugin_updateTips).call(this);
        });
        document.addEventListener("mapVisibilityOptionsChanged", () => {
            this.toggle(!__classPrivateFieldGet(this, _ControlTipsPlugin_app, "f").getMap().getVisibilityOptions()[SHOW_CONTROL_TIPS]);
        });
        document.addEventListener("mouseover", (ev) => {
            if (ev.target instanceof HTMLElement) {
                __classPrivateFieldSet(this, _ControlTipsPlugin_mouseoverElement, ev.target, "f");
            }
            __classPrivateFieldGet(this, _ControlTipsPlugin_instances, "m", _ControlTipsPlugin_updateTips).call(this);
        });
        __classPrivateFieldGet(this, _ControlTipsPlugin_instances, "m", _ControlTipsPlugin_updateTips).call(this);
        __classPrivateFieldGet(this, _ControlTipsPlugin_app, "f").getMap().addVisibilityOption(SHOW_CONTROL_TIPS, true);
        return true;
    }
    getElement() {
        return __classPrivateFieldGet(this, _ControlTipsPlugin_element, "f");
    }
    toggle(bool) {
        this.getElement().classList.toggle("hide", bool);
    }
}
exports.ControlTipsPlugin = ControlTipsPlugin;
_ControlTipsPlugin_element = new WeakMap(), _ControlTipsPlugin_app = new WeakMap(), _ControlTipsPlugin_shortcutManager = new WeakMap(), _ControlTipsPlugin_cursorIsHoveringOverUnit = new WeakMap(), _ControlTipsPlugin_cursorIsHoveringOverAirbase = new WeakMap(), _ControlTipsPlugin_mouseoverElement = new WeakMap(), _ControlTipsPlugin_instances = new WeakSet(), _ControlTipsPlugin_updateTips = function _ControlTipsPlugin_updateTips() {
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
    const currentCombo = combos.find((combo) => __classPrivateFieldGet(this, _ControlTipsPlugin_shortcutManager, "f").keyComboMatches(combo.keys)) || combos[0];
    const element = this.getElement();
    element.innerHTML = "";
    let numSelectedUnits = 0;
    let unitSelectionContainsControlled = false;
    if (__classPrivateFieldGet(this, _ControlTipsPlugin_app, "f").getUnitsManager()) {
        let selectedUnits = Object.values(__classPrivateFieldGet(this, _ControlTipsPlugin_app, "f").getUnitsManager().getSelectedUnits());
        numSelectedUnits = selectedUnits.length;
        unitSelectionContainsControlled = selectedUnits.some((unit) => unit.getControlled());
    }
    const tipsIncludesActiveMouseover = (currentCombo.tips.some((tip) => {
        if (!tip.mouseoverSelector) {
            return false;
        }
        if (__classPrivateFieldGet(this, _ControlTipsPlugin_mouseoverElement, "f") instanceof HTMLElement === false) {
            return false;
        }
        if (!__classPrivateFieldGet(this, _ControlTipsPlugin_mouseoverElement, "f").matches(tip.mouseoverSelector)) {
            return false;
        }
        return true;
    }));
    currentCombo.tips.filter((tip) => {
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
            if (tip.showIfHoveringOverAirbase !== __classPrivateFieldGet(this, _ControlTipsPlugin_cursorIsHoveringOverAirbase, "f")) {
                return false;
            }
        }
        if (typeof tip.showIfHoveringOverUnit === "boolean") {
            if (tip.showIfHoveringOverUnit !== __classPrivateFieldGet(this, _ControlTipsPlugin_cursorIsHoveringOverUnit, "f")) {
                return false;
            }
        }
        if (tipsIncludesActiveMouseover && typeof tip.mouseoverSelector !== "string" && !__classPrivateFieldGet(this, _ControlTipsPlugin_mouseoverElement, "f").matches(tip.mouseoverSelector)) {
            return false;
        }
        if (!tipsIncludesActiveMouseover && typeof tip.mouseoverSelector === "string") {
            return false;
        }
        return true;
    }).forEach((tip) => {
        element.innerHTML += `<div><span class="key">${tip.key}</span><span class="action">${tip.action}</span></div>`;
    });
};

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const controltipsplugin_1 = require("./controltipsplugin");
globalThis.getOlympusPlugin = () => {
    return new controltipsplugin_1.ControlTipsPlugin();
};

},{"./controltipsplugin":1}]},{},[2]);
