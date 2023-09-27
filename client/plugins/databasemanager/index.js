(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AirUnitEditor = void 0;
const uniteditor_1 = require("./uniteditor");
class AirUnitEditor extends uniteditor_1.UnitEditor {
    constructor(scrollDiv, contentDiv) {
        super(scrollDiv, contentDiv);
    }
    setContent(blueprint) {
        this.contentDiv.replaceChildren();
        this.addStringInput("Name", blueprint.name);
        this.addStringInput("Label", blueprint.label);
        this.addStringInput("Short label", blueprint.shortLabel);
    }
}
exports.AirUnitEditor = AirUnitEditor;
},{"./uniteditor":4}],2:[function(require,module,exports){
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
var _DatabaseManagerPlugin_app, _DatabaseManagerPlugin_element, _DatabaseManagerPlugin_scrollDiv, _DatabaseManagerPlugin_contentDiv, _DatabaseManagerPlugin_aircraftEditor;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseManagerPlugin = void 0;
const airuniteditor_1 = require("./airuniteditor");
class DatabaseManagerPlugin {
    constructor() {
        _DatabaseManagerPlugin_app.set(this, null);
        _DatabaseManagerPlugin_element.set(this, void 0);
        _DatabaseManagerPlugin_scrollDiv.set(this, void 0);
        _DatabaseManagerPlugin_contentDiv.set(this, void 0);
        _DatabaseManagerPlugin_aircraftEditor.set(this, void 0);
        __classPrivateFieldSet(this, _DatabaseManagerPlugin_element, document.createElement("div"), "f");
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_element, "f").id = "database-manager-panel";
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_element, "f").oncontextmenu = () => { return false; };
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_element, "f").classList.add("ol-dialog");
        document.body.appendChild(__classPrivateFieldGet(this, _DatabaseManagerPlugin_element, "f"));
        __classPrivateFieldSet(this, _DatabaseManagerPlugin_scrollDiv, document.createElement("div"), "f");
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_scrollDiv, "f").classList.add("dm-scroll-container");
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_element, "f").appendChild(__classPrivateFieldGet(this, _DatabaseManagerPlugin_scrollDiv, "f"));
        __classPrivateFieldSet(this, _DatabaseManagerPlugin_contentDiv, document.createElement("div"), "f");
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_contentDiv, "f").classList.add("dm-content-container");
        __classPrivateFieldGet(this, _DatabaseManagerPlugin_element, "f").appendChild(__classPrivateFieldGet(this, _DatabaseManagerPlugin_contentDiv, "f"));
        __classPrivateFieldSet(this, _DatabaseManagerPlugin_aircraftEditor, new airuniteditor_1.AirUnitEditor(__classPrivateFieldGet(this, _DatabaseManagerPlugin_scrollDiv, "f"), __classPrivateFieldGet(this, _DatabaseManagerPlugin_contentDiv, "f")), "f");
    }
    getName() {
        return "Database Control Plugin";
    }
    initialize(app) {
        var _a;
        __classPrivateFieldSet(this, _DatabaseManagerPlugin_app, app, "f");
        var aircraftDatabase = (_a = __classPrivateFieldGet(this, _DatabaseManagerPlugin_app, "f")) === null || _a === void 0 ? void 0 : _a.getAircraftDatabase();
        if (aircraftDatabase != null) {
            __classPrivateFieldGet(this, _DatabaseManagerPlugin_aircraftEditor, "f").setDatabase(aircraftDatabase);
            __classPrivateFieldGet(this, _DatabaseManagerPlugin_aircraftEditor, "f").show();
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
_DatabaseManagerPlugin_app = new WeakMap(), _DatabaseManagerPlugin_element = new WeakMap(), _DatabaseManagerPlugin_scrollDiv = new WeakMap(), _DatabaseManagerPlugin_contentDiv = new WeakMap(), _DatabaseManagerPlugin_aircraftEditor = new WeakMap();
},{"./airuniteditor":1}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const databasemanagerplugin_1 = require("./databasemanagerplugin");
globalThis.getOlympusPlugin = () => {
    return new databasemanagerplugin_1.DatabaseManagerPlugin();
};
},{"./databasemanagerplugin":2}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitEditor = void 0;
class UnitEditor {
    constructor(scrollDiv, contentDiv) {
        this.database = null;
        this.scrollDiv = scrollDiv;
        this.contentDiv = contentDiv;
    }
    setDatabase(database) {
        this.database = database;
    }
    show() {
        if (this.database !== null) {
            var blueprints = this.database.getBlueprints();
            for (let key in blueprints) {
                var div = document.createElement("div");
                this.scrollDiv.appendChild(div);
                div.textContent = key;
                div.onclick = () => this.setContent(blueprints[key]);
            }
        }
    }
    addStringInput(key, value) {
        var dt = document.createElement("dt");
        var dd = document.createElement("dd");
        dt.innerText = key;
        var input = document.createElement("input");
        input.value = value;
        input.textContent = value;
        dd.appendChild(input);
        this.contentDiv.appendChild(dt);
        this.contentDiv.appendChild(dd);
    }
    addDropdownInput(key, value, options) {
        var dt = document.createElement("dt");
        var dd = document.createElement("dd");
        dt.innerText = key;
        var input = document.createElement("input");
        input.value = value;
        input.textContent = value;
        dd.appendChild(input);
        this.contentDiv.appendChild(dt);
        this.contentDiv.appendChild(dd);
    }
}
exports.UnitEditor = UnitEditor;
},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYWlydW5pdGVkaXRvci50cyIsInNyYy9kYXRhYmFzZW1hbmFnZXJwbHVnaW4udHMiLCJzcmMvaW5kZXgudHMiLCJzcmMvdW5pdGVkaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztBQ0NBLDZDQUEwQztBQUUxQyxNQUFhLGFBQWMsU0FBUSx1QkFBVTtJQUN6QyxZQUFZLFNBQXNCLEVBQUUsVUFBdUI7UUFDdkQsS0FBSyxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUNqQyxDQUFDO0lBRUQsVUFBVSxDQUFDLFNBQXdCO1FBQy9CLElBQUksQ0FBQyxVQUFVLENBQUMsZUFBZSxFQUFFLENBQUM7UUFFbEMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVDLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM5QyxJQUFJLENBQUMsY0FBYyxDQUFDLGFBQWEsRUFBRSxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDN0QsQ0FBQztDQUNKO0FBWkQsc0NBWUM7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDZEQsbURBQWdEO0FBR2hELE1BQWEscUJBQXFCO0lBUzlCO1FBUkEscUNBQTBCLElBQUksRUFBQztRQUUvQixpREFBc0I7UUFDdEIsbURBQXdCO1FBQ3hCLG9EQUF5QjtRQUV6Qix3REFBK0I7UUFHM0IsdUJBQUEsSUFBSSxrQ0FBWSxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxNQUFBLENBQUM7UUFDOUMsdUJBQUEsSUFBSSxzQ0FBUyxDQUFDLEVBQUUsR0FBRyx3QkFBd0IsQ0FBQztRQUM1Qyx1QkFBQSxJQUFJLHNDQUFTLENBQUMsYUFBYSxHQUFHLEdBQUcsRUFBRSxHQUFHLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQyxD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Q0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2hDLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7Q0FJSjtBQXJERCxnQ0FxREMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJpbXBvcnQgeyBVbml0Qmx1ZXByaW50IH0gZnJvbSBcImludGVyZmFjZXNcIjtcclxuaW1wb3J0IHsgVW5pdEVkaXRvciB9IGZyb20gXCIuL3VuaXRlZGl0b3JcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBBaXJVbml0RWRpdG9yIGV4dGVuZHMgVW5pdEVkaXRvciB7XHJcbiAgICBjb25zdHJ1Y3RvcihzY3JvbGxEaXY6IEhUTUxFbGVtZW50LCBjb250ZW50RGl2OiBIVE1MRWxlbWVudCkge1xyXG4gICAgICAgIHN1cGVyKHNjcm9sbERpdiwgY29udGVudERpdik7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0Q29udGVudChibHVlcHJpbnQ6IFVuaXRCbHVlcHJpbnQpIHtcclxuICAgICAgICB0aGlzLmNvbnRlbnREaXYucmVwbGFjZUNoaWxkcmVuKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5hZGRTdHJpbmdJbnB1dChcIk5hbWVcIiwgYmx1ZXByaW50Lm5hbWUpO1xyXG4gICAgICAgIHRoaXMuYWRkU3RyaW5nSW5wdXQoXCJMYWJlbFwiLCBibHVlcHJpbnQubGFiZWwpO1xyXG4gICAgICAgIHRoaXMuYWRkU3RyaW5nSW5wdXQoXCJTaG9ydCBsYWJlbFwiLCBibHVlcHJpbnQuc2hvcnRMYWJlbCk7XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgT2x5bXB1c1BsdWdpbiB9IGZyb20gXCJpbnRlcmZhY2VzXCI7XHJcbmltcG9ydCB7IEFpclVuaXRFZGl0b3IgfSBmcm9tIFwiLi9haXJ1bml0ZWRpdG9yXCI7XHJcbmltcG9ydCB7IE9seW1wdXNBcHAgfSBmcm9tIFwib2x5bXB1c2FwcFwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIERhdGFiYXNlTWFuYWdlclBsdWdpbiBpbXBsZW1lbnRzIE9seW1wdXNQbHVnaW4ge1xyXG4gICAgI2FwcDogT2x5bXB1c0FwcCB8IG51bGwgPSBudWxsO1xyXG5cclxuICAgICNlbGVtZW50OiBIVE1MRWxlbWVudDtcclxuICAgICNzY3JvbGxEaXY6IEhUTUxFbGVtZW50O1xyXG4gICAgI2NvbnRlbnREaXY6IEhUTUxFbGVtZW50O1xyXG5cclxuICAgICNhaXJjcmFmdEVkaXRvcjogQWlyVW5pdEVkaXRvcjtcclxuICAgICAgICBcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuI2VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgIHRoaXMuI2VsZW1lbnQuaWQgPSBcImRhdGFiYXNlLWNvbnRyb2wtcGFuZWxcIjtcclxuICAgICAgICB0aGlzLiNlbGVtZW50Lm9uY29udGV4dG1lbnUgPSAoKSA9PiB7IHJldHVybiBmYWxzZTsgfVxyXG4gICAgICAgIHRoaXMuI2VsZW1lbnQuY2xhc3NMaXN0LmFkZChcIm9sLWRpYWxvZ1wiKTtcclxuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuI2VsZW1lbnQpO1xyXG5cclxuICAgICAgICB0aGlzLiNzY3JvbGxEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgIHRoaXMuI3Njcm9sbERpdi5jbGFzc0xpc3QuYWRkKFwiZGMtc2Nyb2xsLWNvbnRhaW5lclwiKTtcclxuICAgICAgICB0aGlzLiNlbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuI3Njcm9sbERpdik7XHJcblxyXG4gICAgICAgIHRoaXMuI2NvbnRlbnREaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgIHRoaXMuI2NvbnRlbnREaXYuY2xhc3NMaXN0LmFkZChcImRjLWNvbnRlbnQtY29udGFpbmVyXCIpO1xyXG4gICAgICAgIHRoaXMuI2VsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy4jY29udGVudERpdik7XHJcblxyXG4gICAgICAgIHRoaXMuI2FpcmNyYWZ0RWRpdG9yID0gbmV3IEFpclVuaXRFZGl0b3IodGhpcy4jc2Nyb2xsRGl2LCB0aGlzLiNjb250ZW50RGl2KTtcclxuICAgIH1cclxuXHJcbiAgICBnZXROYW1lKCkge1xyXG4gICAgICAgIHJldHVybiBcIkRhdGFiYXNlIENvbnRyb2wgUGx1Z2luXCJcclxuICAgIH1cclxuXHJcbiAgICBpbml0aWFsaXplKGFwcDogYW55KSB7XHJcbiAgICAgICAgdGhpcy4jYXBwID0gYXBwO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBhaXJjcmFmdERhdGFiYXNlID0gdGhpcy4jYXBwPy5nZXRBaXJjcmFmdERhdGFiYXNlKCk7XHJcbiAgICAgICAgaWYgKGFpcmNyYWZ0RGF0YWJhc2UgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLiNhaXJjcmFmdEVkaXRvci5zZXREYXRhYmFzZShhaXJjcmFmdERhdGFiYXNlKTtcclxuICAgICAgICAgICAgdGhpcy4jYWlyY3JhZnRFZGl0b3Iuc2hvdygpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0RWxlbWVudCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy4jZWxlbWVudDtcclxuICAgIH1cclxuXHJcbiAgICB0b2dnbGUoYm9vbD86IGJvb2xlYW4pIHtcclxuICAgICAgICB0aGlzLmdldEVsZW1lbnQoKS5jbGFzc0xpc3QudG9nZ2xlKFwiaGlkZVwiLCBib29sKTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IERhdGFiYXNlTWFuYWdlclBsdWdpbiB9IGZyb20gXCIuL2RhdGFiYXNlbWFuYWdlcnBsdWdpblwiO1xyXG5cclxuZ2xvYmFsVGhpcy5nZXRPbHltcHVzUGx1Z2luID0gKCkgPT4ge1xyXG4gICAgcmV0dXJuIG5ldyBEYXRhYmFzZU1hbmFnZXJQbHVnaW4oKTtcclxufSIsImltcG9ydCB7IFVuaXRCbHVlcHJpbnQgfSBmcm9tIFwiaW50ZXJmYWNlc1wiO1xyXG5pbXBvcnQgeyBVbml0RGF0YWJhc2UgfSBmcm9tIFwidW5pdC9kYXRhYmFzZXMvdW5pdGRhdGFiYXNlXCI7XHJcblxyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgVW5pdEVkaXRvciB7XHJcbiAgICBkYXRhYmFzZTogVW5pdERhdGFiYXNlIHwgbnVsbCA9IG51bGw7XHJcbiAgICBzY3JvbGxEaXY6IEhUTUxFbGVtZW50O1xyXG4gICAgY29udGVudERpdjogSFRNTEVsZW1lbnQ7XHJcblxyXG4gICAgY29uc3RydWN0b3Ioc2Nyb2xsRGl2OiBIVE1MRWxlbWVudCwgY29udGVudERpdjogSFRNTEVsZW1lbnQpIHtcclxuICAgICAgICB0aGlzLnNjcm9sbERpdiA9IHNjcm9sbERpdjtcclxuICAgICAgICB0aGlzLmNvbnRlbnREaXYgPSBjb250ZW50RGl2O1xyXG4gICAgfVxyXG5cclxuICAgIHNldERhdGFiYXNlKGRhdGFiYXNlOiBhbnkpIHtcclxuICAgICAgICB0aGlzLmRhdGFiYXNlID0gZGF0YWJhc2U7XHJcbiAgICB9XHJcblxyXG4gICAgc2hvdygpIHtcclxuICAgICAgICBpZiAodGhpcy5kYXRhYmFzZSAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICB2YXIgYmx1ZXByaW50czoge1trZXk6IHN0cmluZ106IFVuaXRCbHVlcHJpbnR9ID0gdGhpcy5kYXRhYmFzZS5nZXRCbHVlcHJpbnRzKCk7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCBrZXkgaW4gYmx1ZXByaW50cykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbERpdi5hcHBlbmRDaGlsZChkaXYpO1xyXG4gICAgICAgICAgICAgICAgZGl2LnRleHRDb250ZW50ID0ga2V5O1xyXG4gICAgICAgICAgICAgICAgZGl2Lm9uY2xpY2sgPSAoKSA9PiB0aGlzLnNldENvbnRlbnQoYmx1ZXByaW50c1trZXldKTtcclxuICAgICAgICAgICAgfSAgICAgIFxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBhZGRTdHJpbmdJbnB1dChrZXk6IHN0cmluZywgdmFsdWU6IHN0cmluZykge1xyXG4gICAgICAgIHZhciBkdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkdFwiKTtcclxuICAgICAgICB2YXIgZGQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGRcIik7XHJcbiAgICAgICAgZHQuaW5uZXJUZXh0ID0ga2V5O1xyXG4gICAgICAgIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcclxuICAgICAgICBpbnB1dC52YWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgIGlucHV0LnRleHRDb250ZW50ID0gdmFsdWU7XHJcbiAgICAgICAgZGQuYXBwZW5kQ2hpbGQoaW5wdXQpO1xyXG4gICAgICAgIHRoaXMuY29udGVudERpdi5hcHBlbmRDaGlsZChkdCk7XHJcbiAgICAgICAgdGhpcy5jb250ZW50RGl2LmFwcGVuZENoaWxkKGRkKTtcclxuICAgIH1cclxuXHJcbiAgICBhZGREcm9wZG93bklucHV0KGtleTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nLCBvcHRpb25zOiBzdHJpbmdbXSkge1xyXG4gICAgICAgIHZhciBkdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkdFwiKTtcclxuICAgICAgICB2YXIgZGQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGRcIik7XHJcbiAgICAgICAgZHQuaW5uZXJUZXh0ID0ga2V5O1xyXG4gICAgICAgIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcclxuICAgICAgICBpbnB1dC52YWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgIGlucHV0LnRleHRDb250ZW50ID0gdmFsdWU7XHJcbiAgICAgICAgZGQuYXBwZW5kQ2hpbGQoaW5wdXQpO1xyXG4gICAgICAgIHRoaXMuY29udGVudERpdi5hcHBlbmRDaGlsZChkdCk7XHJcbiAgICAgICAgdGhpcy5jb250ZW50RGl2LmFwcGVuZENoaWxkKGRkKTtcclxuICAgIH1cclxuXHJcbiAgICBhYnN0cmFjdCBzZXRDb250ZW50KGJsdWVwcmludDogVW5pdEJsdWVwcmludCk6IHZvaWQ7XHJcbiAgICBcclxufSJdfQ==
