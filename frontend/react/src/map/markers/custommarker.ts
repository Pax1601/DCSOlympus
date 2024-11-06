import { DivIcon, Map, Marker, MarkerOptions, LatLngExpression } from "leaflet";

export class CustomMarker extends Marker {
  constructor(latlng: LatLngExpression, options?: MarkerOptions) {
    super(latlng, options);
  }

  onAdd(map: Map): this {
    this.setIcon(new DivIcon()); // Default empty icon
    super.onAdd(map);
    this.createIcon();
    return this;
  }

  onRemove(map: Map): this {
    super.onRemove(map);
    return this;
  }

  createIcon() {
    /* Overloaded by child classes */
  }
}
