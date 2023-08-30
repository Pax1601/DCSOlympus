import { LatLng } from "leaflet";
import { getActiveCoalition, getMap, getMissionHandler, getUnitsManager, setActiveCoalition } from "..";
import { spawnExplosion, spawnSmoke } from "../server/server";
import { aircraftDatabase } from "../unit/aircraftdatabase";
import { groundUnitDatabase } from "../unit/groundunitdatabase";
import { helicopterDatabase } from "../unit/helicopterdatabase";
import { ContextMenu } from "./contextmenu";
import { Dropdown } from "./dropdown";
import { Switch } from "./switch";
import { Slider } from "./slider";
import { ftToM } from "../other/utils";
import { GAME_MASTER } from "../constants/constants";
import { navyUnitDatabase } from "../unit/navyunitdatabase";
import { CoalitionArea } from "../map/coalitionarea";
import { UnitSpawnMenu } from "./unitspawnmenu";

export class MapContextMenu extends ContextMenu {
    #coalitionSwitch: Switch;
    #aircraftSpawnMenu: UnitSpawnMenu;

    #coalitionArea: CoalitionArea | null = null;
    
    constructor(id: string) {
        super(id);

        this.#coalitionSwitch = new Switch("coalition-switch", (value: boolean) => this.#onSwitchClick(value));
        this.#coalitionSwitch.setValue(false);
        this.#coalitionSwitch.getContainer()?.addEventListener("contextmenu", (e) => this.#onSwitchRightClick(e));

        this.#aircraftSpawnMenu = new UnitSpawnMenu("aircraft-spawn-menu", aircraftDatabase);

        document.addEventListener("mapContextMenuShow", (e: any) => {
            if (this.getVisibleSubMenu() !== e.detail.type)
                this.showSubMenu(e.detail.type);
            else 
                this.hideSubMenus(e.detail.type);
        });

        document.addEventListener("contextMenuDeployAircrafts", () => {

        });

        document.addEventListener("contextMenuDeployHelicopters", () => {

        });

        document.addEventListener("contextMenuDeployGroundUnits", () => {

        });

        document.addEventListener("contextMenuDeployNavyUnits", () => {

        });

        document.addEventListener("contextMenuDeploySmoke", (e: any) => {
            this.hide();
            spawnSmoke(e.detail.color, this.getLatLng());
        });

        document.addEventListener("contextMenuExplosion", (e: any) => {
            this.hide();
            spawnExplosion(e.detail.strength, this.getLatLng());
        });
        
        document.addEventListener("editCoalitionArea", (e: any) => {
            this.hide();
            if (this.#coalitionArea) {
                getMap().deselectAllCoalitionAreas();
                this.#coalitionArea.setSelected(true);
            }
        });

        document.addEventListener("commandModeOptionsChanged", (e: any) => {
            //this.#refreshOptions();
        });

        document.addEventListener("toggleAdvancedOptions", (e: any) => {
            if (e.detail.type === "aircraft")
                document.querySelector("#aircraft-advanced-options")?.classList.toggle("hide");
            else if (e.detail.type === "helicopter")
                document.querySelector("#helicopter-advanced-options")?.classList.toggle("hide");
            this.clip();
        });

    
        this.hide();
    }

    show(x: number, y: number, latlng: LatLng) {
        super.show(x, y, latlng);
        this.showUpperBar();

        this.showAltitudeSlider();

        //this.#spawnOptions.airbaseName = "";
        //this.#spawnOptions.latlng = latlng;

        this.getContainer()?.querySelectorAll('[data-coalition]').forEach((element: any) => { element.setAttribute("data-coalition", getActiveCoalition()) });
        if (getActiveCoalition() == "blue")
            this.#coalitionSwitch.setValue(false);
        else if (getActiveCoalition() == "red")
            this.#coalitionSwitch.setValue(true);
        else
            this.#coalitionSwitch.setValue(undefined);

        if (getMissionHandler().getCommandModeOptions().commandMode !== GAME_MASTER)
            this.#coalitionSwitch.hide()

        this.getContainer()?.querySelector("#coalition-area-button")?.classList.toggle("hide", true);

        //this.#setCountries();
    }

