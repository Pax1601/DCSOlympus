import { Marker, LatLng, Polyline, Icon, DivIcon, CircleMarker, Map, Point, Circle } from 'leaflet';
import { getApp } from '..';
import { enumToCoalition, enumToEmissioNCountermeasure, getMarkerCategoryByName, enumToROE, enumToReactionToThreat, enumToState, getUnitDatabaseByCategory, mToFt, msToKnots, rad2deg, bearing, deg2rad, ftToM, getGroundElevation, coalitionToEnum, nmToFt, nmToM } from '../other/utils';
import { CustomMarker } from '../map/markers/custommarker';
import { SVGInjector } from '@tanem/svg-injector';
import { UnitDatabase } from './databases/unitdatabase';
import { TargetMarker } from '../map/markers/targetmarker';
import { DLINK, DataIndexes, GAME_MASTER, HIDE_GROUP_MEMBERS, IDLE, IRST, MOVE_UNIT, OPTIC, RADAR, ROEs, RWR, SHOW_UNIT_CONTACTS, SHOW_UNITS_ENGAGEMENT_RINGS, SHOW_UNIT_PATHS, SHOW_UNIT_TARGETS, VISUAL, emissionsCountermeasures, reactionsToThreat, states, SHOW_UNITS_ACQUISITION_RINGS, HIDE_UNITS_SHORT_RANGE_RINGS, FILL_SELECTED_RING } from '../constants/constants';
import { DataExtractor } from '../server/dataextractor';
import { groundUnitDatabase } from './databases/groundunitdatabase';
import { navyUnitDatabase } from './databases/navyunitdatabase';
import { Weapon } from '../weapon/weapon';
import { Ammo, Contact, GeneralSettings, LoadoutBlueprint, ObjectIconOptions, Offset, Radio, TACAN, UnitData } from '../interfaces';

var pathIcon = new Icon({
    iconUrl: '/resources/theme/images/markers/marker-icon.png',
    shadowUrl: '/resources/theme/images/markers/marker-shadow.png',
    iconAnchor: [13, 41]
});

export class Unit extends CustomMarker {
    ID: number;

