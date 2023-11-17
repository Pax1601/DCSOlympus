import { Marker, LatLng, Polyline, Icon, DivIcon, CircleMarker, Map, Point, Circle } from 'leaflet';
import { getApp } from '..';
import { enumToCoalition, enumToEmissioNCountermeasure, getMarkerCategoryByName, enumToROE, enumToReactionToThreat, enumToState, getUnitDatabaseByCategory, mToFt, msToKnots, rad2deg, bearing, deg2rad, ftToM, getGroundElevation, coalitionToEnum, nmToFt, nmToM } from '../other/utils';
import { CustomMarker } from '../map/markers/custommarker';
import { SVGInjector } from '@tanem/svg-injector';
import { UnitDatabase } from './databases/unitdatabase';
import { TargetMarker } from '../map/markers/targetmarker';
import { DLINK, DataIndexes, GAME_MASTER, HIDE_GROUP_MEMBERS, IDLE, IRST, MOVE_UNIT, OPTIC, RADAR, ROEs, RWR, SHOW_UNIT_CONTACTS, SHOW_UNITS_ENGAGEMENT_RINGS, SHOW_UNIT_PATHS, SHOW_UNIT_TARGETS, VISUAL, emissionsCountermeasures, reactionsToThreat, states, SHOW_UNITS_ACQUISITION_RINGS, HIDE_UNITS_SHORT_RANGE_RINGS, FILL_SELECTED_RING, GROUPING_ZOOM_TRANSITION } from '../constants/constants';
import { DataExtractor } from '../server/dataextractor';
import { groundUnitDatabase } from './databases/groundunitdatabase';
import { navyUnitDatabase } from './databases/navyunitdatabase';
import { Weapon } from '../weapon/weapon';
import { Ammo, Contact, GeneralSettings, LoadoutBlueprint, ObjectIconOptions, Offset, Radio, TACAN, UnitData } from '../interfaces';
import { RangeCircle } from "../map/rangecircle";
import { Group } from './group';
import { ContextActionSet } from './contextactionset';
import { ContextAction } from './contextaction';

var pathIcon = new Icon({
    iconUrl: '/resources/theme/images/markers/marker-icon.png',
    shadowUrl: '/resources/theme/images/markers/marker-shadow.png',
    iconAnchor: [13, 41]
});

/**
 * Unit class which controls unit behaviour
 */
export abstract class Unit extends CustomMarker {
    ID: number;

    /* Data controlled directly by the backend. No setters are provided to avoid misalignments */
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
    #health: number = 100;

    /* Other members used to draw the unit, mostly ancillary stuff like targets, ranges and so on */
    #group: Group | null = null;
    #selected: boolean = false;
    #hidden: boolean = false;
    #highlighted: boolean = false;
    #waitingForDoubleClick: boolean = false;
    #pathMarkers: Marker[] = [];
    #pathPolyline: Polyline;
    #contactsPolylines: Polyline[] = [];
    #engagementCircle: RangeCircle;
    #acquisitionCircle: RangeCircle;
    #miniMapMarker: CircleMarker | null = null;
    #targetPositionMarker: TargetMarker;
    #targetPositionPolyline: Polyline;
    #doubleClickTimer: number = 0;
    #hotgroup: number | null = null;
    #detectionMethods: number[] = [];

