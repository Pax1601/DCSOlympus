import { DivIcon, LatLngExpression, MarkerOptions } from "leaflet";
import { CustomMarker } from "./custommarker";

export class TextMarker extends CustomMarker {
  #label: string = "";
  #backgroundColor: string = "";

  constructor(latlng: LatLngExpression, label: string, backgroundColor: string, options?: MarkerOptions) {
    super(latlng, options);
    this.setZIndexOffset(9999);

    this.#label = label;
    this.#backgroundColor = backgroundColor;
  }

  createIcon() {
    this.setIcon(
      new DivIcon({
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        className: "leaflet-text-marker",
      })
    );
    var el = document.createElement("div");
    el.classList.add("ol-text-icon")
    el.style.backgroundColor = this.#backgroundColor;

    this.getElement()?.appendChild(el);

    el.innerHTML = this.#label;
  }
}
