import { Dropdown } from "../controls/dropdown";
import { Toolbar } from "./toolbar";

export class PrimaryToolbar extends Toolbar {
    constructor(ID: string) {
        super(ID);

        // TODO move here all code about primary toolbar

        /* The content of the dropdown is entirely defined in the .ejs file */ 
        new Dropdown("app-icon", () => { });
    }
}