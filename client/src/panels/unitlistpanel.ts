import { getApp } from "..";
import { ShortcutKeyboard } from "../shortcut/shortcut";
import { Unit } from "../unit/unit";
import { Panel } from "./panel";

export class UnitListPanel extends Panel {
    #contentElement: HTMLElement;
    #currentSortAlgorithm: string = "unitName";
    #currentSortDirection: string = "ASC";
    #units: Unit[] = [];
    #updatesInterval!: ReturnType<typeof setInterval>;

    constructor(panelElement: string, contentElement: string) {
        super(panelElement);
        const getElement = document.getElementById(contentElement);

        if (getElement instanceof HTMLElement) 
            this.#contentElement = getElement;
        else 
            throw new Error(`UnitList: unable to find element "${contentElement}".`);
        
        //  Add the header click listener and sorting
        [].slice.call(this.getElement().querySelectorAll(".headers > *")).forEach((header: HTMLElement) => {
            header.addEventListener("click", (ev: MouseEvent) => {
                const el = ev.target;
                if (el instanceof HTMLElement) {
                    const newSort = el.getAttribute("data-sort-field") || "unitName";

                    if (this.#currentSortAlgorithm === newSort) 
                        this.#currentSortDirection = (this.#currentSortDirection === "ASC") ? "DESC" : "ASC";
                    else 
                        this.#currentSortDirection = "ASC";
                    
                    this.#currentSortAlgorithm = newSort;

                    this.doUpdate();
                }
            });
        });


        //  Dynamically listen for clicks in order to do stuff with units
        this.getElement().addEventListener("click", (ev: MouseEvent) => {
            const t = ev.target;
            if (t instanceof HTMLElement) {
                let id: number = Number(t.getAttribute("data-unit-id") || 0);
                getApp().getUnitsManager().selectUnit(id);
            }
        });

        new ShortcutKeyboard({
            "callback": () => { this.toggle() },
            "code": "KeyU"
        });

        this.startUpdates();
    }

    doUpdate() {
        if (!this.getVisible()) 
            return;
        
        this.#contentElement.innerHTML = "";

        this.#units = Object.values(getApp().getUnitsManager().getUnits());

        if (this.#currentSortAlgorithm === "coalition") 
            this.#sortUnitsByCoalition();

        if (this.#currentSortAlgorithm === "name") 
            this.#sortUnitsByName();

        if (this.#currentSortAlgorithm === "unitName") 
            this.#sortUnitsByUnitName();

        Object.values(this.#units).forEach((unit: Unit) => {
            //  Exclude dead units
            if (!unit.getAlive()) {
                return;
            }
            this.#contentElement.innerHTML += `
                <div class="unit-list-unit" data-value-unitName="${unit.getUnitName()}" data-value-name="${unit.getName()}" data-value-coalition="${unit.getCoalition()}" data-value-human="${unit.getHuman() ? "Human" : "AI"}">
                    <div data-unit-id="${unit.ID}">${unit.getUnitName()}</div>
                    <div>${unit.getName()}</div>
                    <div>${unit.getCoalition()}</div>
                    <div>${unit.getHuman() ? "Human" : "AI"}</div>
                </div>`;
        });
    }

    getContentElement() {
        return this.#contentElement;
    }

    #sortStringsCompare(str1: string, str2: string) {
        if (str1 > str2) {
            return (this.#currentSortDirection === "ASC") ? 1 : -1;
        } else if (str1 < str2) {
            return (this.#currentSortDirection === "ASC") ? -1 : 1;
        }

        return 0;
    }

    #sortUnitsByUnitName() {
        this.#units.sort((unit1: Unit, unit2: Unit) => {

            const str1 = unit1.getUnitName().toLowerCase();
            const str2 = unit2.getUnitName().toLowerCase();

            return this.#sortStringsCompare(str1, str2);
        });
    }

    #sortUnitsByCoalition() {
        this.#units.sort((unit1: Unit, unit2: Unit) => {
            let str1 = unit1.getCoalition();
            let str2 = unit2.getCoalition();

            let cmp = this.#sortStringsCompare(str1, str2);

            if (cmp !== 0) 
                return cmp;
            
            str1 = unit1.getUnitName().toLowerCase();
            str2 = unit2.getUnitName().toLowerCase();

            return this.#sortStringsCompare(str1, str2);
        });
    }

    #sortUnitsByName() {
        this.#units.sort((unit1: Unit, unit2: Unit) => {
            const str1 = unit1.getName().toLowerCase();
            const str2 = unit2.getName().toLowerCase();
            return this.#sortStringsCompare(str1, str2);
        });
    }

    startUpdates() {
        this.doUpdate();

        this.#updatesInterval = setInterval(() => {
            this.doUpdate();
        }, 2000);
    }

    stopUpdates() {
        clearInterval(this.#updatesInterval);
    }

    toggle() {
        if (this.getVisible()) 
            this.stopUpdates();
        else 
            this.startUpdates();
        
        super.toggle();
    }
}
