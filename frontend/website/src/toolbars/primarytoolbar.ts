import { getApp } from "..";
import { Dropdown } from "../controls/dropdown";
import { Switch } from "../controls/switch";
import { Toolbar } from "./toolbar";

export class PrimaryToolbar extends Toolbar {
    #mainDropdown: Dropdown; 
    #cameraLinkTypeSwitch: Switch;

    constructor(ID: string) {
        super(ID);

        /* The content of the dropdown is entirely defined in the .ejs file */ 
        this.#mainDropdown = new Dropdown("app-icon", () => { });

        this.#cameraLinkTypeSwitch = new Switch("camera-link-type-switch", (value: boolean) => {
            getApp().getMap().setCameraControlMode(value? 'map': 'live');
        })
    }

    getMainDropdown() {
        return this.#mainDropdown;
    }
}