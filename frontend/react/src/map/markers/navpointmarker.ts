import { DivIcon, LatLngExpression, MarkerOptions } from "leaflet";
import { CustomMarker } from "./custommarker";

export class NavpointMarker extends CustomMarker {
  #callsignStr: string;
  #comment: string;

  constructor(latlng: LatLngExpression, callsignStr: string, comment?: string) {
    super(latlng, { interactive: false, draggable: false });
    this.#callsignStr = callsignStr;
    comment ? this.#comment = comment : null;
  }

  createIcon() {
    /* Set the icon */
    let icon = new DivIcon({
      className: "leaflet-navpoint-icon",
      iconAnchor: [0, 0],
      iconSize: [50, 50],
    });
    this.setIcon(icon);

    let el = document.createElement("div");
    el.classList.add("navpoint");

    // Main icon
    let pointIcon = document.createElement("div");
    pointIcon.classList.add("navpoint-icon");
    el.append(pointIcon);

    // Label
    let mainLabel: HTMLDivElement = document.createElement("div");;
    mainLabel.classList.add("navpoint-main-label");
    mainLabel.innerText = this.#callsignStr;
    el.append(mainLabel);

    // Further description
    if (this.#comment) {
      let commentBox: HTMLDivElement = document.createElement("div");;
      commentBox.classList.add("navpoint-comment-box");
      commentBox.innerText = this.#comment;
      mainLabel.append(commentBox);
    }

    this.getElement()?.appendChild(el);
    this.getElement()?.classList.add("ol-navpoint-marker");
  }
}
