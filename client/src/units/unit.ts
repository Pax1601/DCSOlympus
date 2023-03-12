import { Marker, LatLng, Polyline, Icon, DivIcon } from 'leaflet';
import { getMap, getUnitsManager } from '..';
import { rad2deg } from '../other/utils';
import { addDestination, attackUnit, changeAltitude, changeSpeed, createFormation as setLeader, deleteUnit, landAt, setAltitude, setReactionToThreat, setROE, setSpeed } from '../server/server';
import { aircraftDatabase } from './aircraftdatabase';
import { groundUnitsDatabase } from './groundunitsdatabase';

var pathIcon = new Icon({
    iconUrl: 'images/marker-icon.png',
    shadowUrl: 'images/marker-shadow.png',
    iconAnchor: [13, 41]
});

export class Unit extends Marker {
    ID: number;

    #data: UnitData = {
        baseData: {
            AI: false,
            name: "",
            unitName: "",
            groupName: "",
            alive: true,
            category: "",
        },
        flightData: {
            latitude: 0,
            longitude: 0,
            altitude: 0,
            heading: 0,
            speed: 0,
        },
        missionData: {
            fuel: 0,
            flags: {},
            ammo: {},
            targets: {},
            hasTask: false,
            coalition: "",
        },
        formationData: {
            formation: "",
            isLeader: false,
            isWingman: false,
            leaderID: 0,
            wingmenIDs: [],
        },
        taskData: {
            currentTask: "",
            activePath: {},
            targetSpeed: 0,
            targetAltitude: 0,
        },
        optionsData: {
            ROE: "",
            reactionToThreat: "",
        }
    };

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

    constructor(ID: number, data: UpdateData, html: string) {
        super(new LatLng(0, 0), { riseOnHover: true });

        this.ID = ID;

        this.#selectable = true;
        
        this.on('click', (e) => this.#onClick(e));
        this.on('dblclick', (e) => this.#onDoubleClick(e));
        this.on('contextmenu', (e) => this.#onContextMenu(e));

        var icon = new DivIcon({
            html: html,
            className: 'ol-unit-marker',
            iconAnchor: [0, 0]
        });
        this.setIcon(icon);

        this.#pathPolyline = new Polyline([], { color: '#2d3e50', weight: 3, opacity: 0.5, smoothFactor: 1 });
        this.#pathPolyline.addTo(getMap());
        this.#targetsPolylines = [];

        this.setData(data);
    }

    setData(data: UpdateData) {
        document.dispatchEvent(new CustomEvent("unitUpdated", { detail: this }));
        var updateMarker = false;
        if (this.getFlightData().latitude != data.flightData.latitude || 
            this.getFlightData().longitude != data.flightData.longitude || 
            this.getBaseData().alive != data.baseData.alive || this.#forceUpdate || !getMap().hasLayer(this))
            updateMarker = true;
            

        if (data.baseData != undefined)
        {
            for (let key in this.#data.baseData)
                if (key in data.baseData)
                    //@ts-ignore
                    this.#data.baseData[key] = data.baseData[key];
        }

        if (data.flightData != undefined)
        {
            for (let key in this.#data.flightData)
                if (key in data.flightData)
                    //@ts-ignore
                    this.#data.flightData[key] = data.flightData[key];
        }

        if (data.missionData != undefined)
        {
            for (let key in this.#data.missionData)
                if (key in data.missionData)
                    //@ts-ignore
                    this.#data.missionData[key] = data.missionData[key];
        }

        if (data.formationData != undefined)
        {
            for (let key in this.#data.formationData)
                if (key in data.formationData)
                    //@ts-ignore
                    this.#data.formationData[key] = data.formationData[key];
        }

        if (data.taskData != undefined)
        {
            for (let key in this.#data.taskData)
                if (key in data.taskData)
                    //@ts-ignore
                    this.#data.taskData[key] = data.taskData[key];
        }

        if (data.optionsData != undefined)
        {
            for (let key in this.#data.optionsData)
                if (key in data.optionsData)
                    //@ts-ignore
                    this.#data.optionsData[key] = data.optionsData[key];
        }

        /* Dead units can't be selected */
        this.setSelected(this.getSelected() && this.getBaseData().alive)

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

    getData() {
        return this.#data;
    }

    getBaseData() {
        return this.getData().baseData;
    }

    getFlightData() {
        return this.getData().flightData;
    }

    getTaskData() {
        return this.getData().taskData;
    }

    getMissionData() {
        return this.getData().missionData;
    }

    getFormationData() {
        return this.getData().formationData;
    }

    getOptionsData() {
        return this.getData().optionsData;
    }

    setSelected(selected: boolean) {
        /* Only alive units can be selected. Some units are not selectable (weapons) */
        if ((this.getBaseData().alive || !selected) && this.#selectable && this.#selected != selected) {
            this.#selected = selected;
            this.getElement()?.querySelector(".unit")?.setAttribute("data-is-selected", String(this.getSelected()));
            if (selected)
                document.dispatchEvent(new CustomEvent("unitSelection", { detail: this }));
            else
                document.dispatchEvent(new CustomEvent("unitDeselection", { detail: this }));
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
        if (this.getTaskData().activePath != undefined) {
            path = this.getTaskData().activePath;
            path[(Object.keys(path).length + 1).toString()] = latlng;
        }
        else {
            path = { "1": latlng };
        }
        addDestination(this.ID, path);
    }

    clearDestinations() {
        this.getTaskData().activePath = undefined;
    }

    getHidden() {
        return false;
    }

    getLeader() {
        return getUnitsManager().getUnitByID(this.getFormationData().leaderID);
    }

    getFormation() {
        return [<Unit>this].concat(this.getWingmen())
    }

    getWingmen() {
        var wingmen: Unit[] = [];
        if (this.getFormationData().wingmenIDs != undefined) {
            for (let ID of this.getFormationData().wingmenIDs) {
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

    setLeader(isLeader: boolean, wingmenIDs: number[] = []) {
        setLeader(this.ID, isLeader, wingmenIDs);
    }

    delete() {
        deleteUnit(this.ID);
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
        //getMap().showContextMenu(e.originalEvent, "Action: " + this.getData().unitName, options.map((option: string) => {return {tooltip: option, src: "", callback: (action: string) => this.#executeAction(action)}}));
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
            this.setLatLng(new LatLng(this.getFlightData().latitude, this.getFlightData().longitude));
            var element = this.getElement();
            if (element != null) {
                element.querySelector(".unit-vvi")?.setAttribute("style", `height: ${15 + this.getFlightData().speed / 5}px; transform:rotate(${rad2deg(this.getFlightData().heading)}deg);`);

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
        if (this.getTaskData().activePath != undefined) {
            var points = [];
            points.push(new LatLng(this.getFlightData().latitude, this.getFlightData().longitude));

            /* Add markers if missing */
            while (this.#pathMarkers.length < Object.keys(this.getTaskData().activePath).length) {
                var marker = new Marker([0, 0], { icon: pathIcon }).addTo(getMap());
                this.#pathMarkers.push(marker);
            }

            /* Remove markers if too many */
            while (this.#pathMarkers.length > Object.keys(this.getTaskData().activePath).length) {
                getMap().removeLayer(this.#pathMarkers[this.#pathMarkers.length - 1]);
                this.#pathMarkers.splice(this.#pathMarkers.length - 1, 1)
            }

            /* Update the position of the existing markers (to avoid creating markers uselessly) */
            for (let WP in this.getTaskData().activePath) {
                var destination = this.getTaskData().activePath[WP];
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
                    var startLatLng = new LatLng(this.getFlightData().latitude, this.getFlightData().longitude)
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
        super(ID, data,
           `<div class="unit unit-air" data-status="" data-coalition="${data.missionData.coalition}" data-is-in-hotgroup="false" data-is-selected="false">
                <div class="unit-selected-spotlight"></div>
                <div class="unit-marker-border"></div>
                <div class="unit-status"></div>
                <div class="unit-vvi"></div>
                <div class="unit-hotgroup">
                    <div class="unit-hotgroup-id"></div>
                </div>
                <div class="unit-marker"></div>
                <div class="unit-short-label">${aircraftDatabase.getShortLabelByName(data.baseData.name)}</div>
                <div class="unit-fuel">
                    <div class="unit-fuel-level" style="width:100%;"></div>
                </div>
                <div class="unit-ammo">
                    <div class="unit-ammo-fox-1"></div>
                    <div class="unit-ammo-fox-2"></div>
                    <div class="unit-ammo-fox-3"></div>
                    <div class="unit-ammo-other"></div>
                </div>
                <div class="unit-summary">
                    <div class="unit-callsign">${data.baseData.unitName}</div>
                    <div class="unit-heading"></div>
                    <div class="unit-altitude"></div>
                </div>
            </div>`);
    }
}

export class Helicopter extends AirUnit {
    constructor(ID: number, data: UnitData) {
        super(ID, data, 
            ``);
    }
}

export class GroundUnit extends Unit {
    constructor(ID: number, data: UnitData) {
        var role = groundUnitsDatabase.getByName(data.baseData.name)?.loadouts[0].roles[0];
        var roleType = "ground";
        if (role === "SAM")
            roleType = "sam"
        super(ID, data, `
            <div class="unit unit-${roleType}" data-coalition="${data.missionData.coalition}">
                <div class="unit-selected-spotlight"></div>
                <div class="unit-marker"></div>
                <div class="unit-short-label">${role?.substring(0, 1).toUpperCase()}</div>
            </div>
        `);
    }

    getHidden() {
        return false;
    }
}

export class NavyUnit extends Unit {
    constructor(ID: number, data: UnitData) {
        super(ID, data, "");
    }

    getHidden() {
        return false;
    }
}

export class Weapon extends Unit {
    constructor(ID: number, data: UnitData) {
        super(ID, data, "");
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
