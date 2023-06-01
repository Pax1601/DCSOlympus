import { DivIcon } from "leaflet";
import { CustomMarker } from "./custommarker";

export class DestinationPreviewMarker extends CustomMarker {
    createIcon() {
        this.setIcon(new DivIcon({
            iconSize: [52, 52],
            iconAnchor: [26, 26],
            className: "leaflet-destination-preview",
        }));
        var el = document.createElement("div");
        el.classList.add("ol-destination-preview-icon");
        this.getElement()?.appendChild(el);
    }
}