    #alive: boolean = false;
    #human: boolean = false;
    #controlled: boolean = false;
    #coalition: string = "neutral";
    #country: number = 0;
    #name: string = "";
    #unitName: string = "";
    #groupName: string = "";
    #state: string = states[0];
    #task: string = ""
    #hasTask: boolean = false;
    #position: LatLng = new LatLng(0, 0, 0);
    #speed: number = 0;
    #horizontalVelocity: number = 0;
    #verticalVelocity: number = 0;
    #heading: number = 0;
    #isActiveTanker: boolean = false;
    #isActiveAWACS: boolean = false;
    #onOff: boolean = true;
    #followRoads: boolean = false;
    #fuel: number = 0;
    #desiredSpeed: number = 0;
    #desiredSpeedType: string = "CAS";
    #desiredAltitude: number = 0;
    #desiredAltitudeType: string = "ASL";
    #leaderID: number = 0;
    #formationOffset: Offset = {
        x: 0,
        y: 0,
        z: 0
    };
    #targetID: number = 0;
    #targetPosition: LatLng = new LatLng(0, 0);
    #ROE: string = ROEs[1];
    #reactionToThreat: string = reactionsToThreat[2];
    #emissionsCountermeasures: string = emissionsCountermeasures[2];
    #TACAN: TACAN = {
        isOn: false,
        XY: 'X',
        callsign: 'TKR',
        channel: 0
    };
    #radio: Radio = {
        frequency: 124000000,
        callsign: 1,
        callsignNumber: 1
    };
    #generalSettings: GeneralSettings = {
        prohibitAA: false,
        prohibitAfterburner: false,
        prohibitAG: false,
        prohibitAirWpn: false,
        prohibitJettison: false
    };
    #ammo: Ammo[] = [];
    #contacts: Contact[] = [];
    #activePath: LatLng[] = [];
    #isLeader: boolean = false;
    #operateAs: string = "blue";
    #shotsScatter: number = 2;
    #shotsIntensity: number = 2;

    #selectable: boolean;
    #selected: boolean = false;
    #hidden: boolean = false;
    #highlighted: boolean = false;
    #waitingForDoubleClick: boolean = false;
    #pathMarkers: Marker[] = [];
    #pathPolyline: Polyline;
    #contactsPolylines: Polyline[] = [];
    #engagementCircle: Circle;
    #acquisitionCircle: Circle;
    #miniMapMarker: CircleMarker | null = null;
    #targetPositionMarker: TargetMarker;
    #targetPositionPolyline: Polyline;
    #doubleClickTimer: number = 0;
    #hotgroup: number | null = null;
    #detectionMethods: number[] = [];

    getAlive() { return this.#alive };
    getHuman() { return this.#human };
    getControlled() { return this.#controlled };
    getCoalition() { return this.#coalition };
    getCountry() { return this.#country };
    getName() { return this.#name };
    getUnitName() { return this.#unitName };
    getGroupName() { return this.#groupName };
    getState() { return this.#state };
    getTask() { return this.#task };
    getHasTask() { return this.#hasTask };
    getPosition() { return this.#position };
    getSpeed() { return this.#speed };
    getHorizontalVelocity() { return this.#horizontalVelocity };
    getVerticalVelocity() { return this.#verticalVelocity };
    getHeading() { return this.#heading };
    getIsActiveTanker() { return this.#isActiveTanker };
    getIsActiveAWACS() { return this.#isActiveAWACS };
    getOnOff() { return this.#onOff };
    getFollowRoads() { return this.#followRoads };
    getFuel() { return this.#fuel };
    getDesiredSpeed() { return this.#desiredSpeed };
    getDesiredSpeedType() { return this.#desiredSpeedType };
    getDesiredAltitude() { return this.#desiredAltitude };
    getDesiredAltitudeType() { return this.#desiredAltitudeType };
    getLeaderID() { return this.#leaderID };
    getFormationOffset() { return this.#formationOffset };
    getTargetID() { return this.#targetID };
    getTargetPosition() { return this.#targetPosition };
    getROE() { return this.#ROE };
    getReactionToThreat() { return this.#reactionToThreat };
    getEmissionsCountermeasures() { return this.#emissionsCountermeasures };
    getTACAN() { return this.#TACAN };
    getRadio() { return this.#radio };
    getGeneralSettings() { return this.#generalSettings };
    getAmmo() { return this.#ammo };
    getContacts() { return this.#contacts };
    getActivePath() { return this.#activePath };
    getIsLeader() { return this.#isLeader };
    getOperateAs() { return this.#operateAs };
    getShotsScatter() { return this.#shotsScatter};
    getShotsIntensity() { return this.#shotsIntensity};

    static getConstructor(type: string) {
        if (type === "GroundUnit") return GroundUnit;
        if (type === "Aircraft") return Aircraft;
        if (type === "Helicopter") return Helicopter;
        if (type === "NavyUnit") return NavyUnit;
    }

    constructor(ID: number) {
        super(new LatLng(0, 0), { riseOnHover: true, keyboard: false });

        this.ID = ID;
        this.#selectable = true;

        this.#pathPolyline = new Polyline([], { color: '#2d3e50', weight: 3, opacity: 0.5, smoothFactor: 1 });
        this.#pathPolyline.addTo(getApp().getMap());
        this.#targetPositionMarker = new TargetMarker(new LatLng(0, 0));
        this.#targetPositionPolyline = new Polyline([], { color: '#FF0000', weight: 3, opacity: 0.5, smoothFactor: 1 });
        this.#engagementCircle = new Circle(this.getPosition(), { radius: 0, weight: 4, opacity: 1, fillOpacity: 0, dashArray: "4 8", interactive: false, bubblingMouseEvents: false });
        this.#acquisitionCircle = new Circle(this.getPosition(), { radius: 0, weight: 2, opacity: 1, fillOpacity: 0, dashArray: "8 12", interactive: false, bubblingMouseEvents: false });

        this.on('click', (e) => this.#onClick(e));
        this.on('dblclick', (e) => this.#onDoubleClick(e));
        this.on('contextmenu', (e) => this.#onContextMenu(e));
        this.on('mouseover', () => {
            if (this.belongsToCommandedCoalition()) {
                this.setHighlighted(true);
                document.dispatchEvent(new CustomEvent("unitMouseover", { detail: this }));
            }
        });
        this.on('mouseout', () => {
            this.setHighlighted(false);
            document.dispatchEvent(new CustomEvent("unitMouseout", { detail: this }));
        });
        getApp().getMap().on("zoomend", () => { this.#onZoom(); })

        /* Deselect units if they are hidden */
        document.addEventListener("toggleCoalitionVisibility", (ev: CustomEventInit) => {
            window.setTimeout(() => { this.setSelected(this.getSelected() && !this.getHidden()) }, 300);
        });

        document.addEventListener("toggleUnitVisibility", (ev: CustomEventInit) => {
            window.setTimeout(() => { this.setSelected(this.getSelected() && !this.getHidden()) }, 300);
        });

        document.addEventListener("mapVisibilityOptionsChanged", (ev: CustomEventInit) => {
            this.#updateMarker();

            /* Circles don't like to be updated when the map is zooming */
            if (!getApp().getMap().isZooming()) 
                this.#drawRanges();
            else 
                this.once("zoomend", () => { this.#drawRanges(); })

            if (this.getSelected())
                this.drawLines();
        });
    }

    getCategory() {
        // Overloaded by child classes
        return "";
    }

    /********************** Unit data *************************/
    setData(dataExtractor: DataExtractor) {
        var updateMarker = !getApp().getMap().hasLayer(this);

        var datumIndex = 0;
        while (datumIndex != DataIndexes.endOfData) {
            datumIndex = dataExtractor.extractUInt8();
            switch (datumIndex) {
                case DataIndexes.category: dataExtractor.extractString(); break;
                case DataIndexes.alive: this.setAlive(dataExtractor.extractBool()); updateMarker = true; break;
                case DataIndexes.human: this.#human = dataExtractor.extractBool(); break;
                case DataIndexes.controlled: this.#controlled = dataExtractor.extractBool(); updateMarker = true; break;
                case DataIndexes.coalition: this.#coalition = enumToCoalition(dataExtractor.extractUInt8()); updateMarker = true; this.#clearRanges(); break;
                case DataIndexes.country: this.#country = dataExtractor.extractUInt8(); break;
                case DataIndexes.name: this.#name = dataExtractor.extractString(); break;
                case DataIndexes.unitName: this.#unitName = dataExtractor.extractString(); break;
                case DataIndexes.groupName: this.#groupName = dataExtractor.extractString(); updateMarker = true; break;
                case DataIndexes.state: this.#state = enumToState(dataExtractor.extractUInt8()); updateMarker = true; break;
                case DataIndexes.task: this.#task = dataExtractor.extractString(); break;
                case DataIndexes.hasTask: this.#hasTask = dataExtractor.extractBool(); break;
                case DataIndexes.position: this.#position = dataExtractor.extractLatLng(); updateMarker = true; break;
                case DataIndexes.speed: this.#speed = dataExtractor.extractFloat64(); updateMarker = true; break;
                case DataIndexes.horizontalVelocity: this.#horizontalVelocity = dataExtractor.extractFloat64(); break;
                case DataIndexes.verticalVelocity: this.#verticalVelocity = dataExtractor.extractFloat64(); break;
                case DataIndexes.heading: this.#heading = dataExtractor.extractFloat64(); updateMarker = true; break;
                case DataIndexes.isActiveTanker: this.#isActiveTanker = dataExtractor.extractBool(); break;
                case DataIndexes.isActiveAWACS: this.#isActiveAWACS = dataExtractor.extractBool(); break;
                case DataIndexes.onOff: this.#onOff = dataExtractor.extractBool(); break;
                case DataIndexes.followRoads: this.#followRoads = dataExtractor.extractBool(); break;
                case DataIndexes.fuel: this.#fuel = dataExtractor.extractUInt16(); break;
                case DataIndexes.desiredSpeed: this.#desiredSpeed = dataExtractor.extractFloat64(); break;
                case DataIndexes.desiredSpeedType: this.#desiredSpeedType = dataExtractor.extractBool() ? "GS" : "CAS"; break;
                case DataIndexes.desiredAltitude: this.#desiredAltitude = dataExtractor.extractFloat64(); break;
                case DataIndexes.desiredAltitudeType: this.#desiredAltitudeType = dataExtractor.extractBool() ? "AGL" : "ASL"; break;
                case DataIndexes.leaderID: this.#leaderID = dataExtractor.extractUInt32(); break;
                case DataIndexes.formationOffset: this.#formationOffset = dataExtractor.extractOffset(); break;
                case DataIndexes.targetID: this.#targetID = dataExtractor.extractUInt32(); break;
                case DataIndexes.targetPosition: this.#targetPosition = dataExtractor.extractLatLng(); break;
                case DataIndexes.ROE: this.#ROE = enumToROE(dataExtractor.extractUInt8()); break;
                case DataIndexes.reactionToThreat: this.#reactionToThreat = enumToReactionToThreat(dataExtractor.extractUInt8()); break;
                case DataIndexes.emissionsCountermeasures: this.#emissionsCountermeasures = enumToEmissioNCountermeasure(dataExtractor.extractUInt8()); break;
                case DataIndexes.TACAN: this.#TACAN = dataExtractor.extractTACAN(); break;
                case DataIndexes.radio: this.#radio = dataExtractor.extractRadio(); break;
                case DataIndexes.generalSettings: this.#generalSettings = dataExtractor.extractGeneralSettings(); break;
                case DataIndexes.ammo: this.#ammo = dataExtractor.extractAmmo(); break;
                case DataIndexes.contacts: this.#contacts = dataExtractor.extractContacts(); document.dispatchEvent(new CustomEvent("contactsUpdated", { detail: this })); break;
                case DataIndexes.activePath: this.#activePath = dataExtractor.extractActivePath(); break;
                case DataIndexes.isLeader: this.#isLeader = dataExtractor.extractBool(); updateMarker = true; break;
                case DataIndexes.operateAs: this.#operateAs = enumToCoalition(dataExtractor.extractUInt8()); break;
                case DataIndexes.shotsScatter: this.#shotsScatter = dataExtractor.extractUInt8(); break;
                case DataIndexes.shotsIntensity: this.#shotsIntensity = dataExtractor.extractUInt8(); break;
            }
        }

        /* Dead units can't be selected */
        this.setSelected(this.getSelected() && this.#alive && !this.getHidden())

        if (updateMarker)
            this.#updateMarker();

        if (this.getSelected() || getApp().getMap().getCenterUnit() === this)
            document.dispatchEvent(new CustomEvent("unitUpdated", { detail: this }));
    }

    drawLines() {
        /* Leaflet does not like it when you change coordinates when the map is zooming */
        if (!getApp().getMap().isZooming()) {
            this.#drawPath();
            this.#drawContacts();
            this.#drawTarget();
        }
    }

    getData(): UnitData {
        return {
            category: this.getCategory(),
            ID: this.ID,
            alive: this.#alive,
            human: this.#human,
            controlled: this.#controlled,
            coalition: this.#coalition,
            country: this.#country,
            name: this.#name,
            unitName: this.#unitName,
            groupName: this.#groupName,
            state: this.#state,
            task: this.#task,
            hasTask: this.#hasTask,
            position: this.#position,
            speed: this.#speed,
            horizontalVelocity: this.#horizontalVelocity,
            verticalVelocity: this.#verticalVelocity,
            heading: this.#heading,
            isActiveTanker: this.#isActiveTanker,
            isActiveAWACS: this.#isActiveAWACS,
            onOff: this.#onOff,
            followRoads: this.#followRoads,
            fuel: this.#fuel,
            desiredSpeed: this.#desiredSpeed,
            desiredSpeedType: this.#desiredSpeedType,
            desiredAltitude: this.#desiredAltitude,
            desiredAltitudeType: this.#desiredAltitudeType,
            leaderID: this.#leaderID,
            formationOffset: this.#formationOffset,
            targetID: this.#targetID,
            targetPosition: this.#targetPosition,
            ROE: this.#ROE,
            reactionToThreat: this.#reactionToThreat,
            emissionsCountermeasures: this.#emissionsCountermeasures,
            TACAN: this.#TACAN,
            radio: this.#radio,
            generalSettings: this.#generalSettings,
            ammo: this.#ammo,
            contacts: this.#contacts,
            activePath: this.#activePath,
            isLeader: this.#isLeader,
            operateAs: this.#operateAs,
            shotsScatter: this.#shotsScatter,
            shotsIntensity: this.#shotsIntensity
        }
    }

    getMarkerCategory(): string {
        return getMarkerCategoryByName(this.getName());
    }

    getDatabase(): UnitDatabase | null {
        return getUnitDatabaseByCategory(this.getMarkerCategory());
    }

    getIconOptions(): ObjectIconOptions {
        // Default values, overloaded by child classes if needed
        return {
            showState: false,
            showVvi: false,
            showHotgroup: false,
            showUnitIcon: true,
            showShortLabel: false,
            showFuel: false,
            showAmmo: false,
            showSummary: true,
            showCallsign: true,
            rotateToHeading: false
        }
    }

    setAlive(newAlive: boolean) {
        if (newAlive != this.#alive)
            document.dispatchEvent(new CustomEvent("unitDeath", { detail: this }));
        this.#alive = newAlive;
    }

    setSelected(selected: boolean) {
        /* Only alive units can be selected. Some units are not selectable (weapons) */
        if ((this.#alive || !selected) && this.getSelectable() && this.getSelected() != selected && this.belongsToCommandedCoalition()) {
            this.#selected = selected;

            /* Circles don't like to be updated when the map is zooming */
            if (!getApp().getMap().isZooming()) 
                this.#drawRanges();
            else 
                this.once("zoomend", () => { this.#drawRanges(); })

            if (selected) {
                this.#updateMarker();
            }
            else {
                this.#clearContacts();
                this.#clearPath();
                this.#clearTarget();
            }

            this.getElement()?.querySelector(`.unit`)?.toggleAttribute("data-is-selected", selected);
            if (this.getCategory() === "GroundUnit" && getApp().getMap().getZoom() < 13) {
                if (this.#isLeader)
                    this.getGroupMembers().forEach((unit: Unit) => unit.setSelected(selected));
                else
                    this.#updateMarker();
            }

            //  Trigger events after all (de-)selecting has been done
            if (selected) {
                document.dispatchEvent(new CustomEvent("unitSelection", { detail: this }));
            } else {
                document.dispatchEvent(new CustomEvent("unitDeselection", { detail: this }));
            }

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

    setHotgroup(hotgroup: number | null) {
        this.#hotgroup = hotgroup;
        this.#updateMarker();
    }

    getHotgroup() {
        return this.#hotgroup;
    }

    setHighlighted(highlighted: boolean) {
        if (this.getSelectable() && this.#highlighted != highlighted) {
            this.getElement()?.querySelector(`[data-object|="unit"]`)?.toggleAttribute("data-is-highlighted", highlighted);
            this.#highlighted = highlighted;
            this.getGroupMembers().forEach((unit: Unit) => unit.setHighlighted(highlighted));
        }
    }

    getHighlighted() {
        return this.#highlighted;
    }

    getGroupMembers() {
        return Object.values(getApp().getUnitsManager().getUnits()).filter((unit: Unit) => { return unit != this && unit.getGroupName() === this.getGroupName(); });
    }

    belongsToCommandedCoalition() {
        if (getApp().getMissionManager().getCommandModeOptions().commandMode !== GAME_MASTER && getApp().getMissionManager().getCommandedCoalition() !== this.#coalition)
            return false;
        return true;
    }

    getType() {
        return "";
    }

    getSpawnPoints() {
        return this.getDatabase()?.getSpawnPointsByName(this.getName());
    }

    /********************** Icon *************************/
    createIcon(): void {
        /* Set the icon */
        var icon = new DivIcon({
            className: 'leaflet-unit-icon',
            iconAnchor: [25, 25],
            iconSize: [50, 50],
        });
        this.setIcon(icon);

        var el = document.createElement("div");
        el.classList.add("unit");
        el.setAttribute("data-object", `unit-${this.getMarkerCategory()}`);
        el.setAttribute("data-coalition", this.#coalition);

        var iconOptions = this.getIconOptions();

        // Generate and append elements depending on active options          
        // Velocity vector
        if (iconOptions.showVvi) {
            var vvi = document.createElement("div");
            vvi.classList.add("unit-vvi");
            vvi.toggleAttribute("data-rotate-to-heading");
            el.append(vvi);
        }

        // Hotgroup indicator
        if (iconOptions.showHotgroup) {
            var hotgroup = document.createElement("div");
            hotgroup.classList.add("unit-hotgroup");
            var hotgroupId = document.createElement("div");
            hotgroupId.classList.add("unit-hotgroup-id");
            hotgroup.appendChild(hotgroupId);
            el.append(hotgroup);
        }

        // Main icon
        if (iconOptions.showUnitIcon) {
            var unitIcon = document.createElement("div");
            unitIcon.classList.add("unit-icon");
            var img = document.createElement("img");
            var imgSrc;

            /* If a unit does not belong to the commanded coalition or it is not visually detected, show it with the generic aircraft square */
            if (this.belongsToCommandedCoalition() || this.getDetectionMethods().some(value => [VISUAL, OPTIC].includes(value)))
                imgSrc = this.getMarkerCategory();
            else
                imgSrc = "aircraft";

            img.src = `/resources/theme/images/units/${imgSrc}.svg`;
            img.onload = () => SVGInjector(img);
            unitIcon.appendChild(img);
            unitIcon.toggleAttribute("data-rotate-to-heading", iconOptions.rotateToHeading);
            el.append(unitIcon);
        }

        // State icon
        if (iconOptions.showState) {
            var state = document.createElement("div");
            state.classList.add("unit-state");
            el.appendChild(state);
        }

        // Short label
        if (iconOptions.showShortLabel) {
            var shortLabel = document.createElement("div");
            shortLabel.classList.add("unit-short-label");
            shortLabel.innerText = getUnitDatabaseByCategory(this.getMarkerCategory())?.getByName(this.#name)?.shortLabel || "";
            el.append(shortLabel);
        }

        // Fuel indicator
        if (iconOptions.showFuel) {
            var fuelIndicator = document.createElement("div");
            fuelIndicator.classList.add("unit-fuel");
            var fuelLevel = document.createElement("div");
            fuelLevel.classList.add("unit-fuel-level");
            fuelIndicator.appendChild(fuelLevel);
            el.append(fuelIndicator);
        }

        // Ammo indicator
        if (iconOptions.showAmmo) {
            var ammoIndicator = document.createElement("div");
            ammoIndicator.classList.add("unit-ammo");
            for (let i = 0; i <= 3; i++)
                ammoIndicator.appendChild(document.createElement("div"));
            el.append(ammoIndicator);
        }

        // Unit summary
        if (iconOptions.showSummary) {
            var summary = document.createElement("div");
            summary.classList.add("unit-summary");
            var callsign = document.createElement("div");
            callsign.classList.add("unit-callsign");
            callsign.innerText = this.#unitName;
            var altitude = document.createElement("div");
            altitude.classList.add("unit-altitude");
            var speed = document.createElement("div");
            speed.classList.add("unit-speed");
            if (iconOptions.showCallsign) summary.appendChild(callsign);
            summary.appendChild(altitude);
            summary.appendChild(speed);
            el.appendChild(summary);
        }

        this.getElement()?.appendChild(el);

        /* Circles don't like to be updated when the map is zooming */
        if (!getApp().getMap().isZooming()) 
            this.#drawRanges();
        else 
            this.once("zoomend", () => { this.#drawRanges(); })
    }

    /********************** Visibility *************************/
    updateVisibility() {
        const hiddenUnits = getApp().getMap().getHiddenTypes();
        var hidden = ((this.#human && hiddenUnits.includes("human")) ||
            (this.#controlled == false && hiddenUnits.includes("dcs")) ||
            (hiddenUnits.includes(this.getMarkerCategory())) ||
            (hiddenUnits.includes(this.#coalition)) ||
            (!this.belongsToCommandedCoalition() && (this.#detectionMethods.length == 0 || (this.#detectionMethods.length == 1 && this.#detectionMethods[0] === RWR))) ||
            (getApp().getMap().getVisibilityOptions()[HIDE_GROUP_MEMBERS] && !this.#isLeader && this.getCategory() == "GroundUnit" && getApp().getMap().getZoom() < 13 && (this.belongsToCommandedCoalition() || (!this.belongsToCommandedCoalition() && this.#detectionMethods.length == 0)))) &&
            !(this.getSelected());

        this.setHidden(hidden || !this.#alive);
    }

    setHidden(hidden: boolean) {
        this.#hidden = hidden;

        /* Add the marker if not present */
        if (!getApp().getMap().hasLayer(this) && !this.getHidden()) {
            if (getApp().getMap().isZooming())
                this.once("zoomend", () => { this.addTo(getApp().getMap()) })
            else
                this.addTo(getApp().getMap());
        }

        /* Hide the marker if necessary*/
        if (getApp().getMap().hasLayer(this) && this.getHidden()) {
            getApp().getMap().removeLayer(this);
        }

        if (!this.getHidden()) {
            /* Circles don't like to be updated when the map is zooming */
            if (!getApp().getMap().isZooming()) 
                this.#drawRanges();
            else 
                this.once("zoomend", () => { this.#drawRanges(); })
        } else {
            this.#clearRanges();
        }
    }

    getHidden() {
        return this.#hidden;
    }

    setDetectionMethods(newDetectionMethods: number[]) {
        if (!this.belongsToCommandedCoalition()) {
            /* Check if the detection methods of this unit have changed */
            if (this.#detectionMethods.length !== newDetectionMethods.length || this.getDetectionMethods().some(value => !newDetectionMethods.includes(value))) {
                /* Force a redraw of the unit to reflect the new status of the detection methods */
                this.setHidden(true);
                this.#detectionMethods = newDetectionMethods;
                this.#updateMarker();
            }
        }
    }

    getDetectionMethods() {
        return this.#detectionMethods;
    }

    getLeader() {
        return getApp().getUnitsManager().getUnitByID(this.#leaderID);
    }

    canFulfillRole(roles: string | string[]) {
        if (typeof (roles) === "string")
            roles = [roles];

        var loadouts = this.getDatabase()?.getByName(this.#name)?.loadouts;
        if (loadouts) {
            return loadouts.some((loadout: LoadoutBlueprint) => {
                return (roles as string[]).some((role: string) => { return loadout.roles.includes(role) });
            });
        } else
            return false;
    }

    isInViewport() {
        return getApp().getMap().getBounds().contains(this.getPosition());
    }

    canTargetPoint() {
        return this.getDatabase()?.getByName(this.#name)?.canTargetPoint === true;
    }

    canRearm() {
        return this.getDatabase()?.getByName(this.#name)?.canRearm === true;
    }

    canLandAtPoint() {
        return this.getCategory() === "Helicopter";
    }

    canAAA() {
        return this.getDatabase()?.getByName(this.#name)?.canAAA === true;
    }

    indirectFire() {
        return this.getDatabase()?.getByName(this.#name)?.indirectFire === true;
    }

    isTanker() {
        return this.canFulfillRole("Tanker");
    }

    isAWACS() {
        return this.canFulfillRole("AWACS");
    }

    /********************** Unit commands *************************/
    addDestination(latlng: L.LatLng) {
        if (!this.#human) {
            var path: any = {};
            if (this.#activePath.length > 0) {
                path = this.#activePath;
                path[(Object.keys(path).length).toString()] = latlng;
            }
            else {
                path = [latlng];
            }
            getApp().getServerManager().addDestination(this.ID, path);
        }
    }

    clearDestinations() {
        if (!this.#human)
            this.#activePath = [];
    }

    attackUnit(targetID: number) {
        /* Units can't attack themselves */
        if (!this.#human)
            if (this.ID != targetID)
                getApp().getServerManager().attackUnit(this.ID, targetID);
    }

    followUnit(targetID: number, offset: { "x": number, "y": number, "z": number }) {
        /* Units can't follow themselves */
        if (!this.#human)
            if (this.ID != targetID)
                getApp().getServerManager().followUnit(this.ID, targetID, offset);
    }

    landAt(latlng: LatLng) {
        if (!this.#human)
            getApp().getServerManager().landAt(this.ID, latlng);
    }

    changeSpeed(speedChange: string) {
        if (!this.#human)
            getApp().getServerManager().changeSpeed(this.ID, speedChange);
    }

    changeAltitude(altitudeChange: string) {
        if (!this.#human)
            getApp().getServerManager().changeAltitude(this.ID, altitudeChange);
    }

    setSpeed(speed: number) {
        if (!this.#human)
            getApp().getServerManager().setSpeed(this.ID, speed);
    }

    setSpeedType(speedType: string) {
        if (!this.#human)
            getApp().getServerManager().setSpeedType(this.ID, speedType);
    }

    setAltitude(altitude: number) {
        if (!this.#human)
            getApp().getServerManager().setAltitude(this.ID, altitude);
    }

    setAltitudeType(altitudeType: string) {
        if (!this.#human)
            getApp().getServerManager().setAltitudeType(this.ID, altitudeType);
    }

    setROE(ROE: string) {
        if (!this.#human)
            getApp().getServerManager().setROE(this.ID, ROE);
    }

    setReactionToThreat(reactionToThreat: string) {
        if (!this.#human)
            getApp().getServerManager().setReactionToThreat(this.ID, reactionToThreat);
    }

    setEmissionsCountermeasures(emissionCountermeasure: string) {
        if (!this.#human)
            getApp().getServerManager().setEmissionsCountermeasures(this.ID, emissionCountermeasure);
    }

    setOnOff(onOff: boolean) {
        if (!this.#human)
            getApp().getServerManager().setOnOff(this.ID, onOff);
    }

    setFollowRoads(followRoads: boolean) {
        if (!this.#human)
            getApp().getServerManager().setFollowRoads(this.ID, followRoads);
    }

    setOperateAs(operateAs: string) {
        if (!this.#human)
            getApp().getServerManager().setOperateAs(this.ID, coalitionToEnum(operateAs));
    }

    delete(explosion: boolean, immediate: boolean) {
        getApp().getServerManager().deleteUnit(this.ID, explosion, immediate);
    }

    refuel() {
        if (!this.#human)
            getApp().getServerManager().refuel(this.ID);
    }

    setAdvancedOptions(isActiveTanker: boolean, isActiveAWACS: boolean, TACAN: TACAN, radio: Radio, generalSettings: GeneralSettings) {
        if (!this.#human)
            getApp().getServerManager().setAdvacedOptions(this.ID, isActiveTanker, isActiveAWACS, TACAN, radio, generalSettings);
    }

    bombPoint(latlng: LatLng) {
        getApp().getServerManager().bombPoint(this.ID, latlng);
    }

    carpetBomb(latlng: LatLng) {
        getApp().getServerManager().carpetBomb(this.ID, latlng);
    }

    bombBuilding(latlng: LatLng) {
        getApp().getServerManager().bombBuilding(this.ID, latlng);
    }

    fireAtArea(latlng: LatLng) {
        getApp().getServerManager().fireAtArea(this.ID, latlng);
    }

    simulateFireFight(latlng: LatLng, targetGroundElevation: number | null) {
        getGroundElevation(this.getPosition(), (response: string) => {
            var unitGroundElevation: number | null = null;
            try {
                unitGroundElevation = parseFloat(response);
            } catch {
                console.log("Simulate fire fight: could not retrieve ground elevation")
            }

            /* DCS and SRTM altitude data is not exactly the same so to minimize error we use SRTM only to compute relative elevation difference */
            var altitude = this.getPosition().alt;
            if (altitude !== undefined && targetGroundElevation !== null && unitGroundElevation !== null)
                getApp().getServerManager().simulateFireFight(this.ID, latlng, altitude + targetGroundElevation - unitGroundElevation);
        });
    }

    scenicAAA() {
        var coalition = "neutral";
        if (this.getCoalition() === "red")
            coalition = "blue";
        else if (this.getCoalition() == "blue")
            coalition = "red";
        getApp().getServerManager().scenicAAA(this.ID, coalition);
    }

    missOnPurpose() {
        var coalition = "neutral";
        if (this.getCoalition() === "red")
            coalition = "blue";
        else if (this.getCoalition() == "blue")
            coalition = "red";
        getApp().getServerManager().missOnPurpose(this.ID, coalition);
    }

    landAtPoint(latlng: LatLng) {
        getApp().getServerManager().landAtPoint(this.ID, latlng);
    }

    setShotsScatter(shotsScatter: number) {
        if (!this.#human)
            getApp().getServerManager().setShotsScatter(this.ID, shotsScatter);
    }

    setShotsIntensity(shotsIntensity: number) {
        if (!this.#human)
            getApp().getServerManager().setShotsIntensity(this.ID, shotsIntensity);
    }

    /***********************************************/
    getActions():  { [key: string]: { text: string, tooltip: string, type: string } } {
        /* To be implemented by child classes */ // TODO make Unit an abstract class
        return {};
    }

    executeAction(e: any, action: string) {
        if (action === "center-map")
            getApp().getMap().centerOnUnit(this.ID);
        if (action === "attack")
            getApp().getUnitsManager().selectedUnitsAttackUnit(this.ID);
        else if (action === "refuel")
            getApp().getUnitsManager().selectedUnitsRefuel();
        else if (action === "group-ground" || action === "group-navy")
            getApp().getUnitsManager().selectedUnitsCreateGroup();
        else if (action === "scenic-aaa")
            getApp().getUnitsManager().selectedUnitsScenicAAA();
        else if (action === "miss-aaa")
            getApp().getUnitsManager().selectedUnitsMissOnPurpose();
        else if (action === "follow")
            this.#showFollowOptions(e);
    }

    /***********************************************/
    onAdd(map: Map): this {
        super.onAdd(map);
        return this;
    }

    /***********************************************/
    #onClick(e: any) {

        //  Exit if we were waiting for a doubleclick
        if (this.#waitingForDoubleClick) {
            return;
        }

        //  We'll wait for a doubleclick
        this.#waitingForDoubleClick = true;

        this.#doubleClickTimer = window.setTimeout(() => {

            //  Still waiting so no doubleclick; do the click action
            if (this.#waitingForDoubleClick) {
                if (getApp().getMap().getState() === IDLE || getApp().getMap().getState() === MOVE_UNIT || e.originalEvent.ctrlKey) {
                    if (!e.originalEvent.ctrlKey)
                        getApp().getUnitsManager().deselectAllUnits();

                    this.setSelected(!this.getSelected());
                }
            }

            //  No longer waiting for a doubleclick
            this.#waitingForDoubleClick = false;
        }, 200);
    }

    #onDoubleClick(e: any) {
        //  Let single clicks work again
        this.#waitingForDoubleClick = false;
        clearTimeout(this.#doubleClickTimer);

        //  Select all matching units in the viewport
        const unitsManager = getApp().getUnitsManager();
        Object.values(unitsManager.getUnits()).forEach((unit: Unit) => {
            if (unit.getAlive() === true && unit.getName() === this.getName() && unit.isInViewport())
                unitsManager.selectUnit(unit.ID, false);
        });
    }

    getActionOptions() {
        var options: { [key: string]: { text: string, tooltip: string, type: string } } | null = null;

        var units = getApp().getUnitsManager().getSelectedUnits();
        units.push(this);

        /* Keep only the common "or" options or any "and" option */
        units.forEach((unit: Unit) => {
            var unitOptions = unit.getActions();
            if (options === null) {
                options = unitOptions;
            } else {
                /* Options of "or" type get shown if any one unit has it*/
                for (let optionKey in unitOptions) {
                    if (unitOptions[optionKey].type == "or") {
                        options[optionKey] = unitOptions[optionKey];
                    }
                }

                /* Options of "and" type get shown if ALL units have it */
                for (let optionKey in options) {
                    if (!(optionKey in unitOptions)) {
                        delete options[optionKey];
                    }
                }
            }
        });

        return options ?? {};
    }

    #onContextMenu(e: any) {
        var options = this.getActionOptions();

        if (Object.keys(options).length > 0) {
            getApp().getMap().showUnitContextMenu(e.originalEvent.x, e.originalEvent.y, e.latlng);
            getApp().getMap().getUnitContextMenu().setOptions(options, (option: string) => {
                getApp().getMap().hideUnitContextMenu();
                this.executeAction(e, option);
            });
        }
    }

    #showFollowOptions(e: any) {
        var options: { [key: string]: { text: string, tooltip: string } } = {};

        options = {
            'trail':            { text: "Trail",                tooltip: "Follow unit in trail formation" },
            'echelon-lh':       { text: "Echelon (LH)",         tooltip: "Follow unit in echelon left formation" },
            'echelon-rh':       { text: "Echelon (RH)",         tooltip: "Follow unit in echelon right formation" },
            'line-abreast-lh':  { text: "Line abreast (LH)",    tooltip: "Follow unit in line abreast left formation" },
            'line-abreast-rh':  { text: "Line abreast (RH)",    tooltip: "Follow unit in line abreast right formation" },
            'front':            { text: "Front",                tooltip: "Fly in front of unit" },
            'diamond':          { text: "Diamond",              tooltip: "Follow unit in diamond formation" },
            'custom':           { text: "Custom",               tooltip: "Set a custom formation position" },
        }

        getApp().getMap().getUnitContextMenu().setOptions(options, (option: string) => {
            getApp().getMap().hideUnitContextMenu();
            this.#applyFollowOptions(option);
        });

        getApp().getMap().showUnitContextMenu(e.originalEvent.x, e.originalEvent.y, e.latlng);
    }

    #applyFollowOptions(action: string) {
        if (action === "custom") {
            document.getElementById("custom-formation-dialog")?.classList.remove("hide");
            document.addEventListener("applyCustomFormation", () => {
                var dialog = document.getElementById("custom-formation-dialog");
                if (dialog) {
                    dialog.classList.add("hide");
                    var clock = 1;
                    while (clock < 8) {
                        if ((<HTMLInputElement>dialog.querySelector(`#formation-${clock}`)).checked)
                            break
                        clock++;
                    }
                    var angleDeg = 360 - (clock - 1) * 45;
                    var angleRad = deg2rad(angleDeg);
                    var distance = ftToM(parseInt((<HTMLInputElement>dialog.querySelector(`#distance`)?.querySelector("input")).value));
                    var upDown = ftToM(parseInt((<HTMLInputElement>dialog.querySelector(`#up-down`)?.querySelector("input")).value));

                    // X: front-rear, positive front
                    // Y: top-bottom, positive top
                    // Z: left-right, positive right
                    var x = distance * Math.cos(angleRad);
                    var y = upDown;
                    var z = distance * Math.sin(angleRad);

                    getApp().getUnitsManager().selectedUnitsFollowUnit(this.ID, { "x": x, "y": y, "z": z });
                }
            });
        }
        else {
            getApp().getUnitsManager().selectedUnitsFollowUnit(this.ID, undefined, action);
        }
    }

    #updateMarker() {
        this.updateVisibility();

        /* Draw the minimap marker */
        var drawMiniMapMarker = (this.belongsToCommandedCoalition() || this.getDetectionMethods().some(value => [VISUAL, OPTIC, RADAR, IRST, DLINK].includes(value)));
        if (this.#alive && drawMiniMapMarker) {
            if (this.#miniMapMarker == null) {
                this.#miniMapMarker = new CircleMarker(new LatLng(this.#position.lat, this.#position.lng), { radius: 0.5 });
                if (this.#coalition == "neutral")
                    this.#miniMapMarker.setStyle({ color: "#CFD9E8" });
                else if (this.#coalition == "red")
                    this.#miniMapMarker.setStyle({ color: "#ff5858" });
                else
                    this.#miniMapMarker.setStyle({ color: "#247be2" });
                this.#miniMapMarker.addTo(getApp().getMap().getMiniMapLayerGroup());
                this.#miniMapMarker.bringToBack();
            }
            else {
                if (this.#miniMapMarker.getLatLng().lat !== this.getPosition().lat || this.#miniMapMarker.getLatLng().lng !== this.getPosition().lng) {
                    this.#miniMapMarker.setLatLng(new LatLng(this.#position.lat, this.#position.lng));
                    this.#miniMapMarker.bringToBack();
                }
            }
        }
        else {
            if (this.#miniMapMarker != null && getApp().getMap().getMiniMapLayerGroup().hasLayer(this.#miniMapMarker)) {
                getApp().getMap().getMiniMapLayerGroup().removeLayer(this.#miniMapMarker);
                this.#miniMapMarker = null;
            }
        }

        /* Draw the marker */
        if (!this.getHidden()) {
            if (this.getLatLng().lat !== this.#position.lat || this.getLatLng().lng !== this.#position.lng) {
                this.setLatLng(new LatLng(this.#position.lat, this.#position.lng));
            }

            var element = this.getElement();
            if (element != null) {
                /* Draw the velocity vector */
                element.querySelector(".unit-vvi")?.setAttribute("style", `height: ${15 + this.#speed / 5}px;`);

                /* Set fuel data */
                element.querySelector(".unit-fuel-level")?.setAttribute("style", `width: ${this.#fuel}%`);
                element.querySelector(".unit")?.toggleAttribute("data-has-low-fuel", this.#fuel < 20);

                /* Set dead/alive flag */
                element.querySelector(".unit")?.toggleAttribute("data-is-dead", !this.#alive);

                /* Set current unit state */
                if (this.#human) {                                // Unit is human
                    element.querySelector(".unit")?.setAttribute("data-state", "human");
                }
                else if (!this.#controlled) {                     // Unit is under DCS control (not Olympus)
                    element.querySelector(".unit")?.setAttribute("data-state", "dcs");
                }
                else if ((this.getCategory() == "Aircraft" || this.getCategory() == "Helicopter") && !this.#hasTask){
                    element.querySelector(".unit")?.setAttribute("data-state", "no-task");
                }
                else {                                           // Unit is under Olympus control
                    if (this.#onOff) {
                        if (this.#isActiveTanker)
                            element.querySelector(".unit")?.setAttribute("data-state", "tanker");
                        else if (this.#isActiveAWACS)
                            element.querySelector(".unit")?.setAttribute("data-state", "AWACS");
                        else
                            element.querySelector(".unit")?.setAttribute("data-state", this.#state.toLowerCase());
                    }
                    else {
                        element.querySelector(".unit")?.setAttribute("data-state", "off");
                    }
                }

                /* Set altitude and speed */
                if (element.querySelector(".unit-altitude"))
                    (<HTMLElement>element.querySelector(".unit-altitude")).innerText = "FL" + String(Math.floor(mToFt(this.#position.alt as number) / 100));
                if (element.querySelector(".unit-speed"))
                    (<HTMLElement>element.querySelector(".unit-speed")).innerText = String(Math.floor(msToKnots(this.#speed))) + "GS";

                /* Rotate elements according to heading */
                element.querySelectorAll("[data-rotate-to-heading]").forEach(el => {
                    const headingDeg = rad2deg(this.#heading);
                    let currentStyle = el.getAttribute("style") || "";
                    el.setAttribute("style", currentStyle + `transform:rotate(${headingDeg}deg);`);
                });

                /* Turn on ammo indicators */
                var hasFox1 = element.querySelector(".unit")?.hasAttribute("data-has-fox-1");
                var hasFox2 = element.querySelector(".unit")?.hasAttribute("data-has-fox-2");
                var hasFox3 = element.querySelector(".unit")?.hasAttribute("data-has-fox-3");
                var hasOtherAmmo = element.querySelector(".unit")?.hasAttribute("data-has-other-ammo");

                var newHasFox1 = false;
                var newHasFox2 = false;
                var newHasFox3 = false;
                var newHasOtherAmmo = false;
                Object.values(this.#ammo).forEach((ammo: Ammo) => {
                    if (ammo.category == 1 && ammo.missileCategory == 1) {
                        if (ammo.guidance == 4 || ammo.guidance == 5)
                            newHasFox1 = true;
                        else if (ammo.guidance == 2)
                            newHasFox2 = true;
                        else if (ammo.guidance == 3)
                            newHasFox3 = true;
                    }
                    else
                        newHasOtherAmmo = true;
                });

                if (hasFox1 != newHasFox1) element.querySelector(".unit")?.toggleAttribute("data-has-fox-1", newHasFox1);
                if (hasFox2 != newHasFox2) element.querySelector(".unit")?.toggleAttribute("data-has-fox-2", newHasFox2);
                if (hasFox3 != newHasFox3) element.querySelector(".unit")?.toggleAttribute("data-has-fox-3", newHasFox3);
                if (hasOtherAmmo != newHasOtherAmmo) element.querySelector(".unit")?.toggleAttribute("data-has-other-ammo", newHasOtherAmmo);

                /* Draw the hotgroup element */
                element.querySelector(".unit")?.toggleAttribute("data-is-in-hotgroup", this.#hotgroup != null);
                if (this.#hotgroup) {
                    const hotgroupEl = element.querySelector(".unit-hotgroup-id") as HTMLElement;
                    if (hotgroupEl)
                        hotgroupEl.innerText = String(this.#hotgroup);
                }
            }

            /* Set vertical offset for altitude stacking */
            var pos = getApp().getMap().latLngToLayerPoint(this.getLatLng()).round();
            this.setZIndexOffset(1000 + Math.floor(this.#position.alt as number) - pos.y + (this.#highlighted || this.#selected ? 5000 : 0));
        }
    }

    #drawPath() {
        if (this.#activePath != undefined && getApp().getMap().getVisibilityOptions()[SHOW_UNIT_PATHS]) {
            var points = [];
            points.push(new LatLng(this.#position.lat, this.#position.lng));

            /* Add markers if missing */
            while (this.#pathMarkers.length < Object.keys(this.#activePath).length) {
                var marker = new Marker([0, 0], { icon: pathIcon }).addTo(getApp().getMap());
                this.#pathMarkers.push(marker);
            }

            /* Remove markers if too many */
            while (this.#pathMarkers.length > Object.keys(this.#activePath).length) {
                getApp().getMap().removeLayer(this.#pathMarkers[this.#pathMarkers.length - 1]);
                this.#pathMarkers.splice(this.#pathMarkers.length - 1, 1)
            }

            /* Update the position of the existing markers (to avoid creating markers uselessly) */
            for (let WP in this.#activePath) {
                var destination = this.#activePath[WP];
                this.#pathMarkers[parseInt(WP)].setLatLng([destination.lat, destination.lng]);
                points.push(new LatLng(destination.lat, destination.lng));
                this.#pathPolyline.setLatLngs(points);
            }

            if (points.length == 1)
                this.#clearPath();
        }
        else {
            this.#clearPath();
        }
    }

    #clearPath() {
        for (let WP in this.#pathMarkers) {
            getApp().getMap().removeLayer(this.#pathMarkers[WP]);
        }
        this.#pathMarkers = [];
        this.#pathPolyline.setLatLngs([]);
    }

    #drawContacts() {
        this.#clearContacts();
        if (getApp().getMap().getVisibilityOptions()[SHOW_UNIT_CONTACTS]) {
            for (let index in this.#contacts) {
                var contactData = this.#contacts[index];
                var contact: Unit | Weapon | null;

                if (contactData.ID in getApp().getUnitsManager().getUnits())
                    contact = getApp().getUnitsManager().getUnitByID(contactData.ID);
                else
                    contact = getApp().getWeaponsManager().getWeaponByID(contactData.ID);

                if (contact != null && contact.getAlive()) {
                    var startLatLng = new LatLng(this.#position.lat, this.#position.lng);
                    var endLatLng: LatLng;
                    if (contactData.detectionMethod === RWR) {
                        var bearingToContact = bearing(this.#position.lat, this.#position.lng, contact.getPosition().lat, contact.getPosition().lng);
                        var startXY = getApp().getMap().latLngToContainerPoint(startLatLng);
                        var endX = startXY.x + 80 * Math.sin(deg2rad(bearingToContact));
                        var endY = startXY.y - 80 * Math.cos(deg2rad(bearingToContact));
                        endLatLng = getApp().getMap().containerPointToLatLng(new Point(endX, endY));
                    }
                    else
                        endLatLng = new LatLng(contact.getPosition().lat, contact.getPosition().lng);

                    var color;
                    if (contactData.detectionMethod === VISUAL || contactData.detectionMethod === OPTIC)
                        color = "#FF00FF";
                    else if (contactData.detectionMethod === RADAR || contactData.detectionMethod === IRST)
                        color = "#FFFF00";
                    else if (contactData.detectionMethod === RWR)
                        color = "#00FF00";
                    else
                        color = "#FFFFFF";
                    var contactPolyline = new Polyline([startLatLng, endLatLng], { color: color, weight: 3, opacity: 1, smoothFactor: 1, dashArray: "4, 8" });
                    contactPolyline.addTo(getApp().getMap());
                    this.#contactsPolylines.push(contactPolyline)
                }
            }
        }
    }

    #clearContacts() {
        for (let index in this.#contactsPolylines) {
            getApp().getMap().removeLayer(this.#contactsPolylines[index])
        }
    }

    #drawRanges() {
        var engagementRange = 0;
        var acquisitionRange = 0;

        /* Get the acquisition and engagement ranges of the entire group, not for each unit */
        if (this.getIsLeader()) {
            var engagementRange = this.getDatabase()?.getByName(this.getName())?.engagementRange?? 0;
            var acquisitionRange = this.getDatabase()?.getByName(this.getName())?.acquisitionRange?? 0;

            this.getGroupMembers().forEach((unit: Unit) => {
                if (unit.getAlive()) {
                    let unitEngagementRange = unit.getDatabase()?.getByName(unit.getName())?.engagementRange?? 0;
                    let unitAcquisitionRange = unit.getDatabase()?.getByName(unit.getName())?.acquisitionRange?? 0;

                    if (unitEngagementRange > engagementRange)
                        engagementRange = unitEngagementRange;

                    if (unitAcquisitionRange > acquisitionRange)
                        acquisitionRange = unitAcquisitionRange;
                }
            })

            if (acquisitionRange !== this.#acquisitionCircle.getRadius())
                this.#acquisitionCircle.setRadius(acquisitionRange); 

            if (engagementRange !== this.#engagementCircle.getRadius())
                this.#engagementCircle.setRadius(engagementRange);

            this.#engagementCircle.options.fillOpacity = this.getSelected() && getApp().getMap().getVisibilityOptions()[FILL_SELECTED_RING]? 0.3: 0;

            /* Acquisition circles */
            var shortAcquisitionRangeCheck = (acquisitionRange > nmToM(3) || !getApp().getMap().getVisibilityOptions()[HIDE_UNITS_SHORT_RANGE_RINGS]);

            if (getApp().getMap().getVisibilityOptions()[SHOW_UNITS_ACQUISITION_RINGS] && shortAcquisitionRangeCheck && (this.belongsToCommandedCoalition() || this.getDetectionMethods().some(value => [VISUAL, OPTIC, IRST, RWR].includes(value)))) {
                if (!getApp().getMap().hasLayer(this.#acquisitionCircle)) {
                    this.#acquisitionCircle.addTo(getApp().getMap());
                    switch (this.getCoalition()) {
                        case "red":
                            this.#acquisitionCircle.options.color = "#D42121";
                            break;
                        case "blue":
                            this.#acquisitionCircle.options.color = "#017DC1";
                            break;
                        default:
                            this.#acquisitionCircle.options.color = "#111111"
                            break;
                    }
                }
                this.#acquisitionCircle.setLatLng(this.getPosition());
            }
            else {
                if (getApp().getMap().hasLayer(this.#acquisitionCircle))
                    this.#acquisitionCircle.removeFrom(getApp().getMap());
            }
            
            /* Engagement circles */
            var shortEngagementRangeCheck = (engagementRange > nmToM(3) || !getApp().getMap().getVisibilityOptions()[HIDE_UNITS_SHORT_RANGE_RINGS]);
            if (getApp().getMap().getVisibilityOptions()[SHOW_UNITS_ENGAGEMENT_RINGS] && shortEngagementRangeCheck && (this.belongsToCommandedCoalition() || this.getDetectionMethods().some(value => [VISUAL, OPTIC, IRST, RWR].includes(value)))) {
                if (!getApp().getMap().hasLayer(this.#engagementCircle)) {
                    this.#engagementCircle.addTo(getApp().getMap());
                    switch (this.getCoalition()) {
                        case "red":
                            this.#engagementCircle.options.color = "#FF5858";
                            break;
                        case "blue":
                            this.#engagementCircle.options.color = "#3BB9FF";
                            break;
                        default:
                            this.#engagementCircle.options.color = "#CFD9E8"
                            break;
                    }
                }
                this.#engagementCircle.setLatLng(this.getPosition());
            }
            else {
                if (getApp().getMap().hasLayer(this.#engagementCircle))
                    this.#engagementCircle.removeFrom(getApp().getMap());
            }
        }
    }

    #clearRanges() {
        if (getApp().getMap().hasLayer(this.#acquisitionCircle))
            this.#acquisitionCircle.removeFrom(getApp().getMap());

        if (getApp().getMap().hasLayer(this.#engagementCircle))
            this.#engagementCircle.removeFrom(getApp().getMap());
    }

    #drawTarget() {
        if (this.#targetPosition.lat != 0 && this.#targetPosition.lng != 0 && getApp().getMap().getVisibilityOptions()[SHOW_UNIT_PATHS]) {
            this.#drawTargetPosition(this.#targetPosition);
        }
        else if (this.#targetID != 0 && getApp().getMap().getVisibilityOptions()[SHOW_UNIT_TARGETS]) {
            const target = getApp().getUnitsManager().getUnitByID(this.#targetID);
            if (target && (getApp().getMissionManager().getCommandModeOptions().commandMode == GAME_MASTER || (this.belongsToCommandedCoalition() && getApp().getUnitsManager().getUnitDetectedMethods(target).some(value => [VISUAL, OPTIC, RADAR, IRST, DLINK].includes(value))))) {
                this.#drawTargetPosition(target.getPosition());
            }
        }
        else
            this.#clearTarget();
    }

    #drawTargetPosition(targetPosition: LatLng) {
        if (!getApp().getMap().hasLayer(this.#targetPositionMarker))
            this.#targetPositionMarker.addTo(getApp().getMap());
        if (!getApp().getMap().hasLayer(this.#targetPositionPolyline))
            this.#targetPositionPolyline.addTo(getApp().getMap());
        this.#targetPositionMarker.setLatLng(new LatLng(targetPosition.lat, targetPosition.lng));
        this.#targetPositionPolyline.setLatLngs([new LatLng(this.#position.lat, this.#position.lng), new LatLng(targetPosition.lat, targetPosition.lng)])
    }

    #clearTarget() {
        if (getApp().getMap().hasLayer(this.#targetPositionMarker))
            this.#targetPositionMarker.removeFrom(getApp().getMap());

        if (getApp().getMap().hasLayer(this.#targetPositionPolyline))
            this.#targetPositionPolyline.removeFrom(getApp().getMap());
    }

    #onZoom() {
        this.#updateMarker();
    }
}

export class AirUnit extends Unit {
    getIconOptions() {
        var belongsToCommandedCoalition = this.belongsToCommandedCoalition();
        return {
            showState: belongsToCommandedCoalition,
            showVvi: (belongsToCommandedCoalition || this.getDetectionMethods().some(value => [VISUAL, OPTIC, RADAR, IRST, DLINK].includes(value))),
            showHotgroup: belongsToCommandedCoalition,
            showUnitIcon: (belongsToCommandedCoalition || this.getDetectionMethods().some(value => [VISUAL, OPTIC, RADAR, IRST, DLINK].includes(value))),
            showShortLabel: (belongsToCommandedCoalition || this.getDetectionMethods().some(value => [VISUAL, OPTIC].includes(value))),
            showFuel: belongsToCommandedCoalition,
            showAmmo: belongsToCommandedCoalition,
            showSummary: (belongsToCommandedCoalition || this.getDetectionMethods().some(value => [VISUAL, OPTIC, RADAR, IRST, DLINK].includes(value))),
            showCallsign: belongsToCommandedCoalition,
            rotateToHeading: false
        };
    }

    getActions() {
        var options: { [key: string]: { text: string, tooltip: string, type: string } } = {};

        /* Options if this unit is not selected */
        if (!this.getSelected()) {
            /* Someone else is selected */
            if (getApp().getUnitsManager().getSelectedUnits().length > 0) {
                options["attack"] = { text: "Attack", tooltip: "Attack the unit using A/A or A/G weapons", type: "or" };
                options["follow"] = { text: "Follow", tooltip: "Follow the unit at a user defined distance and position", type: "or" };
            } else {
                options["center-map"] = { text: "Center map", tooltip: "Center the map on the unit and follow it", type: "and" };
            }
        }
        /* Options if this unit is selected*/
        else if (this.getSelected()) {
            /* This is the only selected unit */
            if (getApp().getUnitsManager().getSelectedUnits().length == 1) {
                options["center-map"] = { text: "Center map", tooltip: "Center the map on the unit and follow it", type: "and" };
            } else {
                options["follow"] = { text: "Follow", tooltip: "Follow the unit at a user defined distance and position", type: "or" };
            }

            options["refuel"] = { text: "Air to air refuel", tooltip: "Refuel units at the nearest AAR Tanker. If no tanker is available the unit will RTB.", type: "and" }; // TODO Add some way of knowing which aircraft can AAR
        }
        /* All other options */
        else {
            /* Provision */
        }
        return options;
    }
}

export class Aircraft extends AirUnit {
    constructor(ID: number) {
        super(ID);
    }

    getCategory() {
        return "Aircraft";
    }
}

export class Helicopter extends AirUnit {
    constructor(ID: number) {
        super(ID);
    }

    getCategory() {
        return "Helicopter";
    }
}

export class GroundUnit extends Unit {
    constructor(ID: number) {
        super(ID);
    }

    getIconOptions() {
        var belongsToCommandedCoalition = this.belongsToCommandedCoalition();
        return {
            showState: belongsToCommandedCoalition,
            showVvi: false,
            showHotgroup: belongsToCommandedCoalition,
            showUnitIcon: (belongsToCommandedCoalition || this.getDetectionMethods().some(value => [VISUAL, OPTIC, RADAR, IRST, DLINK].includes(value))),
            showShortLabel: false,
            showFuel: false,
            showAmmo: false,
            showSummary: false,
            showCallsign: belongsToCommandedCoalition,
            rotateToHeading: false
        };
    }

    getActions() {
        var options: { [key: string]: { text: string, tooltip: string, type: string } } = {};

        /* Options if this unit is not selected */
        if (!this.getSelected()) {
            /* Someone else is selected */
            if (getApp().getUnitsManager().getSelectedUnits().length > 0) {
                options["attack"] = { text: "Attack", tooltip: "Attack the unit using A/A or A/G weapons", type: "or" };
            } else {
                options["center-map"] = { text: "Center map", tooltip: "Center the map on the unit and follow it", type: "and" };
            }
        }
        /* Options if this unit is selected*/
        else if (this.getSelected()) {
            /* This is the only selected unit */
            if (getApp().getUnitsManager().getSelectedUnits().length == 1) {
                options["center-map"] = { text: "Center map", tooltip: "Center the map on the unit and follow it", type: "and" };
            } else {
                options["group-ground"] = { text: "Create group", tooltip: "Create a group from the selected units", type: "and" };
            }

            if (this.canAAA()) {
                options["scenic-aaa"] = { text: "Scenic AAA", tooltip: "Shoot AAA in the air without aiming at any target, when a enemy unit gets close enough. WARNING: works correctly only on neutral units, blue or red units will aim", type: "and" };
                options["miss-aaa"] = { text: "Miss on purpose AAA", tooltip: "Shoot AAA towards the closest enemy unit, but don't aim precisely. WARNING: works correctly only on neutral units, blue or red units will aim", type: "and" };
            }
        }
        /* All other options */
        else {
            /* Provision */
        }
        return options;
    }

    getCategory() {
        return "GroundUnit";
    }

    getType() {
        var blueprint = groundUnitDatabase.getByName(this.getName());
        return blueprint?.type ? blueprint.type : "";
    }
}

export class NavyUnit extends Unit {
    constructor(ID: number) {
        super(ID);
    }

    getIconOptions() {
        var belongsToCommandedCoalition = this.belongsToCommandedCoalition();
        return {
            showState: belongsToCommandedCoalition,
            showVvi: false,
            showHotgroup: true,
            showUnitIcon: (belongsToCommandedCoalition || this.getDetectionMethods().some(value => [VISUAL, OPTIC, RADAR, IRST, DLINK].includes(value))),
            showShortLabel: false,
            showFuel: false,
            showAmmo: false,
            showSummary: false,
            showCallsign: belongsToCommandedCoalition,
            rotateToHeading: false
        };
    }

    getActions() {
        var options: { [key: string]: { text: string, tooltip: string, type: string } } = {};

        /* Options if this unit is not selected */
        if (!this.getSelected()) {
            /* Someone else is selected */
            if (getApp().getUnitsManager().getSelectedUnits().length > 0) {
                options["attack"] = { text: "Attack", tooltip: "Attack the unit using A/A or A/G weapons", type: "or" };
            } else {
                options["center-map"] = { text: "Center map", tooltip: "Center the map on the unit and follow it", type: "and" };
            }
        }
        /* Options if this unit is selected */
        else if (this.getSelected()) {
            /* This is the only selected unit */
            if (getApp().getUnitsManager().getSelectedUnits().length == 1) {
                options["center-map"] = { text: "Center map", tooltip: "Center the map on the unit and follow it", type: "and" };
            } else {
                options["group-navy"] = { text: "Create group", tooltip: "Create a group from the selected units", type: "and" };
            }
        }
        /* All other options */
        else {
            /* Provision */
        }
        return options;
    }

    getMarkerCategory() {
        return "navyunit";
    }

    getCategory() {
        return "NavyUnit";
    }

    getType() {
        var blueprint = navyUnitDatabase.getByName(this.getName());
        return blueprint?.type ? blueprint.type : "";
    }
}
