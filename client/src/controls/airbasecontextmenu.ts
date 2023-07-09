import { getMap, getUnitsManager, setActiveCoalition } from "..";
import { Airbase } from "../missionhandler/airbase";
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
        this.setName(airbase.getName());
        this.setProperties(airbase.getProperties());
        //  this.setParkings(airbase.getParkings());
        this.setCoalition(airbase.getCoalition());
        this.enableLandButton(getUnitsManager().getSelectedUnitsTypes().length == 1 && (getUnitsManager().getSelectedUnitsCoalition() === airbase.getCoalition() || airbase.getCoalition() === "neutral"))

        
        dataPointMap( <HTMLElement>this.getContainer(), {
            "coalition": airbase.getCoalition(),
            "airbaseName": airbase.getName()
        });
        
        dataPointMap( <HTMLElement>this.getContainer(), this.#airbase.getChartData() );
        
        const runwaysContainer     = <HTMLElement>this.getContainer()?.querySelector( "#airbase-runways" );
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

                        //*
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
                        //*/

                    });

                    runwaysContainer.appendChild( runwayDiv );

                });
            }

        }

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
        (<HTMLElement>this.getContainer()?.querySelector("#spawn-airbase-aircraft-button")).dataset.activeCoalition = coalition;
    }

    enableLandButton(enableLandButton: boolean) {
        this.getContainer()?.querySelector("#land-here-button")?.classList.toggle("hide", !enableLandButton);
    }

    showSpawnMenu() {
        if (this.#airbase != null) {
            setActiveCoalition(this.#airbase.getCoalition());
            getMap().showMapContextMenu({ originalEvent: { x: this.getX(), y: this.getY(), latlng: this.getLatLng() } });
            getMap().getMapContextMenu().hideUpperBar();
            getMap().getMapContextMenu().showSubMenu("aircraft");
            getMap().getMapContextMenu().setAirbaseName(this.#airbase.getName());
            getMap().getMapContextMenu().setLatLng(this.#airbase.getLatLng());
        }
    }
}