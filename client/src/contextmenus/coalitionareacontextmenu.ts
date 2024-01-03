import { LatLng } from "leaflet";
import { getApp } from "..";
import { GAME_MASTER, IADSTypes } from "../constants/constants";
import { CoalitionArea } from "../map/coalitionarea/coalitionarea";
import { ContextMenu } from "./contextmenu";
import { Dropdown } from "../controls/dropdown";
import { Slider } from "../controls/slider";
import { Switch } from "../controls/switch";
import { groundUnitDatabase } from "../unit/databases/groundunitdatabase";
import { createCheckboxOption, getCheckboxOptions } from "../other/utils";

/** This context menu allows the user to edit or delete a CoalitionArea. Moreover, it allows the user to create a IADS automatically using the CoalitionArea as bounds. */
export class CoalitionAreaContextMenu extends ContextMenu {
    #coalitionSwitch: Switch;
    #coalitionArea: CoalitionArea | null = null;
    #iadsDensitySlider: Slider;
    #iadsDistributionSlider: Slider;
    #iadsTypesDropdown: Dropdown;
    #iadsErasDropdown: Dropdown;
    #iadsRangesDropdown: Dropdown;

    /**
     * 
     * @param ID - the ID of the HTML element which will contain the context menu
     */
    constructor(ID: string){
        super(ID);

        /* Create the coalition switch */
        this.#coalitionSwitch = new Switch("coalition-area-switch", (value: boolean) => this.#onSwitchClick(value), true);
        this.#coalitionSwitch.setValue(true);

        /* Create the controls of the IADS creation submenu */
        this.#iadsTypesDropdown = new Dropdown({
            "ID": "iads-units-type-options",
            "callback": () => {}
        });
        this.#iadsErasDropdown = new Dropdown({
            "ID": "iads-era-options",
            "callback": () => {}
        });
        this.#iadsRangesDropdown = new Dropdown({
            "ID": "iads-range-options",
            "callback": () => {}
        });
        this.#iadsDensitySlider = new Slider("iads-density-slider", 5, 100, "%", (value: number) => { });
        this.#iadsDistributionSlider = new Slider("iads-distribution-slider", 5, 100, "%", (value: number) => { });

        /* Set the default parameters of the sliders */
        this.#iadsDensitySlider.setIncrement(5);
        this.#iadsDensitySlider.setValue(50);
        this.#iadsDensitySlider.setActive(true);
        this.#iadsDistributionSlider.setIncrement(5);
        this.#iadsDistributionSlider.setValue(50);
        this.#iadsDistributionSlider.setActive(true);

        document.addEventListener("coalitionAreaContextMenuShow", (e: any) => {
            if (this.getVisibleSubMenu() !== e.detail.type)
                this.#showSubMenu(e.detail.type);
            else
                this.#hideSubMenus();
        });

        document.addEventListener("coalitionAreaBringToBack", (e: any) => {
            if (this.#coalitionArea)
                getApp().getMap().bringCoalitionAreaToBack(this.#coalitionArea);
            getApp().getMap().hideCoalitionAreaContextMenu();
        });

        document.addEventListener("coalitionAreaDelete", (e: any) => {
            if (this.#coalitionArea)
                getApp().getMap().deleteCoalitionArea(this.#coalitionArea);
            getApp().getMap().hideCoalitionAreaContextMenu();
        });

        document.addEventListener("contextMenuCreateIads", (e: any) => {
            const area = this.getCoalitionArea();
            const forceCoalition = (this.getContainer()?.querySelector("#force-coalition")?.querySelector("input") as HTMLInputElement).checked;
            if (area)
                getApp().getUnitsManager().createIADS(area, getCheckboxOptions(this.#iadsTypesDropdown), getCheckboxOptions(this.#iadsErasDropdown), getCheckboxOptions(this.#iadsRangesDropdown), this.#iadsDensitySlider.getValue(), this.#iadsDistributionSlider.getValue(), forceCoalition);
            this.hide();
        });
        this.hide();
    }

    /**
     * 
     * @param x X screen coordinate of the top left corner of the context menu
     * @param y Y screen coordinate of the top left corner of the context menu
     * @param latlng Leaflet latlng object of the mouse click
     */
    show(x: number, y: number, latlng: LatLng) {
        super.show(x, y, latlng);

        /* Create the checkboxes to select the unit roles */
        this.#iadsTypesDropdown.setOptionsElements(IADSTypes.map((role: string) => {
            return createCheckboxOption(role, `Add ${role}s to the IADS` );
        }));

        
        /* Create the checkboxes to select the unit periods */
        this.#iadsErasDropdown.setOptionsElements(groundUnitDatabase.getEras().map((era: string) => {
            return createCheckboxOption(era, `Add ${era} era units to the IADS`);
        }));

        /* Create the checkboxes to select the unit ranges */
        this.#iadsRangesDropdown.setOptionsElements(["Short range", "Medium range", "Long range"].map((range: string) => {
            return createCheckboxOption(range, `Add ${range} units to the IADS`);
        }));

        if (getApp().getMissionManager().getCommandModeOptions().commandMode !== GAME_MASTER)
            this.#coalitionSwitch.hide()
    }

    /** Set the CoalitionArea object the user will be able to edit using this menu
     * 
     * @param coalitionArea The CoalitionArea object to edit
     */
    setCoalitionArea(coalitionArea: CoalitionArea) {
        this.#coalitionArea = coalitionArea;
        this.getContainer()?.querySelectorAll('[data-coalition]').forEach((element: any) => {
            element.setAttribute("data-coalition", this.getCoalitionArea()?.getCoalition())
        });
        this.#coalitionSwitch.setValue(this.getCoalitionArea()?.getCoalition() === "blue");
    }

    /** Get the CoalitionArea object the contextmenu is editing
     * 
     * @returns The CoalitionArea the contextmenu is editing
     */
    getCoalitionArea() {
        return this.#coalitionArea;
    }

    /** Show a submenu of the contextmenu
     * 
     * @param type The submenu type, currently only "iads"
     */
    #showSubMenu(type: string) {
        this.getContainer()?.querySelector("#iads-menu")?.classList.toggle("hide", type !== "iads");
        this.getContainer()?.querySelector("#iads-button")?.classList.toggle("is-open", type === "iads");
        this.clip();

        this.setVisibleSubMenu(type);
    }

    /** Hide all submenus
     * 
     */
    #hideSubMenus() {
        this.getContainer()?.querySelector("#iads-menu")?.classList.toggle("hide", true);
        this.getContainer()?.querySelector("#iads-button")?.classList.toggle("is-open", false);
        this.clip();

        this.setVisibleSubMenu(null);
    }

    /** Callback event called when the coalition switch is clicked to change the coalition of the CoalitionArea
     * 
     * @param value Switch position (false: red, true: blue)
     */
    #onSwitchClick(value: boolean) {
        if (getApp().getMissionManager().getCommandModeOptions().commandMode == GAME_MASTER) {
            this.getCoalitionArea()?.setCoalition(value ? "blue" : "red");
            this.getContainer()?.querySelectorAll('[data-coalition]').forEach((element: any) => {
                element.setAttribute("data-coalition", this.getCoalitionArea()?.getCoalition())
            });
        }
    }
}