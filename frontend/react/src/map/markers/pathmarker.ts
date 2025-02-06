import { DivIcon, LatLngExpression, Map, MarkerOptions } from "leaflet";
import { CustomMarker } from "./custommarker";
import { SVGInjector } from "@tanem/svg-injector";

export class PathMarker extends CustomMarker {
  constructor(latlng: LatLngExpression, options?: MarkerOptions) {
    super(latlng, options);
    this.options.interactive = true;
    this.options.draggable = true;
    this.setZIndexOffset(9999);
  }

  createIcon() {
    this.setIcon(
      new DivIcon({
        iconSize: [32, 32],
        iconAnchor: [16, 27],
        className: "leaflet-path-marker",
      })
    );
    var el = document.createElement("div");
    el.classList.add("ol-path-icon");
    var img = document.createElement("img");
    img.src = "images/markers/path.svg";
    img.onload = () => SVGInjector(img);

    el.appendChild(img);
    this.getElement()?.appendChild(el);
  }
}
