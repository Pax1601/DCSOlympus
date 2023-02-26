import * as L from 'leaflet'
import { getMap } from '..'
import { rad2deg } from '../other/utils'
import { getAircrafImage, getAircraftLabelByName } from './aircraftdatabase'
import { AirUnit, GroundUnit, NavyUnit, Weapon } from './unit'

export interface MarkerOptions {
    unitName: string
    name: string
    human: boolean
    coalitionID: number
    type: any
    AI: boolean
}

export interface MarkerData {
    heading: number
    speed: number
    altitude: number
    alive: boolean
}

export class UnitMarker extends L.Marker {
    #unitName: string
    #name: string
    #human: boolean
    #AI: boolean
    #alive: boolean = true
    #selected: boolean = false

    constructor(options: MarkerOptions) {
        super(new L.LatLng(0, 0), { riseOnHover: true });
        this.#unitName = options.unitName;
        this.#name = getAircraftLabelByName(options.name);
        this.#human = options.human;
        this.#AI = options.AI;

        var coalition = "";
        if (options.coalitionID == 1)
            coalition = "red"
        else if (options.coalitionID == 2)
            coalition = "blue"
        else
            coalition = "neutral"

        var icon = new L.DivIcon({
            html: `<div class="unit"
                        data-coalition=${coalition}
                        data-pilot=${this.#human? "human": "ai"}>
                        <div class="unit-spotlight">
                            <div class="unit-selected-border">
                                <div class="unit-vvi">
                                    <div class="unit-vvi-heading"></div>
                                </div>
                                <div class="unit-id">${this.#name}</div>
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
                            <div class="unit-callsign">${this.#unitName}</div>
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
        this.#alive = data.alive;

        var element = this.getElement();

        if (element != null)
        {
            element.querySelector(".unit")?.setAttribute("data-is-selected", String(this.getSelected()));
            element.querySelector(".unit-vvi-heading")?.setAttribute("style",`transform: rotate(${rad2deg(data.heading)}deg); width: ${data.speed / 5}px`);

            var unitHeadingDiv = element.querySelector(".unit-heading");
            if (unitHeadingDiv != null)
                unitHeadingDiv.innerHTML = String(Math.floor(rad2deg(data.heading)));

            var unitAltitudeDiv = element.querySelector(".unit-altitude");
            if (unitAltitudeDiv != null)
                unitAltitudeDiv.innerHTML = String(Math.floor(data.altitude / 1000));
        }
        var pos = getMap().latLngToLayerPoint(this.getLatLng()).round();
        this.setZIndexOffset(Math.floor(data.altitude) - pos.y);        
    }

    setSelected(selected: boolean) {
        this.#selected = selected;
        this.getElement()?.querySelector("#icon")?.classList.remove("ol-unit-marker-hovered");
        this.getElement()?.querySelector("#ring")?.classList.toggle("ol-unit-marker-selected", selected);
        this.getElement()?.querySelector("#background")?.classList.toggle("ol-unit-marker-selected", selected);
    }

    getSelected() {
        return this.#selected;
    }

    setHovered(hovered: boolean) {
        this.getElement()?.querySelector("#icon")?.classList.toggle("ol-unit-marker-hovered", hovered && this.#alive);
    }

    getName() {
        return this.#name;
    }

    getHuman() {
        return this.#human;
    }

    getAI() {
        return this.#AI;
    }

    getAlive() {
        return this.#alive;
    }

    getVisibility() {
        return "full";
    }

    getUnitImage() {
        return new Image().src = "images/units/unit.png" 
    }
}

export class AirUnitMarker extends UnitMarker {
    getVisibility() {
        if (this.getAlive())
        {
            if (this.getSelected())
                return "full";
            else if (this.getHuman())
                return AirUnit.getVisibility().human;
            else if (this.getAI())
                return AirUnit.getVisibility().ai;
            else 
                return AirUnit.getVisibility().uncontrolled;
        }
        else 
            return "minimal";
    }
}

export class AircraftMarker extends AirUnitMarker {
    getUnitImage()
    {
        return new Image().src = "images/units/" + getAircrafImage(this.getName());
    }
}

export class HelicopterMarker extends AirUnitMarker {
    getUnitImage()
    {
        return new Image().src = "images/units/airUnit.png"
    }
}

export class GroundUnitMarker extends UnitMarker {
    /* Are user driven units recognized as human? */
    getVisibility() {
        if (this.getAlive())
        {
            if (this.getSelected())
                return "full";
            else if (this.getHuman())
                return GroundUnit.getVisibility().human;
            else if (this.getAI())
                return GroundUnit.getVisibility().ai;
            else 
                return GroundUnit.getVisibility().uncontrolled;
        }
        else 
            return "minimal";
    }

    getUnitImage()
    {
        return new Image().src = "images/units/groundUnit.png"
    }
}

export class NavyUnitMarker extends UnitMarker {
    getVisibility() {
        if (this.getAlive())
        {
            if (this.getSelected())
                return "full";
            else if (this.getHuman())
                return NavyUnit.getVisibility().human;
            else if (this.getAI())
                return NavyUnit.getVisibility().ai;
            else 
                return NavyUnit.getVisibility().uncontrolled;
        }
        else 
            return "minimal";
    }

    getUnitImage()
    {
        return new Image().src = "images/units/navyUnit.png"
    }
}

export class WeaponMarker extends UnitMarker {
    getVisibility() {
        if (this.getAlive())
        {
            if (this.getSelected())
                return "full";
            else if (this.getHuman())
                return Weapon.getVisibility().human;
            else if (this.getAI())
                return Weapon.getVisibility().ai;
            else 
                return Weapon.getVisibility().uncontrolled;
        }
        else 
            return "minimal";
    }
}

export class BombMarker extends WeaponMarker {
    getUnitImage()
    {
        return new Image().src = "images/units/bomb.png"
    }
}

export class MissileMarker extends WeaponMarker {
    getUnitImage()
    {
        return new Image().src = "images/units/missile.png"
    }
}