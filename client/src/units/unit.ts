import { Marker, LatLng, Polyline, Icon, DivIcon } from 'leaflet';
import { getMap, getUnitsManager } from '..';
import { rad2deg } from '../other/utils';
import { addDestination, attackUnit, changeAltitude, changeSpeed, createFormation as setLeader, deleteUnit, landAt, setAltitude, setReactionToThreat, setROE, setSpeed } from '../server/server';
import { aircraftDatabase } from './aircraftdatabase';

var pathIcon = new Icon({
    iconUrl: 'images/marker-icon.png',
    shadowUrl: 'images/marker-shadow.png',
    iconAnchor: [13, 41]
});

export class Unit extends Marker {
    ID: number;

    #data: UnitData;

    #selectable: boolean;
    #selected: boolean = false;

    #preventClick: boolean = false;

    #pathMarkers: Marker[] = [];
    #pathPolyline: Polyline;
    #targetsPolylines: Polyline[];

    #timer: number = 0;
    #forceUpdate: boolean = false;

    static getConstructor(type: string) {
        if (type === "GroundUnit") return GroundUnit;
        if (type === "Aircraft") return Aircraft;
        if (type === "Helicopter") return Helicopter;
        if (type === "Missile") return Missile;
        if (type === "Bomb") return Bomb;
        if (type === "NavyUnit") return NavyUnit;
    }

