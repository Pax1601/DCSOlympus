import { DivIcon, LatLng } from "leaflet";
import { CustomMarker } from "../markers/custommarker";

export class CoalitionAreaHandle extends CustomMarker {
  constructor(latlng: LatLng) {
    super(latlng, { interactive: true, draggable: true });

    this.on("add", (e) => {
      this.getElement()?.addEventListener("touchstart", (e) => e.stopPropagation());
    });
  }

  createIcon() {
    this.setIcon(
      new DivIcon({
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        className: "leaflet-coalitionarea-handle-marker",
      })
    );
    var el = document.createElement("div");
    el.classList.add("ol-coalitionarea-handle-icon");
    this.getElement()?.appendChild(el);
  }
}
