import { getApp } from "..";
import { Dialog } from "../dialog/dialog";
import { UnitData } from "../interfaces";
import { UnitDataFile } from "./unitdatafile";

export class UnitDataFileImport extends UnitDataFile {

    protected data!: any;
    protected dialog: Dialog;
    #fileData!: { [key: string]: UnitData[] };

    constructor(elementId: string) {
        super();
        this.dialog = new Dialog(elementId);
        this.dialog.getElement().querySelector(".start-transfer")?.addEventListener("click", (ev: MouseEventInit) => {
            this.#doImport();
            this.dialog.hide();
        });
    }

    #doImport() {

        let selectedCategories: any = {};
        const unitsManager = getApp().getUnitsManager();

        this.dialog.getElement().querySelectorAll(`input[type="checkbox"][name="category-coalition-selection"]:checked`).forEach(<HTMLInputElement>(checkbox: HTMLInputElement) => {
            if (checkbox instanceof HTMLInputElement) {
                const [category, coalition] = checkbox.value.split(":");    // e.g. "category:coalition"
                selectedCategories[category] = selectedCategories[category] || {};
                selectedCategories[category][coalition] = true;
            }
        });

        for (const [groupName, groupData] of Object.entries(this.#fileData)) {
            if (groupName === "" || groupData.length === 0 || !this.#unitGroupDataCanBeImported(groupData))
                continue;

            let { category, coalition } = groupData[0];

            if (!selectedCategories.hasOwnProperty(category)
                || !selectedCategories[category].hasOwnProperty(coalition)
                || selectedCategories[category][coalition] !== true)
                continue;

            let unitsToSpawn = groupData.filter((unitData: UnitData) => this.#unitDataCanBeImported(unitData)).map((unitData: UnitData) => {
                return { unitType: unitData.name, location: unitData.position, liveryID: "" }
            });

            unitsManager.spawnUnits(category, unitsToSpawn, coalition, true);
        }

        /*
        for (let groupName in groups) {
            if (groupName !== "" && groups[groupName].length > 0 && (groups[groupName].every((unit: UnitData) => { return unit.category == "GroundUnit"; }) || groups[groupName].every((unit: any) => { return unit.category == "NavyUnit"; }))) {
                var aliveUnits = groups[groupName].filter((unit: UnitData) => { return unit.alive });
                var units = aliveUnits.map((unit: UnitData) => {
                    return { unitType: unit.name, location: unit.position, liveryID: "" }
                });
                getApp().getUnitsManager().spawnUnits(groups[groupName][0].category, units, groups[groupName][0].coalition, true);
            }
        }
        //*/
    }

    #showForm() {
        const data: any = {};

        for (const [group, units] of Object.entries(this.#fileData)) {
            if (group === "" || units.length === 0)
                continue;

            if (units.some((unit: UnitData) => !this.#unitDataCanBeImported(unit)))
                continue;

            const category = units[0].category;

            if (!data.hasOwnProperty(category)) {
                data[category] = {};
            }

            units.forEach((unit: UnitData) => {
                if (!data[category].hasOwnProperty(unit.coalition))
                    data[category][unit.coalition] = [];

                data[category][unit.coalition].push(unit);
            });

        }

        /*
        groups.filter((unit:Unit) => unitCanBeImported(unit)).forEach((unit:Unit) => {
            const category  = unit.getCategoryLabel();
            const coalition = unit.getCoalition();

            if (!data.hasOwnProperty(category)) {
                data[category] = {};
            }

            if (!data[category].hasOwnProperty(coalition))
                data[category][coalition] = [];

            data[category][coalition].push(unit);
        });
        //*/
        this.data = data;
        this.buildCategoryCoalitionTable();
        this.dialog.show();
    }

    selectFile() {
        var input = document.createElement("input");
        input.type = "file";
        input.addEventListener("change", (e: any) => {
            var file = e.target.files[0];
            if (!file) {
                return;
            }
            var reader = new FileReader();
            reader.onload = (e: any) => {
                this.#fileData = JSON.parse(e.target.result);
                this.#showForm();
            };
            reader.readAsText(file);
        })
        input.click();
    }

    #unitDataCanBeImported(unitData: UnitData) {
        return unitData.alive && this.#unitGroupDataCanBeImported([unitData]);
    }

    #unitGroupDataCanBeImported(unitGroupData: UnitData[]) {
        return unitGroupData.every((unitData: UnitData) => {
            return !["Aircraft", "Helicopter"].includes(unitData.category);
        }) && unitGroupData.some((unitData: UnitData) => unitData.alive);
    }

}