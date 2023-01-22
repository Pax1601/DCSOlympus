import { ConvertDDToDMS, rad2deg } from "../other/utils";
import { Unit } from "../units/unit";

export class UnitInfoPanel {
    #element: HTMLElement
    #display: string;

    constructor(ID: string) {
        this.#element = <HTMLElement>document.getElementById(ID);
        this.#display = '';
        if (this.#element != null) {
            this.#display = this.#element.style.display;
            this.hide();
        }
    }

    show() {
        this.#element.style.display = this.#display;
    }

    hide() {
        this.#element.style.display = "none";
    }

    update(unit: Unit) {
        var loadout = "";
        for (let index in unit.ammo) {
            var ammo = unit.ammo[index];
            var displayName = ammo.desc.displayName;
            var amount = ammo.count;
            loadout += amount + "x" + displayName;
            if (parseInt(index) < Object.keys(unit.ammo).length)
                loadout += ", ";
        }

        if (this.#element != null) {
            this.#element.querySelector("#unit-name")!.innerHTML = unit.unitName;
            this.#element.querySelector("#group-name")!.innerHTML = unit.groupName;
            this.#element.querySelector("#heading")!.innerHTML = String(Math.floor(rad2deg(unit.heading)) + "°");
            this.#element.querySelector("#altitude")!.innerHTML = String(Math.floor(unit.altitude / 0.3048) + "ft");
            this.#element.querySelector("#groundspeed")!.innerHTML = String(Math.floor(unit.speed * 1.94384) + "kts");
            this.#element.querySelector("#fuel")!.innerHTML = String(unit.fuel + "%");
            this.#element.querySelector("#position")!.innerHTML = ConvertDDToDMS(unit.latitude, false) + " " + ConvertDDToDMS(unit.longitude, true);

            this.#element.querySelector("#task")!.innerHTML = unit.currentTask;
            this.#element.querySelector("#loadout")!.innerHTML = loadout;
        }
    }
}