    constructor(ID: number, data: UnitData) {
        super(new LatLng(0, 0), { riseOnHover: true });

        this.ID = ID;

        this.#selectable = true;
        this.#data = data;

        this.on('click', (e) => this.#onClick(e));
        this.on('dblclick', (e) => this.#onDoubleClick(e));
        this.on('contextmenu', (e) => this.#onContextMenu(e));

        var icon = new DivIcon({
            html: `<div class="unit"
                        data-coalition=${this.getMissionData().coalition}
                        data-pilot=${this.getMissionData().flags.human? "human": "ai"}>
                        <div class="unit-spotlight">
                            <div class="unit-selected-border">
                                <div class="unit-vvi">
                                    <div class="unit-vvi-heading"></div>
                                </div>
                                <div class="unit-id">${aircraftDatabase.getShortLabelByName(this.getData().name)}</div>
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
                            <div class="unit-callsign">${this.getData().unitName}</div>
                            <div class="unit-heading"></div>
                            <div class="unit-altitude"></div>
                        </div>
                    </div>`,
            className: 'ol-unit-marker',
            iconAnchor: [30, 30]
        });
        this.setIcon(icon);

        this.#pathPolyline = new Polyline([], { color: '#2d3e50', weight: 3, opacity: 0.5, smoothFactor: 1 });
        this.#pathPolyline.addTo(getMap());
        this.#targetsPolylines = [];
    }

    update(response: UnitData) {
        var updateMarker = true;
        //if (this.#data.flightData.latitude != response.flightData.latitude || 
        //    this.#data.flightData.longitude != response.flightData.longitude || 
        //    this.#data.alive != response.alive || 
        //    this.#forceUpdate || 
        //    !getMap().hasLayer(this.#marker))
        //    updateMarker = true;

        this.#data = response;

        /* Dead units can't be selected */
        this.setSelected(this.getSelected() && this.#data.alive)

        if (updateMarker)
            this.#updateMarker();

        this.#clearTargets();
        if (this.getSelected()) {
            this.#drawPath();
            this.#drawTargets();
        }
        else
            this.#clearPath();
    }

    setSelected(selected: boolean) {
        /* Only alive units can be selected. Some units are not selectable (weapons) */
        if ((this.#data.alive || !selected) && this.#selectable && this.#selected != selected) {
            this.#selected = selected;
            this.getElement()?.querySelector(".unit")?.setAttribute("data-is-selected", String(this.getSelected()));
            document.dispatchEvent(new CustomEvent("unitSelection", { detail: this }));
        }
    }

    getSelected() {
        return this.#selected;
    }

    setSelectable(selectable: boolean) {
        this.#selectable = selectable;
    }

    getSelectable() {
        return this.#selectable;
    }

    addDestination(latlng: L.LatLng) {
        var path: any = {};
        if (this.#data.taskData.activePath != null) {
            path = this.#data.taskData.activePath;
            path[(Object.keys(path).length + 1).toString()] = latlng;
        }
        else {
            path = { "1": latlng };
        }
        addDestination(this.ID, path);
    }

    clearDestinations() {
        this.#data.taskData.activePath = null;
    }

    getHidden() {
        return false;
    }

    getLeader() {
        return getUnitsManager().getUnitByID(this.#data.formationData.leaderID);
    }

    getFormation() {
        return [<Unit>this].concat(this.getWingmen())
    }

    getWingmen() {
        var wingmen: Unit[] = [];
        if (this.#data.formationData.wingmenIDs != null) {
            for (let ID of this.#data.formationData.wingmenIDs) {
                var unit = getUnitsManager().getUnitByID(ID)
                if (unit)
                    wingmen.push(unit);
            }
        }
        return wingmen;
    }

    forceUpdate() {
        this.#forceUpdate = true;
    }

    getData() {
        return this.#data;
    }

    getFlightData() {
        return this.#data.flightData;
    }

    getTaskData() {
        return this.#data.taskData;
    }

    getMissionData() {
        return this.#data.missionData;
    }

    getFormationData() {
        return this.#data.formationData;
    }

    getOptionsData() {
        return this.#data.optionsData;
    }
    
    attackUnit(targetID: number) {
        /* Call DCS attackUnit function */
        if (this.ID != targetID) {
            attackUnit(this.ID, targetID);
        }
        else {
            // TODO: show a message
        }
    }

    landAt(latlng: LatLng) {
        landAt(this.ID, latlng);
    }

    changeSpeed(speedChange: string) {
        changeSpeed(this.ID, speedChange);
    }

    changeAltitude(altitudeChange: string) {
        changeAltitude(this.ID, altitudeChange);
    }

    setSpeed(speed: number) {
        setSpeed(this.ID, speed);
    }

    setAltitude(altitude: number) {
        setAltitude(this.ID, altitude);
    }

    setROE(ROE: string) {
        setROE(this.ID, ROE);
    }

    setReactionToThreat(reactionToThreat: string) {
        setReactionToThreat(this.ID, reactionToThreat);
    }

    delete() {
        deleteUnit(this.ID);
    }

    /*
    setformation(formation)
    {
    }
    */

    setLeader(isLeader: boolean, wingmenIDs: number[] = []) {
        setLeader(this.ID, isLeader, wingmenIDs);
    }

    #onClick(e: any) {
        this.#timer = setTimeout(() => {
            if (!this.#preventClick) {
                if (getMap().getState() === 'IDLE' || getMap().getState() === 'MOVE_UNIT' || e.originalEvent.ctrlKey) {
                    if (!e.originalEvent.ctrlKey) {
                        getUnitsManager().deselectAllUnits();
                    }
                    this.setSelected(true);
                }
            }
            this.#preventClick = false;
        }, 200);
    }

    #onDoubleClick(e: any) {
        clearTimeout(this.#timer);
        this.#preventClick = true;
    }

    #onContextMenu(e: any) {
        var options = [
            'Attack',
            'Follow'
        ]

        getMap().showContextMenu(e.originalEvent, "Action: " + this.#data.unitName, options, (action: string) => this.#executeAction(action));
    }

    #executeAction(action: string) {
        getMap().hideContextMenu();
        if (action === "Attack")
            getUnitsManager().selectedUnitsAttackUnit(this.ID);
    }

    #updateMarker() {
        /* Add the marker if not present */
        if (!getMap().hasLayer(this) && !this.getHidden()) {
            this.addTo(getMap());
        }

        /* Hide the marker if necessary*/
        if (getMap().hasLayer(this) && this.getHidden()) {
            getMap().removeLayer(this);
        }
        else {
            this.setLatLng(new LatLng(this.#data.flightData.latitude, this.#data.flightData.longitude));
            var element = this.getElement();
            if (element != null)
            {
                element.querySelector(".unit-vvi-heading")?.setAttribute("style",`transform: rotate(${rad2deg(this.getFlightData().heading)}deg); width: ${15 + this.getFlightData().speed / 5}px`);
                element.querySelector(".unit")?.setAttribute("data-fuel-level", "20");
                element.querySelector(".unit")?.setAttribute("data-has-fox-1", "true");
    
                var unitHeadingDiv = element.querySelector(".unit-heading");
                if (unitHeadingDiv != null)
                    unitHeadingDiv.innerHTML = String(Math.floor(rad2deg(this.getFlightData().heading)));
    
                var unitAltitudeDiv = element.querySelector(".unit-altitude");
                if (unitAltitudeDiv != null)
                    unitAltitudeDiv.innerHTML = String(Math.floor(this.getFlightData().altitude / 0.3048 / 1000));
            }
            var pos = getMap().latLngToLayerPoint(this.getLatLng()).round();
            this.setZIndexOffset(Math.floor(this.getFlightData().altitude) - pos.y);        
        }

        this.#forceUpdate = false;
    }

    #drawPath() {
        if (this.#data.taskData.activePath != null) {
            var points = [];
            points.push(new LatLng(this.#data.flightData.latitude, this.#data.flightData.longitude));

            /* Add markers if missing */
            while (this.#pathMarkers.length < Object.keys(this.#data.taskData.activePath).length) {
                var marker = new Marker([0, 0], { icon: pathIcon }).addTo(getMap());
                this.#pathMarkers.push(marker);
            }

            /* Remove markers if too many */
            while (this.#pathMarkers.length > Object.keys(this.#data.taskData.activePath).length) {
                getMap().removeLayer(this.#pathMarkers[this.#pathMarkers.length - 1]);
                this.#pathMarkers.splice(this.#pathMarkers.length - 1, 1)
            }

            /* Update the position of the existing markers (to avoid creating markers uselessly) */
            for (let WP in this.#data.taskData.activePath) {
                var destination = this.#data.taskData.activePath[WP];
                this.#pathMarkers[parseInt(WP) - 1].setLatLng([destination.lat, destination.lng]);
                points.push(new LatLng(destination.lat, destination.lng));
                this.#pathPolyline.setLatLngs(points);
            }
        }
    }

    #clearPath() {
        for (let WP in this.#pathMarkers) {
            getMap().removeLayer(this.#pathMarkers[WP]);
        }
        this.#pathMarkers = [];
        this.#pathPolyline.setLatLngs([]);
    }

    #drawTargets() {
        for (let typeIndex in this.getMissionData().targets) {
            for (let index in this.getMissionData().targets[typeIndex]) {
                var targetData = this.getMissionData().targets[typeIndex][index];
                var target = getUnitsManager().getUnitByID(targetData.object["id_"])
                if (target != null) {
                    var startLatLng = new LatLng(this.#data.flightData.latitude, this.#data.flightData.longitude)
                    var endLatLng = new LatLng(target.getFlightData().latitude, target.getFlightData().longitude)

                    var color;
                    if (typeIndex === "radar")
                        color = "#FFFF00";
                    else if (typeIndex === "visual")
                        color = "#FF00FF";
                    else if (typeIndex === "rwr")
                        color = "#00FF00";
                    else
                        color = "#FFFFFF";
                    var targetPolyline = new Polyline([startLatLng, endLatLng], { color: color, weight: 3, opacity: 1, smoothFactor: 1 });
                    targetPolyline.addTo(getMap());
                    this.#targetsPolylines.push(targetPolyline)
                }
            }
        }
    }

    #clearTargets() {
        for (let index in this.#targetsPolylines) {
            getMap().removeLayer(this.#targetsPolylines[index])
        }
    }
}

export class AirUnit extends Unit {
    getHidden() {
       return false;
    }
}

export class Aircraft extends AirUnit {
    constructor(ID: number, data: UnitData) {
        super(ID, data);
    }
}

export class Helicopter extends AirUnit {
    constructor(ID: number, data: UnitData) {
        super(ID, data);
    }
}

export class GroundUnit extends Unit {
    constructor(ID: number, data: UnitData) {
        super(ID, data);
    }

    getHidden() {
        return false;
    }
}

export class NavyUnit extends Unit {
    constructor(ID: number, data: UnitData) {
        super(ID, data);
    }

    getHidden() {
        return false;
    }
}

export class Weapon extends Unit {
    constructor(ID: number, data: UnitData) {
        super(ID, data);
        this.setSelectable(false);
    }
}

export class Missile extends Weapon {
    constructor(ID: number, data: UnitData) {
        super(ID, data);
    }
}

export class Bomb extends Weapon {
    constructor(ID: number, data: UnitData) {
        super(ID, data);
    }
}
