import {
  LatLngExpression,
  Map,
  Circle,
  DivIcon,
  Marker,
  CircleOptions,
  LatLng,
} from "leaflet";
import { getApp } from "../../olympusapp";
import { CoalitionAreaHandle } from "./coalitionareahandle";
import { BLUE_COMMANDER, RED_COMMANDER } from "../../constants/constants";
import { Coalition } from "../../types/types";
import * as turf from "@turf/turf";

let totalAreas = 0;

export class CoalitionCircle extends Circle {
  #coalition: Coalition = "blue";
  #selected: boolean = true;
  #editing: boolean = true;
  #radiusHandle: CoalitionAreaHandle;
  #labelText: string;
  #label: Marker;

  constructor(latlng: LatLngExpression, options: CircleOptions) {
    if (options === undefined) options = { radius: 0 };

    totalAreas++;

    options.bubblingMouseEvents = false;
    options.interactive = false;
    //@ts-ignore draggable option added by leaflet-path-drag
    options.draggable = true;

    super(latlng, options);
    this.#setColors();

    this.#labelText = `Circle ${totalAreas}`;

    if (
      [BLUE_COMMANDER, RED_COMMANDER].includes(
        getApp().getMissionManager().getCommandModeOptions().commandMode
      )
    )
      this.setCoalition(getApp().getMissionManager().getCommandedCoalition());

    this.on("drag", () => {
      this.#setRadiusHandle();
      this.#drawLabel();
    });

    this.on("remove", () => {
      this.#label.removeFrom(this._map);
    });
  }

  setCoalition(coalition: Coalition) {
    this.#coalition = coalition;
    this.#setColors();
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

    //@ts-ignore draggable option added by leaflet-path-drag
    selected ? this.dragging.enable() : this.dragging.disable();
  }

  getSelected() {
    return this.#selected;
  }

  setEditing(editing: boolean) {
    this.#editing = editing;
    this.#setRadiusHandle();
  }

  getEditing() {
    return this.#editing;
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
  }

  onRemove(map: Map): this {
    super.onRemove(map);
    this.#radiusHandle.removeFrom(getApp().getMap());
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
      const dest = turf.destination(
        turf.point([this.getLatLng().lng, this.getLatLng().lat]),
        this.getRadius() / 1000,
        0
      );
      this.#radiusHandle = new CoalitionAreaHandle(
        new LatLng(dest.geometry.coordinates[1], dest.geometry.coordinates[0])
      );
      this.#radiusHandle.addTo(getApp().getMap());
      this.#radiusHandle.on("drag", (e: any) => {
        this.setRadius(this.getLatLng().distanceTo(e.latlng));
      });
    }
  }

  #drawLabel() {
    if (this.#label) {
      this.#label.removeFrom(this._map);
    }
    this.#label = new Marker(this.getLatLng(), {
      icon: new DivIcon({
        className: "label",
        html: this.#labelText,
        iconSize: [100, 40],
      }),
      interactive: false,
    }).addTo(this._map);
    this.#label
      .getElement()
      ?.classList.add(
        `ol-coalitionarea-label`,
        `${this.#selected ? "selected" : `${this.#coalition}`}`
      );
  }
}
