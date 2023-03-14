import { getUnitsManager } from "..";
import { Airbase } from "../missionhandler/airbase";
import { ContextMenu } from "./contextmenu";

export class AirbaseContextMenu extends ContextMenu {
    #airbase: Airbase | null = null;

    constructor(id: string)
    {
        super(id);
    }

    setAirbase(airbase: Airbase)
    {
        this.#airbase = airbase;
        this.setAirbaseName(airbase.getName());
        this.setAirbaseProperties(airbase.getProperties());
        this.setAirbaseParkings(airbase.getParkings());
        this.enableLandButton(getUnitsManager().getSelectedUnitsType() === "Aircraft" && (getUnitsManager().getSelectedUnitsCoalition() === airbase.getCoalition() || airbase.getCoalition() === "neutral"))
    }

    setAirbaseName(airbaseName: string)
    {
        var nameDiv = <HTMLElement>this.getContainer()?.querySelector("#airbase-name");
        if (nameDiv != null)
            nameDiv.innerText = airbaseName; 
    }

    setAirbaseProperties(airbaseProperties: string[])
    {
        this.getContainer()?.querySelector("#airbase-properties")?.replaceChildren(...airbaseProperties.map((property: string) => {
            var div = document.createElement("div");
            div.innerText = property;
            return div;
        }));
    }

    setAirbaseParkings(airbaseParkings: string[])
    {
        this.getContainer()?.querySelector("#airbase-parking")?.replaceChildren(...airbaseParkings.map((parking: string) => {
            var div = document.createElement("div");
            div.innerText = parking;
            return div;
        }));
    }

    enableLandButton(enableLandButton: boolean)
    {
        this.getContainer()?.querySelector("#land-here-button")?.classList.toggle("hide", !enableLandButton);
        
    }
}