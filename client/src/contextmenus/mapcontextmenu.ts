import { LatLng } from "leaflet";
import { getApp } from "..";
import { ContextMenu } from "./contextmenu";
import { Switch } from "../controls/switch";
import { GAME_MASTER } from "../constants/constants";
import { CoalitionArea } from "../map/coalitionarea/coalitionarea";
import { AirDefenceUnitSpawnMenu, AircraftSpawnMenu, GroundUnitSpawnMenu, HelicopterSpawnMenu, NavyUnitSpawnMenu } from "../controls/unitspawnmenu";
import { Airbase } from "../mission/airbase";
import { SmokeMarker } from "../map/markers/smokemarker";
import { UnitSpawnTable } from "../interfaces";
import { getUnitDatabaseByCategory } from "../other/utils";

/** The MapContextMenu is the main contextmenu shown to the user whenever it rightclicks on the map. It is the primary interaction method for the user.
 * It allows to spawn units, create explosions and smoke, and edit CoalitionAreas.
 */
export class MapContextMenu extends ContextMenu {
    #coalitionSwitch: Switch;
    #aircraftSpawnMenu: AircraftSpawnMenu;
    #helicopterSpawnMenu: HelicopterSpawnMenu;
    #airDefenceUnitSpawnMenu: AirDefenceUnitSpawnMenu;
    #groundUnitSpawnMenu: GroundUnitSpawnMenu;
    #navyUnitSpawnMenu: NavyUnitSpawnMenu;
    #coalitionArea: CoalitionArea | null = null;
    #selectedUnitCategory: string = "";

