import { LatLng, LatLngExpression, Polygon, PolylineOptions } from "leaflet";
import { getMap } from "..";
import { DRAW_POLYGON } from "./map";
import { CoalitionAreaHandle } from "./coalitionareahandle";

export class CoalitionArea extends Polygon {
    #coalition: string = "blue";
    #selected: boolean = true;
    #editing: boolean = true;
    #handles: CoalitionAreaHandle[] = [];

    constructor(latlngs: LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][], options?: PolylineOptions) {
        if (options === undefined) 
            options = {};
        
        options.bubblingMouseEvents = false;
        super(latlngs, options);

        this.on("click", (e: any) => {
            if (!this.getSelected()) {
                this.setSelected(true);
                getMap().setState(DRAW_POLYGON);
            }
            else if (this.getEditing()) {
                this.addLatLng(e.latlng);
                this.addTemporaryLatLng(e.latlng);
            }
        });

        this.on("contextmenu", (e: any) => {
            if (!this.#editing)
                getMap().showCoalitionAreaContextMenu(e, this);
            else 
                this.setEditing(false);
        });

        this.#setColors();
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
        if (!selected)
            this.setEditing(false);
    }
    
    getSelected() {
        return this.#selected;
    }

    setEditing(editing: boolean) {
        this.#editing = editing;
        this.#setHandles();
    }

    getEditing() {
        return this.#editing;
    }

    addTemporaryLatLng(latlng: LatLng) {
        this.addLatLng(latlng);
    }

    moveTemporaryLatLng(latlng: LatLng) {
        var latlngs = this.getLatLngs()[0] as LatLng[];
        latlngs[latlngs.length - 1] = latlng;
        this.setLatLngs(latlngs);
    }

    addLatLng(latlng: LatLngExpression | LatLngExpression[], latlngs?: LatLng[] | undefined): this {
        super.addLatLng(latlng, latlngs)
        this.#setHandles();
        return this;
    }

    #setColors() {
        this.setStyle({color: this.getSelected()? "white": this.#coalition, fillColor: this.#coalition});
    }

    #setHandles() {
        this.#handles.forEach((handle: CoalitionAreaHandle) => handle.removeFrom(getMap()));
        this.#handles = [];
        var latlngs = this.getLatLngs()[0] as LatLng[];
        latlngs.forEach((latlng: LatLng, idx: number) => {
            const handle = new CoalitionAreaHandle(latlng);
            handle.addTo(getMap());
            handle.on("dragend", (e: any) => {
                var latlngs = this.getLatLngs()[0] as LatLng[];
                latlngs[idx] = e.latlng;
                this.setLatLngs(latlngs);
            });
            this.#handles.push(handle);
        });
    }
}