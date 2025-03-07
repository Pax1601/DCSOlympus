import { DivIcon, LatLng } from "leaflet";
import { CustomMarker } from "../markers/custommarker";
import { SVGInjector } from "@tanem/svg-injector";

export class ArrowMarker extends CustomMarker {
  #bearing: number = 0;

  constructor(latlng: LatLng) {
    super(latlng, { interactive: true, draggable: false });
  }

  createIcon() {
    this.setIcon(
      new DivIcon({
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        className: "leaflet-arrow-marker",
      })
    );
    var div = document.createElement("div");
    var img = document.createElement("img");
    img.src = "images/others/arrow.svg";
    img.onload = () => SVGInjector(img);
    div.classList.add("ol-arrow-icon");
    div.append(img);
    this.getElement()?.appendChild(div);
  }

  setBearing(bearing: number) {
    this.#bearing = bearing;
    let img = this.getElement()?.querySelector("svg");
    if (img) img.style.transform = `rotate(${bearing}rad)`;
  }
}
