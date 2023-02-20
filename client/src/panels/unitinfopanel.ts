import { ConvertDDToDMS, rad2deg } from "../other/utils";
import { Unit } from "../units/unit";
import { Panel } from "./panel";

export class UnitInfoPanel extends Panel {
    #unitName: HTMLElement;
    #groupName: HTMLElement;
    #name: HTMLElement;
    #heading: HTMLElement;
    #altitude: HTMLElement;
    #groundSpeed: HTMLElement;
    #fuel: HTMLElement;
    #latitude: HTMLElement;
    #longitude: HTMLElement;
    #task: HTMLElement;
    #loadoutContainer: HTMLElement;

    constructor(ID: string) {
        super(ID);

        this.#unitName = <HTMLElement>(this.getElement().querySelector("#unit-name"));
        this.#groupName=  <HTMLElement>(this.getElement().querySelector("#group-name"));
        this.#name = <HTMLElement>(this.getElement().querySelector("#name"));
        this.#heading = <HTMLElement>(this.getElement().querySelector("#heading"));
        this.#altitude = <HTMLElement>(this.getElement().querySelector("#altitude"));
        this.#groundSpeed = <HTMLElement>(this.getElement().querySelector("#ground-speed"));
        this.#fuel = <HTMLElement>(this.getElement().querySelector("#fuel"));
        this.#latitude = <HTMLElement>(this.getElement().querySelector("#latitude"));
        this.#longitude = <HTMLElement>(this.getElement().querySelector("#longitude"));
        this.#task = <HTMLElement>(this.getElement().querySelector("#task"));
        this.#loadoutContainer = <HTMLElement>(this.getElement().querySelector("#loadout-container"));

        this.hide();
    }
    
    update(unit: Unit) {
        if (this.getElement() != null) {
            /* Set the unit info */
            this.#unitName.innerHTML = unit.unitName;
            this.#groupName.innerHTML = unit.groupName;
            this.#name.innerHTML = unit.name;
            this.#heading.innerHTML = String(Math.floor(rad2deg(unit.heading)) + " °");
            this.#altitude.innerHTML = String(Math.floor(unit.altitude / 0.3048) + " ft");
            this.#groundSpeed.innerHTML = String(Math.floor(unit.speed * 1.94384) + " kts");
            this.#fuel.innerHTML = String(unit.fuel + "%");
            this.#latitude.innerHTML = ConvertDDToDMS(unit.latitude, false);
            this.#longitude.innerHTML = ConvertDDToDMS(unit.longitude, true);
            this.#task.innerHTML = unit.currentTask !== ""? unit.currentTask: "No task";

            /* Set the class of the task container */
            this.#task.classList.toggle("red", unit.coalitionID == 1);
            this.#task.classList.toggle("blue", unit.coalitionID == 2);
            this.#task.classList.toggle("neutral", unit.coalitionID == 0);
            
            /* Add the loadout elements */
            var els = this.getElement().getElementsByClassName("js-loadout-element");
            while (els.length > 0)
                this.#loadoutContainer.removeChild(els[0]);
  
            for (let index in unit.ammo) 
                this.#addLoadoutElement(unit, index);
        }
    }

    #addLoadoutElement(unit: Unit, index: string)
    {
        var ammo = unit.ammo[index];
        var displayName = ammo.desc.displayName;
        var amount = ammo.count;
        var el = document.createElement("div")
        el.classList.add("js-loadout-element", "ol-rectangular-container-dark")
        el.innerHTML = amount + "x" + displayName;
        this.#loadoutContainer.appendChild(el);
    }
}