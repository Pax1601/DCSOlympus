import { Dropdown } from "../controls/dropdown";
import { Toolbar } from "./toolbar";

export class PrimaryToolbar extends Toolbar {
    #mainDropdown: Dropdown; 

    constructor(ID: string) {
        super(ID);

        /* The content of the dropdown is entirely defined in the .ejs file */ 
        this.#mainDropdown = new Dropdown("app-icon", () => { });
    }

    getMainDropdown() {
        return this.#mainDropdown;
    }
}