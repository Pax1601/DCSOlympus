import { DivIcon, LatLngExpression, MarkerOptions } from "leaflet";
import { CustomMarker } from "./custommarker";
import { Coalition } from "../../types/types";

export class ClusterMarker extends CustomMarker {
  #coalition: Coalition;
  #numberOfUnits: number;

  constructor(latlng: LatLngExpression, coalition: Coalition, numberOfUnits:number, options?: MarkerOptions) {
    super(latlng, options);
    this.setZIndexOffset(9999);
    this.#coalition = coalition;
    this.#numberOfUnits = numberOfUnits;
  }

  createIcon() {
    this.setIcon(
      new DivIcon({
        iconSize: [52, 52],
        iconAnchor: [26, 26],
        className: "leaflet-cluster-marker",
      })
    );
    var el = document.createElement("div");
    el.classList.add("ol-cluster-icon");
    el.classList.add(`${this.#coalition}`);
    this.getElement()?.appendChild(el);
    var span = document.createElement("span");
    span.classList.add("ol-cluster-number");
    span.textContent = `${this.#numberOfUnits}`;
    el.appendChild(span);
  }
}
