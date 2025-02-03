import { DivIcon, LatLngExpression, Map, MarkerOptions } from "leaflet";
import { CustomMarker } from "./custommarker";
import { SVGInjector } from "@tanem/svg-injector";

export class MeasureEndMarker extends CustomMarker {
  #rotationAngle: number = 0;

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
        iconAnchor: [16, 16],
        className: "leaflet-measure-end-marker",
      })
    );
    var el = document.createElement("div");
    el.classList.add("ol-measure-end-icon");
    var img = document.createElement("img");
    img.src = "images/markers/measure-end.svg";
    img.onload = () => {
      SVGInjector(img);
      this.#applyRotation();
    }
    el.appendChild(img);
    this.getElement()?.appendChild(el);
  }

  setRotationAngle(angle: number) {
    this.#rotationAngle = angle;
    this.#applyRotation();
  }

  getRotationAngle() {
    return this.#rotationAngle;
  }

  onAdd(map: Map): this {
    super.onAdd(map);
    this.#applyRotation();
    return this;
  }

  #applyRotation() {
    const element = this.getElement();
    if (element) {
      const svg = element.querySelector("svg");
      if (svg) svg.style.transform = `rotate(${this.#rotationAngle - Math.PI / 2}rad)`;
    }
  }
}
