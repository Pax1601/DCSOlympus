import { getApp } from "..";
import { Ammo } from "../interfaces";
import { aircraftDatabase } from "../unit/databases/aircraftdatabase";
import { Unit } from "../unit/unit";
import { Panel } from "./panel";

export class UnitInfoPanel extends Panel {
    #currentTask: HTMLElement;
    #fuelBar: HTMLElement;
    #fuelPercentage: HTMLElement;
    #loadoutContainer: HTMLElement;
    #silhouette: HTMLImageElement;
    #unitControl: HTMLElement;
    #unitLabel: HTMLElement;
    #unitGroup: HTMLElement;
    #unitName: HTMLElement;

    constructor(ID: string) {
        super( ID );

        this.#currentTask = (this.getElement().querySelector("#current-task")) as HTMLElement;
        this.#fuelBar = (this.getElement().querySelector("#fuel-bar")) as HTMLElement;
        this.#fuelPercentage = (this.getElement().querySelector("#fuel-percentage")) as HTMLElement;
        this.#loadoutContainer = (this.getElement().querySelector("#loadout-container")) as HTMLElement;
        this.#silhouette = (this.getElement().querySelector("#loadout-silhouette")) as HTMLImageElement;
        this.#unitControl = (this.getElement().querySelector("#unit-control")) as HTMLElement;
        this.#unitLabel = (this.getElement().querySelector("#unit-label")) as HTMLElement;
        this.#unitGroup = (this.getElement().querySelector("#unit-group")) as HTMLElement;
        this.#unitName = (this.getElement().querySelector("#unit-name")) as HTMLElement;

        document.addEventListener("unitsSelection", (e: CustomEvent<Unit[]>) => this.#onUnitsSelection(e.detail));
        document.addEventListener("unitsDeselection", (e: CustomEvent<Unit[]>) => this.#onUnitsDeselection(e.detail));
        document.addEventListener("clearSelection", (e: CustomEvent<Unit[]>) => this.#onUnitsDeselection([]));
        document.addEventListener("unitUpdated", (e: CustomEvent<Unit>) => this.#onUnitUpdate(e.detail));

        this.hide();
    }

    #onUnitUpdate(unit: Unit) {
        if (this.getElement() != null && this.getVisible() && unit.getSelected()) {

            /* Set the unit info */
            this.#unitLabel.innerText = aircraftDatabase.getByName(unit.getName())?.label || unit.getName();
            this.#unitGroup.dataset.groupName = unit.getGroup()?.getName() ?? "No group";
            this.#unitName.innerText = unit.getUnitName();
            if (unit.getHuman())
                this.#unitControl.innerText = "Human";
            else if (unit.getControlled())
                this.#unitControl.innerText = "Olympus controlled";
            else
                this.#unitControl.innerText = "DCS Controlled";
            this.#fuelBar.style.width = String(unit.getFuel() + "%");
            this.#fuelPercentage.dataset.percentage = "" + unit.getFuel();
            this.#currentTask.dataset.currentTask = unit.getTask() !== "" ? unit.getTask() : "No task";
            this.#currentTask.dataset.coalition = unit.getCoalition();

            const filename = unit.getDatabase()?.getByName(unit.getName())?.filename;
            if (filename)
                this.#silhouette.src = `/images/units/${filename}`;
            this.#silhouette.classList.toggle("hide", filename == undefined || filename == '');

            /* Add the loadout elements */
            const items = this.#loadoutContainer.querySelector("#loadout-items") as HTMLElement;

            if (items) {
                const ammo = Object.values(unit.getAmmo());
                if (ammo.length > 0) {
                    items.replaceChildren(...Object.values(unit.getAmmo()).map(
                        (ammo: Ammo) => {
                            var el = document.createElement("div");
                            el.dataset.qty = `${ammo.quantity}`;
                            el.dataset.item = ammo.name;
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

    show() {
        const context = getApp().getCurrentContext();
        if ( !context.getUseUnitInfoPanel() )
            return;

        super.show();
    }
}