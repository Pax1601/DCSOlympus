import { DivIcon, LatLngExpression, MarkerOptions } from "leaflet";
import { CustomMarker } from "./custommarker";

export class PickupMarker extends CustomMarker {
  constructor(latlng: LatLngExpression, options?: MarkerOptions) {
    super(latlng, options);
    this.options.interactive = false;
    this.setZIndexOffset(9999);
  }

  createIcon() {
    this.setIcon(
      new DivIcon({
        iconSize: [52, 52],
        iconAnchor: [26, 26],
        className: "leaflet-pickup-marker",
      })
    );
    var el = document.createElement("div");
    el.classList.add("ol-pickup-icon");
    this.getElement()?.appendChild(el);
  }
}
