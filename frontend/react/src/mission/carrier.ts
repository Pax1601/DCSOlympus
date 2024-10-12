import { DivIcon, LatLng, Map } from "leaflet";
import { Airbase } from "./airbase";

export class Carrier extends Airbase {
  createIcon() {
    var icon = new DivIcon({
      className: "leaflet-airbase-marker",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    }); // Set the marker, className must be set to avoid white square
    this.setIcon(icon);

    var el = document.createElement("div");
    el.classList.add("airbase-icon");
    el.setAttribute("data-object", "airbase");

    this.getImg().src = "/vite/images/carriers/nimitz.png";
    this.getImg().style.width = `0px`; // Make the image immediately small to avoid giant carriers
    el.appendChild(this.getImg());
    this.getElement()?.appendChild(el);
    el.addEventListener("mouseover", (ev) => {
      document.dispatchEvent(new CustomEvent("airbasemouseover", { detail: this }));
    });
    el.addEventListener("mouseout", (ev) => {
      document.dispatchEvent(new CustomEvent("airbasemouseout", { detail: this }));
    });
    el.dataset.coalition = this.getCoalition();
  }

  onAdd(map: Map): this {
    super.onAdd(map);
    //this._map.on("zoomstart", (e: any) => this.updateSize());
    return this;
  }

  onRemove(map: Map): this {
    super.onRemove(map);
    //this._map.off("zoomstart", (e: any) => this.updateSize());
    return this;
  }

  setHeading(heading: number) {
    this.getImg().style.transform = `rotate(${heading - 3.14 / 2}rad)`;
  }

  updateSize() {
    if (this._map) {
      const y = this._map.getSize().y;
      const x = this._map.getSize().x;
      const maxMeters = this._map.containerPointToLatLng([0, y]).distanceTo(this._map.containerPointToLatLng([x, y]));
      const meterPerPixel = maxMeters / x;
      this.getImg().style.width = `${Math.round(333 / meterPerPixel)}px`;
      this.setZIndexOffset(-10000);
    }
  }
}
