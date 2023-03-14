import { ContextMenu } from "./contextmenu";

export class AirbaseContextMenu extends ContextMenu {
    #airbaseName: string | null = null;

    constructor(id: string)
    {
        super(id);
    }

    setAirbaseName(airbaseName: string)
    {
        this.#airbaseName = airbaseName;
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