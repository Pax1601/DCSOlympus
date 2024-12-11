import { CustomMarker } from "./custommarker";
import { DivIcon, LatLng } from "leaflet";
import { SVGInjector } from "@tanem/svg-injector";
import { getApp } from "../../olympusapp";

export class ExplosionMarker extends CustomMarker {
  #timer: number = 0;
  #timeout: number = 0;

  constructor(latlng: LatLng, timeout?: number) {
    super(latlng, { interactive: false });

    if (timeout) {
      this.#timeout = timeout;

      this.#timer = window.setTimeout(() => {
        this.removeFrom(getApp().getMap());
      }, timeout * 1000);
    }
  }

  createIcon() {
    /* Set the icon */
    this.setIcon(
      new DivIcon({
        iconSize: [52, 52],
        iconAnchor: [26, 52],
        className: "leaflet-explosion-marker",
      })
    );
    var el = document.createElement("div");
    el.classList.add("ol-explosion-icon");
    var img = document.createElement("img");
    img.src = "./images/markers/explosion.svg";
    img.onload = () => SVGInjector(img);
    el.appendChild(img);
    this.getElement()?.appendChild(el);
  }
}
