import { LatLng } from "leaflet";
import { getActiveCoalition } from "..";
import { ContextMenu } from "./contextmenu";
import { AircraftSpawnMenu, HelicopterSpawnMenu } from "../controls/unitspawnmenu";
import { Airbase } from "../mission/airbase";

/** This context menu is shown when the user wants to spawn a new aircraft or helicopter from the ground at an airbase. 
 * It is shown by clicking on the "spawn" button of a AirbaseContextMenu. */
export class AirbaseSpawnContextMenu extends ContextMenu {
    #aircraftSpawnMenu: AircraftSpawnMenu;
    #helicopterSpawnMenu: HelicopterSpawnMenu;

    /**
     * 
     * @param ID - the ID of the HTML element which will contain the context menu
     */
    constructor(ID: string){
        super(ID);

        /* Create the spawn menus for the different unit types */
        this.#aircraftSpawnMenu = new AircraftSpawnMenu("airbase-aircraft-spawn-menu");
        this.#helicopterSpawnMenu = new HelicopterSpawnMenu("airbase-helicopter-spawn-menu");

        this.#aircraftSpawnMenu.getAltitudeSlider().hide();
        this.#helicopterSpawnMenu.getAltitudeSlider().hide();

        /* Event listeners */
        document.addEventListener("mapContextMenuShow", (e: any) => {
            if (this.getVisibleSubMenu() !== e.detail.type)
                this.#showSubMenu(e.detail.type);
            else
                this.#hideSubMenus();
        });

        this.#aircraftSpawnMenu.getContainer().addEventListener("resize", () => this.clip());
        this.#helicopterSpawnMenu.getContainer().addEventListener("resize", () => this.clip());

        this.hide();
    }

    /** Show the context menu
     * 
     * @param x X screen coordinate of the top left corner of the context menu
     * @param y Y screen coordinate of the top left corner of the context menu
     */
    show(x: number, y: number) {
        super.show(x, y, new LatLng(0, 0));

        this.#aircraftSpawnMenu.setAirbase(undefined);
        this.#helicopterSpawnMenu.setAirbase(undefined);
        this.#aircraftSpawnMenu.setCountries();
        this.#helicopterSpawnMenu.setCountries();

        this.getContainer()?.querySelectorAll('[data-coalition]').forEach((element: any) => { element.setAttribute("data-coalition", getActiveCoalition()) });
    }

    /** Sets the airbase at which the new unit will be spawned
     * 
     * @param airbase The airbase at which the new unit will be spawned. Note: if the airbase has no suitable parking spots, the airplane may be spawned on the runway, or spawning may fail.
     */
    setAirbase(airbase: Airbase) {
        this.#aircraftSpawnMenu.setAirbase(airbase);
        this.#helicopterSpawnMenu.setAirbase(airbase);
    }

    /** Shows the submenu depending on unit selection
     * 
     * @param type Submenu type, either "aircraft" or "helicopter"
     */
    #showSubMenu(type: string) {
        this.getContainer()?.querySelector("#airbase-aircraft-spawn-menu")?.classList.toggle("hide", type !== "aircraft");
        this.getContainer()?.querySelector("#airbase-aircraft-spawn-button")?.classList.toggle("is-open", type === "aircraft");
        this.getContainer()?.querySelector("#airbase-helicopter-spawn-menu")?.classList.toggle("hide", type !== "helicopter");
        this.getContainer()?.querySelector("#airbase-helicopter-spawn-button")?.classList.toggle("is-open", type === "helicopter");
       
        (this.getContainer()?.querySelectorAll(".deploy-unit-button"))?.forEach((element: Node) => { (element as HTMLButtonElement).disabled = true; })

        this.#aircraftSpawnMenu.reset();
        this.#aircraftSpawnMenu.setCountries();
        this.#helicopterSpawnMenu.reset();
        this.#helicopterSpawnMenu.setCountries();

        this.setVisibleSubMenu(type);
        this.clip();
    }

    /** Hide all the open submenus
     * 
     */
    #hideSubMenus() {
        this.getContainer()?.querySelector("#airbase-aircraft-spawn-menu")?.classList.toggle("hide", true);
        this.getContainer()?.querySelector("#airbase-aircraft-spawn-button")?.classList.toggle("is-open", false);
        this.getContainer()?.querySelector("#airbase-helicopter-spawn-menu")?.classList.toggle("hide", true);
        this.getContainer()?.querySelector("#airbase-helicopter-spawn-button")?.classList.toggle("is-open", false);
      
        this.#aircraftSpawnMenu.reset();
        this.#helicopterSpawnMenu.reset();

        this.setVisibleSubMenu(null);
        this.clip();
    }
}