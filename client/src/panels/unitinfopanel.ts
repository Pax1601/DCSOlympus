import { getUnitsManager } from "..";
import { ConvertDDToDMS, rad2deg } from "../other/utils";
import { aircraftDatabase } from "../units/aircraftdatabase";
import { Unit } from "../units/unit";
import { Panel } from "./panel";

export class UnitInfoPanel extends Panel {
    #altitude: HTMLElement;
    #currentTask: HTMLElement;
    #fuelBar: HTMLElement;
    #fuelPercentage: HTMLElement;
    #groundSpeed: HTMLElement;
    #groupName: HTMLElement;
    #heading: HTMLElement;
    #name: HTMLElement;
    #latitude: HTMLElement;
    #longitude: HTMLElement;
    #loadoutContainer: HTMLElement;
    #silhouette: HTMLImageElement;
    #unitControl: HTMLElement;
    #unitLabel: HTMLElement;
    #unitName: HTMLElement;

    constructor(ID: string) {
        super(ID);

        this.#altitude = (this.getElement().querySelector("#altitude")) as HTMLElement;
        this.#currentTask = (this.getElement().querySelector("#current-task")) as HTMLElement;
        this.#groundSpeed = (this.getElement().querySelector("#ground-speed")) as HTMLElement;
        this.#fuelBar = (this.getElement().querySelector("#fuel-bar")) as HTMLElement;
        this.#fuelPercentage = (this.getElement().querySelector("#fuel-percentage")) as HTMLElement;
        this.#groupName = (this.getElement().querySelector("#group-name")) as HTMLElement;
        this.#heading = (this.getElement().querySelector("#heading")) as HTMLElement;
        this.#name = (this.getElement().querySelector("#name")) as HTMLElement;
        this.#latitude = (this.getElement().querySelector("#latitude")) as HTMLElement;
        this.#loadoutContainer = (this.getElement().querySelector("#loadout-container")) as HTMLElement;
        this.#longitude = (this.getElement().querySelector("#longitude")) as HTMLElement;
        this.#silhouette = (this.getElement().querySelector("#loadout-silhouette")) as HTMLImageElement;
        this.#unitControl = (this.getElement().querySelector("#unit-control")) as HTMLElement;
        this.#unitLabel = (this.getElement().querySelector("#unit-label")) as HTMLElement;
        this.#unitName = (this.getElement().querySelector("#unit-name")) as HTMLElement;

        document.addEventListener("unitsSelection", (e: CustomEvent<Unit[]>) => this.#onUnitsSelection(e.detail));
        document.addEventListener("unitsDeselection", (e: CustomEvent<Unit[]>) => this.#onUnitsDeselection(e.detail));
        document.addEventListener("clearSelection", (e: CustomEvent<Unit[]>) => this.#onUnitsDeselection([]));
        document.addEventListener("unitUpdated", (e: CustomEvent<Unit>) => this.#onUnitUpdate(e.detail));

        this.hide();
    }

    #onUnitUpdate(unit: Unit) {
        if (this.getElement() != null && this.getVisible() && unit.getSelected()) {

            const baseData = unit.getData();

            /* Set the unit info */
            this.#unitLabel.innerText = aircraftDatabase.getByName(baseData.name)?.label || baseData.name;
            this.#unitName.innerText = baseData.unitName;
            if (unit.getData().human)
                this.#unitControl.innerText = "Human";
            else if (baseData.controlled)
                this.#unitControl.innerText = "Olympus controlled";
            else
                this.#unitControl.innerText = "DCS Controlled";
            this.#fuelBar.style.width = String(unit.getData().fuel + "%");
            this.#fuelPercentage.dataset.percentage = "" + unit.getData().fuel;
            this.#currentTask.dataset.currentTask = unit.getData().task !== "" ? unit.getData().task : "No task";
            this.#currentTask.dataset.coalition = unit.getData().coalition;

            this.#silhouette.src = `/images/units/${unit.getDatabase()?.getByName(baseData.name)?.filename}`;
            this.#silhouette.classList.toggle("hide", unit.getDatabase()?.getByName(baseData.name)?.filename == undefined || unit.getDatabase()?.getByName(baseData.name)?.filename == '');

            /* Add the loadout elements */
            const items = <HTMLElement>this.#loadoutContainer.querySelector("#loadout-items");

            if (items) {
                const ammo = Object.values(unit.getData().ammo);
                if (ammo.length > 0) {
                    items.replaceChildren(...Object.values(unit.getData().ammo).map(
                        (ammo: any) => {
                            var el = document.createElement("div");
                            el.dataset.qty = ammo.count;
                            el.dataset.item = ammo.desc.displayName;
                            return el;
                        }
                    ));

                } else {
                    items.innerText = "No loadout";
                }
            }
        }
    }

    #onUnitsSelection(units: Unit[]) {
        if (units.length == 1) {
            this.show();
            this.#onUnitUpdate(units[0]);
        }
        else
            this.hide();
    }

    #onUnitsDeselection(units: Unit[]) {
        if (units.length == 1) {
            this.show();
            this.#onUnitUpdate(units[0]);
        }
        else
            this.hide();
    }
}