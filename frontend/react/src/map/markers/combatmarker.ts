import { CustomMarker } from "./custommarker";
import { DivIcon, LatLng } from "leaflet";
import { getApp } from "../../olympusapp";

/* Pulsing rings shown where a unit was destroyed. The rings pulse for a few seconds, then a small mark slowly fades out */
export class CombatMarker extends CustomMarker {
  #color: string;
  #lifetime: number;

  /**
   * @param latlng Where the event happened
   * @param color CSS color of the rings, usually the color of the shooter's coalition
   * @param lifetime Seconds before the marker is removed
   */
  constructor(latlng: LatLng, color: string, lifetime: number = 30) {
    super(latlng, { interactive: false, keyboard: false });
    this.#color = color;
    this.#lifetime = lifetime;

    window.setTimeout(() => this.removeFrom(getApp().getMap()), lifetime * 1000);
  }

  createIcon() {
    this.setIcon(
      new DivIcon({
        iconSize: [0, 0],
        iconAnchor: [0, 0],
        className: "leaflet-combat-marker",
      })
    );
    const el = document.createElement("div");
    el.classList.add("ol-combat-marker");
    el.style.setProperty("--combat-color", this.#color);
    el.style.setProperty("--combat-lifetime", `${this.#lifetime}s`);
    el.innerHTML = `<span class="ol-combat-flash"></span><span class="ol-combat-ring"></span><span class="ol-combat-ring ol-combat-ring-delayed"></span><span class="ol-combat-cross"></span>`;
    this.getElement()?.appendChild(el);
  }
}
