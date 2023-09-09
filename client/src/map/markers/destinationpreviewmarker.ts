import { DivIcon, LatLngExpression, MarkerOptions } from "leaflet";
import { CustomMarker } from "./custommarker";

export class DestinationPreviewMarker extends CustomMarker {
    constructor(latlng: LatLngExpression, options?: MarkerOptions) {
        super(latlng, options);
        this.setZIndexOffset(9999);
    }

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
