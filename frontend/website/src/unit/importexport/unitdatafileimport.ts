import { getApp } from "../..";
import { Dialog } from "../../dialog/dialog";
import { UnitData } from "../../interfaces";
import { ImportFileJSONSchemaValidator } from "../../schemas/schema";
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
                return { unitType: unitData.name, location: unitData.position, liveryID: "", skill: "High" }
            });

            unitsManager.spawnUnits(category, unitsToSpawn, coalition, false);
        }
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
                
                try {
                    this.#fileData = JSON.parse(e.target.result);

                    const validator = new ImportFileJSONSchemaValidator();
                    if (!validator.validate(this.#fileData)) {
                        const errors = validator.getErrors().reduce((acc:any, error:any) => {
                            let errorString = error.instancePath.substring(1) + ": " + error.message;
                            if (error.params) {
                                const {allowedValues} = error.params;
                                if (allowedValues)
                                    errorString += ": " + allowedValues.join(', ');
                            }
                            acc.push(errorString);
                            return acc;
                        }, [] as string[]);
                        this.#showFileDataErrors(errors);
                    } else {
                        this.#showForm();
                    }                   
                } catch(e:any) {
                    this.#showFileDataErrors([e]);
                }
            };
            reader.readAsText(file);
        })
        input.click();
    }

    #showFileDataErrors( reasons:string[]) {
        
        this.dialog.getElement().querySelectorAll("[data-on-error]").forEach((el:Element) => {
            el.classList.toggle("hide", el.getAttribute("data-on-error") === "hide");
        });

        const reasonsList = this.dialog.getElement().querySelector(".import-error-reasons");
        if (reasonsList instanceof HTMLElement)
            reasonsList.innerHTML = `<li>${reasons.join("</li><li>")}</li>`;

        this.dialog.show();
    }

    #showForm() {
        this.dialog.getElement().querySelectorAll("[data-on-error]").forEach((el:Element) => {
            el.classList.toggle("hide", el.getAttribute("data-on-error") === "show");
        });

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

        this.data = data;
        this.buildCategoryCoalitionTable();
        this.dialog.show();
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