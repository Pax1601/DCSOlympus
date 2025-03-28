import { DivIcon, DomEvent, LatLngExpression, MarkerOptions } from "leaflet";
import { CustomMarker } from "./custommarker";
import { SVGInjector } from "@tanem/svg-injector";

export class MeasureStartMarker extends CustomMarker {
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
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        className: "leaflet-measure-start-marker",
      })
    );
    var el = document.createElement("div");
    el.classList.add("ol-measure-start-icon");
    var img = document.createElement("img");
    img.src = "images/markers/measure-start.svg";
    img.onload = () => SVGInjector(img);
    el.appendChild(img);
    this.getElement()?.appendChild(el);
  }
}
