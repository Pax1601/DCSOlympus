import { getUnitsManager } from "..";
import { Panel } from "../panels/panel";
import { Unit } from "../units/unit";

export class UnitDataTable extends Panel {
    constructor(id: string) {
        super(id);
        this.hide();
    }

    update() {
        var units = getUnitsManager().getUnits();

        const unitsArray = Object.values(units).sort((a: Unit, b: Unit) => {
            const aVal = a.getUnitName()?.toLowerCase();
            const bVal = b.getUnitName()?.toLowerCase();

            if (aVal > bVal) {
                return 1;
            } else if (bVal > aVal) {
                return -1;
            } else {
                return 0;
            }
        });
        

        function addRow(parentEl: HTMLElement, columns: string[]) {
            const rowDiv = document.createElement("div");

            for (const item of columns) {

                const div = document.createElement("div");
                div.innerText = item;
                rowDiv.appendChild(div);

            }
            parentEl.appendChild(rowDiv);
        }

        const el = <HTMLElement> this.getElement().querySelector("#unit-list");

        if (el) {

            el.innerHTML = "";

            addRow(el, ["Callsign", "Name", "Category", "AI/Human"])

            for (const unit of unitsArray) {

                const dataset = [unit.getUnitName(), unit.getName(), unit.getCategory(), (unit.getControlled()) ? "AI" : "Human"];

                addRow(el, dataset);
            }
        }
    }
}