import { CustomMarker } from "./custommarker";
import { DivIcon, LatLng } from "leaflet";
import { SVGInjector } from "@tanem/svg-injector";
import { getApp } from "../..";

export class TemporaryUnitMarker extends CustomMarker {
    #name: string;
    #coalition: string;
    #commandHash: string|undefined = undefined;
    #timer: number = 0;

    constructor(latlng: LatLng, name: string, coalition: string, commandHash?: string) {
        super(latlng, {interactive: false});
        this.#name = name;
        this.#coalition = coalition;
        this.#commandHash = commandHash;

        if (commandHash !== undefined) 
            this.setCommandHash(commandHash)
    }

    setCommandHash(commandHash: string) {
        this.#commandHash = commandHash;
        this.#timer = window.setInterval(() => { 
            if (this.#commandHash !== undefined)  {
                getApp().getServerManager().isCommandExecuted((res: any) => {
                    if (res.commandExecuted) {
                        this.removeFrom(getApp().getMap());
                        window.clearInterval(this.#timer);
                    }
                }, this.#commandHash)
            }
        }, 1000);
    }

    createIcon() {
        const category      = getApp().getUtilities().getMarkerCategoryByName(this.#name);
        const databaseEntry = getApp().getUtilities().getUnitDatabaseByCategory(category)?.getByName(this.#name);

        /* Set the icon */
        var icon = new DivIcon({
            className: 'leaflet-unit-icon',
            iconAnchor: [25, 25],
            iconSize: [50, 50],
        });
        this.setIcon(icon);

        var el = document.createElement("div");
        el.classList.add("unit");
        el.setAttribute("data-object", `unit-${category}`);
        el.setAttribute("data-coalition", this.#coalition);

        // Main icon
        var unitIcon = document.createElement("div");
        unitIcon.classList.add("unit-icon");
        var img = document.createElement("img");

        img.src = `/resources/theme/images/units/${databaseEntry?.markerFile ?? category}.svg`;
        img.onload = () => SVGInjector(img);
        unitIcon.appendChild(img);
        unitIcon.toggleAttribute("data-rotate-to-heading", false);
        el.append(unitIcon);
        
        // Short label
        if (category == "aircraft" || category == "helicopter") {
            var shortLabel = document.createElement("div");
            shortLabel.classList.add("unit-short-label");
            shortLabel.innerText = databaseEntry?.shortLabel || ""; 
            el.append(shortLabel);
        }

        this.getElement()?.appendChild(el);
        this.getElement()?.classList.add("ol-temporary-marker");
    }
}