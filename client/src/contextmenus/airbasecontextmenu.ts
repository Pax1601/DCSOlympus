import { getMap, getMissionHandler, getUnitsManager, setActiveCoalition } from "..";
import { GAME_MASTER } from "../constants/constants";
import { Airbase } from "../mission/airbase";
import { dataPointMap } from "../other/utils";
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

        document.addEventListener("contextMenuSpawnAirbase", (e: any) => {
            this.#showSpawnMenu();
        })

        document.addEventListener("contextMenuLandAirbase", (e: any) => {
            if (this.#airbase)
                getUnitsManager().selectedUnitsLandAt(this.#airbase.getLatLng());
            this.hide();
        })
    }

    /** Sets the airbase for which data will be shown in the context menu
     * 
     * @param airbase The airbase for which data will be shown in the context menu. Note: the airbase must be present in the public/databases/airbases/<theatre>.json database.
     */
    setAirbase(airbase: Airbase) {
        this.#airbase = airbase;

        this.#setName(this.#airbase.getName());
        this.#setProperties(this.#airbase.getProperties());
        this.#setParkings(this.#airbase.getParkings());
        this.#setCoalition(this.#airbase.getCoalition());
        this.#showLandButton(getUnitsManager().getSelectedUnitsTypes().length == 1 && ["Aircraft", "Helicopter"].includes(getUnitsManager().getSelectedUnitsTypes()[0]) && (getUnitsManager().getSelectedUnitsVariable((unit: Unit) => {return unit.getCoalition()}) === this.#airbase.getCoalition() || this.#airbase.getCoalition() === "neutral"))
        this.#showSpawnButton(getMissionHandler().getCommandModeOptions().commandMode == GAME_MASTER || this.#airbase.getCoalition() == getMissionHandler().getCommandedCoalition());
        this.#setAirbaseData();
        
        this.clip();
    }

    /**
     * 
     * @param airbaseName The name of the airbase
     */
    #setName(airbaseName: string) {
        var nameDiv = <HTMLElement>this.getContainer()?.querySelector("#airbase-name");
        if (nameDiv != null)
            nameDiv.innerText = airbaseName;
    }

    /**
     * 
     * @param airbaseProperties The properties of the airbase
     */
    #setProperties(airbaseProperties: string[]) {
        this.getContainer()?.querySelector("#airbase-properties")?.replaceChildren(...airbaseProperties.map((property: string) => {
            var div = document.createElement("div");
            div.innerText = property;
            return div;
        }),);
    }

    /**
     * 
     * @param airbaseParkings List of available parkings at the airbase
     */
    #setParkings(airbaseParkings: string[]) {
        this.getContainer()?.querySelector("#airbase-parking")?.replaceChildren(...airbaseParkings.map((parking: string) => {
            var div = document.createElement("div");
            div.innerText = parking;
            return div;
        }));
    }

    /**
     * 
     * @param coalition Coalition to which the airbase belongs
     */
    #setCoalition(coalition: string) {
        (this.getContainer()?.querySelector("#spawn-airbase-aircraft-button") as HTMLElement).dataset.coalition = coalition;
    }

    /**
     * 
     * @param showSpawnButton If true, the spawn button will be visibile
     */
    #showSpawnButton(showSpawnButton: boolean) {
        this.getContainer()?.querySelector("#spawn-airbase-aircraft-button")?.classList.toggle("hide", !showSpawnButton);
    }

    /**
     * 
     * @param showLandButton If true, the land button will be visible
     */
    #showLandButton(showLandButton: boolean) {
        this.getContainer()?.querySelector("#land-here-button")?.classList.toggle("hide", !showLandButton);
    }

    /** Shows the spawn context menu which allows the user to select a unit to ground spawn at the airbase
     * 
     */
    #showSpawnMenu() {
        if (this.#airbase != null) {
            setActiveCoalition(this.#airbase.getCoalition());
            getMap().showAirbaseSpawnMenu(this.getX(), this.getY(), this.getLatLng(), this.#airbase);
        }
    }

    /** @todo needs commenting
     * 
     */
    #setAirbaseData() {
        if (this.#airbase && this.getContainer()) {
            dataPointMap(this.getContainer() as HTMLElement, {
                "coalition": this.#airbase.getCoalition(),
                "airbaseName": this.#airbase.getName()
            });
            
            dataPointMap( this.getContainer() as HTMLElement, this.#airbase.getChartData() );
            
            const runwaysContainer     = this.getContainer()?.querySelector( "#airbase-runways" ) as HTMLElement;
            runwaysContainer.innerHTML = "";

            if ( runwaysContainer instanceof HTMLElement ) {
                const runways = this.#airbase.getChartData().runways;
                
                if ( runways.length === 0 ) {
                    runwaysContainer.innerText = "No data";
                } else {
                    runways.forEach( runway => {
                        let runwayDiv = document.createElement( "div" );
                        runwayDiv.classList.add( "runway" );

                        runway.headings.forEach( headings => {
                            for ( const [ heading, data ] of Object.entries( headings ) ) {
                                
                                let headingDiv = document.createElement( "div" );
                                headingDiv.classList.add( "heading" );

                                let abbr       = document.createElement( "abbr" );
                                abbr.title     = `Mag heading: ${data.magHeading}`;
                                abbr.innerText = heading;

                                headingDiv.appendChild( abbr );
                                runwayDiv.appendChild( headingDiv );

                                if ( data.ILS ) {
                                    let ilsDiv = document.createElement( "div" );
                                    ilsDiv.classList.add( "ils" );

                                    abbr           = document.createElement( "abbr" );
                                    abbr.title     = data.ILS;
                                    abbr.innerText = "ILS";

                                    ilsDiv.appendChild( abbr );
                                    headingDiv.appendChild( ilsDiv );
                                }
                            }
                        });

                        runwaysContainer.appendChild( runwayDiv );
                    });
                }
            }
        }
    }
}