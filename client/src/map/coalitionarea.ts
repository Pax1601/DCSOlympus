import { LatLngExpression, Polygon, PolylineOptions } from "leaflet";
import { getMap } from "..";

export class CoalitionArea extends Polygon {
    constructor(latlngs: LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][], options?: PolylineOptions) {
        if (options === undefined) 
            options = {};
            
        options.bubblingMouseEvents = false;
        super(latlngs, options);

        this.on("contextmenu", (e: any) => {
            getMap().showCoalitionAreaContextMenu(e, this);
        })
    }

    setCoalition(coalition: string) {
        this.setStyle({color: coalition, fillColor: coalition});
    }
}