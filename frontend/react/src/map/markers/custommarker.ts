import { DivIcon, Map, Marker, MarkerOptions, LatLngExpression } from "leaflet";
import { SelectionEnabledChangedEvent } from "../../events";

export class CustomMarker extends Marker {
  constructor(latlng: LatLngExpression, options?: MarkerOptions) {
    super(latlng, options);

    SelectionEnabledChangedEvent.on((enabled) => {
      const el = this.getElement();
      if (el === undefined || el === null) return;
      if (enabled) el.classList.add("disable-pointer-events");
      else el.classList.remove("disable-pointer-events");
    });
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
