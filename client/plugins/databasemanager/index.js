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
var _DatabaseManagerPlugin_instances, _DatabaseManagerPlugin_element, _DatabaseManagerPlugin_app, _DatabaseManagerPlugin_scrollDiv, _DatabaseManagerPlugin_contentDiv, _DatabaseManagerPlugin_setContent;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseManagerPlugin = void 0;
const SHOW_CONTROL_TIPS = "Show control tips";
class DatabaseManagerPlugin {
    constructor() {
        _DatabaseManagerPlugin_instances.add(this);
        _DatabaseManagerPlugin_element.set(this, void 0);
        _DatabaseManagerPlugin_app.set(this, void 0);
        _DatabaseManagerPlugin_scrollDiv.set(this, void 0);
        _DatabaseManagerPlugin_contentDiv.set(this, void 0);
        __classPrivateFieldSet(this, _DatabaseManagerPlugin_element, document.createElement("div"), "f");
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_element, "f").id = "database-control-panel";
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_element, "f").oncontextmenu = () => { return false; };
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_element, "f").classList.add("ol-dialog");
        document.body.appendChild(__classPrivateFieldGet(this, _DatabaseManagerPlugin_element, "f"));
        __classPrivateFieldSet(this, _DatabaseManagerPlugin_scrollDiv, document.createElement("div"), "f");
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_scrollDiv, "f").classList.add("dc-scroll-container");
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_element, "f").appendChild(__classPrivateFieldGet(this, _DatabaseManagerPlugin_scrollDiv, "f"));
        __classPrivateFieldSet(this, _DatabaseManagerPlugin_contentDiv, document.createElement("div"), "f");
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_contentDiv, "f").classList.add("dc-content-container");
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_element, "f").appendChild(__classPrivateFieldGet(this, _DatabaseManagerPlugin_contentDiv, "f"));
    }
    getName() {
        return "Database Control Plugin";
    }
    initialize(app) {
        __classPrivateFieldSet(this, _DatabaseManagerPlugin_app, app, "f");
        var aircraftDatabase = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f").getAircraftDatabase();
        var blueprints = aircraftDatabase.getBlueprints();
        for (let key in blueprints) {
            var div = document.createElement("div");
            __classPrivateFieldGet(this, _DatabaseManagerPlugin_scrollDiv, "f").appendChild(div);
            div.textContent = key;
            div.onclick = () => __classPrivateFieldGet(this, _DatabaseManagerPlugin_instances, "m", _DatabaseManagerPlugin_setContent).call(this, blueprints[key]);
        }
        return true;
    }
    getElement() {
        return __classPrivateFieldGet(this, _DatabaseManagerPlugin_element, "f");
    }
    toggle(bool) {
        this.getElement().classList.toggle("hide", bool);
    }
}
exports.DatabaseManagerPlugin = DatabaseManagerPlugin;
_DatabaseManagerPlugin_element = new WeakMap(), _DatabaseManagerPlugin_app = new WeakMap(), _DatabaseManagerPlugin_scrollDiv = new WeakMap(), _DatabaseManagerPlugin_contentDiv = new WeakMap(), _DatabaseManagerPlugin_instances = new WeakSet(), _DatabaseManagerPlugin_setContent = function _DatabaseManagerPlugin_setContent(blueprint) {
    __classPrivateFieldGet(this, _DatabaseManagerPlugin_contentDiv, "f").replaceChildren();
    for (var key in blueprint) {
        if (typeof blueprint[key] === "string") {
            var dt = document.createElement("dt");
            var dd = document.createElement("dd");
            dt.innerText = key;
            var input = document.createElement("input");
            input.value = blueprint[key];
            input.textContent = blueprint[key];
            dd.appendChild(input);
            __classPrivateFieldGet(this, _DatabaseManagerPlugin_contentDiv, "f").appendChild(dt);
            __classPrivateFieldGet(this, _DatabaseManagerPlugin_contentDiv, "f").appendChild(dd);
        }
    }
};

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const databasemanagerplugin_1 = require("./databasemanagerplugin");
globalThis.getOlympusPlugin = () => {
    return new databasemanagerplugin_1.DatabaseManagerPlugin();
};

},{"./databasemanagerplugin":1}]},{},[2]);
