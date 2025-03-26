import { DivIcon, DomEvent, LatLng } from "leaflet";
import { CustomMarker } from "../markers/custommarker";

export class DraggableHandle extends CustomMarker {
  constructor(latlng: LatLng) {
    super(latlng, { interactive: true, draggable: true });

    this.on("add", (e) => {
      this.getElement()?.addEventListener("touchstart", (e) => e.stopPropagation());
    });

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
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        className: "leaflet-draggable-handle-marker",
      })
    );
    var el = document.createElement("div");
    el.classList.add("ol-draggable-handle-icon");
    this.getElement()?.appendChild(el);
  }
}
