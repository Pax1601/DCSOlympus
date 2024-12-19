import { LatLngExpression, Map, Circle, DivIcon, Marker, CircleOptions, LatLng } from "leaflet";
import { getApp } from "../../olympusapp";
import { CoalitionAreaHandle } from "./coalitionareahandle";
import { BLUE_COMMANDER, RED_COMMANDER } from "../../constants/constants";
import { Coalition } from "../../types/types";
import * as turf from "@turf/turf";
import { CoalitionAreaChangedEvent, CoalitionAreaSelectedEvent } from "../../events";

let totalCircles = 0;

export class CoalitionCircle extends Circle {
  #coalition: Coalition = "blue";
  #selected: boolean = true;
  #creating: boolean = false;
  #radiusHandle: CoalitionAreaHandle;
  #labelText: string;
  #label: Marker;
  #updateTimeout: number | null = null;

  constructor(latlng: LatLngExpression, options: CircleOptions, creating = true) {
    if (options === undefined) options = { radius: 0 };

    totalCircles++;

    options.bubblingMouseEvents = false;
    options.interactive = false;
    //@ts-ignore draggable option added by leaflet-path-drag
    options.draggable = true;

    super(latlng, options);
    this.#setColors();

    this.#labelText = `Circle ${totalCircles}`;
    this.#creating = creating;

    if ([BLUE_COMMANDER, RED_COMMANDER].includes(getApp().getMissionManager().getCommandModeOptions().commandMode))
      this.setCoalition(getApp().getMissionManager().getCommandedCoalition());

    this.on("drag", () => {
      this.#setRadiusHandle();
      this.#drawLabel();

      if (this.#updateTimeout) window.clearTimeout(this.#updateTimeout);
      this.#updateTimeout = window.setTimeout(() => {
        CoalitionAreaChangedEvent.dispatch(this);
        this.#updateTimeout = null;
      }, 500);
    });

    getApp().getMap().addLayer(this);
  }

  setCoalition(coalition: Coalition) {
    this.#coalition = coalition;
    this.#setColors();
    CoalitionAreaChangedEvent.dispatch(this);
  }

  getCoalition() {
    return this.#coalition;
  }

  setSelected(selected: boolean) {
    this.#selected = selected;
    this.#setColors();
    this.#setRadiusHandle();
    this.#drawLabel();
    this.setOpacity(selected ? 1 : 0.5);

    if (selected) CoalitionAreaSelectedEvent.dispatch(this);

    //@ts-ignore draggable option added by leaflet-path-drag
    selected ? this.dragging.enable() : this.dragging.disable();
  }

  getSelected() {
    return this.#selected;
  }

  setCreating(creating: boolean) {
    this.#creating = creating;
    this.#setRadiusHandle();

    /* Remove areas with less than 2 vertexes */
    if (this.getLatLng().lat === 0 && this.getLatLng().lng === 0) getApp().getCoalitionAreasManager().deleteCoalitionArea(this);
  }

  getCreating() {
    return this.#creating;
  }

  setOpacity(opacity: number) {
    this.setStyle({ opacity: opacity, fillOpacity: opacity * 0.25 });
  }

  getLabelText() {
    return this.#labelText;
  }

  setLabelText(labelText: string) {
    this.#labelText = labelText;
    this.#drawLabel();
    CoalitionAreaChangedEvent.dispatch(this);
  }

  onAdd(map: Map): this {
    super.onAdd(map);
    this.#drawLabel();

    return this;
  }

  onRemove(map: Map): this {
    super.onRemove(map);
    this.#label?.removeFrom(map);
    this.#radiusHandle?.removeFrom(map);
    return this;
  }

  setLatLng(latlng: LatLngExpression): this {
    super.setLatLng(latlng);
    this.#setRadiusHandle();
    this.#drawLabel();
    return this;
  }

  #setColors() {
    let coalitionColor = "#FFFFFF";
    if (this.getCoalition() === "blue") coalitionColor = "#247be2";
    else if (this.getCoalition() === "red") coalitionColor = "#ff5858";

    this.setStyle({
      color: this.getSelected() ? "white" : coalitionColor,
      fillColor: coalitionColor,
    });
  }

  #setRadiusHandle() {
    if (this.#radiusHandle) this.#radiusHandle.removeFrom(getApp().getMap());

    if (this.#selected) {
      const dest = turf.destination(turf.point([this.getLatLng().lng, this.getLatLng().lat]), this.getRadius() / 1000, 0);
      this.#radiusHandle = new CoalitionAreaHandle(new LatLng(dest.geometry.coordinates[1], dest.geometry.coordinates[0]));
      this.#radiusHandle.addTo(getApp().getMap());
      this.#radiusHandle.on("drag", (e: any) => {
        this.setRadius(this.getLatLng().distanceTo(e.latlng));
      });
    }
  }

  #drawLabel() {
    this.#label?.removeFrom(this._map);
    
    this.#label = new Marker(this.getLatLng(), {
      icon: new DivIcon({
        className: "label",
        html: this.#labelText,
        iconSize: [100, 40],
      }),
      interactive: false,
    }).addTo(this._map);
    this.#label.getElement()?.classList.add(`ol-coalitionarea-label`, `${this.#selected ? "selected" : `${this.#coalition}`}`);
  }
}
