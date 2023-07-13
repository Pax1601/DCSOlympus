import { Icon, LatLng, Marker, Polyline } from "leaflet";
import { getMap, getMissionHandler, getUnitsManager } from "..";
import { distance, bearing, zeroAppend, mToNm, nmToFt } from "../other/utils";
import { Unit } from "../units/unit";
import { Panel } from "./panel";
import formatcoords from "formatcoords";

export class MouseInfoPanel extends Panel {
    #measureMarker: Marker;
    #measurePoint: LatLng | null = null;
    #measureIcon: Icon;
    #measureLine: Polyline = new Polyline([], { color: '#2d3e50', weight: 3, opacity: 0.5, smoothFactor: 1, interactive: false });
    #measureBox: HTMLElement;

    constructor(ID: string) {
        super(ID);

        this.#measureIcon = new Icon({ iconUrl: 'resources/theme/images/icons/pin.svg', iconAnchor: [16, 32] });
        this.#measureMarker = new Marker([0, 0], { icon: this.#measureIcon, interactive: false });

        this.#measureBox = document.createElement("div");
        this.#measureBox.classList.add("ol-measure-box", "hide");
        document.body.appendChild(this.#measureBox);

        getMap()?.on("click", (e: any) => this.#onMapClick(e));
        getMap()?.on('zoom', (e: any) => this.#onZoom(e));
        getMap()?.on('mousemove', (e: any) => this.#onMouseMove(e));

        document.addEventListener('unitsSelection', (e: CustomEvent<Unit[]>) => this.#update());
        document.addEventListener('clearSelection', () => this.#update());
    }

    #update() {
        const mousePosition = getMap().getMouseCoordinates();

        var selectedUnitPosition = null;
        var selectedUnits = getUnitsManager().getSelectedUnits();
        if (selectedUnits && selectedUnits.length == 1)
            selectedUnitPosition = new LatLng(selectedUnits[0].getPosition().lat, selectedUnits[0].getPosition().lng);

        /* Draw measures from selected unit, from pin location, and from bullseyes */
        this.#drawMeasure("ref-measure-position", "measure-position", this.#measurePoint, mousePosition);
        this.#drawMeasure("ref-unit-position", "unit-position", selectedUnitPosition, mousePosition);

        this.getElement().querySelector(`#measuring-tool`)?.classList.toggle("hide", this.#measurePoint === null && selectedUnitPosition === null);

        var bullseyes = getMissionHandler().getBullseyes();
        for (let idx in bullseyes)
            this.#drawMeasure(null, `bullseye-${idx}`, bullseyes[idx].getLatLng(), mousePosition);

        /* Draw coordinates */
        var coords = formatcoords(mousePosition.lat, mousePosition.lng);
        var coordString = coords.format('XDDMMss', {decimalPlaces: 4});
        this.#drawCoordinates("ref-mouse-position-latitude", "mouse-position-latitude", coordString.split(" ")[0]);
        this.#drawCoordinates("ref-mouse-position-longitude", "mouse-position-longitude", coordString.split(" ")[1]);
    }

    #onMapClick(e: any) {
        if (e.originalEvent.ctrlKey) {
            if (!this.#measurePoint) {
                this.#measureBox.classList.toggle("hide", false);
                this.#measurePoint = e.latlng;
                this.#measureMarker.setLatLng(e.latlng);
                this.#measureMarker.addTo(getMap());
                if (!getMap().hasLayer(this.#measureLine))
                    this.#measureLine.addTo(getMap());
            }
            else {
                this.#measureBox.classList.toggle("hide", true);
                this.#measurePoint = null;
                if (getMap().hasLayer(this.#measureMarker))
                    getMap().removeLayer(this.#measureMarker);

                this.#measureLine.setLatLngs([]);
                if (getMap().hasLayer(this.#measureLine))
                    getMap().removeLayer(this.#measureLine);
            }
        }

        this.#update();
    }

    #drawMeasureLine() {
        var mouseLatLng = getMap().containerPointToLatLng(getMap().getMousePosition());
        if (this.#measurePoint != null) {
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

            let bng = zeroAppend(Math.floor(bear), 3);

            if (bng === "000")
                bng = "360";

            var [str, unit] = this.#computeDistanceString(dist)

            let data = [`${bng}°`, `${str} ${unit}`];

            this.#measureBox.innerText = data.join(" / ");
            this.#measureBox.style.left = (getMap().getMousePosition().x + startXY.x) / 2 - this.#measureBox.offsetWidth / 2 + "px";
            this.#measureBox.style.top = (getMap().getMousePosition().y + startXY.y) / 2 - this.#measureBox.offsetHeight / 2 + "px";
            this.#measureBox.style.rotate = angle + "rad";
        }
    }

    #onMouseMove(e: any) {

        this.#update();
        this.#drawMeasureLine();
    }

    #onZoom(e: any) {
        this.#drawMeasureLine();
    }

    #drawMeasure(imgId: string | null, textId: string, value: LatLng | null, mousePosition: LatLng) {
        var el = this.getElement().querySelector(`#${textId}`) as HTMLElement;
        var img = imgId != null ? this.getElement().querySelector(`#${imgId}`) as HTMLElement : null;
        if (value) {
            if (el != null) {
                el.classList.remove("hide");

                var bear = bearing(value.lat, value.lng, mousePosition.lat, mousePosition.lng);
                var dist = distance(value.lat, value.lng, mousePosition.lat, mousePosition.lng);

                let bng = zeroAppend(Math.floor(bear), 3);

                if (bng === "000")
                    bng = "360";

                var [str, unit] = this.#computeDistanceString(dist)

                el.dataset.bearing = bng;
                el.dataset.distance = str;
                el.dataset.distanceUnits = unit;
            }
            if (img != null)
                img.classList.remove("hide");
        }
        else {
            if (el != null)
                el.classList.add("hide");
            if (img != null)
                img.classList.add("hide");
        }
    }

    #drawCoordinates(imgId: string, textId: string, value: string) {
        const el = this.getElement().querySelector(`#${textId}`) as HTMLElement;
        const img = this.getElement().querySelector(`#${imgId}`) as HTMLElement;
        if (img && el) {
            el.dataset.value = value.substring(1);
            img.dataset.label = value[0];
        }
    }

    #computeDistanceString(dist: number) {
        var val = mToNm(dist);
        var strVal = 0;
        var decimal = false;
        var unit = "NM";
        if (val > 10)
            strVal = Math.floor(val);
        else if (val > 1 && val <= 10) {
            strVal = Math.floor(val * 100) / 100;
            decimal = true;
        }
        else {
            strVal = Math.floor(nmToFt(val));
            unit = "ft";
        }

        return [zeroAppend(strVal, 3, decimal), unit];
    }
}
