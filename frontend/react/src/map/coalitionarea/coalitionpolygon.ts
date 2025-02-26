import { LatLng, LatLngExpression, Map, Point, Polygon, PolylineOptions, DivIcon, Marker } from "leaflet";
import { getApp } from "../../olympusapp";
import { DraggableHandle } from "./coalitionareahandle";
import { CoalitionAreaMiddleHandle } from "./coalitionareamiddlehandle";
import { BLUE_COMMANDER, colors, RED_COMMANDER } from "../../constants/constants";
import { Coalition } from "../../types/types";
import { polyCenter } from "../../other/utils";
import { CoalitionAreaChangedEvent, CoalitionAreaSelectedEvent } from "../../events";

let totalPolygons = 0;

export class CoalitionPolygon extends Polygon {
  #coalition: Coalition = "blue";
  #selected: boolean = true;
  #creating: boolean = false;
  #handles: DraggableHandle[] = [];
  #middleHandles: CoalitionAreaMiddleHandle[] = [];
  #activeIndex: number = 0;
  #labelText: string;
  #label: Marker;
  #updateTimeout: number | null = null;

  constructor(latlngs: LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][], options?: PolylineOptions, creating = true) {
    if (options === undefined) options = {};

    totalPolygons++;

    options.bubblingMouseEvents = false;
    options.interactive = false;
    //@ts-ignore draggable option added by leaflet-path-drag
    options.draggable = true;

    super(latlngs, options);
    this.#setColors();

    this.#labelText = `Polygon ${totalPolygons}`;
    this.#creating = creating;

    if ([BLUE_COMMANDER, RED_COMMANDER].includes(getApp().getMissionManager().getCommandModeOptions().commandMode))
      this.setCoalition(getApp().getMissionManager().getCommandedCoalition());

    this.on("drag", () => {
      this.#setHandles();
      this.#setMiddleHandles();
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
    this.#setHandles();
    this.#drawLabel();
    this.setOpacity(selected ? 1 : 0.5);
    if (!this.getSelected() && this.getCreating()) {
      /* Remove the vertex we were working on */
      var latlngs = this.getLatLngs()[0] as LatLng[];
      latlngs.splice(this.#activeIndex, 1);
      this.setLatLngs(latlngs);
      this.setCreating(false);
    }

    if (selected) CoalitionAreaSelectedEvent.dispatch(this);

    //@ts-ignore draggable option added by leaflet-path-drag
    selected ? this.dragging.enable() : this.dragging.disable();
  }

  getSelected() {
    return this.#selected;
  }

  setCreating(creating: boolean) {
    this.#creating = creating;
    this.#setHandles();
    var latlngs = this.getLatLngs()[0] as LatLng[];

    /* Remove areas with less than 2 vertexes */
    if (latlngs.length <= 2) getApp().getCoalitionAreasManager().deleteCoalitionArea(this);
  }

  getCreating() {
    return this.#creating;
  }

  addTemporaryLatLng(latlng: LatLng) {
    this.#activeIndex++;
    var latlngs = this.getLatLngs()[0] as LatLng[];
    latlngs.splice(this.#activeIndex, 0, latlng);
    this.setLatLngs(latlngs);
    this.#setHandles();
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
    this.#handles.concat(this.#middleHandles).forEach((handle: DraggableHandle | CoalitionAreaMiddleHandle) => handle.removeFrom(map));
    return this;
  }

  setLatLngs(latlngs: LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][]) {
    super.setLatLngs(latlngs);
    this.#drawLabel();

    if (this.#updateTimeout) window.clearTimeout(this.#updateTimeout);
    this.#updateTimeout = window.setTimeout(() => {
      CoalitionAreaChangedEvent.dispatch(this);
      this.#updateTimeout = null;
    }, 500);

    return this;
  }

  #setColors() {
    let coalitionColor = colors.NEUTRAL_COALITION;
    if (this.getCoalition() === "blue") coalitionColor = colors.BLUE_COALITION;
    else if (this.getCoalition() === "red") coalitionColor = colors.RED_COALITION;

    this.setStyle({
      color: this.getSelected() ? "white" : coalitionColor,
      fillColor: coalitionColor,
    });
  }

  #setHandles() {
    this.#handles.forEach((handle: DraggableHandle) => handle.removeFrom(getApp().getMap()));
    this.#handles = [];
    if (this.getSelected()) {
      var latlngs = this.getLatLngs()[0] as LatLng[];
      latlngs.forEach((latlng: LatLng, idx: number) => {
        /* Add the polygon vertex handle (for moving the vertex) */
        const handle = new DraggableHandle(latlng);
        handle.addTo(getApp().getMap());
        handle.on("drag", (e: any) => {
          var latlngs = this.getLatLngs()[0] as LatLng[];
          latlngs[idx] = e.target.getLatLng();
          this.setLatLngs(latlngs);
          this.#setMiddleHandles();
        });
        this.#handles.push(handle);
      });
    }
    this.#setMiddleHandles();
  }

  #setMiddleHandles() {
    this.#middleHandles.forEach((handle: CoalitionAreaMiddleHandle) => handle.removeFrom(getApp().getMap()));
    this.#middleHandles = [];
    var latlngs = this.getLatLngs()[0] as LatLng[];
    if (this.getSelected() && latlngs.length >= 2) {
      var lastLatLng: LatLng | null = null;
      latlngs.concat([latlngs[0]]).forEach((latlng: LatLng, idx: number) => {
        /* Add the polygon middle point handle (for adding new vertexes) */
        if (lastLatLng != null) {
          const handle1Point = getApp().getMap().latLngToLayerPoint(latlng);
          const handle2Point = getApp().getMap().latLngToLayerPoint(lastLatLng);
          const middlePoint = new Point((handle1Point.x + handle2Point.x) / 2, (handle1Point.y + handle2Point.y) / 2);
          const middleLatLng = getApp().getMap().layerPointToLatLng(middlePoint);

          const middleHandle = new CoalitionAreaMiddleHandle(middleLatLng);
          middleHandle.addTo(getApp().getMap());
          middleHandle.on("click", (e: any) => {
            this.#activeIndex = idx - 1;
            this.addTemporaryLatLng(middleLatLng);
          });
          this.#middleHandles.push(middleHandle);
        }
        lastLatLng = latlng;
      });
    }
  }

  #drawLabel() {
    if (this.#label) {
      this.#label.removeFrom(this._map);
    }
    if ((this.getLatLngs()[0] as LatLng[]).length > 2) {
      this.#label = new Marker(polyCenter(this), {
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
}
