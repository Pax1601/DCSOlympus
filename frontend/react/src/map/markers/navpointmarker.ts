import { DivIcon, LatLngExpression, MarkerOptions } from "leaflet";
import { CustomMarker } from "./custommarker";
import { SVGInjector } from "@tanem/svg-injector";

export class NavpointMarker extends CustomMarker {
  #callsignStr: string;
  #comment: string;
  #tag: string;

  constructor(latlng: LatLngExpression, callsignStr: string, comment: string, tag: string) {
    super(latlng, { interactive: false, draggable: false });
    this.#callsignStr = callsignStr;
    comment ? this.#comment = comment : null;
    tag ? this.#tag = tag : null;
  }

  private getImage() {
    switch (this.#tag) {
      case 'TGT':
        return 'images/markers/navpoint-tgt.svg'
      default:
        return 'images/markers/navpoint.svg'
    }
  }

  private getSize() {
    switch (this.#tag) {
      case 'TGT':
        return '20px'
      default:
        return '8px'
    }
  }

  createIcon() {
    /* Set the icon */
    let icon = new DivIcon({
      className: "leaflet-navpoint-icon",
      iconAnchor: [0, 0],
      iconSize: [2, 2],
    });
    this.setIcon(icon);

    let el = document.createElement("div");
    el.classList.add("navpoint");

    // Main icon
    let pointIcon = document.createElement("div");
    pointIcon.classList.add("navpoint-icon");
    var img = document.createElement("img");
    img.src = this.getImage();
    img.onload = () => {
      SVGInjector(img);
    };
    img.style.width = this.getSize();
    img.style.height = this.getSize();
    pointIcon.appendChild(img);
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