    showSubMenu(type: string) {
        if (type === "more")
            this.getContainer()?.querySelector("#more-options-button-bar")?.classList.toggle("hide");
        else if (["aircraft", "groundunit"].includes(type))
            this.getContainer()?.querySelector("#more-options-button-bar")?.classList.toggle("hide", true);

        this.getContainer()?.querySelector("#aircraft-spawn-menu")?.classList.toggle("hide", type !== "aircraft");
        this.getContainer()?.querySelector("#aircraft-spawn-button")?.classList.toggle("is-open", type === "aircraft");
        this.getContainer()?.querySelector("#helicopter-spawn-menu")?.classList.toggle("hide", type !== "helicopter");
        this.getContainer()?.querySelector("#helicopter-spawn-button")?.classList.toggle("is-open", type === "helicopter");
        this.getContainer()?.querySelector("#groundunit-spawn-menu")?.classList.toggle("hide", type !== "groundunit");
        this.getContainer()?.querySelector("#groundunit-spawn-button")?.classList.toggle("is-open", type === "groundunit");
        this.getContainer()?.querySelector("#navyunit-spawn-menu")?.classList.toggle("hide", type !== "navyunit");
        this.getContainer()?.querySelector("#navyunit-spawn-button")?.classList.toggle("is-open", type === "navyunit");
        this.getContainer()?.querySelector("#smoke-spawn-menu")?.classList.toggle("hide", type !== "smoke");
        this.getContainer()?.querySelector("#smoke-spawn-button")?.classList.toggle("is-open", type === "smoke");
        this.getContainer()?.querySelector("#explosion-menu")?.classList.toggle("hide", type !== "explosion");
        this.getContainer()?.querySelector("#explosion-spawn-button")?.classList.toggle("is-open", type === "explosion");

        (this.getContainer()?.querySelectorAll(".deploy-unit-button"))?.forEach((element: Node) => {(element as HTMLButtonElement).disabled = true;})

        this.#aircraftSpawnMenu.resetUnitRole();
        this.#aircraftSpawnMenu.resetUnitLabel();
        this.#aircraftSpawnMenu.setCountries();
        
        this.clip();

        //if (type === "aircraft") {
        //    this.#spawnOptions.altitude = ftToM(this.#aircraftSpawnAltitudeSlider.getValue());
        //}
        //else if (type === "helicopter") {
        //    this.#spawnOptions.altitude = ftToM(this.#helicopterSpawnAltitudeSlider.getValue());
        //}

        this.setVisibleSubMenu(type);
    }

    hideSubMenus(type: string) {
        this.getContainer()?.querySelector("#more-options-button-bar")?.classList.toggle("hide", ["aircraft", "groundunit"].includes(type));
        this.getContainer()?.querySelector("#aircraft-spawn-menu")?.classList.toggle("hide", true);
        this.getContainer()?.querySelector("#aircraft-spawn-button")?.classList.toggle("is-open", false);
        this.getContainer()?.querySelector("#helicopter-spawn-menu")?.classList.toggle("hide", true);
        this.getContainer()?.querySelector("#helicopter-spawn-button")?.classList.toggle("is-open", false);
        this.getContainer()?.querySelector("#groundunit-spawn-menu")?.classList.toggle("hide", true);
        this.getContainer()?.querySelector("#groundunit-spawn-button")?.classList.toggle("is-open", false);
        this.getContainer()?.querySelector("#navyunit-spawn-menu")?.classList.toggle("hide", true);
        this.getContainer()?.querySelector("#navyunit-spawn-button")?.classList.toggle("is-open", false);
        this.getContainer()?.querySelector("#smoke-spawn-menu")?.classList.toggle("hide", true);
        this.getContainer()?.querySelector("#smoke-spawn-button")?.classList.toggle("is-open", false);
        this.getContainer()?.querySelector("#explosion-menu")?.classList.toggle("hide", true);
        this.getContainer()?.querySelector("#explosion-spawn-button")?.classList.toggle("is-open", false);

        this.#aircraftSpawnMenu.resetUnitRole();
        this.#aircraftSpawnMenu.resetUnitLabel();

        this.clip();

        this.setVisibleSubMenu(null);
    }

    showUpperBar() {
        this.getContainer()?.querySelector(".upper-bar")?.classList.toggle("hide", false);
    }

    hideUpperBar() {
        this.getContainer()?.querySelector(".upper-bar")?.classList.toggle("hide", true);
    }

    showLowerBar() {
        this.getContainer()?.querySelector("#more-options-button-bar")?.classList.toggle("hide", false);
    }

    hideLowerBar() {
        this.getContainer()?.querySelector("#more-optionsbutton-bar")?.classList.toggle("hide", true);
    }

    showAltitudeSlider() {
        this.getContainer()?.querySelector("#aircraft-spawn-altitude-slider")?.classList.toggle("hide", false);
    }

    hideAltitudeSlider() {
        this.getContainer()?.querySelector("#aircraft-spawn-altitude-slider")?.classList.toggle("hide", true);
    }

    setAirbaseName(airbaseName: string) {
        //this.#spawnOptions.airbaseName = airbaseName;
    }

    setLatLng(latlng: LatLng) {
        //this.#spawnOptions.latlng = latlng;
    }

    setCoalitionArea(coalitionArea: CoalitionArea) {
        this.#coalitionArea = coalitionArea;
        this.getContainer()?.querySelector("#coalition-area-button")?.classList.toggle("hide", false);
    }

    #onSwitchClick(value: boolean) {
        value? setActiveCoalition("red"): setActiveCoalition("blue");
        this.getContainer()?.querySelectorAll('[data-coalition]').forEach((element: any) => { element.setAttribute("data-coalition", getActiveCoalition()) });
        //this.#setCountries();
    }

    #onSwitchRightClick(e: any) {
        this.#coalitionSwitch.setValue(undefined);
        setActiveCoalition("neutral");
        this.getContainer()?.querySelectorAll('[data-coalition]').forEach((element: any) => { element.setAttribute("data-coalition", getActiveCoalition()) });
        //this.#setCountries();
    }
}