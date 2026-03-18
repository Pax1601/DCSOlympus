import { CustomMarker } from "./custommarker";
import { DivIcon, LatLng } from "leaflet";
import { SVGInjector } from "@tanem/svg-injector";
import { getApp } from "../../olympusapp";

export class TemporaryStaticMarker extends CustomMarker {
  #timer: number = 0;
  #timeout: number = 0;
  #commandHash: string | undefined = undefined;

  constructor(latlng: LatLng, timeout?: number, commandHash?: string) {
    super(latlng, { interactive: false });

    if (timeout) {
      this.#timeout = timeout;

      this.#timer = window.setTimeout(() => {
        this.removeFrom(getApp().getMap());
      }, timeout * 1000);
    }

    if (commandHash !== undefined) this.setCommandHash(commandHash);
  }

  createIcon() {
    /* Set the icon */
    this.setIcon(
      new DivIcon({
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        className: "leaflet-temporary-statics-marker",
      }),
    );
    var el = document.createElement("div");
    el.classList.add("ol-temporary-statics-icon");
    var img = document.createElement("img");
    img.src = "images/markers/temporary-statics.svg";
    img.onload = () => SVGInjector(img);
    el.appendChild(img);
    this.getElement()?.appendChild(el);
  }

  setCommandHash(commandHash: string) {
    this.#commandHash = commandHash;
    this.#timer = window.setInterval(() => {
      if (this.#commandHash !== undefined) {
        getApp()
          .getServerManager()
          .isCommandExecuted((res: any) => {
            if (res.commandExecuted) {
              this.removeFrom(getApp().getMap());
              window.clearInterval(this.#timer);
            }
          }, this.#commandHash);
      }
    }, 1000);
  }
}
