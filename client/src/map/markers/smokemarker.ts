import { DivIcon, LatLngExpression, MarkerOptions } from "leaflet";
import { CustomMarker } from "./custommarker";
import { SVGInjector } from "@tanem/svg-injector";
import { getMap } from "../..";

export class SmokeMarker extends CustomMarker {
    #color: string;

    constructor(latlng: LatLngExpression, color: string, options?: MarkerOptions) {
        super(latlng, options);
        this.setZIndexOffset(9999);
        this.#color = color;
        window.setTimeout(() => { this.removeFrom(getMap()); }, 300000) /* Remove the smoke after 5 minutes */
    }

    createIcon() {
        this.setIcon(new DivIcon({
            iconSize: [52, 52],
            iconAnchor: [26, 52],
            className: "leaflet-smoke-marker",
        }));
        var el = document.createElement("div");
        el.classList.add("ol-smoke-icon");
        el.setAttribute("data-color", this.#color);
        var img = document.createElement("img");
        img.src = "/resources/theme/images/markers/smoke.svg";
        img.onload = () => SVGInjector(img);
        el.appendChild(img);
        this.getElement()?.appendChild(el);
    }
}