    /**
     * 
     * @param ID - the ID of the HTML element which will contain the context menu
     */
    constructor(ID: string){
        super(ID);

        /* Create the coalition switch */
        this.#coalitionSwitch = new Switch("coalition-switch", (value: boolean) => this.#onSwitchClick(value));
        this.#coalitionSwitch.setValue(true);
        this.#coalitionSwitch.getContainer()?.addEventListener("contextmenu", (e) => this.#onSwitchRightClick());

        /* Create the spawn menus for the different unit types */
        this.#aircraftSpawnMenu = new AircraftSpawnMenu("aircraft-spawn-menu");
        this.#helicopterSpawnMenu = new HelicopterSpawnMenu("helicopter-spawn-menu");
        this.#airDefenceUnitSpawnMenu = new AirDefenceUnitSpawnMenu("air-defence-spawn-menu");
        this.#groundUnitSpawnMenu = new GroundUnitSpawnMenu("groundunit-spawn-menu");
        this.#navyUnitSpawnMenu = new NavyUnitSpawnMenu("navyunit-spawn-menu");

        /* Event listeners */
        document.addEventListener("mapContextMenuShow", (e: any) => {
            if (this.getVisibleSubMenu() !== e.detail.type) {
                this.#showSubMenu(e.detail.type);
                this.#selectedUnitCategory = e.detail.type;
            } else
                this.#hideSubMenus(e.detail.type);
        });

        document.addEventListener("contextMenuDeploySmoke", (e: any) => {
            this.hide();
            getApp().getServerManager().spawnSmoke(e.detail.color, this.getLatLng());
            var marker = new SmokeMarker(this.getLatLng(), e.detail.color);
            marker.addTo(getApp().getMap());
        });

        document.addEventListener("contextMenuExplosion", (e: any) => {
            this.hide();
            getApp().getServerManager().spawnExplosion(e.detail.strength ?? 0, e.detail.explosionType, this.getLatLng());
        });

        document.addEventListener("editCoalitionArea", (e: any) => {
            this.hide();
            if (this.#coalitionArea) {
                getApp().getMap().deselectAllCoalitionAreas();
                this.#coalitionArea.setSelected(true);
            }
        });

        // document.addEventListener("commandModeOptionsChanged", (e: any) => {
        //     //this.#refreshOptions();
        // });

        this.#aircraftSpawnMenu.getContainer().addEventListener("resize", () => this.clip());
        this.#helicopterSpawnMenu.getContainer().addEventListener("resize", () => this.clip());
        this.#airDefenceUnitSpawnMenu.getContainer().addEventListener("resize", () => this.clip());
        this.#groundUnitSpawnMenu.getContainer().addEventListener("resize", () => this.clip());
        this.#navyUnitSpawnMenu.getContainer().addEventListener("resize", () => this.clip());

        this.#aircraftSpawnMenu.getContainer().addEventListener("hide", () => this.hide());
        this.#helicopterSpawnMenu.getContainer().addEventListener("hide", () => this.hide());
        this.#airDefenceUnitSpawnMenu.getContainer().addEventListener("hide", () => this.hide());
        this.#groundUnitSpawnMenu.getContainer().addEventListener("hide", () => this.hide());
        this.#navyUnitSpawnMenu.getContainer().addEventListener("hide", () => this.hide());

        this.getContainer()?.addEventListener("show", () => this.#aircraftSpawnMenu.showCirclesPreviews());
        this.getContainer()?.addEventListener("show", () => this.#helicopterSpawnMenu.showCirclesPreviews());
        this.getContainer()?.addEventListener("show", () => this.#airDefenceUnitSpawnMenu.showCirclesPreviews());
        this.getContainer()?.addEventListener("show", () => this.#groundUnitSpawnMenu.showCirclesPreviews());
        this.getContainer()?.addEventListener("show", () => this.#navyUnitSpawnMenu.showCirclesPreviews());

        this.getContainer()?.addEventListener("hide", () => this.#aircraftSpawnMenu.clearCirclesPreviews());
        this.getContainer()?.addEventListener("hide", () => this.#helicopterSpawnMenu.clearCirclesPreviews());
        this.getContainer()?.addEventListener("hide", () => this.#airDefenceUnitSpawnMenu.clearCirclesPreviews());
        this.getContainer()?.addEventListener("hide", () => this.#groundUnitSpawnMenu.clearCirclesPreviews());
        this.getContainer()?.addEventListener("hide", () => this.#navyUnitSpawnMenu.clearCirclesPreviews());

        this.#setupHistory();
    }

    /** Show the contextmenu on top of the map, usually at the location where the user has clicked on it.
     * 
     * @param x X screen coordinate of the top left corner of the context menu
     * @param y Y screen coordinate of the top left corner of the context menu
     * @param latlng Leaflet latlng object of the mouse click
     */
    show(x: number, y: number, latlng: LatLng) {
        if (!getApp().getCurrentContext().getUseSpawnMenu())
            return false;

        super.show(x, y, latlng);

        this.#aircraftSpawnMenu.setLatLng(latlng);
        this.#helicopterSpawnMenu.setLatLng(latlng);
        this.#airDefenceUnitSpawnMenu.setLatLng(latlng);
        this.#groundUnitSpawnMenu.setLatLng(latlng);
        this.#navyUnitSpawnMenu.setLatLng(latlng);

        this.#aircraftSpawnMenu.setCountries();
        this.#helicopterSpawnMenu.setCountries();
        this.#airDefenceUnitSpawnMenu.setCountries();
        this.#groundUnitSpawnMenu.setCountries();
        this.#navyUnitSpawnMenu.setCountries();

        /* Only a Game Master can choose the coalition of a new unit */
        if (getApp().getMissionManager().getCommandModeOptions().commandMode !== GAME_MASTER) 
            this.#coalitionSwitch.hide()

        this.getContainer()?.querySelectorAll('[data-coalition]').forEach((element: any) => { element.setAttribute("data-coalition", getApp().getActiveCoalition()) });
        if (getApp().getActiveCoalition() == "blue")
            this.#coalitionSwitch.setValue(true);
        else if (getApp().getActiveCoalition() == "red")
            this.#coalitionSwitch.setValue(false);
        else
            this.#coalitionSwitch.setValue(undefined);
        
        /* Hide the coalition area button. It will be visible if a coalition area is set */
        this.getContainer()?.querySelector("#coalition-area-button")?.classList.toggle("hide", true);
    }

    /** If the user rightclicked on a CoalitionArea, it will be given the ability to edit it.
     * 
     * @param coalitionArea The CoalitionArea the user can edit
     */
    setCoalitionArea(coalitionArea: CoalitionArea) {
        this.#coalitionArea = coalitionArea;
        this.getContainer()?.querySelector("#coalition-area-button")?.classList.toggle("hide", false);
    }

    /** Shows the submenu depending on unit selection
     * 
     * @param type Submenu type, either "aircraft", "helicopter", "groundunit", "navyunit", "smoke", or "explosion"
     */
    #showSubMenu(type: string) {
        if (type === "more")
            this.getContainer()?.querySelector("#more-options-button-bar")?.classList.toggle("hide");
        else if (["aircraft", "helicopter", "air-defence", "groundunit"].includes(type))
            this.getContainer()?.querySelector("#more-options-button-bar")?.classList.toggle("hide", true);

        this.getContainer()?.querySelector("#aircraft-spawn-menu")?.classList.toggle("hide", type !== "aircraft");
        this.getContainer()?.querySelector("#aircraft-spawn-button")?.classList.toggle("is-open", type === "aircraft");
        this.getContainer()?.querySelector("#helicopter-spawn-menu")?.classList.toggle("hide", type !== "helicopter");
        this.getContainer()?.querySelector("#helicopter-spawn-button")?.classList.toggle("is-open", type === "helicopter");
        this.getContainer()?.querySelector("#groundunit-spawn-menu")?.classList.toggle("hide", type !== "groundunit");
        this.getContainer()?.querySelector("#groundunit-spawn-button")?.classList.toggle("is-open", type === "groundunit");
        this.getContainer()?.querySelector("#air-defence-spawn-menu")?.classList.toggle("hide", type !== "air-defence");
        this.getContainer()?.querySelector("#air-defence-spawn-button")?.classList.toggle("is-open", type === "air-defence");
        this.getContainer()?.querySelector("#navyunit-spawn-menu")?.classList.toggle("hide", type !== "navyunit");
        this.getContainer()?.querySelector("#navyunit-spawn-button")?.classList.toggle("is-open", type === "navyunit");
        this.getContainer()?.querySelector("#smoke-spawn-menu")?.classList.toggle("hide", type !== "smoke");
        this.getContainer()?.querySelector("#smoke-spawn-button")?.classList.toggle("is-open", type === "smoke");
        this.getContainer()?.querySelector("#explosion-menu")?.classList.toggle("hide", type !== "explosion");
        this.getContainer()?.querySelector("#explosion-spawn-button")?.classList.toggle("is-open", type === "explosion");

        (this.getContainer()?.querySelectorAll(".deploy-unit-button"))?.forEach((element: Node) => { (element as HTMLButtonElement).disabled = true; })

        this.#aircraftSpawnMenu.reset();
        this.#aircraftSpawnMenu.setCountries();
        this.#aircraftSpawnMenu.clearCirclesPreviews();
        this.#helicopterSpawnMenu.reset();
        this.#helicopterSpawnMenu.setCountries();
        this.#helicopterSpawnMenu.clearCirclesPreviews();
        this.#airDefenceUnitSpawnMenu.reset();
        this.#airDefenceUnitSpawnMenu.setCountries();
        this.#airDefenceUnitSpawnMenu.clearCirclesPreviews();
        this.#groundUnitSpawnMenu.reset();
        this.#groundUnitSpawnMenu.setCountries();
        this.#groundUnitSpawnMenu.clearCirclesPreviews();
        this.#navyUnitSpawnMenu.reset();
        this.#navyUnitSpawnMenu.setCountries();
        this.#navyUnitSpawnMenu.clearCirclesPreviews();

        this.setVisibleSubMenu(type);
        this.clip();
    }

    /** Hide all the submenus
     * 
     * @param type The type of the currenlt open submenu. 
     */
    #hideSubMenus(type: string) {
        /* Close the lower options bar if the currently open submenu does not required it */
        this.getContainer()?.querySelector("#more-options-button-bar")?.classList.toggle("hide", ["aircraft", "helicopter", "groundunit"].includes(type));
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

        this.#aircraftSpawnMenu.reset();
        this.#helicopterSpawnMenu.reset();
        this.#airDefenceUnitSpawnMenu.reset();
        this.#groundUnitSpawnMenu.reset();
        this.#navyUnitSpawnMenu.reset();

        this.#aircraftSpawnMenu.clearCirclesPreviews();
        this.#helicopterSpawnMenu.clearCirclesPreviews();
        this.#airDefenceUnitSpawnMenu.clearCirclesPreviews();
        this.#groundUnitSpawnMenu.clearCirclesPreviews();
        this.#navyUnitSpawnMenu.clearCirclesPreviews();

        this.setVisibleSubMenu(null);
        this.clip();
    }

    /** Callback called when the user left clicks on the coalition switch
     * 
     * @param value Switch position (true: "blue", false: "red")
     */
    #onSwitchClick(value: boolean) {
        value ? getApp().setActiveCoalition("blue") : getApp().setActiveCoalition("red");
        this.getContainer()?.querySelectorAll('[data-coalition]').forEach((element: any) => { element.setAttribute("data-coalition", getApp().getActiveCoalition()) });
        this.#aircraftSpawnMenu.setCountries();
        this.#helicopterSpawnMenu.setCountries();
        this.#airDefenceUnitSpawnMenu.setCountries();
        this.#groundUnitSpawnMenu.setCountries();
        this.#navyUnitSpawnMenu.setCountries();
    }

    /** Callback called when the user rightclicks on the coalition switch. This will select the "neutral" coalition.
     * 
     */
    #onSwitchRightClick() {
        this.#coalitionSwitch.setValue(undefined);
        getApp().setActiveCoalition("neutral");
        this.getContainer()?.querySelectorAll('[data-coalition]').forEach((element: any) => { element.setAttribute("data-coalition", getApp().getActiveCoalition()) });
        this.#aircraftSpawnMenu.setCountries();
        this.#helicopterSpawnMenu.setCountries();
        this.#airDefenceUnitSpawnMenu.setCountries();
        this.#groundUnitSpawnMenu.setCountries();
        this.#navyUnitSpawnMenu.setCountries();
    }


    /** Handles all of the logic for historal logging.
     * 
     */
    #setupHistory() {

        /* Set up the tab clicks */
        const spawnModes           = this.getContainer()?.querySelectorAll(".spawn-mode");
        const activeCoalitionLabel = document.getElementById("active-coalition-label");
        this.getContainer()?.querySelectorAll(".spawn-mode-tab").forEach((btn:Element) => {
            btn.addEventListener("click", (ev:MouseEventInit) => {
                spawnModes?.forEach(div => div.classList.add("hide"));

                const prevSiblings = [];
                let prev = btn.previousElementSibling;

                /* Count previous */
                while ( prev ) {
                    prevSiblings.push(prev);
                    prev = prev.previousElementSibling;
                }

                /* Tabs and content windows are assumed to be in the same order */
                if (spawnModes && spawnModes[prevSiblings.length]) {
                    spawnModes[prevSiblings.length].classList.remove("hide");
                }

                if (activeCoalitionLabel) activeCoalitionLabel.classList.toggle("hide", !btn.hasAttribute("data-show-label"));
            });
        });

        const history    = <HTMLDivElement>document.getElementById("spawn-history-menu");
        const maxEntries = 20;

        /** Listen for unit spawned **/
        document.addEventListener( "unitSpawned", (ev:CustomEventInit) => {
            const buttons = history.querySelectorAll("button");
            const detail:any = ev.detail;
            if (buttons.length === 0) history.innerHTML = "";  //  Take out any "no data" messages
            const button = document.createElement("button");
            button.setAttribute("data-spawned-coalition", detail.coalition);
            button.setAttribute("data-unit-type", detail.unitSpawnTable[0].unitType);
            button.setAttribute("data-unit-qty", detail.unitSpawnTable.length);

            const db = getUnitDatabaseByCategory(detail.category);
            button.innerHTML = `${db?.getByName(detail.unitSpawnTable[0].unitType)?.label} (${detail.unitSpawnTable.length})`;

            //  Remove a previous instance to save clogging up the list
            const previous:any = [].slice.call(buttons).find( (button:Element) => (
                detail.coalition === button.getAttribute("data-spawned-coalition") &&
                detail.unitSpawnTable[0].unitType === button.getAttribute("data-unit-type") &&
                detail.unitSpawnTable.length === parseInt(button.getAttribute("data-unit-qty") || "-1")));

            if (previous instanceof HTMLElement) previous.remove();

            /* Click to do the spawn */
            button.addEventListener("click", (ev:MouseEventInit) => {
                detail.unitSpawnTable.forEach((table:UnitSpawnTable, i:number) => {
                    table.location = this.getLatLng();  //  Set to new menu location
                    table.location.lat += 0.00015 * i;
                });
                getApp().getUnitsManager().spawnUnits(detail.category, detail.unitSpawnTable, detail.coalition, detail.immediate, detail.airbase, detail.country);
            });

            /*  Insert into DOM */
            history.prepend(button);

            /* Trim down to max number of entries */
            while (history.querySelectorAll("button").length > maxEntries) {
                history.childNodes[maxEntries].remove();
            }
        });
    }
}