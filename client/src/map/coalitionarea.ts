import { DomUtil, LatLng, LatLngExpression, Map, Point, Polygon, PolylineOptions } from "leaflet";
import { getMap, getUnitsManager } from "..";
import { CoalitionAreaHandle } from "./coalitionareahandle";
import { CoalitionAreaMiddleHandle } from "./coalitionareamiddlehandle";
import { BLUE_COMMANDER, RED_COMMANDER } from "../constants/constants";

export class CoalitionArea extends Polygon {
    #coalition: string = "blue";
    #selected: boolean = true;
    #editing: boolean = true;
    #handles: CoalitionAreaHandle[] = [];
    #middleHandles: CoalitionAreaMiddleHandle[] = [];
    #activeIndex: number = 0;

    constructor(latlngs: LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][], options?: PolylineOptions) {
        if (options === undefined)
            options = {};

        options.bubblingMouseEvents = false;
        options.interactive = false;

        super(latlngs, options);
        this.#setColors();
        this.#registerCallbacks();

        if (getUnitsManager().getCommandMode() == BLUE_COMMANDER) 
            this.setCoalition("blue");
        else if (getUnitsManager().getCommandMode() == RED_COMMANDER) 
            this.setCoalition("red");

    }

    setCoalition(coalition: string) {
        this.#coalition = coalition;
        this.#setColors();
    }

    getCoalition() {
        return this.#coalition;
    }

    setSelected(selected: boolean) {
        this.#selected = selected;
        this.#setColors();
        this.#setHandles();
        this.setOpacity(selected? 1: 0.5);
        if (!this.getSelected() && this.getEditing()) {
            /* Remove the vertex we were working on */
            var latlngs = this.getLatLngs()[0] as LatLng[];
            latlngs.splice(this.#activeIndex, 1);
            this.setLatLngs(latlngs);
            this.setEditing(false);
        }
    }

    getSelected() {
        return this.#selected;
    }

    setEditing(editing: boolean) {
        this.#editing = editing;
        this.#setHandles();
        var latlngs = this.getLatLngs()[0] as LatLng[];

        /* Remove areas with less than 2 vertexes */
        if (latlngs.length <= 2)
            getMap().deleteCoalitionArea(this);
    }

    getEditing() {
        return this.#editing;
    }

    addTemporaryLatLng(latlng: LatLng) {
        this.#activeIndex++;
        var latlngs = this.getLatLngs()[0] as LatLng[];
        latlngs.splice(this.#activeIndex, 0, latlng);
        this.setLatLngs(latlngs);
        this.#setHandles();
    }

    moveActiveVertex(latlng: LatLng) {
        var latlngs = this.getLatLngs()[0] as LatLng[];
        latlngs[this.#activeIndex] = latlng;
        this.setLatLngs(latlngs);
        this.#setHandles();
    }

    setOpacity(opacity: number) {
        this.setStyle({opacity: opacity, fillOpacity: opacity * 0.25});
    }

    onRemove(map: Map): this {
        super.onRemove(map);
        this.#handles.concat(this.#middleHandles).forEach((handle: CoalitionAreaHandle | CoalitionAreaMiddleHandle) => handle.removeFrom(getMap()));
        return this;
    }

    #setColors() {
        const coalitionColor = this.getCoalition() === "blue" ? "#247be2" : "#ff5858";
        this.setStyle({ color: this.getSelected() ? "white" : coalitionColor, fillColor: coalitionColor });
    }

    #setHandles() {
        this.#handles.forEach((handle: CoalitionAreaHandle) => handle.removeFrom(getMap()));
        this.#handles = [];
        if (this.getSelected()) {
            var latlngs = this.getLatLngs()[0] as LatLng[];
            latlngs.forEach((latlng: LatLng, idx: number) => {
                /* Add the polygon vertex handle (for moving the vertex) */
                const handle = new CoalitionAreaHandle(latlng);
                handle.addTo(getMap());
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
        this.#middleHandles.forEach((handle: CoalitionAreaMiddleHandle) => handle.removeFrom(getMap()));
        this.#middleHandles = [];
        var latlngs = this.getLatLngs()[0] as LatLng[];
        if (this.getSelected() && latlngs.length >= 2) {
            var lastLatLng: LatLng | null = null;
            latlngs.concat([latlngs[0]]).forEach((latlng: LatLng, idx: number) => {
                /* Add the polygon middle point handle (for adding new vertexes) */
                if (lastLatLng != null) {
                    const handle1Point = getMap().latLngToLayerPoint(latlng);
                    const handle2Point = getMap().latLngToLayerPoint(lastLatLng);
                    const middlePoint = new Point((handle1Point.x + handle2Point.x) / 2, (handle1Point.y + handle2Point.y) / 2);
                    const middleLatLng = getMap().layerPointToLatLng(middlePoint);

                    const middleHandle = new CoalitionAreaMiddleHandle(middleLatLng);
                    middleHandle.addTo(getMap());
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

    #registerCallbacks() {
        this.on("click", (e: any) => {
            getMap().deselectAllCoalitionAreas();
            if (!this.getSelected()) {
                this.setSelected(true);
            }
        });

        this.on("contextmenu", (e: any) => {
            if (!this.getEditing()) {
                getMap().deselectAllCoalitionAreas();
                this.setSelected(true);
            }
            else
                this.setEditing(false);
        });
    }
}