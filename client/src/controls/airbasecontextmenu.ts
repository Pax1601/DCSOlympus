import { getMap, getMissionHandler, getUnitsManager, setActiveCoalition } from "..";
import { BLUE_COMMANDER, GAME_MASTER, RED_COMMANDER } from "../constants/constants";
import { Airbase } from "../mission/airbase";
import { dataPointMap } from "../other/utils";
import { ContextMenu } from "./contextmenu";

export class AirbaseContextMenu extends ContextMenu {
    #airbase: Airbase | null = null;

    constructor(id: string) {
        super(id);
        document.addEventListener("contextMenuSpawnAirbase", (e: any) => {
            this.showSpawnMenu();
        })

        document.addEventListener("contextMenuLandAirbase", (e: any) => {
            if (this.#airbase)
                getUnitsManager().selectedUnitsLandAt(this.#airbase.getLatLng());
            this.hide();
        })
    }

    setAirbase(airbase: Airbase) {
        this.#airbase = airbase;
        this.setName(this.#airbase.getName());
        this.setProperties(this.#airbase.getProperties());
        this.setParkings(this.#airbase.getParkings());
        this.setCoalition(this.#airbase.getCoalition());
        this.enableLandButton(getUnitsManager().getSelectedUnitsTypes().length == 1 && ["Aircraft", "Helicopter"].includes(getUnitsManager().getSelectedUnitsTypes()[0]) && (getUnitsManager().getSelectedUnitsCoalition() === this.#airbase.getCoalition() || this.#airbase.getCoalition() === "neutral"))
        this.enableSpawnButton(getMissionHandler().getCommandModeOptions().commandMode == GAME_MASTER || this.#airbase.getCoalition() == getMissionHandler().getCommandedCoalition());
        
        this.#setAirbaseData();
        
        this.clip();
    }

    setName(airbaseName: string) {
        var nameDiv = <HTMLElement>this.getContainer()?.querySelector("#airbase-name");
        if (nameDiv != null)
            nameDiv.innerText = airbaseName;
    }

    setProperties(airbaseProperties: string[]) {
        this.getContainer()?.querySelector("#airbase-properties")?.replaceChildren(...airbaseProperties.map((property: string) => {
            var div = document.createElement("div");
            div.innerText = property;
            return div;
        }),);
    }

    setParkings(airbaseParkings: string[]) {
        this.getContainer()?.querySelector("#airbase-parking")?.replaceChildren(...airbaseParkings.map((parking: string) => {
            var div = document.createElement("div");
            div.innerText = parking;
            return div;
        }));
    }

    setCoalition(coalition: string) {
        (<HTMLElement>this.getContainer()?.querySelector("#spawn-airbase-aircraft-button")).dataset.coalition = coalition;
    }

    enableSpawnButton(enableSpawnButton: boolean) {
        this.getContainer()?.querySelector("#spawn-airbase-aircraft-button")?.classList.toggle("hide", !enableSpawnButton);
    }

    enableLandButton(enableLandButton: boolean) {
        this.getContainer()?.querySelector("#land-here-button")?.classList.toggle("hide", !enableLandButton);
    }

    showSpawnMenu() {
        if (this.#airbase != null) {
            setActiveCoalition(this.#airbase.getCoalition());
            getMap().showMapContextMenu(this.getX(), this.getY(), this.getLatLng());
            getMap().getMapContextMenu().hideUpperBar();
            getMap().getMapContextMenu().hideLowerBar();
            getMap().getMapContextMenu().hideAltitudeSlider();
            getMap().getMapContextMenu().showSubMenu("aircraft");
            getMap().getMapContextMenu().setAirbaseName(this.#airbase.getName());
            getMap().getMapContextMenu().setLatLng(this.#airbase.getLatLng());
        }
    }

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