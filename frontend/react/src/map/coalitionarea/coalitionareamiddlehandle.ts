import { DivIcon, DomEvent, LatLng } from "leaflet";
import { CustomMarker } from "../markers/custommarker";

export class CoalitionAreaMiddleHandle extends CustomMarker {
  constructor(latlng: LatLng) {
    super(latlng, { interactive: true, draggable: false });

    this.on("mousedown", (e: any) => {
      DomEvent.stop(e);
      DomEvent.preventDefault(e);
      e.originalEvent.stopImmediatePropagation();
    });
    this.on("mouseup", (e: any) => {
      DomEvent.stop(e);
      DomEvent.preventDefault(e);
      e.originalEvent.stopImmediatePropagation();
    });
  }

  createIcon() {
    this.setIcon(
      new DivIcon({
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        className: "leaflet-coalitionarea-middle-handle-marker",
      })
    );
    var el = document.createElement("div");
    el.classList.add("ol-coalitionarea-middle-handle-icon");
    this.getElement()?.appendChild(el);
  }
}
