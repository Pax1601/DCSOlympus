import { MiniMap, MiniMapOptions } from "leaflet-control-mini-map";

export class ClickableMiniMap extends MiniMap {
  constructor(layer: L.TileLayer | L.LayerGroup, options?: MiniMapOptions) {
    super(layer, options);
  }

  getMap() {
    //@ts-ignore needed to access not exported member. A bit of a hack, required to access click events //TODO: fix me
    return this._miniMap;
  }
}
