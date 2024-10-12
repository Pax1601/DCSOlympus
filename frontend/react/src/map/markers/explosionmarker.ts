import { CustomMarker } from "./custommarker";
import { DivIcon, LatLng } from "leaflet";
import { SVGInjector } from "@tanem/svg-injector";
import { getApp } from "../../olympusapp";

export class ExplosionMarker extends CustomMarker {
  #timer: number = 0;
  #timeout: number = 0;

  constructor(latlng: LatLng, timeout: number) {
    super(latlng, { interactive: false });

    this.#timeout = timeout;

    this.#timer = window.setTimeout(() => {
      this.removeFrom(getApp().getMap());
    }, timeout * 1000);
  }

  createIcon() {
    /* Set the icon */
    var icon = new DivIcon({
      className: "leaflet-explosion-icon",
      iconAnchor: [25, 25],
      iconSize: [50, 50],
    });
    this.setIcon(icon);

    var el = document.createElement("div");
    var img = document.createElement("img");
    img.src = `/vite/images/markers/smoke.svg`;
    img.onload = () => SVGInjector(img);
    el.append(img);

    this.getElement()?.appendChild(el);
    this.getElement()?.classList.add("ol-temporary-marker");
  }
}
