import { getApp } from "..";
import { GAME_MASTER } from "../constants/constants";
import { Airbase } from "../mission/airbase";
import { Unit } from "../unit/unit";
import { ContextMenu } from "./contextmenu";

/** This context menu is shown to the user when the airbase marker is right clicked on the map. 
 * It allows the user to inspect information about the airbase, as well as allowing to spawn units from the airbase itself and land units on it. */
export class AirbaseContextMenu extends ContextMenu {
    #airbase: Airbase | null = null;

    /**
     * 
     * @param ID - the ID of the HTML element which will contain the context menu
     */
    constructor(ID: string){
        super(ID);

        document.addEventListener("contextMenuSpawnAirbase", (e:CustomEventInit) => {
            this.#showSpawnMenu();
        });

        document.addEventListener("contextMenuLandAirbase", (e:CustomEventInit) => {
            if (this.#airbase)
                getApp().getUnitsManager().landAt(this.#airbase.getLatLng());
            this.hide();
        });

        getApp().getTemplateManger().add("airbaseContextMenu", `
            <h3 id="airbase-name"><%= airbase.getName() %></h3>
            <dl id="airbase-chart-data" class="ol-data-grid">
                <dt>ICAO</dt>
                <dd data-point="ICAO"><%= chartData.ICAO %></dd>
                <dt>Coalition</dt>
                <dd data-point="coalition"><%= airbase.getCoalition() %></dd>
                <dt>Elevation</dt>
                <dd><span data-point="elevation"><%= chartData.elevation %></span>ft</dd>
                <dt>TACAN</dt>
                <dd data-point="TACAN"><%= chartData.TACAN || "-" %></dd>
            </dl>
            <h4>Runways</h4>
            <div id="airbase-runways">
                <% chartData.runways.forEach( runway => { %>
                    <div class="runway">
                        <% runway.headings.forEach( heading => { %>
                            <% for( const[ name, data ] of Object.entries(heading)) { %>
                                <div class="heading"><abbr title="Mag heading: <%= data.magHeading %>"><%= name.replace("(CLOSED)", "(C)") %></abbr><% if (data.ILS) { %><abbr title="<%= data.ILS %>">ILS</abbr><% } %></div>
                            <% } %>
                        <% }) %>
                    </div>
                <% }) %>
            </div>
            <hr />
            <% if (showSpawnButton) { %>
                <button id="spawn-airbase-aircraft-button" data-coalition="neutral" title="Spawn aircraft" data-on-click="contextMenuSpawnAirbase" class="deploy-unit-button">Spawn</button>
            <% } %>
            <% if (showLandHere) { %>
                <button id="land-here-button" title="Land here" data-on-click="contextMenuLandAirbase">Land here</button>
            <% } %>
        `);
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
                "chartData": airbase.getChartData(),
                "showLandHere": ( getApp().getUnitsManager().getSelectedUnitsCategories().length == 1 && ["Aircraft", "Helicopter"].includes(getApp().getUnitsManager().getSelectedUnitsCategories()[0])
                    && (getApp().getUnitsManager().getSelectedUnitsVariable((unit: Unit) => {return unit.getCoalition()}) === this.#airbase?.getCoalition() || this.#airbase?.getCoalition() === "neutral")),
                "showSpawnButton": ( getApp().getMissionManager().getCommandModeOptions().commandMode == GAME_MASTER
                    || this.#airbase.getCoalition() == getApp().getMissionManager().getCommandedCoalition() )
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