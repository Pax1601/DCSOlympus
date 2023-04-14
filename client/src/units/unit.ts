import { Marker, LatLng, Polyline, Icon, DivIcon } from 'leaflet';
import { getMap, getUnitsManager } from '..';
import { rad2deg } from '../other/utils';
import { addDestination, attackUnit, changeAltitude, changeSpeed, createFormation as setLeader, deleteUnit, getUnits, landAt, setAltitude, setReactionToThreat, setROE, setSpeed, refuel, setAdvacedOptions, followUnit } from '../server/server';
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
            currentState: "IDLE",
            currentTask: "",
            activePath: {},
            targetSpeed: 0,
            targetAltitude: 0,
            isTanker: false,
            isAWACS: false,
            TACANOn: false,
            TACANChannel: 0,
            TACANXY: "X",
            TACANCallsign: "",
            radioFrequency: 0,
            radioCallsign: 0,
            radioCallsignNumber: 0,
            radioAMFM: "AM"
        },
        optionsData: {
            ROE: "",
            reactionToThreat: "",
        }
    };

    #selectable: boolean;
    #selected: boolean = false;
    #hidden: boolean = false;

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

    constructor(ID: number, data: UpdateData) {
        super(new LatLng(0, 0), { riseOnHover: true });

        this.ID = ID;

        this.#selectable = true;
        
        this.on('click', (e) => this.#onClick(e));
        this.on('dblclick', (e) => this.#onDoubleClick(e));
        this.on('contextmenu', (e) => this.#onContextMenu(e));
        
        this.#pathPolyline = new Polyline([], { color: '#2d3e50', weight: 3, opacity: 0.5, smoothFactor: 1 });
        this.#pathPolyline.addTo(getMap());
        this.#targetsPolylines = [];

        /* Deselect units if they are hidden */
        document.addEventListener("toggleCoalitionVisibility", (ev: CustomEventInit) => {
            setTimeout(() => {this.setSelected(this.getSelected() && !this.getHidden())}, 300);
        });
    
        document.addEventListener("toggleUnitVisibility", (ev: CustomEventInit) => {
            setTimeout(() => {this.setSelected(this.getSelected() && !this.getHidden())}, 300);
        });

        /* Set the unit data */
        this.setData(data);

        /* Set the icon */
        var icon = new DivIcon({
            html: this.getMarkerHTML(),
            className: 'leaflet-unit-marker',
            iconAnchor: [0, 0]
        });
        this.setIcon(icon);

    }

    getMarkerHTML() {
        return  `<div class="unit" data-object="unit-${this.getMarkerCategory()}" data-coalition="${this.getMissionData().coalition}">
                    <div class="unit-selected-spotlight"></div>
                    <div class="unit-marker"></div>
                    <div class="unit-short-label"></div>
                </div>`
    }

    getMarkerCategory()
    {
        // Overloaded by child classes
        return "";
    }

    setData(data: UpdateData) {
        document.dispatchEvent(new CustomEvent("unitUpdated", { detail: this }));
        var updateMarker = false;
    
        if ((data.flightData.latitude != undefined && data.flightData.longitude != undefined && (this.getFlightData().latitude != data.flightData.latitude || this.getFlightData().longitude != data.flightData.longitude)) 
            || (data.flightData.heading != undefined && this.getFlightData().heading != data.flightData.heading)
            || (data.baseData.alive != undefined && this.getBaseData().alive != data.baseData.alive)
            || this.#forceUpdate || !getMap().hasLayer(this))
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
        this.setSelected(this.getSelected() && this.getBaseData().alive && !this.getHidden())

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
        if ((this.getBaseData().alive || !selected) && this.getSelectable() && this.getSelected() != selected) {
            this.#selected = selected;
            this.getElement()?.querySelector(`[data-object|="unit"]`)?.toggleAttribute("data-is-selected");
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

    updateVisibility()
    {
        this.setHidden( document.body.getAttribute(`data-hide-${this.getMissionData().coalition}`) != null || 
                        document.body.getAttribute(`data-hide-${this.getMarkerCategory()}`) != null ||
                        !this.getBaseData().alive)
    }

    setHidden(hidden: boolean)
    {
        this.#hidden = hidden; 

        /* Add the marker if not present */
        if (!getMap().hasLayer(this) && !this.getHidden()) {
            this.addTo(getMap());
        }

        /* Hide the marker if necessary*/
        if (getMap().hasLayer(this) && this.getHidden()) {
            getMap().removeLayer(this);
        }        
    }

    getHidden() {
        return this.#hidden;
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

    attackUnit(targetID: number) {
        /* Call DCS attackUnit function */
        if (this.ID != targetID) {
            attackUnit(this.ID, targetID);
        }
        else {
            // TODO: show a message
        }
    }

    followUnit(targetID: number) {
        /* Call DCS attackUnit function */
        if (this.ID != targetID) {
            followUnit(this.ID, targetID);
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

    refuel() {
        refuel(this.ID);
    }

    setAdvancedOptions(isTanker: boolean, isAWACS: boolean, TACANChannel: number, TACANXY: string, TACANcallsign: string, radioFrequency: number, radioCallsign: number, radioCallsignNumber: number) {
        setAdvacedOptions(this.ID, isTanker, isAWACS, TACANChannel, TACANXY, TACANcallsign, radioFrequency, radioCallsign, radioCallsignNumber);
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
        var options: {[key: string]: string} = {};
        if (getUnitsManager().getSelectedUnits().length > 0 && !(getUnitsManager().getSelectedUnits().includes(this)))
        {
            options = {
                'Attack': `<div id="attack">Attack</div>`,
                'Follow': `<div id="follow">Follow</div>`
            }
        }
        else if ((getUnitsManager().getSelectedUnits().length > 0 && (getUnitsManager().getSelectedUnits().includes(this))) || getUnitsManager().getSelectedUnits().length == 0)
        {
            if (this.getBaseData().category == "Aircraft")
            {
                options["Refuel"] = `<div id="refuel">Refuel</div>`; // TODO Add some way of knowing which aircraft can AAR
            }
        }

        if (Object.keys(options).length > 0)
        {
            getMap().showUnitContextMenu(e);
            getMap().getUnitContextMenu().setOptions(options, (option: string) => {
                getMap().hideUnitContextMenu();
                this.#executeAction(option);
            });
        }
    }

    #executeAction(action: string) {
        if (action === "Attack")
            getUnitsManager().selectedUnitsAttackUnit(this.ID);
        if (action === "Refuel")
            getUnitsManager().selectedUnitsRefuel();
        if (action === "Follow")
            getUnitsManager().selectedUnitsFollowUnit(this.ID);
    }

    #updateMarker() {
        this.updateVisibility();

        if (!this.getHidden()) {

            this.setLatLng(new LatLng(this.getFlightData().latitude, this.getFlightData().longitude));
            var element = this.getElement();
            if (element != null) {
                element.querySelector(".unit-vvi")?.setAttribute("style", `height: ${15 + this.getFlightData().speed / 5}px;`);
                element.querySelector(".unit")?.setAttribute("data-pilot", this.getMissionData().flags.human? "human": "ai");

                element.querySelector(".unit-fuel-level")?.setAttribute("style", `width: ${this.getMissionData().fuel}%`);
                element.querySelector(".unit")?.toggleAttribute("data-has-low-fuel", this.getMissionData().fuel < 20);

                element.querySelector(".unit")?.toggleAttribute("data-is-dead", !this.getBaseData().alive);

                var unitHeadingDiv = element.querySelector(".unit-heading");
                if (unitHeadingDiv != null)
                    unitHeadingDiv.innerHTML = String(Math.floor(rad2deg(this.getFlightData().heading)));

                var unitAltitudeDiv = element.querySelector(".unit-altitude");
                if (unitAltitudeDiv != null) {
                    unitAltitudeDiv.innerHTML = String(Math.floor(this.getFlightData().altitude / 0.3048 / 1000));

                }
                
                element.querySelectorAll( "[data-rotate-to-heading]" ).forEach( el => {
                    const headingDeg = rad2deg( this.getFlightData().heading );
                    let currentStyle = el.getAttribute( "style" ) || "";
                    el.setAttribute( "style", currentStyle + `transform:rotate(${headingDeg}deg);` );
                });

                var unitSpeedDiv = element.querySelector(".unit-speed");
                if (unitSpeedDiv != null)
                    unitSpeedDiv.innerHTML = String(Math.floor(this.getFlightData().speed * 1.94384 ) );

            }
            var pos = getMap().latLngToLayerPoint(this.getLatLng()).round();
            this.setZIndexOffset(1000 + Math.floor(this.getFlightData().altitude) - pos.y);
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

}

export class Aircraft extends AirUnit {
    constructor(ID: number, data: UnitData) {
        super(ID, data);
    }

    getMarkerHTML()
    {
        return `<div class="unit" data-object="unit-aircraft" data-status="" data-coalition="${this.getMissionData().coalition}">
                    <div class="unit-selected-spotlight"></div>
                    <div class="unit-marker-border"></div>
                    <div class="unit-status"></div>
                    <div class="unit-vvi" data-rotate-to-heading></div>
                    <div class="unit-hotgroup">
                        <div class="unit-hotgroup-id"></div>
                    </div>
                    <div class="unit-marker"></div>
                    <div class="unit-short-label">${aircraftDatabase.getByName(this.getBaseData().name)?.shortLabel || ""}</div>
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
                        <div class="unit-callsign">${this.getBaseData().unitName}</div>
                        <div class="unit-altitude"></div>
                        <div class="unit-speed"></div>
                    </div>
                </div>`
    }

    getMarkerCategory()
    {
        return "aircraft";
    }
}

export class Helicopter extends AirUnit {
    constructor(ID: number, data: UnitData) {
        super(ID, data);
    }

    getVisibilityCategory()
    {
        return "helicopter";
    }
}

export class GroundUnit extends Unit {
    constructor(ID: number, data: UnitData) {
        super(ID, data);
    }

    getMarkerHTML() {
        var role = groundUnitsDatabase.getByName(this.getBaseData().name)?.loadouts[0].roles[0];
        return  `<div class="unit" data-object="unit-${this.getMarkerCategory()}" data-coalition="${this.getMissionData().coalition}">
                    <div class="unit-selected-spotlight"></div>
                    <div class="unit-marker"></div>
                    <div class="unit-short-label">${role?.substring(0, 1)?.toUpperCase() || ""}</div>
                </div>`
    }

    getMarkerCategory()
    {
        // TODO this is very messy
        var role = groundUnitsDatabase.getByName(this.getBaseData().name)?.loadouts[0].roles[0];
        var markerCategory = (role === "SAM") ? "sam" : "groundunit";
        return markerCategory;
    }
}

export class NavyUnit extends Unit {
    constructor(ID: number, data: UnitData) {
        super(ID, data);
    }
    
    getMarkerCategory() {
        return "navyunit";
    }
}

export class Weapon extends Unit {
    constructor(ID: number, data: UnitData) {
        super(ID, data);
        this.setSelectable(false);
    }

    getMarkerHTML(): string {
        return `<div class="unit" data-object="unit-${this.getMarkerCategory()}" data-coalition="${this.getMissionData().coalition}">
                    <div class="unit-selected-spotlight"></div>
                    <div class="unit-marker" data-rotate-to-heading></div>
                    <div class="unit-short-label"></div>
                </div>`
    }

}

export class Missile extends Weapon {
    constructor(ID: number, data: UnitData) {
        super(ID, data);
    }

    getMarkerCategory() {
        return "missile";
    }
}

export class Bomb extends Weapon {
    constructor(ID: number, data: UnitData) {
        super(ID, data);
    }

    getMarkerCategory() {
        return "bomb";
    }
}
