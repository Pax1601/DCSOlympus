import * as L from 'leaflet'
import { getMap } from '..'
import { rad2deg } from '../other/utils'

export interface MarkerOptions {
    unitName: string,
    name: string,
    human: boolean,
    coalition: string,
    AI: boolean
}

export interface MarkerData {
    heading: number,
    speed: number,
    altitude: number,
    alive: boolean
}

export class UnitMarker extends L.Marker {
    #options: MarkerOptions;
    #data: MarkerData;
    #selected: boolean = false

    constructor(options: MarkerOptions) {
        super(new L.LatLng(0, 0), { riseOnHover: true });

        this.#options = options;
        this.#data = {heading: 0, speed: 0, altitude: 0, alive: true};

        var icon = new L.DivIcon({
            html: `<div class="unit"
                        data-coalition=${this.#options.coalition}
                        data-pilot=${this.#options.human? "human": "ai"}>
                        <div class="unit-spotlight">
                            <div class="unit-selected-border">
                                <div class="unit-vvi">
                                    <div class="unit-vvi-heading"></div>
                                </div>
                                <div class="unit-id">${this.#options.name}</div>
                            </div>
                        </div>
                        <div class="unit-hotgroup">
                            <div class="unit-hotgroup-id"></div>
                        </div>
                        <div class="unit-fuel">
                            <div class="unit-fuel-level"></div>
                        </div>
                        <div class="unit-ammo">
                            <div data-ammo-type="fox-1"></div>
                            <div data-ammo-type="fox-2"></div>
                            <div data-ammo-type="fox-3"></div>
                            <div data-ammo-type="other"></div>
                        </div>
                        <div class="unit-summary">
                            <div class="unit-callsign">${this.#options.unitName}</div>
                            <div class="unit-heading"></div>
                            <div class="unit-altitude"></div>
                        </div>
                    </div>`,
            className: 'ol-unit-marker',
            iconAnchor: [30, 30]
        });
        this.setIcon(icon);
    }

    onAdd(map: L.Map): this {
        super.onAdd(map);
        this.addEventListener('mouseover', function (e: any) { e.target?.setHovered(true); });
        this.addEventListener('mouseout', function (e: any) { e.target?.setHovered(false); });
        return this
    }

    draw(data: MarkerData) {
        this.#data;

        var element = this.getElement();
        if (element != null)
        {
            element.querySelector(".unit-vvi-heading")?.setAttribute("style",`transform: rotate(${rad2deg(data.heading)}deg); width: ${15 + data.speed / 5}px`);
            element.querySelector(".unit")?.setAttribute("data-fuel-level", "20");
            element.querySelector(".unit")?.setAttribute("data-has-fox-1", "true");

            var unitHeadingDiv = element.querySelector(".unit-heading");
            if (unitHeadingDiv != null)
                unitHeadingDiv.innerHTML = String(Math.floor(rad2deg(data.heading)));

            var unitAltitudeDiv = element.querySelector(".unit-altitude");
            if (unitAltitudeDiv != null)
                unitAltitudeDiv.innerHTML = String(Math.floor(data.altitude / 0.3048 / 1000));
        }
        var pos = getMap().latLngToLayerPoint(this.getLatLng()).round();
        this.setZIndexOffset(Math.floor(data.altitude) - pos.y);        
    }

    setSelected(selected: boolean) {
        this.#selected = selected;
        this.getElement()?.querySelector(".unit")?.setAttribute("data-is-selected", String(this.getSelected()));
    }

    getSelected() {
        return this.#selected;
    }

    setHovered(hovered: boolean) {
        this.getElement()?.querySelector("#icon")?.classList.toggle("ol-unit-marker-hovered", hovered && this.#data.alive);
    }

    getData() {
        return this.#data;
    }

    getOptions() {
        return this.#options;
    }
}

export class AirUnitMarker extends UnitMarker {

}

export class AircraftMarker extends AirUnitMarker {

}

export class HelicopterMarker extends AirUnitMarker {
    
}

export class GroundUnitMarker extends UnitMarker {
    
}

export class NavyUnitMarker extends UnitMarker {
    
}

export class WeaponMarker extends UnitMarker {
    
}

export class BombMarker extends WeaponMarker {

}

export class MissileMarker extends WeaponMarker {

}