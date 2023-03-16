import { Icon, LatLng, Marker, Polyline } from "leaflet";
import { getMap, getMissionData, getUnitsManager } from "..";
import { distance, bearing, zeroPad, zeroAppend, reciprocalHeading } from "../other/utils";
import { Unit } from "../units/unit";
import { Panel } from "./panel";

export class MouseInfoPanel extends Panel {
    #measureMarker: Marker;
    #measurePoint: LatLng | null = null;
    #measureIcon: Icon;
    #measureLine: Polyline = new Polyline([], { color: '#2d3e50', weight: 3, opacity: 0.5, smoothFactor: 1, interactive: false });
    #measureBox: HTMLElement;

    constructor(ID: string) {
        super(ID);

        this.#measureIcon = new Icon({ iconUrl: 'images/pin.png', iconAnchor: [16, 32]});
        this.#measureMarker = new Marker([0, 0], {icon: this.#measureIcon, interactive: false});

        this.#measureBox = document.createElement("div");
        this.#measureBox.classList.add("ol-measure-box");
        document.body.appendChild(this.#measureBox);

        getMap()?.on("click", (e: any) => this.#onMapClick(e));
        getMap()?.on('zoom', (e: any) => this.#onZoom(e));
        getMap()?.on('mousemove', (e: any) => this.#onMouseMove(e));

        document.addEventListener('unitsSelection', (e: CustomEvent<Unit[]>) => this.#onUnitsSelection(e.detail));
        document.addEventListener('clearSelection', () => this.#onClearSelection());
    }

    #update(mousePosition: LatLng, measurePosition: LatLng | null, unitPosition: LatLng | null) {
        var bullseyes = getMissionData().getBullseyes();
        for (let idx in bullseyes)
        {
            var el = <HTMLElement>this.getElement().querySelector(`#bullseye-${idx}`);

            if ( el != null ) {
                var dist = distance(bullseyes[idx].latitude, bullseyes[idx].longitude, mousePosition.lat, mousePosition.lng);
                var bear = bearing(bullseyes[idx].latitude, bullseyes[idx].longitude, mousePosition.lat, mousePosition.lng);

                el.dataset.bearing       = zeroAppend(Math.floor(bear), 3);
                el.dataset.distance      = zeroAppend(Math.floor(dist*0.000539957), 3);
                el.dataset.distanceUnits = "NM";
            }
            
        }

        if (measurePosition) {
            var el = <HTMLElement>this.getElement().querySelector(`#measure-position`);

            if (el != null) {
                var bear = bearing(measurePosition.lat, measurePosition.lng, mousePosition.lat, mousePosition.lng);
                var dist = distance(measurePosition.lat, measurePosition.lng, mousePosition.lat, mousePosition.lng);

                el.dataset.bearing       = zeroAppend(Math.floor(bear), 3);
                el.dataset.distance      = zeroAppend(Math.floor(dist*0.000539957), 3);
                el.dataset.distanceUnits = "NM";

            }
        }


        if (unitPosition) {
            var el = <HTMLElement>this.getElement().querySelector(`#unit-position`);
            if (el != null) {
                var dist = distance(unitPosition.lat, unitPosition.lng, mousePosition.lat, mousePosition.lng);
                var bear = bearing(unitPosition.lat, unitPosition.lng, mousePosition.lat, mousePosition.lng);

                el.dataset.bearing       = zeroAppend(Math.floor(bear), 3);
                el.dataset.distance      = zeroAppend(Math.floor(dist*0.000539957), 3);
                el.dataset.distanceUnits = "nm";
            }
        }
    }

    #onMapClick(e: any)
    {
        if (e.originalEvent.ctrlKey)
        {
            if (!this.#measurePoint)
            {
                this.#measureBox.classList.toggle("hide", false);
                this.#measurePoint = e.latlng;
                this.#measureMarker.setLatLng(e.latlng);
                this.#measureMarker.addTo(getMap());
                if (!getMap().hasLayer(this.#measureLine))
                    this.#measureLine.addTo(getMap());
            }
            else
            {
                this.#measureBox.classList.toggle("hide", true);
                this.#measurePoint = null;
                if (getMap().hasLayer(this.#measureMarker))
                    getMap().removeLayer(this.#measureMarker);

                this.#measureLine.setLatLngs([]);
                if (getMap().hasLayer(this.#measureLine))
                    getMap().removeLayer(this.#measureLine);
            }
        }
    }

    #drawMeasureLine()
    {
        var mouseLatLng = getMap().containerPointToLatLng(getMap().getMousePosition());
        if (this.#measurePoint != null)
        {
            var points = [this.#measurePoint, mouseLatLng];
            this.#measureLine.setLatLngs(points);
            var dist = distance(this.#measurePoint.lat, this.#measurePoint.lng, mouseLatLng.lat, mouseLatLng.lng);
            var bear = bearing(this.#measurePoint.lat, this.#measurePoint.lng, mouseLatLng.lat, mouseLatLng.lng);
            var startXY = getMap().latLngToContainerPoint(this.#measurePoint);
            var dx = (getMap().getMousePosition().x - startXY.x);
            var dy = (getMap().getMousePosition().y - startXY.y);

            var angle = Math.atan2(dy, dx);
            if (angle > Math.PI / 2) 
                angle = angle - Math.PI;

            if (angle < -Math.PI / 2) 
                angle = angle + Math.PI;

            const bng = zeroAppend(Math.floor(bear), 3);
            const reciprocal = zeroAppend( reciprocalHeading( parseInt( bng ) ), 3 );

            let data = [ `${bng}°`, `${Math.floor(dist*0.000539957)}nm`, `${reciprocal}°` ];

            if ( bear < 180 ) {
                data = data.reverse();
            }

            this.#measureBox.innerText = data.join( " | " );
            this.#measureBox.style.left = (getMap().getMousePosition().x + startXY.x) / 2 - this.#measureBox.offsetWidth / 2 + "px";
            this.#measureBox.style.top = (getMap().getMousePosition().y + startXY.y) / 2 - this.#measureBox.offsetHeight / 2 + "px";
            this.#measureBox.style.rotate = angle + "rad";
        }
    }

    #onMouseMove(e: any)
    {
        var selectedUnitPosition = null;
        var selectedUnits = getUnitsManager().getSelectedUnits();
        if (selectedUnits && selectedUnits.length == 1)
            selectedUnitPosition = new LatLng(selectedUnits[0].getFlightData().latitude, selectedUnits[0].getFlightData().longitude);

        this.#update(<LatLng>e.latlng, this.#measurePoint, selectedUnitPosition);
        this.#drawMeasureLine();
    }

    #onZoom(e: any)
    {
        this.#drawMeasureLine();
    }

    #onUnitsSelection(units: Unit[])
    {
        if (units.length == 1)
            this.getElement().querySelector(`#unit-position`)?.classList.toggle("hide", false);
    }
    
    #onClearSelection()
    {
        this.#measureBox.classList.toggle("hide", true);
        this.getElement().querySelector(`#unit-position`)?.classList.toggle("hide", true);
    }
}
