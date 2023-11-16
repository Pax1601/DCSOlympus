import { getApp } from "..";
import { Dialog } from "../dialog/dialog";
import { zeroAppend } from "../other/utils";
import { Unit } from "./unit";
import { UnitDataFile } from "./unitdatafile";

export class UnitDataFileExport extends UnitDataFile {

    protected data!:any;
    protected dialog:Dialog;
    #element!:HTMLElement;

    constructor( elementId:string ) {
        super();
        this.dialog = new Dialog(elementId);
        this.#element = this.dialog.getElement();

        this.#element.querySelector(".start-transfer")?.addEventListener("click", (ev:MouseEventInit) => {
            this.#doExport();
        });
    }

    /**
     * Show the form to start the export journey
     */
    showForm(units:Unit[]) {        
        const data:any            = {};
        const unitCanBeExported   = (unit:Unit) => !["Aircraft", "Helicopter"].includes(unit.getCategory());

        units.filter((unit:Unit) => unit.getAlive() && unitCanBeExported(unit)).forEach((unit:Unit) => {
            const category  = unit.getCategory();
            const coalition = unit.getCoalition();

            if (!data.hasOwnProperty(category)) {
                data[category] = {};
            }

            if (!data[category].hasOwnProperty(coalition))
                data[category][coalition] = [];

            data[category][coalition].push(unit);
        });

        this.data = data;
        this.buildCategoryCoalitionTable();
        this.dialog.show();
    }
    
    #doExport() {

        let selectedUnits:Unit[] = [];
        
        this.#element.querySelectorAll(`input[type="checkbox"][name="category-coalition-selection"]:checked`).forEach(<HTMLInputElement>(checkbox:HTMLInputElement) => {
            if (checkbox instanceof HTMLInputElement) {
                const [category, coalition] = checkbox.value.split(":");    // e.g. "category:coalition"
                selectedUnits = selectedUnits.concat(this.data[category][coalition]);
            }
        });

        if (selectedUnits.length === 0) {
            alert("Please select at least one option for export.");
            return;
        }

        var unitsToExport: { [key: string]: any } = {};
        selectedUnits.forEach((unit:Unit) => {
            var data: any = unit.getData();
            if (unit.getGroupName() in unitsToExport)
                unitsToExport[unit.getGroupName()].push(data);
            else
                unitsToExport[unit.getGroupName()] = [data];
        });

        const date = new Date();
        const a    = document.createElement("a");
        const file = new Blob([JSON.stringify(unitsToExport)], { type: 'text/plain' });
        a.href     = URL.createObjectURL(file);
        a.download = `olympus_${getApp().getMissionManager().getTheatre().replace( /[^\w]/gi, "" ).toLowerCase()}_${date.getFullYear()}${zeroAppend(date.getMonth()+1, 2)}${zeroAppend(date.getDate(), 2)}_${zeroAppend(date.getHours(), 2)}${zeroAppend(date.getMinutes(), 2)}${zeroAppend(date.getSeconds(), 2)}.json`;
        a.click();
        this.dialog.hide();
    }

}