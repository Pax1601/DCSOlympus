import { DivIcon, LatLng } from "leaflet";
import { CustomMarker } from "./custommarker";

export class DestinationPreviewHandle extends CustomMarker {
  constructor(latlng: LatLng) {
    super(latlng, { interactive: true, draggable: true });
  }

  createIcon() {
    this.setIcon(
      new DivIcon({
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        className: "leaflet-destination-preview-handle-marker",
      })
    );
    var el = document.createElement("div");
    el.classList.add("ol-destination-preview-handle-icon");
    this.getElement()?.appendChild(el);
  }
}
