(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _BoilerplatePlugin_app;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoilerplatePlugin = void 0;
class BoilerplatePlugin {
    constructor() {
        _BoilerplatePlugin_app.set(this, void 0);
    }
    /**
     * @param app <OlympusApp>
     *
     * @returns boolean on success
     */
    initialize(app) {
        __classPrivateFieldSet(this, _BoilerplatePlugin_app, app, "f");
        return true; //  Return true on success
    }
    getName() {
        return "Boilerplate";
    }
}
exports.BoilerplatePlugin = BoilerplatePlugin;
_BoilerplatePlugin_app = new WeakMap();

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const boilerplate_1 = require("./boilerplate");
globalThis.getOlympusPlugin = () => {
    return new boilerplate_1.BoilerplatePlugin();
};

},{"./boilerplate":1}]},{},[2]);
