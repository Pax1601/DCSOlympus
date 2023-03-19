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

        document.addEventListener("unitsSelection", (e: CustomEvent<Unit[]>) => this.#onUnitsSelection(e.detail));
        document.addEventListener("unitsDeselection", (e: CustomEvent<Unit[]>) => this.#onUnitsDeselection(e.detail));
        document.addEventListener("clearSelection", () => this.#onUnitsDeselection([]));
        document.addEventListener("unitUpdated", (e: CustomEvent<Unit>) => this.#onUnitUpdate(e.detail));

        this.hide();
    }
    
    #onUnitUpdate(unit: Unit) {
        if (this.getElement() != null && this.getVisible() && unit.getSelected()) {
            /* Set the unit info */
            this.#unitName.innerText = unit.getBaseData().unitName;
            this.#groupName.innerText = unit.getBaseData().groupName;
            this.#name.innerText = unit.getBaseData().name;
            //this.#heading.innerText = String(Math.floor(rad2deg(unit.getFlightData().heading)) + " °");
            //this.#altitude.innerText = String(Math.floor(unit.getFlightData().altitude / 0.3048) + " ft");
            //this.#groundSpeed.innerText = String(Math.floor(unit.getFlightData().speed * 1.94384) + " kts");
            //this.#fuel.innerText = String(unit.getMissionData().fuel + "%");
            //this.#latitude.innerText = ConvertDDToDMS(unit.getFlightData().latitude, false);
            //this.#longitude.innerText = ConvertDDToDMS(unit.getFlightData().longitude, true);
            this.#task.innerText = unit.getTaskData().currentTask !== ""? unit.getTaskData().currentTask: "No task";

            /* Set the class of the task container */
            this.#task.classList.toggle("red", unit.getMissionData().coalition === "red");
            this.#task.classList.toggle("blue", unit.getMissionData().coalition === "blue");
            this.#task.classList.toggle("neutral", unit.getMissionData().coalition === "neutral");
            
            /* Add the loadout elements */
            this.#loadoutContainer.replaceChildren(...unit.getMissionData().ammo.map(
                (ammo: any) => {
                    var el = document.createElement("div");
                    el.classList.add("pill", "loadout-item");
                    el.dataset.loadoutQty = ammo.count;
                    el.dataset.loadoutItem = ammo.desc.displayName;
                    return el;
                }
            ))
        }
    }

    #onUnitsSelection(units: Unit[]){
        if (units.length == 1)
            this.show();
        else
            this.hide();
    }

    #onUnitsDeselection(units: Unit[]){
        if (units.length == 1)
            this.show();
        else
            this.hide();
    }
}