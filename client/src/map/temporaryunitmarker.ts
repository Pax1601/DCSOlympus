import { Icon } from "leaflet";
import { CustomMarker } from "./custommarker";

export class TemporaryUnitMarker extends CustomMarker {
    createIcon() {
        var icon = new Icon({
            iconUrl: '/resources/theme/images/markers/temporary-icon.png',
            iconSize: [52, 52],
            iconAnchor: [26, 26]
        });
        this.setIcon(icon);
    }
}