import { DivIcon, DomEvent, LatLngExpression, MarkerOptions } from "leaflet";
import { CustomMarker } from "./custommarker";

export class SpotMarker extends CustomMarker {
  constructor(latlng: LatLngExpression, options?: MarkerOptions) {
    super(latlng, options);
    this.options.interactive = true;
    this.options.draggable = true;
    this.setZIndexOffset(9999);

    this.on("mousedown", (e) => {
      DomEvent.stopPropagation(e);
    });

    this.on("mouseup", (e) => {
      DomEvent.stopPropagation(e);
    });

    this.on("dragstart", (e) => {
      DomEvent.stopPropagation(e);
    });

    this.on("dragend", (e) => {
      DomEvent.stopPropagation(e);
    });
  }

  createIcon() {
    this.setIcon(
      new DivIcon({
        iconSize: [52, 52],
        iconAnchor: [26, 26],
        className: "leaflet-spot-marker",
      })
    );
    var el = document.createElement("div");
    el.classList.add("ol-spot-icon");
    this.getElement()?.appendChild(el);
  }
}
