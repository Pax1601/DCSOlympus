import { Marker, LatLng, Polyline, Icon } from 'leaflet';
import { getMap, getUnitsManager } from '..';
import { UnitMarker, MarkerOptions, AircraftMarker, HelicopterMarker, GroundUnitMarker, NavyUnitMarker, WeaponMarker, MissileMarker, BombMarker } from './unitmarker';
import { addDestination, attackUnit, changeAltitude, changeSpeed, createFormation as setLeader, deleteUnit, landAt, setAltitude, setReactionToThreat, setROE, setSpeed } from '../server/server';
import { aircraftDatabase } from './aircraftdatabase';

var pathIcon = new Icon({
    iconUrl: 'images/marker-icon.png',
    shadowUrl: 'images/marker-shadow.png',
    iconAnchor: [13, 41]
});

export class Unit {
    ID: number;

    #data: UnitData;
    #marker: UnitMarker;

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

    constructor(ID: number, marker: UnitMarker, data: UnitData) {
        this.ID = ID;

        this.#selectable = true;
        this.#data = data;

        /* The marker is set by the inherited class */
        this.#marker = marker;
        this.#marker.on('click', (e) => this.#onClick(e));
        this.#marker.on('dblclick', (e) => this.#onDoubleClick(e));
        this.#marker.on('contextmenu', (e) => this.#onContextMenu(e));

        this.#pathPolyline = new Polyline([], { color: '#2d3e50', weight: 3, opacity: 0.5, smoothFactor: 1 });
        this.#pathPolyline.addTo(getMap());
        this.#targetsPolylines = [];
    }

    update(response: UnitData) {
        var updateMarker = false;
        if (this.#data.flightData.latitude != response.flightData.latitude || this.#data.flightData.longitude != response.flightData.longitude || this.#data.alive != response.alive || this.#forceUpdate)
            updateMarker = true;

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
            this.#marker.setSelected(selected);
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
        if (!getMap().hasLayer(this.#marker) && !this.getHidden()) {
            this.#marker.addTo(getMap());
        }

        /* Hide the marker if necessary*/
        if (getMap().hasLayer(this.#marker) && this.getHidden()) {
            getMap().removeLayer(this.#marker);
        }
        else {
            this.#marker.setLatLng(new LatLng(this.#data.flightData.latitude, this.#data.flightData.longitude));
            this.#marker.draw({
                heading: this.#data.flightData.heading,
                speed: this.#data.flightData.speed,
                altitude: this.#data.flightData.altitude,
                alive: this.#data.alive
            });
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
        var marker = new AircraftMarker({
            AI: data.AI,
            unitName: data.unitName, 
            name: aircraftDatabase.getShortLabelByName(data.name), 
            human: data.missionData.flags.human, 
            coalition: data.missionData.coalition});
        super(ID, marker, data);
    }
}

export class Helicopter extends AirUnit {
    constructor(ID: number, data: UnitData) {
        var marker = new HelicopterMarker({
            AI: data.AI,
            unitName: data.unitName, 
            name: "H", 
            human: data.missionData.flags.human, 
            coalition: data.missionData.coalition});
        super(ID, marker, data);
    }
}

export class GroundUnit extends Unit {
    constructor(ID: number, data: UnitData) {
        var marker = new GroundUnitMarker({
            AI: data.AI,
            unitName: data.unitName, 
            name: "G", 
            human: data.missionData.flags.human, 
            coalition: data.missionData.coalition});
        super(ID, marker, data);
    }

    getHidden() {
        return false;
    }
}

export class NavyUnit extends Unit {
    constructor(ID: number, data: UnitData) {
        var marker = new NavyUnitMarker({
            AI: data.AI,
            unitName: data.unitName, 
            name: "N", 
            human: data.missionData.flags.human, 
            coalition: data.missionData.coalition});
        super(ID, marker, data);
    }

    getHidden() {
        return false;
    }
}

export class Weapon extends Unit {
    constructor(ID: number, marker: UnitMarker, data: UnitData) {
        super(ID, marker, data);
        this.setSelectable(false);
    }
}

export class Missile extends Weapon {
    constructor(ID: number, data: UnitData) {
        var marker = new MissileMarker({
            AI: data.AI,
            unitName: data.unitName, 
            name: "M", 
            human: data.missionData.flags.human, 
            coalition: data.missionData.coalition});
        super(ID, marker, data);
    }
}

export class Bomb extends Weapon {
    constructor(ID: number, data: UnitData) {
        var marker = new BombMarker({
            AI: data.AI,
            unitName: data.unitName, 
            name: "B", 
            human: data.missionData.flags.human, 
            coalition: data.missionData.coalition});
        super(ID, marker, data);
    }
}
