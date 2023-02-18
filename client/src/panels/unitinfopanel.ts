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
        if (this.#element != null) {
            var els = this.#element.getElementsByClassName("js-loadout-element");
            while (els.length > 0)
                this.#element.querySelector("#loadout-container")?.removeChild(els[0]);
  
            for (let index in unit.ammo) {
                var ammo = unit.ammo[index];
                var displayName = ammo.desc.displayName;
                var amount = ammo.count;
                var el = document.createElement("div")
                el.classList.add("js-loadout-element", "rectangular-container-dark")
                el.innerHTML = amount + "x" + displayName;
                this.#element.querySelector("#loadout-container")?.appendChild(el);
            }

            this.#element.querySelector("#unit-name")!.innerHTML = unit.unitName;
            this.#element.querySelector("#group-name")!.innerHTML = unit.groupName;
            this.#element.querySelector("#name")!.innerHTML = unit.name;
            this.#element.querySelector("#heading")!.innerHTML = String(Math.floor(rad2deg(unit.heading)) + " °");
            this.#element.querySelector("#altitude")!.innerHTML = String(Math.floor(unit.altitude / 0.3048) + " ft");
            this.#element.querySelector("#ground-speed")!.innerHTML = String(Math.floor(unit.speed * 1.94384) + " kts");
            this.#element.querySelector("#fuel")!.innerHTML = String(unit.fuel + "%");
            this.#element.querySelector("#latitude")!.innerHTML = ConvertDDToDMS(unit.latitude, false);
            this.#element.querySelector("#longitude")!.innerHTML = ConvertDDToDMS(unit.longitude, true);
            this.#element.querySelector("#task")!.innerHTML = unit.currentTask !== ""? unit.currentTask: "Not controlled";

            this.#element.querySelector("#task")!.classList.remove("red", "blue", "neutral");
            if (unit.coalitionID == 1)
                this.#element.querySelector("#task")!.classList.add("red");
            else if (unit.coalitionID == 2)
                this.#element.querySelector("#task")!.classList.add("blue");
            else
                this.#element.querySelector("#task")!.classList.add("neutral");
            
        }
    }
}