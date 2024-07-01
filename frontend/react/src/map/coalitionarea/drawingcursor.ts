import { DivIcon, LatLng } from "leaflet";
import { CustomMarker } from "../markers/custommarker";

export class DrawingCursor extends CustomMarker {
  constructor() {
    super(new LatLng(0, 0), { interactive: false });
    this.setZIndexOffset(9999);
  }

  createIcon() {
    this.setIcon(
      new DivIcon({
        iconSize: [24, 24],
        iconAnchor: [0, 24],
        className: "leaflet-draw-marker",
      })
    );
    var el = document.createElement("div");
    el.classList.add("ol-draw-icon");
    this.getElement()?.appendChild(el);
  }
}
