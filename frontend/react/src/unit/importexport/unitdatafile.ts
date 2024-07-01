//import { Dialog } from "../../dialog/dialog";
//import { createCheckboxOption } from "../../other/utils";

var categoryMap = {
  Aircraft: "Aircraft",
  Helicopter: "Helicopter",
  GroundUnit: "Ground units",
  NavyUnit: "Naval units",
};

export abstract class UnitDataFile {
  protected data: any;
  //protected dialog!: Dialog;

  constructor() {}

  buildCategoryCoalitionTable() {
    const categories = this.#getCategoriesFromData();
    const coalitions = ["blue", "neutral", "red"];

    let headersHTML: string = ``;
    let matrixHTML: string = ``;

    //categories.forEach((category: string, index) => {
    //    matrixHTML += `<tr><td>${categoryMap[category as keyof typeof categoryMap]}</td>`;
    //
    //    coalitions.forEach((coalition: string) => {
    //        if (index === 0)
    //            headersHTML += `<th data-coalition="${coalition}">${coalition[0].toUpperCase() + coalition.substring(1)}</th>`;
    //
    //        const optionIsValid = this.data[category].hasOwnProperty(coalition);
    //        let checkboxHTML = createCheckboxOption(``, category, optionIsValid, () => { }, {
    //            "disabled": !optionIsValid,
    //            "name": "category-coalition-selection",
    //            "readOnly": !optionIsValid,
    //            "value" : `${category}:${coalition}`
    //        }).outerHTML;
    //
    //        if (optionIsValid)
    //            checkboxHTML = checkboxHTML.replace(`"checkbox"`, `"checkbox" checked`);       //  inner and outerHTML screw default checked up
    //
    //        matrixHTML += `<td data-coalition="${coalition}">${checkboxHTML}</td>`;
    //
    //    });
    //    matrixHTML += "</tr>";
    //});
    //
    //const table = <HTMLTableElement>this.dialog.getElement().querySelector("table.categories-coalitions");

    //(<HTMLElement>table.tHead).innerHTML = `<tr><td>&nbsp;</td>${headersHTML}</tr>`;
    //(<HTMLElement>table.querySelector(`tbody`)).innerHTML = matrixHTML;
  }

  #getCategoriesFromData() {
    const categories = Object.keys(this.data);
    categories.sort();
    return categories;
  }

  getData() {
    return this.data;
  }
}
