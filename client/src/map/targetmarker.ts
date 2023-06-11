import { DivIcon } from "leaflet";
import { CustomMarker } from "./custommarker";

export class TargetMarker extends CustomMarker {
    #interactive: boolean = false;

    createIcon() {
        this.setIcon(new DivIcon({
            iconSize: [52, 52],
            iconAnchor: [26, 26],
            className: "leaflet-target-marker",
        }));
        var el = document.createElement("div");
        el.classList.add("ol-target-icon");
        el.classList.toggle("ol-target-icon-interactive", this.#interactive)
        this.getElement()?.appendChild(el);
    }
}
