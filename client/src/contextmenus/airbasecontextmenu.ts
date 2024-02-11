import { getApp } from "..";
import { GAME_MASTER } from "../constants/constants";
import { Airbase } from "../mission/airbase";
import { Unit } from "../unit/unit";
import { ContextMenu, contextMenuConfig } from "./contextmenu";

/** This context menu is shown to the user when the airbase marker is right clicked on the map. 
 * It allows the user to inspect information about the airbase, as well as allowing to spawn units from the airbase itself and land units on it. */
export class AirbaseContextMenu extends ContextMenu {
    #airbase: Airbase | null = null;

    /**
     * 
     * @param config <contextMenuConfig> the config object for the menu
     */
    constructor(config: contextMenuConfig) {
        super(config);
        document.addEventListener("contextMenuSpawnAirbase", (e: CustomEventInit) => {
            this.#showSpawnMenu();
        });

        document.addEventListener("contextMenuLandAirbase", (e: CustomEventInit) => {
            if (this.#airbase)
                getApp().getUnitsManager().landAt(this.#airbase.getLatLng());
            this.hide();
        });
    }

    /** Sets the airbase for which data will be shown in the context menu
     * 
     * @param airbase The airbase for which data will be shown in the context menu. Note: the airbase must be present in the public/databases/airbases/<theatre>.json database.
     */
    setAirbase(airbase: Airbase) {
        this.#airbase = airbase;

        const container = this.getContainer();
        if (container instanceof HTMLElement) {
            container.innerHTML = getApp().getTemplateManger().renderTemplate("airbaseContextMenu", {
                "airbase": airbase,
                "showLandHere": (getApp().getUnitsManager().getSelectedUnitsCategories().length == 1 && ["Aircraft", "Helicopter"].includes(getApp().getUnitsManager().getSelectedUnitsCategories()[0])
                    && (getApp().getUnitsManager().getSelectedUnitsVariable((unit: Unit) => { return unit.getCoalition() }) === this.#airbase?.getCoalition() || this.#airbase?.getCoalition() === "neutral")),
                "showSpawnButton": (getApp().getMissionManager().getCommandModeOptions().commandMode == GAME_MASTER
                    || this.#airbase.getCoalition() == getApp().getMissionManager().getCommandedCoalition())
            });

            this.clip();
        }

    }


    /** Shows the spawn context menu which allows the user to select a unit to ground spawn at the airbase
     * 
     */
    #showSpawnMenu() {
        if (this.#airbase != null) {
            getApp().setActiveCoalition(this.#airbase.getCoalition());
            getApp().getMap().showAirbaseSpawnMenu(this.#airbase, this.getX(), this.getY(), this.getLatLng());
        }
    }

}