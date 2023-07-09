import { CustomMarker } from "./custommarker";
import { SpawnOptions } from "../controls/mapcontextmenu";
import { DivIcon } from "leaflet";
import { SVGInjector } from "@tanem/svg-injector";
import { getMarkerCategoryByName, getUnitDatabaseByCategory } from "../other/utils";

export class TemporaryUnitMarker extends CustomMarker {
    #spawnOptions: SpawnOptions;

    constructor(spawnOptions: SpawnOptions) {
        super(spawnOptions.latlng, {interactive: false});
        this.#spawnOptions = spawnOptions;
    }

    createIcon() {
        const category = getMarkerCategoryByName(this.#spawnOptions.name);

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
        el.setAttribute("data-coalition", this.#spawnOptions.coalition);

        // Main icon
        var unitIcon = document.createElement("div");
        unitIcon.classList.add("unit-icon");
        var img = document.createElement("img");
        img.src = `/resources/theme/images/units/${category}.svg`;
        img.onload = () => SVGInjector(img);
        unitIcon.appendChild(img);
        unitIcon.toggleAttribute("data-rotate-to-heading", false);
        el.append(unitIcon);
        
        // Short label
        if (category == "aircraft" || category == "helicopter") {
            var shortLabel = document.createElement("div");
            shortLabel.classList.add("unit-short-label");
            shortLabel.innerText = getUnitDatabaseByCategory(category)?.getByName(this.#spawnOptions.name)?.shortLabel || ""; 
            el.append(shortLabel);
        }

        this.getElement()?.appendChild(el);
        this.getElement()?.classList.add("ol-temporary-marker");
    }
}