    /* Getters for backend driven data */
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
    getIsActiveAWACS() { return this.#isActiveAWACS };
    getIsActiveTanker() { return this.#isActiveTanker };
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
    getShotsScatter() { return this.#shotsScatter };
    getShotsIntensity() { return this.#shotsIntensity };
    getHealth() { return this.#health };

    static getConstructor(type: string) {
        if (type === "GroundUnit") return GroundUnit;
        if (type === "Aircraft") return Aircraft;
        if (type === "Helicopter") return Helicopter;
        if (type === "NavyUnit") return NavyUnit;
    }

    constructor(ID: number) {
        super(new LatLng(0, 0), { riseOnHover: true, keyboard: false });

        this.ID = ID;

        this.#pathPolyline = new Polyline([], { color: '#2d3e50', weight: 3, opacity: 0.5, smoothFactor: 1 });
        this.#pathPolyline.addTo(getApp().getMap());
        this.#targetPositionMarker = new TargetMarker(new LatLng(0, 0));
        this.#targetPositionPolyline = new Polyline([], { color: '#FF0000', weight: 3, opacity: 0.5, smoothFactor: 1 });
        this.#engagementCircle = new RangeCircle(this.getPosition(), { radius: 0, weight: 4, opacity: 1, fillOpacity: 0, dashArray: "4 8", interactive: false, bubblingMouseEvents: false });
        this.#acquisitionCircle = new RangeCircle(this.getPosition(), { radius: 0, weight: 2, opacity: 1, fillOpacity: 0, dashArray: "8 12", interactive: false, bubblingMouseEvents: false });

        /* Leaflet events listeners */
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
        getApp().getMap().on("zoomend", (e: any) => { this.#onZoom(e); })

        /* Deselect units if they are hidden */
        document.addEventListener("toggleCoalitionVisibility", (ev: CustomEventInit) => {
            window.setTimeout(() => { this.setSelected(this.getSelected() && !this.getHidden()) }, 300);
        });

        document.addEventListener("toggleUnitVisibility", (ev: CustomEventInit) => {
            window.setTimeout(() => { this.setSelected(this.getSelected() && !this.getHidden()) }, 300);
        });

        /* Update the marker when the visibility options change */
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

    /********************** Abstract methods  *************************/
    /** Get the unit category string
     * 
     * @returns string The unit category
     */
    abstract getCategory(): string;

    /** Get the icon options
     * Used to configure how the marker appears on the map
     * 
     * @returns ObjectIconOptions
     */
    abstract getIconOptions(): ObjectIconOptions;

    /** Get the actions that this unit can perform
     * 
     */
    abstract appendContextActions(contextActionSet: ContextActionSet, targetUnit: Unit | null, targetPosition: LatLng | null): void;

    /********************** Unit data *************************/
    /** This function is called by the units manager to update all the data coming from the backend. It reads the binary raw data using a DataExtractor
     * 
     * @param dataExtractor The DataExtractor object pointing to the binary buffer which contains the raw data coming from the backend
     */
    setData(dataExtractor: DataExtractor) {
        /* This variable controls if the marker must be updated. This is not always true since not all variables have an effect on the marker */
        var updateMarker = !getApp().getMap().hasLayer(this);

        var oldIsLeader = this.#isLeader;
        var datumIndex = 0;
        while (datumIndex != DataIndexes.endOfData) {
            datumIndex = dataExtractor.extractUInt8();
            switch (datumIndex) {
                case DataIndexes.category: dataExtractor.extractString(); break;
                case DataIndexes.alive: this.setAlive(dataExtractor.extractBool()); updateMarker = true; break;
                case DataIndexes.human: this.#human = dataExtractor.extractBool(); break;
                case DataIndexes.controlled: this.#controlled = dataExtractor.extractBool(); updateMarker = true; break;
                case DataIndexes.coalition: let newCoalition = enumToCoalition(dataExtractor.extractUInt8()); updateMarker = true; if (newCoalition != this.#coalition) this.#clearRanges(); this.#coalition = newCoalition; break; // If the coalition has changed, redraw the range circles to update the colour
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
                case DataIndexes.isLeader: this.#isLeader = dataExtractor.extractBool(); break;
                case DataIndexes.operateAs: this.#operateAs = enumToCoalition(dataExtractor.extractUInt8()); break;
                case DataIndexes.shotsScatter: this.#shotsScatter = dataExtractor.extractUInt8(); break;
                case DataIndexes.shotsIntensity: this.#shotsIntensity = dataExtractor.extractUInt8(); break;
                case DataIndexes.health: this.#health = dataExtractor.extractUInt8(); updateMarker = true; break;
            }
        }

        /* Dead and hidden units can't be selected */
        this.setSelected(this.getSelected() && this.#alive && !this.getHidden())

        /* Update the marker if required */
        if (updateMarker)
            this.#updateMarker();

        /* Redraw the marker if isLeader has changed. TODO I don't love this approach, observables may be more elegant */
        if (oldIsLeader !== this.#isLeader) {
            this.#redrawMarker();

            /* Reapply selection */
            if (this.getSelected()) {
                this.setSelected(false);
                this.setSelected(true);
            }
        }

        /* If the unit is selected or if the view is centered on this unit, sent the update signal so that other elements like the UnitControlPanel can be updated. */
        if (this.getSelected() || getApp().getMap().getCenterUnit() === this)
            document.dispatchEvent(new CustomEvent("unitUpdated", { detail: this }));
    }

    /** Get unit data collated into an object
     * 
     * @returns object populated by unit information which can also be retrieved using getters
     */
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
            shotsIntensity: this.#shotsIntensity,
            health: this.#health
        }
    }

    /**
     * 
     * @returns string containing the marker category
     */
    getMarkerCategory(): string {
        return getMarkerCategoryByName(this.getName());
    }

    /** Get a database of information also in this unit's category
     * 
     * @returns UnitDatabase
     */
    getDatabase(): UnitDatabase | null {
        return getUnitDatabaseByCategory(this.getMarkerCategory());
    }

    /** Set the unit as alive or dead
     * 
     * @param newAlive (boolean) true = alive, false = dead
     */
    setAlive(newAlive: boolean) {
        if (newAlive != this.#alive)
            document.dispatchEvent(new CustomEvent("unitDeath", { detail: this }));
        this.#alive = newAlive;
    }

    /** Set the unit as user-selected
     * 
     * @param selected (boolean)
     */
    setSelected(selected: boolean) {
        /* Only alive units can be selected that belong to the commanded coalition can be selected */
        if ((this.#alive || !selected) && this.belongsToCommandedCoalition() && this.getSelected() != selected) {
            this.#selected = selected;

            /* If selected, update the marker to show the selected effects, else clear all the drawings that are only shown for selected units. */
            if (selected) {
                this.#updateMarker();
            }
            else {
                this.#clearContacts();
                this.#clearPath();
                this.#clearTarget();
            }

            /* When the group leader is selected, if grouping is active, all the other group members are also selected */
            if (this.getCategory() === "GroundUnit" && getApp().getMap().getZoom() < GROUPING_ZOOM_TRANSITION) {
                if (this.#isLeader) {
                    /* Redraw the marker in case the leader unit was replaced by a group marker, like for SAM Sites */
                    this.#redrawMarker();
                    this.getGroupMembers().forEach((unit: Unit) => unit.setSelected(selected));
                }
                else {
                    this.#updateMarker();
                }
            }

            /* Activate the selection effects on the marker */
            this.getElement()?.querySelector(`.unit`)?.toggleAttribute("data-is-selected", selected);

            /* Trigger events after all (de-)selecting has been done */
            if (selected) {
                document.dispatchEvent(new CustomEvent("unitSelection", { detail: this }));
            } else {
                document.dispatchEvent(new CustomEvent("unitDeselection", { detail: this }));
            }
        }
    }

    /** Is this unit selected?
     * 
     * @returns boolean
     */
    getSelected() {
        return this.#selected;
    }

    /** Set the number of the hotgroup to which the unit belongs
     *  
     * @param hotgroup (number)
     */
    setHotgroup(hotgroup: number | null) {
        this.#hotgroup = hotgroup;
        this.#updateMarker();
    }

    /** Get the unit's hotgroup number
     * 
     * @returns number
     */
    getHotgroup() {
        return this.#hotgroup;
    }

    /** Set the unit as highlighted
     * 
     * @param highlighted (boolean)
     */
    setHighlighted(highlighted: boolean) {
        if (this.#highlighted != highlighted) {
            this.#highlighted = highlighted;
            this.getElement()?.querySelector(`[data-object|="unit"]`)?.toggleAttribute("data-is-highlighted", highlighted);
            this.getGroupMembers().forEach((unit: Unit) => unit.setHighlighted(highlighted));
        }
    }

    /** Get whether the unit is highlighted or not
     * 
     * @returns boolean
     */
    getHighlighted() {
        return this.#highlighted;
    }

    /** Get the other members of the group which this unit is in
     * 
     * @returns Unit[]
     */
    getGroupMembers() {
        if (this.#group !== null)
            return this.#group.getMembers().filter((unit: Unit) => { return unit != this; })
        return [];
    }

    /** Return the leader of the group
     * 
     * @returns Unit The leader of the group
     */
    getGroupLeader() {
        if (this.#group !== null)
            return this.#group.getLeader();
        return null;
    }

    /** Returns whether the user is allowed to command this unit, based on coalition
     * 
     * @returns boolean
     */
    belongsToCommandedCoalition() {
        return (getApp().getMissionManager().getCommandModeOptions().commandMode !== GAME_MASTER && getApp().getMissionManager().getCommandedCoalition() !== this.#coalition) ? false : true;
    }

    getType() {
        return "";
    }

    getSpawnPoints() {
        return this.getDatabase()?.getSpawnPointsByName(this.getName());
    }

    getDatabaseEntry() {
        return this.getDatabase()?.getByName(this.#name);
    }

    getGroup() {
        return this.#group;
    }

    setGroup(group: Group | null) {
        this.#group = group;
    }

    drawLines() {
        /* Leaflet does not like it when you change coordinates when the map is zooming */
        if (!getApp().getMap().isZooming()) {
            this.#drawPath();
            this.#drawContacts();
            this.#drawTarget();
        }
    }

    checkZoomRedraw() {
        return false;
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

        /* Create the base element */
        var el = document.createElement("div");
        el.classList.add("unit");
        el.setAttribute("data-object", `unit-${this.getMarkerCategory()}`);
        el.setAttribute("data-coalition", this.#coalition);

        var iconOptions = this.getIconOptions();

        /* Generate and append elements depending on active options */
        /* Velocity vector */
        if (iconOptions.showVvi) {
            var vvi = document.createElement("div");
            vvi.classList.add("unit-vvi");
            vvi.toggleAttribute("data-rotate-to-heading");
            el.append(vvi);
        }

        /* Hotgroup indicator */
        if (iconOptions.showHotgroup) {
            var hotgroup = document.createElement("div");
            hotgroup.classList.add("unit-hotgroup");
            var hotgroupId = document.createElement("div");
            hotgroupId.classList.add("unit-hotgroup-id");
            hotgroup.appendChild(hotgroupId);
            el.append(hotgroup);
        }

        /* Main icon */
        if (iconOptions.showUnitIcon) {
            var unitIcon = document.createElement("div");
            unitIcon.classList.add("unit-icon");
            var img = document.createElement("img");

            /* If a unit does not belong to the commanded coalition or it is not visually detected, show it with the generic aircraft square */
            var marker;
            if (this.belongsToCommandedCoalition() || this.getDetectionMethods().some(value => [VISUAL, OPTIC].includes(value)))
                marker = this.getDatabaseEntry()?.markerFile ?? this.getMarkerCategory();
            else
                marker = "aircraft";
            img.src = `/resources/theme/images/units/${marker}.svg`;
            img.onload = () => SVGInjector(img);
            unitIcon.appendChild(img);

            unitIcon.toggleAttribute("data-rotate-to-heading", iconOptions.rotateToHeading);
            el.append(unitIcon);
        }

        /* State icon */
        if (iconOptions.showState) {
            var state = document.createElement("div");
            state.classList.add("unit-state");
            el.appendChild(state);
        }

        /* Short label */
        if (iconOptions.showShortLabel) {
            var shortLabel = document.createElement("div");
            shortLabel.classList.add("unit-short-label");
            shortLabel.innerText = this.getDatabaseEntry()?.shortLabel || "";
            el.append(shortLabel);
        }

        /* Fuel indicator */
        if (iconOptions.showFuel) {
            var fuelIndicator = document.createElement("div");
            fuelIndicator.classList.add("unit-fuel");
            var fuelLevel = document.createElement("div");
            fuelLevel.classList.add("unit-fuel-level");
            fuelIndicator.appendChild(fuelLevel);
            el.append(fuelIndicator);
        }

        /* Health indicator */
        if (iconOptions.showHealth) {
            var healthIndicator = document.createElement("div");
            healthIndicator.classList.add("unit-health");
            var healthLevel = document.createElement("div");
            healthLevel.classList.add("unit-health-level");
            healthIndicator.appendChild(healthLevel);
            el.append(healthIndicator);
        }

        /* Ammo indicator */
        if (iconOptions.showAmmo) {
            var ammoIndicator = document.createElement("div");
            ammoIndicator.classList.add("unit-ammo");
            for (let i = 0; i <= 3; i++)
                ammoIndicator.appendChild(document.createElement("div"));
            el.append(ammoIndicator);
        }

        /* Unit summary */
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
    }

    /********************** Visibility *************************/
    updateVisibility() {
        const hiddenTypes = getApp().getMap().getHiddenTypes();
        var hidden = (
            /* Hide the unit if it is a human and humans are hidden */
            (this.#human && hiddenTypes.includes("human")) ||
            /* Hide the unit if it is DCS controlled and DCS controlled units are hidden */
            (this.#controlled == false && hiddenTypes.includes("dcs")) ||
            /* Hide the unit if this specific category is hidden */
            (hiddenTypes.includes(this.getMarkerCategory())) ||
            /* Hide the unit if this coalition is hidden */
            (hiddenTypes.includes(this.#coalition)) ||
            /* Hide the unit if it does not belong to the commanded coalition and it is not detected by a method that can pinpoint its location (RWR does not count) */
            (!this.belongsToCommandedCoalition() && (this.#detectionMethods.length == 0 || (this.#detectionMethods.length == 1 && this.#detectionMethods[0] === RWR))) ||
            /* Hide the unit if grouping is activated, the unit is not the group leader, it is not selected, and the zoom is higher than the grouping threshold */
            (getApp().getMap().getVisibilityOptions()[HIDE_GROUP_MEMBERS] && !this.#isLeader && this.getCategory() == "GroundUnit" && getApp().getMap().getZoom() < GROUPING_ZOOM_TRANSITION && 
            (this.belongsToCommandedCoalition() || (!this.belongsToCommandedCoalition() && this.#detectionMethods.length == 0))));

        /* Force dead units to be hidden */
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

        /* Draw the range circles if the unit is not hidden */
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

        var loadouts = this.getDatabaseEntry()?.loadouts;
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
        return this.getDatabaseEntry()?.canTargetPoint === true;
    }

    canRearm() {
        return this.getDatabaseEntry()?.canRearm === true;
    }

    canAAA() {
        return this.getDatabaseEntry()?.canAAA === true;
    }

    indirectFire() {
        return this.getDatabaseEntry()?.indirectFire === true;
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

    delete(explosion: boolean, explosionType: string, immediate: boolean) {
        getApp().getServerManager().deleteUnit(this.ID, explosion, explosionType, immediate);
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
    onAdd(map: Map): this {
        super.onAdd(map);
        return this;
    }

    onGroupChanged(member: Unit) {
        this.#redrawMarker();
    }

    showFollowOptions(units: Unit[]) {
        var contextActionSet = new ContextActionSet();
       
        contextActionSet.addContextAction(this, 'trail', "Trail", "Follow unit in trail formation", () => this.applyFollowOptions('trail', units));
        contextActionSet.addContextAction(this, 'echelon-lh', "Echelon (LH)", "Follow unit in echelon left formation", () => this.applyFollowOptions('echelon-lh', units));
        contextActionSet.addContextAction(this, 'echelon-rh', "Echelon (RH)", "Follow unit in echelon right formation", () => this.applyFollowOptions('echelon-rh', units));
        contextActionSet.addContextAction(this, 'line-abreast-lh', "Line abreast (LH)", "Follow unit in line abreast left formation", () => this.applyFollowOptions('line-abreast-lh', units));
        contextActionSet.addContextAction(this, 'line-abreast-rh', "Line abreast (RH)", "Follow unit in line abreast right formation", () => this.applyFollowOptions('line-abreast-rh', units));
        contextActionSet.addContextAction(this, 'front', "Front", "Fly in front of unit", () => this.applyFollowOptions('front', units));
        contextActionSet.addContextAction(this, 'diamond', "Diamond", "Follow unit in diamond formation", () => this.applyFollowOptions('diamond', units));
        contextActionSet.addContextAction(this, 'custom', "Custom", "Set a custom formation position", () => this.applyFollowOptions('custom', units));
        
        getApp().getMap().getUnitContextMenu().setContextActions(contextActionSet);
        getApp().getMap().showUnitContextMenu();
    }

    applyFollowOptions(formation: string, units: Unit[]) {
        if (formation === "custom") {
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

                    getApp().getUnitsManager().followUnit(this.ID, { "x": x, "y": y, "z": z }, undefined, units);
                }
            });
        }
        else {
            getApp().getUnitsManager().followUnit(this.ID, undefined, formation, units);
        }
    }

    /***********************************************/
    #onClick(e: any) {
        /*  Exit if we were waiting for a doubleclick */
        if (this.#waitingForDoubleClick) {
            return;
        }

        /* We'll wait for a doubleclick */
        this.#waitingForDoubleClick = true;
        this.#doubleClickTimer = window.setTimeout(() => {
            /* Still waiting so no doubleclick; do the click action */
            if (this.#waitingForDoubleClick) {
                if (getApp().getMap().getState() === IDLE || getApp().getMap().getState() === MOVE_UNIT || e.originalEvent.ctrlKey) {
                    if (!e.originalEvent.ctrlKey)
                        getApp().getUnitsManager().deselectAllUnits();

                    this.setSelected(!this.getSelected());
                }
            }

            /* No longer waiting for a doubleclick */
            this.#waitingForDoubleClick = false;
        }, 200);
    }

    #onDoubleClick(e: any) {
        /* Let single clicks work again */
        this.#waitingForDoubleClick = false;
        clearTimeout(this.#doubleClickTimer);

        /* Select all matching units in the viewport */
        const unitsManager = getApp().getUnitsManager();
        Object.values(unitsManager.getUnits()).forEach((unit: Unit) => {
            if (unit.getAlive() === true && unit.getName() === this.getName() && unit.isInViewport())
                unitsManager.selectUnit(unit.ID, false);
        });
    }

    #onContextMenu(e: any) {
        var contextActionSet = new ContextActionSet();

        var units = getApp().getUnitsManager().getSelectedUnits();
        if (!units.includes(this))
            units.push(this);

        units.forEach((unit: Unit) => {
            unit.appendContextActions(contextActionSet, this, null);
        })

        if (Object.keys(contextActionSet.getContextActions()).length > 0) {
            getApp().getMap().showUnitContextMenu(e.originalEvent.x, e.originalEvent.y, e.latlng);
            getApp().getMap().getUnitContextMenu().setContextActions(contextActionSet);
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

                /* Set health data */
                element.querySelector(".unit-health-level")?.setAttribute("style", `width: ${this.#health}%`);
                element.querySelector(".unit")?.toggleAttribute("data-has-low-health", this.#health < 20);

                /* Set dead/alive flag */
                element.querySelector(".unit")?.toggleAttribute("data-is-dead", !this.#alive);

                /* Set current unit state */
                if (this.#human) {                                // Unit is human
                    element.querySelector(".unit")?.setAttribute("data-state", "human");
                }
                else if (!this.#controlled) {                     // Unit is under DCS control (not Olympus)
                    element.querySelector(".unit")?.setAttribute("data-state", "dcs");
                }
                else if ((this.getCategory() == "Aircraft" || this.getCategory() == "Helicopter") && !this.#hasTask) {
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

    #redrawMarker() {
        this.removeFrom(getApp().getMap());
        this.#updateMarker();

        /* Activate the selection effects on the marker */
        this.getElement()?.querySelector(`.unit`)?.toggleAttribute("data-is-selected", this.getSelected());
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
            var engagementRange = this.getDatabase()?.getByName(this.getName())?.engagementRange ?? 0;
            var acquisitionRange = this.getDatabase()?.getByName(this.getName())?.acquisitionRange ?? 0;

            this.getGroupMembers().forEach((unit: Unit) => {
                if (unit.getAlive()) {
                    let unitEngagementRange = unit.getDatabase()?.getByName(unit.getName())?.engagementRange ?? 0;
                    let unitAcquisitionRange = unit.getDatabase()?.getByName(unit.getName())?.acquisitionRange ?? 0;

                    if (unitEngagementRange > engagementRange)
                        engagementRange = unitEngagementRange;

                    if (unitAcquisitionRange > acquisitionRange)
                        acquisitionRange = unitAcquisitionRange;
                }
            })

            if (acquisitionRange !== this.#acquisitionCircle.getRadius()) {
                this.#acquisitionCircle.setRadius(acquisitionRange);
            }

            if (engagementRange !== this.#engagementCircle.getRadius())
                this.#engagementCircle.setRadius(engagementRange);

            this.#engagementCircle.options.fillOpacity = this.getSelected() && getApp().getMap().getVisibilityOptions()[FILL_SELECTED_RING] ? 0.3 : 0;

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
                if (this.getPosition() != this.#acquisitionCircle.getLatLng())
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
                if (this.getPosition() != this.#engagementCircle.getLatLng())
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

    #onZoom(e: any) {
        if (this.checkZoomRedraw())
            this.#redrawMarker();
        this.#updateMarker();
    }
}

export abstract class AirUnit extends Unit {
    getIconOptions() {
        var belongsToCommandedCoalition = this.belongsToCommandedCoalition();
        return {
            showState: belongsToCommandedCoalition,
            showVvi: (belongsToCommandedCoalition || this.getDetectionMethods().some(value => [VISUAL, OPTIC, RADAR, IRST, DLINK].includes(value))),
            showHealth: false,
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

    appendContextActions(contextActionSet: ContextActionSet, targetUnit: Unit | null, targetPosition: LatLng | null) {
        if (targetUnit !== null) {
            if (targetUnit != this) {
                contextActionSet.addContextAction(this, "attack", "Attack unit", "Attack the unit using A/A or A/G weapons", (units: Unit[]) => { getApp().getUnitsManager().attackUnit(targetUnit.ID, units) });
                contextActionSet.addContextAction(this, "follow", "Follow unit", "Follow this unit in formation", (units: Unit[]) => { targetUnit.showFollowOptions(units); }, false); // Don't hide the context menu after the execution (to show the follow options)
            }
            if (targetUnit.getSelected()) {
                contextActionSet.addContextAction(this, "refuel", "Refuel", "Refuel units at the nearest AAR Tanker. If no tanker is available the unit will RTB", (units: Unit[]) => { getApp().getUnitsManager().refuel(units) });
            }
            if (getApp().getUnitsManager().getSelectedUnits().length == 1 && targetUnit === this) {
                contextActionSet.addContextAction(this, "center-map", "Center map", "Center the map on the unit and follow it", () => { getApp().getMap().centerOnUnit(this.ID); });
            }
        }

        if (targetPosition !== null) {
            contextActionSet.addContextAction(this, "bomb", "Precision bombing", "Precision bombing of a specific point", (units: Unit[]) => { getApp().getUnitsManager().bombPoint(targetPosition, units) });
            contextActionSet.addContextAction(this, "carpet-bomb", "Carpet bombing", "Carpet bombing close to a point", (units: Unit[]) => { getApp().getUnitsManager().carpetBomb(targetPosition, units) });
        }
    }
}

export class Aircraft extends AirUnit {
    constructor(ID: number) {
        super(ID);
    }

    getCategory() {
        return "Aircraft";
    }

    appendContextActions(contextActionSet: ContextActionSet, targetUnit: Unit | null, targetPosition: LatLng | null) {
        super.appendContextActions(contextActionSet, targetUnit, targetPosition);

        if (targetPosition === null && this.getSelected()) {
            contextActionSet.addContextAction(this, "refuel", "Refuel", "Refuel units at the nearest AAR Tanker. If no tanker is available the unit will RTB", (units: Unit[]) => { getApp().getUnitsManager().refuel(units) });
        }
    }
}

export class Helicopter extends AirUnit {
    constructor(ID: number) {
        super(ID);
    }

    getCategory() {
        return "Helicopter";
    }

    appendContextActions(contextActionSet: ContextActionSet, targetUnit: Unit | null, targetPosition: LatLng | null) {
        super.appendContextActions(contextActionSet, targetUnit, targetPosition);

        if (targetPosition !== null) 
            contextActionSet.addContextAction(this, "land-at-point", "Land here", "land at this precise location", (units: Unit[]) => { getApp().getUnitsManager().landAtPoint(targetPosition, units) });
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
            showHealth: true,
            showHotgroup: belongsToCommandedCoalition,
            showUnitIcon: (belongsToCommandedCoalition || this.getDetectionMethods().some(value => [VISUAL, OPTIC, RADAR, IRST, DLINK].includes(value))),
            showShortLabel: this.getDatabaseEntry()?.type === "SAM Site",
            showFuel: false,
            showAmmo: false,
            showSummary: false,
            showCallsign: belongsToCommandedCoalition,
            rotateToHeading: false
        };
    }

    appendContextActions(contextActionSet: ContextActionSet, targetUnit: Unit | null, targetPosition: LatLng | null) {
        contextActionSet.addContextAction(this, "group-ground", "Group ground units", "Create a group of ground units", (units: Unit[]) => { getApp().getUnitsManager().createGroup(units) });

        if (targetUnit !== null) {
            if (targetUnit != this) {
                contextActionSet.addContextAction(this, "attack", "Attack unit", "Attack the unit using A/A or A/G weapons", (units: Unit[]) => { getApp().getUnitsManager().attackUnit(targetUnit.ID, units) });
            }

            if (getApp().getUnitsManager().getSelectedUnits().length == 1 && targetUnit === this) {
                contextActionSet.addContextAction(this, "center-map", "Center map", "Center the map on the unit and follow it", () => { getApp().getMap().centerOnUnit(this.ID); });
            }
        }

        if (targetPosition !== null) {
            if (this.canTargetPoint()) {
                contextActionSet.addContextAction(this, "fire-at-area", "Fire at area", "Fire at a specific area on the ground", (units: Unit[]) => { getApp().getUnitsManager().fireAtArea(targetPosition, units) });
                contextActionSet.addContextAction(this, "simulate-fire-fight", "Simulate fire fight", "Simulate a fire fight by shooting randomly in a certain large area. WARNING: works correctly only on neutral units, blue or red units will aim", (units: Unit[]) => { getApp().getUnitsManager().fireAtArea(targetPosition, units) });
            }
        }
        else {
            if (this.canAAA()) {
                contextActionSet.addContextAction(this, "scenic-aaa", "Scenic AAA", "Shoot AAA in the air without aiming at any target, when a enemy unit gets close enough. WARNING: works correctly only on neutral units, blue or red units will aim", (units: Unit[]) => { getApp().getUnitsManager().scenicAAA(units) });
                contextActionSet.addContextAction(this, "miss-aaa", "Misson on purpose", "Shoot AAA towards the closest enemy unit, but don't aim precisely. WARNING: works correctly only on neutral units, blue or red units will aim", (units: Unit[]) => { getApp().getUnitsManager().missOnPurpose(units) });
            }
        }
    }

    getCategory() {
        return "GroundUnit";
    }

    getType() {
        var blueprint = groundUnitDatabase.getByName(this.getName());
        return blueprint?.type ? blueprint.type : "";
    }

    /* When a unit is a leader of a group, the map is zoomed out and grouping when zoomed out is enabled, check if the unit should be shown as a specific group. This is used to show a SAM battery instead of the group leader */
    getDatabaseEntry() {
        let unitWhenGrouped = null;
        if (!this.getSelected() && this.getIsLeader() && getApp().getMap().getVisibilityOptions()[HIDE_GROUP_MEMBERS] && getApp().getMap().getZoom() < GROUPING_ZOOM_TRANSITION) {
            unitWhenGrouped = this.getDatabase()?.getByName(this.getName())?.unitWhenGrouped ?? null;
            let member = this.getGroupMembers().reduce((prev: Unit | null, unit: Unit, index: number) => {
                if (unit.getDatabaseEntry()?.unitWhenGrouped != undefined)
                    return unit
                return prev;
            }, null);
            unitWhenGrouped = (member !== null ? member?.getDatabaseEntry()?.unitWhenGrouped : unitWhenGrouped);
        }
        if (unitWhenGrouped)
            return this.getDatabase()?.getByName(unitWhenGrouped);
        else
            return this.getDatabase()?.getByName(this.getName());
    }

    /* When we zoom past the grouping limit, grouping is enabled and the unit is a leader, we redraw the unit to apply any possible grouped marker */
    checkZoomRedraw(): boolean {
        return (this.getIsLeader() && getApp().getMap().getVisibilityOptions()[HIDE_GROUP_MEMBERS] &&
            (getApp().getMap().getZoom() >= GROUPING_ZOOM_TRANSITION && getApp().getMap().getPreviousZoom() < GROUPING_ZOOM_TRANSITION ||
                getApp().getMap().getZoom() < GROUPING_ZOOM_TRANSITION && getApp().getMap().getPreviousZoom() >= GROUPING_ZOOM_TRANSITION))
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
            showHealth: true,
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

    appendContextActions(contextActionSet: ContextActionSet, targetUnit: Unit | null, targetPosition: LatLng | null) {
        contextActionSet.addContextAction(this, "group-navy", "Group navy units", "Create a group of navy units", (units: Unit[]) => { getApp().getUnitsManager().createGroup(units) });

        if (targetUnit !== null) {
            if (targetUnit != this) {
                contextActionSet.addContextAction(this, "attack", "Attack unit", "Attack the unit using A/A or A/G weapons", (units: Unit[]) => { getApp().getUnitsManager().attackUnit(targetUnit.ID, units) });
            }
            if (getApp().getUnitsManager().getSelectedUnits().length == 1 && targetUnit === this) {
                contextActionSet.addContextAction(this, "center-map", "Center map", "Center the map on the unit and follow it", () => { getApp().getMap().centerOnUnit(this.ID); });
            }
        }

        if (targetPosition !== null) {
            contextActionSet.addContextAction(this, "fire-at-area", "Fire at area", "Fire at a specific area on the ground", (units: Unit[]) => { getApp().getUnitsManager().fireAtArea(targetPosition, units) });
        }
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
