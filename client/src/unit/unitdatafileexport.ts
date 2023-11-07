import { Dialog } from "../dialog/dialog";
import { Unit } from "./unit";
import { unitDataFile } from "./unitdatafile";

export class UnitDataFileExport extends unitDataFile {

    #dialog:Dialog;
    #element!:HTMLElement;
    #categoryCoalitionHeaders!: HTMLElement;
    #categoryCoalitionMatrix!: HTMLElement;

    constructor( elementId:string ) {
        super();
        this.#dialog = new Dialog(elementId);
        this.#element = this.#dialog.getElement();
        this.#categoryCoalitionMatrix  = <HTMLElement>this.#element.querySelector("tbody");
        this.#categoryCoalitionHeaders = <HTMLElement>this.#element.querySelector("thead");
    }

    /**
     * Show the form to start the export journey
     */
    showForm(units:Unit[]) {
        this.#element.setAttribute( "data-mode", "export" );
        
        const data:any = {};

        const categories:string[] = [];
        const coalitions:string[] = [];

        units.filter((unit:Unit) => unit.getControlled() && unit.getAlive()).forEach((unit:Unit) => {
            const category = unit.getCategory();
            const coalition = unit.getCoalition();

            if (!coalitions.includes(coalition))
                coalitions.push(coalition);

            if (!data.hasOwnProperty(category)) {
                data[category] = {};
                categories.push(category);
            }

            //  Cache unit data
            if (!data[category].hasOwnProperty(coalition))
                data[category][coalition] = [];

            data[category][coalition].push(unit);
        });

        categories.sort();
        coalitions.sort();

        let headersHTML:string = ``;
        let matrixHTML:string = ``;

        categories.forEach((category:string, index) => {
            matrixHTML += `<tr><td>${category}</td>`;

            coalitions.forEach((coalition:string) => {
                if (index === 0)
                    headersHTML += `<th data-coalition="${coalition}">${coalition}</th>`;
                matrixHTML += `<td data-coalition="${coalition}">${(data[category].hasOwnProperty(coalition)) ? `<input type="checkbox" value="${category}:${coalition}" checked />`: "-"}</td>`;
            });

            matrixHTML += "</tr>";
        });

        this.#categoryCoalitionHeaders.innerHTML = `<tr><td>&nbsp;</td>${headersHTML}</tr>`;
        this.#categoryCoalitionMatrix.innerHTML = matrixHTML;
        this.#dialog.show();
    }

}