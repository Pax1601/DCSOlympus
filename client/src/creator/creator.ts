import { Dropdown, TDropdownConfig } from "../controls/dropdown";

export class Creator {

    createDropdown(config:TDropdownConfig):Dropdown {
        return new Dropdown(config);
    }

}