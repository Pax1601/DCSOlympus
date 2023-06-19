import { getMap, getUnitsManager } from "..";
import { CoalitionArea } from "../map/coalitionarea";
import { ContextMenu } from "./contextmenu";
import { Dropdown } from "./dropdown";
import { Slider } from "./slider";
import { Switch } from "./switch";

const unitRole = ["AAA", "MANPADS", "SAM Sites", "Radar"];

export class CoalitionAreaContextMenu extends ContextMenu {
    #coalitionSwitch: Switch;
    #coalitionArea: CoalitionArea | null = null;
    #iadsDensitySlider: Slider;
    #iadsRoleDropdown: Dropdown;

    //#iadsPeriodDropdown: Dropdown;

    constructor(id: string) {
        super(id);

        this.#coalitionSwitch = new Switch("coalition-area-switch", (value: boolean) => this.#onSwitchClick(value));
        this.#coalitionSwitch.setValue(false);
        this.#iadsRoleDropdown = new Dropdown("iads-units-role-options", () => { });
        //this.#iadsPeriodDropdown = new Dropdown("iads-period-options", () => {});
        this.#iadsDensitySlider = new Slider("iads-density-slider", 5, 100, "%", (value: number) => { });
        this.#iadsDensitySlider.setIncrement(5);
        this.#iadsDensitySlider.setValue(50);
        this.#iadsDensitySlider.setActive(true);

        document.addEventListener("coalitionAreaContextMenuShow", (e: any) => {
            if (this.getVisibleSubMenu() !== e.detail.type)
                this.showSubMenu(e.detail.type);
            else
                this.hideSubMenus();
        });

        document.addEventListener("coalitionAreaDelete", (e: any) => {
            if (this.#coalitionArea)
                getMap().deleteCoalitionArea(this.#coalitionArea);
            getMap().hideCoalitionAreaContextMenu();
        });

        document.addEventListener("contextMenuCreateIads", (e: any) => {
            const values: { [key: string]: boolean } = {};
            const element = this.#iadsRoleDropdown.getOptionElements();
            for (let idx = 0; idx < element.length; idx++) {
                const option = element.item(idx) as HTMLElement;
                const key = option.querySelector("span")?.innerText;
                const value = option.querySelector("input")?.checked;
                if (key !== undefined && value !== undefined)
                    values[key] = value;
            }

            const area = this.getCoalitionArea();
            if (area)
                getUnitsManager().createIADS(area, values, this.#iadsDensitySlider.getValue());
        })

        /* Create the checkboxes to select the unit roles */
        this.#iadsRoleDropdown.setOptionsElements(unitRole.map((unitRole: string) => {
            var div = document.createElement("div");
            div.classList.add("ol-checkbox");
            var label = document.createElement("label");
            label.title = `Add ${unitRole}s to the IADS`;
            var input = document.createElement("input");
            input.type = "checkbox";
            input.checked = true;
            var span = document.createElement("span");
            span.innerText = unitRole;
            label.appendChild(input);
            label.appendChild(span);
            div.appendChild(label);
            return div as HTMLElement;
        }));

        this.hide();
    }

    showSubMenu(type: string) {
        this.getContainer()?.querySelector("#iads-menu")?.classList.toggle("hide", type !== "iads");
        this.getContainer()?.querySelector("#iads-button")?.classList.toggle("is-open", type === "iads");
        this.clip();

        this.setVisibleSubMenu(type);
    }

    hideSubMenus() {
        this.getContainer()?.querySelector("#iads-menu")?.classList.toggle("hide", true);
        this.getContainer()?.querySelector("#iads-button")?.classList.toggle("is-open", false);
        this.clip();

        this.setVisibleSubMenu(null);
    }

    getCoalitionArea() {
        return this.#coalitionArea;
    }

    setCoalitionArea(coalitionArea: CoalitionArea) {
        this.#coalitionArea = coalitionArea;
        this.getContainer()?.querySelectorAll('[data-coalition]').forEach((element: any) => {
            element.setAttribute("data-coalition", this.getCoalitionArea()?.getCoalition())
        });
        this.#coalitionSwitch.setValue(this.getCoalitionArea()?.getCoalition() === "red");
    }

    #onSwitchClick(value: boolean) {
        this.getCoalitionArea()?.setCoalition(value ? "red" : "blue");
        this.getContainer()?.querySelectorAll('[data-coalition]').forEach((element: any) => {
            element.setAttribute("data-coalition", this.getCoalitionArea()?.getCoalition())
        });
    }
}