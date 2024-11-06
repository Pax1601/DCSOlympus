import { DivIcon } from "leaflet";
import { CustomMarker } from "../map/markers/custommarker";
import { SVGInjector } from "@tanem/svg-injector";

export class Bullseye extends CustomMarker {
  #coalition: string = "";

  createIcon() {
    var icon = new DivIcon({
      className: "leaflet-bullseye-marker",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    }); // Set the marker, className must be set to avoid white square
    this.setIcon(icon);

    var el = document.createElement("div");
    el.classList.add("bullseye-icon");
    el.setAttribute("data-object", "bullseye");
    var img = document.createElement("img");
    img.src = "/vite/images/markers/bullseye.svg";
    img.onload = () => SVGInjector(img);
    el.appendChild(img);
    this.getElement()?.appendChild(el);
  }

  setCoalition(coalition: string) {
    this.#coalition = coalition;
    (this.getElement()?.querySelector(".bullseye-icon") as HTMLElement).dataset.coalition = this.#coalition;
  }

  getCoalition() {
    return this.#coalition;
  }
}
