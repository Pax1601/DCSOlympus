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
var _AirUnitEditor_loadoutEditor;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AirUnitEditor = void 0;
const uniteditor_1 = require("./uniteditor");
const loadouteditor_1 = require("./loadouteditor");
const utils_1 = require("./utils");
/** Database editor for Air Units, both Aircraft and Helicopter since they are identical in terms of datbase entries.
 *
 */
class AirUnitEditor extends uniteditor_1.UnitEditor {
    constructor(contentDiv1, contentDiv2, contentDiv3) {
        super(contentDiv1, contentDiv2, contentDiv3);
        _AirUnitEditor_loadoutEditor.set(this, null);
        /* The loadout editor allows to edit the loadout (who could have thought eh?) */
        __classPrivateFieldSet(this, _AirUnitEditor_loadoutEditor, new loadouteditor_1.LoadoutEditor(this.contentDiv3), "f");
        /* Refresh the loadout editor if needed */
        this.contentDiv3.addEventListener("refresh", () => {
            var _a;
            if (this.visible)
                (_a = __classPrivateFieldGet(this, _AirUnitEditor_loadoutEditor, "f")) === null || _a === void 0 ? void 0 : _a.show();
        });
    }
    /** Sets a unit blueprint as the currently active one
     *
     * @param blueprint The blueprint to edit
     */
    setBlueprint(blueprint) {
        var _a, _b, _c, _d, _e, _f;
        this.blueprint = blueprint;
        if (this.blueprint !== null) {
            this.contentDiv2.replaceChildren();
            var title = document.createElement("label");
            title.innerText = "Unit properties";
            this.contentDiv2.appendChild(title);
            (0, utils_1.addStringInput)(this.contentDiv2, "Name", blueprint.name, "text", (value) => { blueprint.name = value; }, true);
            (0, utils_1.addStringInput)(this.contentDiv2, "Label", blueprint.label, "text", (value) => { blueprint.label = value; });
            (0, utils_1.addStringInput)(this.contentDiv2, "Short label", blueprint.shortLabel, "text", (value) => { blueprint.shortLabel = value; });
            (0, utils_1.addDropdownInput)(this.contentDiv2, "Coalition", blueprint.coalition, ["", "blue", "red"]);
            (0, utils_1.addDropdownInput)(this.contentDiv2, "Era", blueprint.era, ["WW2", "Early Cold War", "Mid Cold War", "Late Cold War", "Modern"]);
            (0, utils_1.addStringInput)(this.contentDiv2, "Filename", (_a = blueprint.filename) !== null && _a !== void 0 ? _a : "", "text", (value) => { blueprint.filename = value; });
            (0, utils_1.addStringInput)(this.contentDiv2, "Cost", (_b = String(blueprint.cost)) !== null && _b !== void 0 ? _b : "", "number", (value) => { blueprint.cost = parseFloat(value); });
            (0, utils_1.addStringInput)(this.contentDiv2, "Rufels from", (_c = String(blueprint.refuelsFrom)) !== null && _c !== void 0 ? _c : "", "text", (value) => { blueprint.refuelsFrom = value; });
            (0, utils_1.addStringInput)(this.contentDiv2, "Refueling type", (_d = String(blueprint.refuelingType)) !== null && _d !== void 0 ? _d : "", "text", (value) => { blueprint.refuelingType = value; });
            /* Add a scrollable list of loadouts that the user can edit */
            var title = document.createElement("label");
            title.innerText = "Loadouts";
            this.contentDiv2.appendChild(title);
            (0, utils_1.addLoadoutsScroll)(this.contentDiv2, (_e = blueprint.loadouts) !== null && _e !== void 0 ? _e : [], (loadout) => {
                var _a, _b;
                (_a = __classPrivateFieldGet(this, _AirUnitEditor_loadoutEditor, "f")) === null || _a === void 0 ? void 0 : _a.setLoadout(loadout);
                (_b = __classPrivateFieldGet(this, _AirUnitEditor_loadoutEditor, "f")) === null || _b === void 0 ? void 0 : _b.show();
            });
            (0, utils_1.addNewElementInput)(this.contentDiv2, (ev, input) => { this.addLoadout(input.value); });
            (_f = __classPrivateFieldGet(this, _AirUnitEditor_loadoutEditor, "f")) === null || _f === void 0 ? void 0 : _f.hide();
        }
    }
    /** Add a new empty blueprint
     *
     * @param key Blueprint key
     */
    addBlueprint(key) {
        if (this.database != null) {
            this.database.blueprints[key] = {
                name: key,
                coalition: "",
                label: "",
                shortLabel: "",
                era: "",
                loadouts: []
            };
            this.show();
            this.setBlueprint(this.database.blueprints[key]);
        }
    }
    /** Add a new empty loadout to the currently active blueprint
     *
     * @param loadoutName The name of the new loadout
     */
    addLoadout(loadoutName) {
        var _a;
        if (loadoutName && this.blueprint !== null) {
            (_a = this.blueprint.loadouts) === null || _a === void 0 ? void 0 : _a.push({
                name: loadoutName,
                code: "",
                fuel: 1,
                items: [],
                roles: []
            });
            this.setBlueprint(this.blueprint);
        }
    }
    /** Hide the editor
     *
     */
    hide() {
        var _a;
        super.hide();
        (_a = __classPrivateFieldGet(this, _AirUnitEditor_loadoutEditor, "f")) === null || _a === void 0 ? void 0 : _a.hide();
    }
}
exports.AirUnitEditor = AirUnitEditor;
_AirUnitEditor_loadoutEditor = new WeakMap();

},{"./loadouteditor":5,"./uniteditor":7,"./utils":8}],2:[function(require,module,exports){
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
var _DatabaseManagerPlugin_instances, _DatabaseManagerPlugin_app, _DatabaseManagerPlugin_element, _DatabaseManagerPlugin_mainContentContainer, _DatabaseManagerPlugin_contentDiv1, _DatabaseManagerPlugin_contentDiv2, _DatabaseManagerPlugin_contentDiv3, _DatabaseManagerPlugin_button1, _DatabaseManagerPlugin_button2, _DatabaseManagerPlugin_button3, _DatabaseManagerPlugin_button4, _DatabaseManagerPlugin_button5, _DatabaseManagerPlugin_button6, _DatabaseManagerPlugin_button7, _DatabaseManagerPlugin_button8, _DatabaseManagerPlugin_button9, _DatabaseManagerPlugin_aircraftEditor, _DatabaseManagerPlugin_helicopterEditor, _DatabaseManagerPlugin_groundUnitEditor, _DatabaseManagerPlugin_navyUnitEditor, _DatabaseManagerPlugin_hideAll, _DatabaseManagerPlugin_loadDatabases, _DatabaseManagerPlugin_saveDatabases, _DatabaseManagerPlugin_resetToDefaultDatabases, _DatabaseManagerPlugin_restoreToPreviousDatabases, _DatabaseManagerPlugin_uploadDatabase, _DatabaseManagerPlugin_resetToDefaultDatabase, _DatabaseManagerPlugin_restoreToPreviousDatabase;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseManagerPlugin = void 0;
const airuniteditor_1 = require("./airuniteditor");
const grounduniteditor_1 = require("./grounduniteditor");
const navyuniteditor_1 = require("./navyuniteditor");
/** Database Manager
 *
 * This database provides a user interface to allow easier and convenient unit databases manipulation. It allows to edit all the fields of the units databases, save them
 * on the server, and restore the defaults.
 *
 * TODO:
 * Add ability to manage liveries
 *
 */
class DatabaseManagerPlugin {
    constructor() {
        _DatabaseManagerPlugin_instances.add(this);
        _DatabaseManagerPlugin_app.set(this, null);
        _DatabaseManagerPlugin_element.set(this, void 0);
        _DatabaseManagerPlugin_mainContentContainer.set(this, void 0);
        _DatabaseManagerPlugin_contentDiv1.set(this, void 0);
        _DatabaseManagerPlugin_contentDiv2.set(this, void 0);
        _DatabaseManagerPlugin_contentDiv3.set(this, void 0);
        /* Upper tab buttons */
        _DatabaseManagerPlugin_button1.set(this, void 0);
        _DatabaseManagerPlugin_button2.set(this, void 0);
        _DatabaseManagerPlugin_button3.set(this, void 0);
        _DatabaseManagerPlugin_button4.set(this, void 0);
        /* Lower operation buttons */
        _DatabaseManagerPlugin_button5.set(this, void 0);
        _DatabaseManagerPlugin_button6.set(this, void 0);
        _DatabaseManagerPlugin_button7.set(this, void 0);
        _DatabaseManagerPlugin_button8.set(this, void 0);
        _DatabaseManagerPlugin_button9.set(this, void 0);
        /* Database editors */
        _DatabaseManagerPlugin_aircraftEditor.set(this, void 0);
        _DatabaseManagerPlugin_helicopterEditor.set(this, void 0);
        _DatabaseManagerPlugin_groundUnitEditor.set(this, void 0);
        _DatabaseManagerPlugin_navyUnitEditor.set(this, void 0);
        /* Create main HTML element */
        __classPrivateFieldSet(this, _DatabaseManagerPlugin_element, document.createElement("div"), "f");
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_element, "f").id = "database-manager-panel";
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_element, "f").oncontextmenu = () => { return false; };
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_element, "f").classList.add("ol-dialog");
        document.body.appendChild(__classPrivateFieldGet(this, _DatabaseManagerPlugin_element, "f"));
        /* Start hidden */
        this.toggle(false);
        /* Create the top tab buttons container and buttons */
        let topButtonContainer = document.createElement("div");
        __classPrivateFieldSet(this, _DatabaseManagerPlugin_button1, document.createElement("button"), "f");
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_button1, "f").classList.add("tab-button");
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_button1, "f").textContent = "Aircraft database";
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_button1, "f").onclick = () => { __classPrivateFieldGet(this, _DatabaseManagerPlugin_instances, "m", _DatabaseManagerPlugin_hideAll).call(this); __classPrivateFieldGet(this, _DatabaseManagerPlugin_aircraftEditor, "f").show(); __classPrivateFieldGet(this, _DatabaseManagerPlugin_button1, "f").classList.add("selected"); };
        topButtonContainer.appendChild(__classPrivateFieldGet(this, _DatabaseManagerPlugin_button1, "f"));
        __classPrivateFieldSet(this, _DatabaseManagerPlugin_button2, document.createElement("button"), "f");
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_button2, "f").classList.add("tab-button");
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_button2, "f").textContent = "Helicopter database";
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_button2, "f").onclick = () => { __classPrivateFieldGet(this, _DatabaseManagerPlugin_instances, "m", _DatabaseManagerPlugin_hideAll).call(this); __classPrivateFieldGet(this, _DatabaseManagerPlugin_helicopterEditor, "f").show(); __classPrivateFieldGet(this, _DatabaseManagerPlugin_button2, "f").classList.add("selected"); };
        topButtonContainer.appendChild(__classPrivateFieldGet(this, _DatabaseManagerPlugin_button2, "f"));
        __classPrivateFieldSet(this, _DatabaseManagerPlugin_button3, document.createElement("button"), "f");
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_button3, "f").classList.add("tab-button");
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_button3, "f").textContent = "Ground Unit database";
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_button3, "f").onclick = () => { __classPrivateFieldGet(this, _DatabaseManagerPlugin_instances, "m", _DatabaseManagerPlugin_hideAll).call(this); __classPrivateFieldGet(this, _DatabaseManagerPlugin_groundUnitEditor, "f").show(); __classPrivateFieldGet(this, _DatabaseManagerPlugin_button3, "f").classList.add("selected"); };
        topButtonContainer.appendChild(__classPrivateFieldGet(this, _DatabaseManagerPlugin_button3, "f"));
        __classPrivateFieldSet(this, _DatabaseManagerPlugin_button4, document.createElement("button"), "f");
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_button4, "f").classList.add("tab-button");
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_button4, "f").textContent = "Navy Unit database";
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_button4, "f").onclick = () => { __classPrivateFieldGet(this, _DatabaseManagerPlugin_instances, "m", _DatabaseManagerPlugin_hideAll).call(this); __classPrivateFieldGet(this, _DatabaseManagerPlugin_navyUnitEditor, "f").show(); __classPrivateFieldGet(this, _DatabaseManagerPlugin_button4, "f").classList.add("selected"); };
        topButtonContainer.appendChild(__classPrivateFieldGet(this, _DatabaseManagerPlugin_button4, "f"));
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_element, "f").appendChild(topButtonContainer);
        /* Create the container for the database editor elements  and the elements themselves */
        __classPrivateFieldSet(this, _DatabaseManagerPlugin_mainContentContainer, document.createElement("div"), "f");
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_mainContentContainer, "f").classList.add("dm-container");
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_element, "f").appendChild(__classPrivateFieldGet(this, _DatabaseManagerPlugin_mainContentContainer, "f"));
        __classPrivateFieldSet(this, _DatabaseManagerPlugin_contentDiv1, document.createElement("div"), "f");
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_contentDiv1, "f").classList.add("dm-content-container");
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_mainContentContainer, "f").appendChild(__classPrivateFieldGet(this, _DatabaseManagerPlugin_contentDiv1, "f"));
        __classPrivateFieldSet(this, _DatabaseManagerPlugin_contentDiv2, document.createElement("div"), "f");
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_contentDiv2, "f").classList.add("dm-content-container");
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_mainContentContainer, "f").appendChild(__classPrivateFieldGet(this, _DatabaseManagerPlugin_contentDiv2, "f"));
        __classPrivateFieldSet(this, _DatabaseManagerPlugin_contentDiv3, document.createElement("div"), "f");
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_contentDiv3, "f").classList.add("dm-content-container");
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_mainContentContainer, "f").appendChild(__classPrivateFieldGet(this, _DatabaseManagerPlugin_contentDiv3, "f"));
        /* Create the database editors, which use the three divs created before */
        __classPrivateFieldSet(this, _DatabaseManagerPlugin_aircraftEditor, new airuniteditor_1.AirUnitEditor(__classPrivateFieldGet(this, _DatabaseManagerPlugin_contentDiv1, "f"), __classPrivateFieldGet(this, _DatabaseManagerPlugin_contentDiv2, "f"), __classPrivateFieldGet(this, _DatabaseManagerPlugin_contentDiv3, "f")), "f");
        __classPrivateFieldSet(this, _DatabaseManagerPlugin_helicopterEditor, new airuniteditor_1.AirUnitEditor(__classPrivateFieldGet(this, _DatabaseManagerPlugin_contentDiv1, "f"), __classPrivateFieldGet(this, _DatabaseManagerPlugin_contentDiv2, "f"), __classPrivateFieldGet(this, _DatabaseManagerPlugin_contentDiv3, "f")), "f");
        __classPrivateFieldSet(this, _DatabaseManagerPlugin_groundUnitEditor, new grounduniteditor_1.GroundUnitEditor(__classPrivateFieldGet(this, _DatabaseManagerPlugin_contentDiv1, "f"), __classPrivateFieldGet(this, _DatabaseManagerPlugin_contentDiv2, "f"), __classPrivateFieldGet(this, _DatabaseManagerPlugin_contentDiv3, "f")), "f");
        __classPrivateFieldSet(this, _DatabaseManagerPlugin_navyUnitEditor, new navyuniteditor_1.NavyUnitEditor(__classPrivateFieldGet(this, _DatabaseManagerPlugin_contentDiv1, "f"), __classPrivateFieldGet(this, _DatabaseManagerPlugin_contentDiv2, "f"), __classPrivateFieldGet(this, _DatabaseManagerPlugin_contentDiv3, "f")), "f");
        /* Create the bottom buttons container. These buttons allow to save, restore, reset, and discard the changes */
        let bottomButtonContainer = document.createElement("div");
        __classPrivateFieldSet(this, _DatabaseManagerPlugin_button5, document.createElement("button"), "f");
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_button5, "f").textContent = "Save";
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_button5, "f").title = "Save the changes on the server";
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_button5, "f").onclick = () => { __classPrivateFieldGet(this, _DatabaseManagerPlugin_instances, "m", _DatabaseManagerPlugin_saveDatabases).call(this); };
        bottomButtonContainer.appendChild(__classPrivateFieldGet(this, _DatabaseManagerPlugin_button5, "f"));
        __classPrivateFieldSet(this, _DatabaseManagerPlugin_button6, document.createElement("button"), "f");
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_button6, "f").textContent = "Discard";
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_button6, "f").title = "Discard all changes and reload the database from the server";
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_button6, "f").onclick = () => { __classPrivateFieldGet(this, _DatabaseManagerPlugin_instances, "m", _DatabaseManagerPlugin_loadDatabases).call(this); };
        bottomButtonContainer.appendChild(__classPrivateFieldGet(this, _DatabaseManagerPlugin_button6, "f"));
        __classPrivateFieldSet(this, _DatabaseManagerPlugin_button7, document.createElement("button"), "f");
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_button7, "f").textContent = "Reset defaults";
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_button7, "f").onclick = () => { __classPrivateFieldGet(this, _DatabaseManagerPlugin_instances, "m", _DatabaseManagerPlugin_resetToDefaultDatabases).call(this); };
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_button7, "f").title = "Reset the databases to the default values";
        bottomButtonContainer.appendChild(__classPrivateFieldGet(this, _DatabaseManagerPlugin_button7, "f"));
        __classPrivateFieldSet(this, _DatabaseManagerPlugin_button8, document.createElement("button"), "f");
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_button8, "f").textContent = "Restore previous";
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_button8, "f").onclick = () => { __classPrivateFieldGet(this, _DatabaseManagerPlugin_instances, "m", _DatabaseManagerPlugin_restoreToPreviousDatabases).call(this); };
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_button8, "f").title = "Restore the previously saved databases. Use this if you saved a database by mistake.";
        bottomButtonContainer.appendChild(__classPrivateFieldGet(this, _DatabaseManagerPlugin_button8, "f"));
        __classPrivateFieldSet(this, _DatabaseManagerPlugin_button9, document.createElement("button"), "f");
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_button9, "f").textContent = "Close";
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_button9, "f").title = "Close the Database Manager";
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_button9, "f").onclick = () => { this.toggle(false); };
        bottomButtonContainer.appendChild(__classPrivateFieldGet(this, _DatabaseManagerPlugin_button9, "f"));
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_element, "f").appendChild(bottomButtonContainer);
    }
    /**
     *
     * @returns The name of the plugin
     */
    getName() {
        return "Database Control Plugin";
    }
    /** Initialize the plugin
     *
     * @param app The OlympusApp singleton
     * @returns True if successfull
     */
    initialize(app) {
        var _a;
        __classPrivateFieldSet(this, _DatabaseManagerPlugin_app, app, "f");
        /* Load the databases and initialize the editors */
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_instances, "m", _DatabaseManagerPlugin_loadDatabases).call(this);
        /* Add a button to the main Olympus App to allow the users to open the dialog */
        var mainButtonDiv = document.createElement("div");
        var mainButton = document.createElement("button");
        mainButton.textContent = "Database manager";
        mainButtonDiv.appendChild(mainButton);
        var toolbar = (_a = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _a === void 0 ? void 0 : _a.getToolbarsManager().get("primaryToolbar");
        var elements = toolbar.getMainDropdown().getOptionElements();
        var arr = Array.prototype.slice.call(elements);
        arr.splice(arr.length - 1, 0, mainButtonDiv);
        toolbar.getMainDropdown().setOptionsElements(arr);
        mainButton.onclick = () => {
            var _a;
            toolbar.getMainDropdown().close();
            if (((_a = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _a === void 0 ? void 0 : _a.getMissionManager().getCommandModeOptions().commandMode) === "Game master")
                this.toggle();
        };
        return true;
    }
    /**
     *
     * @returns The main container element
     */
    getElement() {
        return __classPrivateFieldGet(this, _DatabaseManagerPlugin_element, "f");
    }
    /** Toggles the visibility of the dialog
     *
     * @param bool Force a specific visibility state
     */
    toggle(bool) {
        if (bool)
            this.getElement().classList.toggle("hide", !bool);
        else
            this.getElement().classList.toggle("hide");
    }
}
exports.DatabaseManagerPlugin = DatabaseManagerPlugin;
_DatabaseManagerPlugin_app = new WeakMap(), _DatabaseManagerPlugin_element = new WeakMap(), _DatabaseManagerPlugin_mainContentContainer = new WeakMap(), _DatabaseManagerPlugin_contentDiv1 = new WeakMap(), _DatabaseManagerPlugin_contentDiv2 = new WeakMap(), _DatabaseManagerPlugin_contentDiv3 = new WeakMap(), _DatabaseManagerPlugin_button1 = new WeakMap(), _DatabaseManagerPlugin_button2 = new WeakMap(), _DatabaseManagerPlugin_button3 = new WeakMap(), _DatabaseManagerPlugin_button4 = new WeakMap(), _DatabaseManagerPlugin_button5 = new WeakMap(), _DatabaseManagerPlugin_button6 = new WeakMap(), _DatabaseManagerPlugin_button7 = new WeakMap(), _DatabaseManagerPlugin_button8 = new WeakMap(), _DatabaseManagerPlugin_button9 = new WeakMap(), _DatabaseManagerPlugin_aircraftEditor = new WeakMap(), _DatabaseManagerPlugin_helicopterEditor = new WeakMap(), _DatabaseManagerPlugin_groundUnitEditor = new WeakMap(), _DatabaseManagerPlugin_navyUnitEditor = new WeakMap(), _DatabaseManagerPlugin_instances = new WeakSet(), _DatabaseManagerPlugin_hideAll = function _DatabaseManagerPlugin_hideAll() {
    __classPrivateFieldGet(this, _DatabaseManagerPlugin_aircraftEditor, "f").hide();
    __classPrivateFieldGet(this, _DatabaseManagerPlugin_helicopterEditor, "f").hide();
    __classPrivateFieldGet(this, _DatabaseManagerPlugin_groundUnitEditor, "f").hide();
    __classPrivateFieldGet(this, _DatabaseManagerPlugin_navyUnitEditor, "f").hide();
    __classPrivateFieldGet(this, _DatabaseManagerPlugin_button1, "f").classList.remove("selected");
    __classPrivateFieldGet(this, _DatabaseManagerPlugin_button2, "f").classList.remove("selected");
    __classPrivateFieldGet(this, _DatabaseManagerPlugin_button3, "f").classList.remove("selected");
    __classPrivateFieldGet(this, _DatabaseManagerPlugin_button4, "f").classList.remove("selected");
}, _DatabaseManagerPlugin_loadDatabases = function _DatabaseManagerPlugin_loadDatabases() {
    var _a, _b, _c, _d;
    var aircraftDatabase = (_a = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _a === void 0 ? void 0 : _a.getAircraftDatabase();
    if (aircraftDatabase != null)
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_aircraftEditor, "f").setDatabase(aircraftDatabase);
    var helicopterDatabase = (_b = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _b === void 0 ? void 0 : _b.getHelicopterDatabase();
    if (helicopterDatabase != null)
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_helicopterEditor, "f").setDatabase(helicopterDatabase);
    var groundUnitDatabase = (_c = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _c === void 0 ? void 0 : _c.getGroundUnitDatabase();
    if (groundUnitDatabase != null)
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_groundUnitEditor, "f").setDatabase(groundUnitDatabase);
    var navyUnitDatabase = (_d = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _d === void 0 ? void 0 : _d.getNavyUnitDatabase();
    if (navyUnitDatabase != null)
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_navyUnitEditor, "f").setDatabase(navyUnitDatabase);
    __classPrivateFieldGet(this, _DatabaseManagerPlugin_instances, "m", _DatabaseManagerPlugin_hideAll).call(this);
    __classPrivateFieldGet(this, _DatabaseManagerPlugin_aircraftEditor, "f").show();
    __classPrivateFieldGet(this, _DatabaseManagerPlugin_button1, "f").classList.add("selected");
}, _DatabaseManagerPlugin_saveDatabases = function _DatabaseManagerPlugin_saveDatabases() {
    var aircraftDatabase = __classPrivateFieldGet(this, _DatabaseManagerPlugin_aircraftEditor, "f").getDatabase();
    if (aircraftDatabase) {
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_instances, "m", _DatabaseManagerPlugin_uploadDatabase).call(this, aircraftDatabase, "aircraftdatabase", "Aircraft database", () => {
            var helicopterDatabase = __classPrivateFieldGet(this, _DatabaseManagerPlugin_helicopterEditor, "f").getDatabase();
            if (helicopterDatabase) {
                __classPrivateFieldGet(this, _DatabaseManagerPlugin_instances, "m", _DatabaseManagerPlugin_uploadDatabase).call(this, helicopterDatabase, "helicopterDatabase", "Helicopter database", () => {
                    var groundUnitDatabase = __classPrivateFieldGet(this, _DatabaseManagerPlugin_groundUnitEditor, "f").getDatabase();
                    if (groundUnitDatabase) {
                        __classPrivateFieldGet(this, _DatabaseManagerPlugin_instances, "m", _DatabaseManagerPlugin_uploadDatabase).call(this, groundUnitDatabase, "groundUnitDatabase", "Ground Unit database", () => {
                            var navyUnitDatabase = __classPrivateFieldGet(this, _DatabaseManagerPlugin_navyUnitEditor, "f").getDatabase();
                            if (navyUnitDatabase) {
                                __classPrivateFieldGet(this, _DatabaseManagerPlugin_instances, "m", _DatabaseManagerPlugin_uploadDatabase).call(this, navyUnitDatabase, "navyUnitDatabase", "Navy Unit database", () => {
                                    var _a, _b, _c, _d, _e;
                                    (_a = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _a === void 0 ? void 0 : _a.getAircraftDatabase().load(() => { });
                                    (_b = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _b === void 0 ? void 0 : _b.getHelicopterDatabase().load(() => { });
                                    (_c = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _c === void 0 ? void 0 : _c.getGroundUnitDatabase().load(() => { });
                                    (_d = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _d === void 0 ? void 0 : _d.getNavyUnitDatabase().load(() => { });
                                    (_e = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _e === void 0 ? void 0 : _e.getServerManager().reloadDatabases(() => {
                                        var _a, _b;
                                        (_b = (_a = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _a === void 0 ? void 0 : _a.getPopupsManager().get("infoPopup")) === null || _b === void 0 ? void 0 : _b.setText("Olympus core databases reloaded");
                                    });
                                });
                            }
                        });
                    }
                });
            }
        });
    }
}, _DatabaseManagerPlugin_resetToDefaultDatabases = function _DatabaseManagerPlugin_resetToDefaultDatabases() {
    __classPrivateFieldGet(this, _DatabaseManagerPlugin_instances, "m", _DatabaseManagerPlugin_resetToDefaultDatabase).call(this, "aircraftdatabase", "Aircraft database", () => {
        var _a;
        (_a = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _a === void 0 ? void 0 : _a.getAircraftDatabase().load(() => {
            __classPrivateFieldGet(this, _DatabaseManagerPlugin_instances, "m", _DatabaseManagerPlugin_resetToDefaultDatabase).call(this, "helicopterdatabase", "Helicopter database", () => {
                var _a;
                (_a = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _a === void 0 ? void 0 : _a.getHelicopterDatabase().load(() => {
                    __classPrivateFieldGet(this, _DatabaseManagerPlugin_instances, "m", _DatabaseManagerPlugin_resetToDefaultDatabase).call(this, "groundunitdatabase", "Ground Unit database", () => {
                        var _a;
                        (_a = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _a === void 0 ? void 0 : _a.getGroundUnitDatabase().load(() => {
                            __classPrivateFieldGet(this, _DatabaseManagerPlugin_instances, "m", _DatabaseManagerPlugin_resetToDefaultDatabase).call(this, "navyunitdatabase", "Navy Unit database", () => {
                                var _a;
                                (_a = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _a === void 0 ? void 0 : _a.getNavyUnitDatabase().load(() => {
                                    var _a;
                                    __classPrivateFieldGet(this, _DatabaseManagerPlugin_instances, "m", _DatabaseManagerPlugin_loadDatabases).call(this);
                                    (_a = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _a === void 0 ? void 0 : _a.getServerManager().reloadDatabases(() => {
                                        var _a, _b;
                                        (_b = (_a = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _a === void 0 ? void 0 : _a.getPopupsManager().get("infoPopup")) === null || _b === void 0 ? void 0 : _b.setText("Olympus core databases reloaded");
                                    });
                                    __classPrivateFieldGet(this, _DatabaseManagerPlugin_instances, "m", _DatabaseManagerPlugin_hideAll).call(this);
                                    __classPrivateFieldGet(this, _DatabaseManagerPlugin_aircraftEditor, "f").show();
                                    __classPrivateFieldGet(this, _DatabaseManagerPlugin_button1, "f").classList.add("selected");
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}, _DatabaseManagerPlugin_restoreToPreviousDatabases = function _DatabaseManagerPlugin_restoreToPreviousDatabases() {
    __classPrivateFieldGet(this, _DatabaseManagerPlugin_instances, "m", _DatabaseManagerPlugin_restoreToPreviousDatabase).call(this, "aircraftdatabase", "Aircraft database", () => {
        var _a;
        (_a = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _a === void 0 ? void 0 : _a.getAircraftDatabase().load(() => {
            __classPrivateFieldGet(this, _DatabaseManagerPlugin_instances, "m", _DatabaseManagerPlugin_restoreToPreviousDatabase).call(this, "helicopterdatabase", "Helicopter database", () => {
                var _a;
                (_a = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _a === void 0 ? void 0 : _a.getHelicopterDatabase().load(() => {
                    __classPrivateFieldGet(this, _DatabaseManagerPlugin_instances, "m", _DatabaseManagerPlugin_restoreToPreviousDatabase).call(this, "groundunitdatabase", "Ground Unit database", () => {
                        var _a;
                        (_a = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _a === void 0 ? void 0 : _a.getGroundUnitDatabase().load(() => {
                            __classPrivateFieldGet(this, _DatabaseManagerPlugin_instances, "m", _DatabaseManagerPlugin_restoreToPreviousDatabase).call(this, "navyunitdatabase", "Navy Unit database", () => {
                                var _a;
                                (_a = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _a === void 0 ? void 0 : _a.getNavyUnitDatabase().load(() => {
                                    var _a;
                                    __classPrivateFieldGet(this, _DatabaseManagerPlugin_instances, "m", _DatabaseManagerPlugin_loadDatabases).call(this);
                                    (_a = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _a === void 0 ? void 0 : _a.getServerManager().reloadDatabases(() => {
                                        var _a, _b;
                                        (_b = (_a = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _a === void 0 ? void 0 : _a.getPopupsManager().get("infoPopup")) === null || _b === void 0 ? void 0 : _b.setText("Olympus core databases reloaded");
                                    });
                                    __classPrivateFieldGet(this, _DatabaseManagerPlugin_instances, "m", _DatabaseManagerPlugin_hideAll).call(this);
                                    __classPrivateFieldGet(this, _DatabaseManagerPlugin_aircraftEditor, "f").show();
                                    __classPrivateFieldGet(this, _DatabaseManagerPlugin_button1, "f").classList.add("selected");
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}, _DatabaseManagerPlugin_uploadDatabase = function _DatabaseManagerPlugin_uploadDatabase(database, name, label, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("PUT", "/api/databases/save/units/" + name);
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.onload = (res) => {
        var _a, _b, _c, _d;
        if (xmlHttp.status == 200) {
            (_b = (_a = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _a === void 0 ? void 0 : _a.getPopupsManager().get("infoPopup")) === null || _b === void 0 ? void 0 : _b.setText(label + " saved successfully");
            callback();
        }
        else {
            (_d = (_c = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _c === void 0 ? void 0 : _c.getPopupsManager().get("infoPopup")) === null || _d === void 0 ? void 0 : _d.setText("An error has occurred while saving the " + label);
        }
    };
    xmlHttp.onerror = (res) => {
        var _a, _b;
        (_b = (_a = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _a === void 0 ? void 0 : _a.getPopupsManager().get("infoPopup")) === null || _b === void 0 ? void 0 : _b.setText("An error has occurred while saving the " + label);
    };
    xmlHttp.send(JSON.stringify(database));
}, _DatabaseManagerPlugin_resetToDefaultDatabase = function _DatabaseManagerPlugin_resetToDefaultDatabase(name, label, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("PUT", "/api/databases/reset/units/" + name);
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.onload = (res) => {
        var _a, _b, _c, _d;
        if (xmlHttp.status == 200) {
            (_b = (_a = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _a === void 0 ? void 0 : _a.getPopupsManager().get("infoPopup")) === null || _b === void 0 ? void 0 : _b.setText(label + " reset successfully");
            callback();
        }
        else {
            (_d = (_c = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _c === void 0 ? void 0 : _c.getPopupsManager().get("infoPopup")) === null || _d === void 0 ? void 0 : _d.setText("An error has occurred while resetting the " + label);
        }
    };
    xmlHttp.onerror = (res) => {
        var _a, _b;
        (_b = (_a = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _a === void 0 ? void 0 : _a.getPopupsManager().get("infoPopup")) === null || _b === void 0 ? void 0 : _b.setText("An error has occurred while resetting the " + label);
    };
    xmlHttp.send("");
}, _DatabaseManagerPlugin_restoreToPreviousDatabase = function _DatabaseManagerPlugin_restoreToPreviousDatabase(name, label, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("PUT", "/api/databases/restore/units/" + name);
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.onload = (res) => {
        var _a, _b, _c, _d;
        if (xmlHttp.status == 200) {
            (_b = (_a = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _a === void 0 ? void 0 : _a.getPopupsManager().get("infoPopup")) === null || _b === void 0 ? void 0 : _b.setText(label + " restored successfully");
            callback();
        }
        else {
            (_d = (_c = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _c === void 0 ? void 0 : _c.getPopupsManager().get("infoPopup")) === null || _d === void 0 ? void 0 : _d.setText("An error has occurred while restoring the " + label);
        }
    };
    xmlHttp.onerror = (res) => {
        var _a, _b;
        (_b = (_a = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _a === void 0 ? void 0 : _a.getPopupsManager().get("infoPopup")) === null || _b === void 0 ? void 0 : _b.setText("An error has occurred while restoring the " + label);
    };
    xmlHttp.send("");
};

},{"./airuniteditor":1,"./grounduniteditor":3,"./navyuniteditor":6}],3:[function(require,module,exports){
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
var _GroundUnitEditor_blueprint;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroundUnitEditor = void 0;
const uniteditor_1 = require("./uniteditor");
const utils_1 = require("./utils");
/** Database editor for ground units
 *
 */
class GroundUnitEditor extends uniteditor_1.UnitEditor {
    constructor(contentDiv1, contentDiv2, contentDiv3) {
        super(contentDiv1, contentDiv2, contentDiv3);
        _GroundUnitEditor_blueprint.set(this, null);
    }
    /** Sets a unit blueprint as the currently active one
     *
     * @param blueprint The blueprint to edit
     */
    setBlueprint(blueprint) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        __classPrivateFieldSet(this, _GroundUnitEditor_blueprint, blueprint, "f");
        if (__classPrivateFieldGet(this, _GroundUnitEditor_blueprint, "f") !== null) {
            this.contentDiv2.replaceChildren();
            var title = document.createElement("label");
            title.innerText = "Unit properties";
            this.contentDiv2.appendChild(title);
            (0, utils_1.addStringInput)(this.contentDiv2, "Name", blueprint.name, "text", (value) => { blueprint.name = value; }, true);
            (0, utils_1.addStringInput)(this.contentDiv2, "Label", blueprint.label, "text", (value) => { blueprint.label = value; });
            (0, utils_1.addStringInput)(this.contentDiv2, "Short label", blueprint.shortLabel, "text", (value) => { blueprint.shortLabel = value; });
            (0, utils_1.addStringInput)(this.contentDiv2, "Type", (_a = blueprint.type) !== null && _a !== void 0 ? _a : "", "text", (value) => { blueprint.type = value; });
            (0, utils_1.addDropdownInput)(this.contentDiv2, "Coalition", blueprint.coalition, ["", "blue", "red"]);
            (0, utils_1.addDropdownInput)(this.contentDiv2, "Era", blueprint.era, ["WW2", "Early Cold War", "Mid Cold War", "Late Cold War", "Modern"]);
            //addStringInput(this.contentDiv2, "Filename", blueprint.filename?? "", "text", (value: string) => {blueprint.filename = value; });
            (0, utils_1.addStringInput)(this.contentDiv2, "Cost", (_b = String(blueprint.cost)) !== null && _b !== void 0 ? _b : "", "number", (value) => { blueprint.cost = parseFloat(value); });
            (0, utils_1.addStringInput)(this.contentDiv2, "Acquisition range [NM]", (_c = String(blueprint.acquisitionRange)) !== null && _c !== void 0 ? _c : "", "number", (value) => { blueprint.acquisitionRange = parseFloat(value); });
            (0, utils_1.addStringInput)(this.contentDiv2, "Engagement range [NM]", (_d = String(blueprint.engagementRange)) !== null && _d !== void 0 ? _d : "", "number", (value) => { blueprint.engagementRange = parseFloat(value); });
            (0, utils_1.addStringInput)(this.contentDiv2, "Barrel height [m]", (_e = String(blueprint.barrelHeight)) !== null && _e !== void 0 ? _e : "", "number", (value) => { blueprint.barrelHeight = parseFloat(value); });
            (0, utils_1.addStringInput)(this.contentDiv2, "Muzzle velocity [m/s]", (_f = String(blueprint.muzzleVelocity)) !== null && _f !== void 0 ? _f : "", "number", (value) => { blueprint.muzzleVelocity = parseFloat(value); });
            (0, utils_1.addStringInput)(this.contentDiv2, "Aim time [s]", (_g = String(blueprint.aimTime)) !== null && _g !== void 0 ? _g : "", "number", (value) => { blueprint.aimTime = parseFloat(value); });
            (0, utils_1.addStringInput)(this.contentDiv2, "Burst quantity", (_h = String(blueprint.shotsToFire)) !== null && _h !== void 0 ? _h : "", "number", (value) => { blueprint.shotsToFire = Math.round(parseFloat(value)); });
        }
    }
    /** Add a new empty blueprint
     *
     * @param key Blueprint key
     */
    addBlueprint(key) {
        if (this.database != null) {
            this.database.blueprints[key] = {
                name: key,
                coalition: "",
                label: "",
                shortLabel: "",
                era: ""
            };
            this.show();
            this.setBlueprint(this.database.blueprints[key]);
        }
    }
}
exports.GroundUnitEditor = GroundUnitEditor;
_GroundUnitEditor_blueprint = new WeakMap();

},{"./uniteditor":7,"./utils":8}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const databasemanagerplugin_1 = require("./databasemanagerplugin");
globalThis.getOlympusPlugin = () => {
    return new databasemanagerplugin_1.DatabaseManagerPlugin();
};

},{"./databasemanagerplugin":2}],5:[function(require,module,exports){
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
var _LoadoutEditor_contentDiv, _LoadoutEditor_loadout, _LoadoutEditor_visible;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadoutEditor = void 0;
const utils_1 = require("./utils");
/** The LoadoutEditor allows the user to edit a loadout
 *
 */
class LoadoutEditor {
    constructor(contentDiv) {
        _LoadoutEditor_contentDiv.set(this, void 0);
        _LoadoutEditor_loadout.set(this, null);
        _LoadoutEditor_visible.set(this, false);
        __classPrivateFieldSet(this, _LoadoutEditor_contentDiv, contentDiv, "f");
        __classPrivateFieldGet(this, _LoadoutEditor_contentDiv, "f").addEventListener("refresh", () => {
            if (__classPrivateFieldGet(this, _LoadoutEditor_visible, "f"))
                this.show();
        });
    }
    /** Set the loadout to edit
     *
     * @param loadout The loadout to edit
     */
    setLoadout(loadout) {
        __classPrivateFieldSet(this, _LoadoutEditor_loadout, loadout, "f");
    }
    /** Show the editor
     *
     */
    show() {
        __classPrivateFieldSet(this, _LoadoutEditor_visible, true, "f");
        __classPrivateFieldGet(this, _LoadoutEditor_contentDiv, "f").replaceChildren();
        var title = document.createElement("label");
        title.innerText = "Loadout properties";
        __classPrivateFieldGet(this, _LoadoutEditor_contentDiv, "f").appendChild(title);
        if (__classPrivateFieldGet(this, _LoadoutEditor_loadout, "f")) {
            var laodout = __classPrivateFieldGet(this, _LoadoutEditor_loadout, "f");
            (0, utils_1.addStringInput)(__classPrivateFieldGet(this, _LoadoutEditor_contentDiv, "f"), "Name", laodout.name, "text", (value) => { laodout.name = value; __classPrivateFieldGet(this, _LoadoutEditor_contentDiv, "f").dispatchEvent(new Event("refresh")); });
            (0, utils_1.addStringInput)(__classPrivateFieldGet(this, _LoadoutEditor_contentDiv, "f"), "Code", laodout.code, "text", (value) => { laodout.code = value; });
            (0, utils_1.addLoadoutItemsEditor)(__classPrivateFieldGet(this, _LoadoutEditor_contentDiv, "f"), __classPrivateFieldGet(this, _LoadoutEditor_loadout, "f"));
        }
    }
    /** Hide the editor
     *
     */
    hide() {
        __classPrivateFieldSet(this, _LoadoutEditor_visible, false, "f");
        __classPrivateFieldGet(this, _LoadoutEditor_contentDiv, "f").replaceChildren();
    }
}
exports.LoadoutEditor = LoadoutEditor;
_LoadoutEditor_contentDiv = new WeakMap(), _LoadoutEditor_loadout = new WeakMap(), _LoadoutEditor_visible = new WeakMap();

},{"./utils":8}],6:[function(require,module,exports){
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
var _NavyUnitEditor_blueprint;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavyUnitEditor = void 0;
const uniteditor_1 = require("./uniteditor");
const utils_1 = require("./utils");
/** Database editor for navy units
 *
 */
class NavyUnitEditor extends uniteditor_1.UnitEditor {
    constructor(contentDiv1, contentDiv2, contentDiv3) {
        super(contentDiv1, contentDiv2, contentDiv3);
        _NavyUnitEditor_blueprint.set(this, null);
    }
    /** Sets a unit blueprint as the currently active one
     *
     * @param blueprint The blueprint to edit
     */
    setBlueprint(blueprint) {
        var _a, _b, _c, _d;
        __classPrivateFieldSet(this, _NavyUnitEditor_blueprint, blueprint, "f");
        if (__classPrivateFieldGet(this, _NavyUnitEditor_blueprint, "f") !== null) {
            this.contentDiv2.replaceChildren();
            var title = document.createElement("label");
            title.innerText = "Unit properties";
            this.contentDiv2.appendChild(title);
            (0, utils_1.addStringInput)(this.contentDiv2, "Name", blueprint.name, "text", (value) => { blueprint.name = value; }, true);
            (0, utils_1.addStringInput)(this.contentDiv2, "Label", blueprint.label, "text", (value) => { blueprint.label = value; });
            (0, utils_1.addStringInput)(this.contentDiv2, "Short label", blueprint.shortLabel, "text", (value) => { blueprint.shortLabel = value; });
            (0, utils_1.addStringInput)(this.contentDiv2, "Type", (_a = blueprint.type) !== null && _a !== void 0 ? _a : "", "text", (value) => { blueprint.type = value; });
            (0, utils_1.addDropdownInput)(this.contentDiv2, "Coalition", blueprint.coalition, ["", "blue", "red"]);
            (0, utils_1.addDropdownInput)(this.contentDiv2, "Era", blueprint.era, ["WW2", "Early Cold War", "Mid Cold War", "Late Cold War", "Modern"]);
            //addStringInput(this.contentDiv2, "Filename", blueprint.filename?? "", "text", (value: string) => {blueprint.filename = value; });
            (0, utils_1.addStringInput)(this.contentDiv2, "Cost", (_b = String(blueprint.cost)) !== null && _b !== void 0 ? _b : "", "number", (value) => { blueprint.cost = parseFloat(value); });
            (0, utils_1.addStringInput)(this.contentDiv2, "Barrel height [m]", (_c = String(blueprint.barrelHeight)) !== null && _c !== void 0 ? _c : "", "number", (value) => { blueprint.barrelHeight = parseFloat(value); });
            (0, utils_1.addStringInput)(this.contentDiv2, "Muzzle velocity [m/s]", (_d = String(blueprint.muzzleVelocity)) !== null && _d !== void 0 ? _d : "", "number", (value) => { blueprint.muzzleVelocity = parseFloat(value); });
        }
    }
    /** Add a new empty blueprint
     *
     * @param key Blueprint key
     */
    addBlueprint(key) {
        if (this.database != null) {
            this.database.blueprints[key] = {
                name: key,
                coalition: "",
                label: "",
                shortLabel: "",
                era: ""
            };
            this.show();
            this.setBlueprint(this.database.blueprints[key]);
        }
    }
}
exports.NavyUnitEditor = NavyUnitEditor;
_NavyUnitEditor_blueprint = new WeakMap();

},{"./uniteditor":7,"./utils":8}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitEditor = void 0;
const utils_1 = require("./utils");
/** Base abstract class of Unit database editors
 *
 */
class UnitEditor {
    constructor(contentDiv1, contentDiv2, contentDiv3) {
        this.blueprint = null;
        this.database = null;
        this.visible = false;
        this.contentDiv1 = contentDiv1;
        this.contentDiv2 = contentDiv2;
        this.contentDiv3 = contentDiv3;
        /* Refresh the list of units if it changes */
        this.contentDiv1.addEventListener("refresh", () => {
            if (this.visible)
                this.show();
        });
        /* If the unit properties or loadout are edited, reload the editor */
        this.contentDiv2.addEventListener("refresh", () => {
            if (this.visible) {
                if (this.blueprint !== null)
                    this.setBlueprint(this.blueprint);
            }
        });
        this.contentDiv3.addEventListener("refresh", () => {
            if (this.visible) {
                if (this.blueprint !== null)
                    this.setBlueprint(this.blueprint);
            }
        });
    }
    /**
     *
     * @param database The database that the editor will operate on
     */
    setDatabase(database) {
        this.database = JSON.parse(JSON.stringify(database));
    }
    /** Show the editor
     *
     */
    show() {
        this.visible = true;
        this.contentDiv1.replaceChildren();
        this.contentDiv2.replaceChildren();
        this.contentDiv3.replaceChildren();
        /* Create the list of units. Each unit is clickable to activate the editor on it */
        if (this.database != null) {
            var title = document.createElement("label");
            title.innerText = "Units list";
            this.contentDiv1.appendChild(title);
            (0, utils_1.addBlueprintsScroll)(this.contentDiv1, this.database, (key) => {
                if (this.database != null)
                    this.setBlueprint(this.database.blueprints[key]);
            });
            (0, utils_1.addNewElementInput)(this.contentDiv1, (ev, input) => {
                if (input.value != "")
                    this.addBlueprint((input).value);
            });
        }
    }
    /** Hid the editor
     *
     */
    hide() {
        this.visible = false;
        this.contentDiv1.replaceChildren();
        this.contentDiv2.replaceChildren();
        this.contentDiv3.replaceChildren();
    }
    /**
     *
     * @returns The edited database
     */
    getDatabase() {
        return this.database;
    }
}
exports.UnitEditor = UnitEditor;

},{"./utils":8}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addLoadoutsScroll = exports.addBlueprintsScroll = exports.addNewElementInput = exports.addLoadoutItemsEditor = exports.addDropdownInput = exports.addStringInput = void 0;
/** This file contains a set of utility functions that are reused in the various editors and allows to declutter the classes
 *
 */
/** Add a string input in the form of String: [ value ]
 *
 * @param div The HTMLElement that will contain the input
 * @param key The key of the input, which will be used as label
 * @param value The initial value of the input
 * @param type The type of the input, e.g. "Text" or "Number" as per html standard
 * @param callback Callback called when the user enters a new value
 * @param disabled If true, the input will be disabled and read only
 */
function addStringInput(div, key, value, type, callback, disabled) {
    var row = document.createElement("div");
    var dt = document.createElement("dt");
    var dd = document.createElement("dd");
    dt.innerText = key;
    var input = document.createElement("input");
    input.value = value;
    input.textContent = value;
    input.type = type !== null && type !== void 0 ? type : "text";
    input.disabled = disabled !== null && disabled !== void 0 ? disabled : false;
    input.onchange = () => callback(input.value);
    dd.appendChild(input);
    row.appendChild(dt);
    row.appendChild(dd);
    row.classList.add("input-row");
    div.appendChild(row);
}
exports.addStringInput = addStringInput;
/** Add a dropdown (select) input
 *
 * @param div The HTMLElement that will contain the input
 * @param key The key of the input, which will be used as label
 * @param value The initial value of the input
 * @param options The dropdown options
 */
function addDropdownInput(div, key, value, options) {
    var row = document.createElement("div");
    var dt = document.createElement("dt");
    var dd = document.createElement("dd");
    dt.innerText = key;
    var select = document.createElement("select");
    options.forEach((option) => {
        var el = document.createElement("option");
        el.value = option;
        el.innerText = option;
        select.appendChild(el);
    });
    select.value = value;
    dd.appendChild(select);
    row.appendChild(dt);
    row.appendChild(dd);
    row.classList.add("input-row");
    div.appendChild(row);
}
exports.addDropdownInput = addDropdownInput;
/** Create a loadout items editor. This editor allows to add or remove loadout items, as well as changing their name and quantity
 *
 * @param div The HTMLElement that will contain the editor
 * @param loadout The loadout to edit
 */
function addLoadoutItemsEditor(div, loadout) {
    var itemsEl = document.createElement("div");
    itemsEl.classList.add("dm-scroll-container", "dm-items-container");
    /* Create a row for each loadout item to allow and change the name and quantity of the item itself */
    loadout.items.forEach((item, index) => {
        var rowDiv = document.createElement("div");
        var nameLabel = document.createElement("label");
        nameLabel.innerText = "Name";
        rowDiv.appendChild(nameLabel);
        var nameInput = document.createElement("input");
        rowDiv.appendChild(nameInput);
        nameInput.textContent = item.name;
        nameInput.value = item.name;
        nameInput.onchange = () => { loadout.items[index].name = nameInput.value; };
        var quantityLabel = document.createElement("label");
        quantityLabel.innerText = "Quantity";
        rowDiv.appendChild(quantityLabel);
        var quantityInput = document.createElement("input");
        rowDiv.appendChild(quantityInput);
        quantityInput.textContent = String(item.quantity);
        quantityInput.value = String(item.quantity);
        quantityInput.type = "number";
        quantityInput.step = "1";
        quantityInput.onchange = () => { loadout.items[index].quantity = parseInt(quantityInput.value); };
        /* This button allows to remove the item */
        var button = document.createElement("button");
        button.innerText = "X";
        button.onclick = () => {
            loadout.items.splice(index, 1);
            div.dispatchEvent(new Event("refresh"));
        };
        rowDiv.appendChild(button);
        itemsEl.appendChild(rowDiv);
    });
    div.appendChild(itemsEl);
    /* Button to add a new item to the loadout */
    var inputDiv = document.createElement("div");
    inputDiv.classList.add("dm-new-item-input");
    var button = document.createElement("button");
    button.innerText = "Add";
    inputDiv.appendChild(button);
    div.appendChild(inputDiv);
    button.addEventListener("click", (ev) => {
        loadout === null || loadout === void 0 ? void 0 : loadout.items.push({
            name: "",
            quantity: 1
        });
        div.dispatchEvent(new Event("refresh"));
    });
}
exports.addLoadoutItemsEditor = addLoadoutItemsEditor;
/** Add a input and button to create a new element in a list. It uses a generic callback to actually add the element.
 *
 * @param div The HTMLElement that will contain the input and button
 * @param callback Callback called when the user clicks on "Add"
 */
function addNewElementInput(div, callback) {
    var inputDiv = document.createElement("div");
    inputDiv.classList.add("dm-new-element-input");
    var input = document.createElement("input");
    inputDiv.appendChild(input);
    var button = document.createElement("button");
    button.innerText = "Add";
    button.addEventListener("click", (ev) => callback(ev, input));
    inputDiv.appendChild(button);
    div.appendChild(inputDiv);
}
exports.addNewElementInput = addNewElementInput;
/** Add a scrollable list of blueprints
 *
 * @param div The HTMLElement that will contain the list
 * @param database The database that will be used to fill the list of blueprints
 * @param callback Callback called when the user clicks on one of the elements
 */
function addBlueprintsScroll(div, database, callback) {
    var scrollDiv = document.createElement("div");
    scrollDiv.classList.add("dm-scroll-container");
    if (database !== null) {
        var blueprints = database.blueprints;
        for (let key in Object.keys(blueprints).sort()) {
            var rowDiv = document.createElement("div");
            scrollDiv.appendChild(rowDiv);
            var text = document.createElement("label");
            text.textContent = key;
            text.onclick = () => callback(key);
            rowDiv.appendChild(text);
            /* This button allows to remove an element from the list. It requires a refresh. */
            var button = document.createElement("button");
            button.innerText = "X";
            button.onclick = () => {
                delete blueprints[key];
                div.dispatchEvent(new Event("refresh"));
            };
            rowDiv.appendChild(button);
        }
    }
    div.appendChild(scrollDiv);
}
exports.addBlueprintsScroll = addBlueprintsScroll;
/** Add a scrollable list of loadouts
 *
 * @param div The HTMLElement that will contain the list
 * @param loadouts The loadouts that will be used to fill the list
 * @param callback Callback called when the user clicks on one of the elements
 */
function addLoadoutsScroll(div, loadouts, callback) {
    var loadoutsEl = document.createElement("div");
    loadoutsEl.classList.add("dm-scroll-container", "dm-loadout-container");
    loadouts.forEach((loadout, index) => {
        var rowDiv = document.createElement("div");
        loadoutsEl.appendChild(rowDiv);
        var text = document.createElement("label");
        text.textContent = loadout.name;
        text.onclick = () => { callback(loadout); };
        rowDiv.appendChild(text);
        /* The "Empty loadout" can not be removed */
        if (loadout.name !== "Empty loadout") {
            /* This button allows to remove an element from the list. It requires a refresh. */
            var button = document.createElement("button");
            button.innerText = "X";
            button.onclick = () => {
                loadouts.splice(index, 1);
                div.dispatchEvent(new Event("refresh"));
            };
            rowDiv.appendChild(button);
        }
    });
    div.appendChild(loadoutsEl);
}
exports.addLoadoutsScroll = addLoadoutsScroll;

},{}]},{},[4]);
