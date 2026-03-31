import { DivIcon, DomEvent } from "leaflet";
import { CustomMarker } from "../map/markers/custommarker";
import { StaticOptions } from "../interfaces";
import { Map } from "../map/map";
import { ImportExportSubstate, OlympusState } from "../constants/constants";
import { getApp } from "../olympusapp";
import { AppStateChangedEvent } from "../events";

// TODO add ability to select the marker
export class Static extends CustomMarker {
  #ID: number;
  #name: string = "";
  #coalition: string = "";
  #heading: number = 0;
  #size1: number = 0;
  #size2: number = 0;
  #selected: boolean = false;

  constructor(options: StaticOptions) {
    super(options.latlng, { riseOnHover: false });

    this.#ID = options.ID;
    this.#coalition = options.coalition;
    this.#size1 = options.size1;
    this.#size2 = options.size2;
    this.#heading = options.heading;
    this.#name = options.name;

    this.on("click", (e) => {
      if (getApp().getState() === OlympusState.IMPORT_EXPORT && getApp().getSubState() === ImportExportSubstate.SELECT_STATICS) 
        this.setSelected(!this.#selected);
      DomEvent.stopPropagation(e);
    });

    AppStateChangedEvent.on((state, subState) => {
      this.setSelected(false);
    });
  }

  createIcon() {
    var icon = new DivIcon({
      className: "leaflet-static-marker",
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    }); // Set the marker, className must be set to avoid white square
    this.setIcon(icon);

    var el = document.createElement("div");
    el.classList.add("static-icon");
    el.setAttribute("coalition", this.#coalition);

    el.style.transform = `translate(-50%, -50%) rotate(${this.#heading - 3.14 / 2}rad)`;

    this.getElement()?.appendChild(el);
    el.dataset.coalition = this.#coalition;
  }

  setCoalition(coalition: string) {
    this.#coalition = coalition;
    (this.getElement()?.querySelector(".static-icon") as HTMLElement).dataset.coalition = this.#coalition;
  }

  getID() {
    return this.#ID;
  }

  getCoalition() {
    return this.#coalition;
  }

  getName() {
    return this.#name;
  }

  onAdd(map: Map): this {
    super.onAdd(map);
    this._map.on("zoomend", (e: any) => this.updateSize());
    return this;
  }

  onRemove(map: Map): this {
    super.onRemove(map);
    this._map.off("zoomend", (e: any) => this.updateSize());
    return this;
  }

  updateSize() {
    const el = this.getElement()?.querySelector(".static-icon") as HTMLElement;
    if (this._map) {
      const y = this._map.getSize().y;
      const x = this._map.getSize().x;
      const maxMeters = this._map.containerPointToLatLng([0, y]).distanceTo(this._map.containerPointToLatLng([x, y]));
      const meterPerPixel = maxMeters / x;
      el.style.width = `${Math.round(this.#size1 / meterPerPixel)}px`;
      el.style.height = `${Math.round(this.#size2 / meterPerPixel)}px`;
      this.setZIndexOffset(-10000);
    }
  }

  setSelected(selected: boolean) {
    this.#selected = selected;
    this.getElement()?.querySelector(`.static-icon`)?.toggleAttribute("data-is-selected", selected)
  }

  getSelected() {
    return this.#selected;
  }
}
