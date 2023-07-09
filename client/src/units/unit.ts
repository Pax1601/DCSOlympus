import { Marker, LatLng, Polyline, Icon, DivIcon, CircleMarker, Map } from 'leaflet';
import { getMap, getUnitsManager } from '..';
import { enumToCoalition, enumToEmissioNCountermeasure, getMarkerCategoryByName, enumToROE, enumToReactionToThreat, enumToState, getUnitDatabaseByCategory, mToFt, msToKnots, rad2deg } from '../other/utils';
import { addDestination, attackUnit, changeAltitude, changeSpeed, createFormation as setLeader, deleteUnit, getUnits, landAt, setAltitude, setReactionToThreat, setROE, setSpeed, refuel, setAdvacedOptions, followUnit, setEmissionsCountermeasures, setSpeedType, setAltitudeType, setOnOff, setFollowRoads, bombPoint, carpetBomb, bombBuilding, fireAtArea } from '../server/server';
import { CustomMarker } from '../map/custommarker';
import { SVGInjector } from '@tanem/svg-injector';
import { UnitDatabase } from './unitdatabase';
import { TargetMarker } from '../map/targetmarker';
import { BOMBING, CARPET_BOMBING, DataIndexes, FIRE_AT_AREA, IDLE, MOVE_UNIT, ROEs, emissionsCountermeasures, reactionsToThreat, states } from '../constants/constants';
import { Ammo, Contact, GeneralSettings, Offset, Radio, TACAN, UnitIconOptions } from '../@types/unit';
import { DataExtractor } from './dataextractor';

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
    #heading: number = 0;
    #isTanker: boolean = false;
    #isAWACS: boolean = false;
    #onOff: boolean = true;
    #followRoads: boolean = false;
    #fuel: number = 0;
    #desiredSpeed: number = 0;
    #desiredSpeedType: string = "GS";
    #desiredAltitude: number = 0;
    #desiredAltitudeType: string = "AGL";
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

    #selectable: boolean;
    #selected: boolean = false;
    #hidden: boolean = false;
    #highlighted: boolean = false;
    #preventClick: boolean = false;
    #pathMarkers: Marker[] = [];
    #pathPolyline: Polyline;
    #contactsPolylines: Polyline[];
    #miniMapMarker: CircleMarker | null = null;
    #targetPositionMarker: TargetMarker;
    #targetPositionPolyline: Polyline;
    #timer: number = 0;
    #hotgroup: number | null = null;

    getAlive() {return this.#alive};
    getHuman() {return this.#human};
    getControlled() {return this.#controlled};
    getCoalition() {return this.#coalition};
    getCountry() {return this.#country};
    getName() {return this.#name};
    getUnitName() {return this.#unitName};
    getGroupName() {return this.#groupName};
    getState() {return this.#state};
    getTask() {return this.#task};
    getHasTask() {return this.#hasTask};
    getPosition() {return this.#position};
    getSpeed() {return this.#speed};
    getHeading() {return this.#heading};
    getIsTanker() {return this.#isTanker};
    getIsAWACS() {return this.#isAWACS};
    getOnOff() {return this.#onOff};
    getFollowRoads() {return this.#followRoads};
    getFuel() {return this.#fuel};
    getDesiredSpeed() {return this.#desiredSpeed};
    getDesiredSpeedType() {return this.#desiredSpeedType};
    getDesiredAltitude() {return this.#desiredAltitude};
    getDesiredAltitudeType() {return this.#desiredAltitudeType};
    getLeaderID() {return this.#leaderID};
    getFormationOffset() {return this.#formationOffset};
    getTargetID() {return this.#targetID};
    getTargetPosition() {return this.#targetPosition};
    getROE() {return this.#ROE};
    getReactionToThreat() {return this.#reactionToThreat};
    getEmissionsCountermeasures() {return this.#emissionsCountermeasures};
    getTACAN() {return this.#TACAN};
    getRadio() {return this.#radio};
    getGeneralSettings() {return this.#generalSettings};
    getAmmo() {return this.#ammo};
    getContacts() {return this.#contacts};
    getActivePath() {return this.#activePath};

    static getConstructor(type: string) {
        if (type === "GroundUnit") return GroundUnit;
        if (type === "Aircraft") return Aircraft;
        if (type === "Helicopter") return Helicopter;
        if (type === "Missile") return Missile;
        if (type === "Bomb") return Bomb;
        if (type === "NavyUnit") return NavyUnit;
    }

    constructor(ID: number) {
        super(new LatLng(0, 0), { riseOnHover: true, keyboard: false });

        this.ID = ID;
        this.#selectable = true;

        this.#pathPolyline = new Polyline([], { color: '#2d3e50', weight: 3, opacity: 0.5, smoothFactor: 1 });
        this.#pathPolyline.addTo(getMap());
        this.#contactsPolylines = [];
        this.#targetPositionMarker = new TargetMarker(new LatLng(0, 0));
        this.#targetPositionPolyline = new Polyline([], { color: '#FF0000', weight: 3, opacity: 0.5, smoothFactor: 1 });

        this.on('click', (e) => this.#onClick(e));
        this.on('dblclick', (e) => this.#onDoubleClick(e));
        this.on('contextmenu', (e) => this.#onContextMenu(e));
        this.on('mouseover', () => { this.setHighlighted(true); })
        this.on('mouseout', () => { this.setHighlighted(false); })

        /* Deselect units if they are hidden */
        document.addEventListener("toggleCoalitionVisibility", (ev: CustomEventInit) => {
            window.setTimeout(() => { this.setSelected(this.getSelected() && !this.getHidden()) }, 300);
        });

        document.addEventListener("toggleUnitVisibility", (ev: CustomEventInit) => {
            window.setTimeout(() => { this.setSelected(this.getSelected() && !this.getHidden()) }, 300);
        });
    }

    getCategory() {
        // Overloaded by child classes
        return "";
    }

    /********************** Unit data *************************/
    setData(dataExtractor: DataExtractor) {
        var updateMarker = !getMap().hasLayer(this);

        var datumIndex = 0;
        while (datumIndex != DataIndexes.endOfData) {
            datumIndex = dataExtractor.extractUInt8();
            switch (datumIndex) {
                case DataIndexes.category: dataExtractor.extractString(); break;
                case DataIndexes.alive: this.setAlive(dataExtractor.extractBool()); updateMarker = true; break;
                case DataIndexes.human: this.#human = dataExtractor.extractBool(); break;
                case DataIndexes.controlled: this.#controlled = dataExtractor.extractBool(); updateMarker = true; break;
                case DataIndexes.coalition: this.#coalition = enumToCoalition(dataExtractor.extractUInt8()); break;
                case DataIndexes.country: this.#country = dataExtractor.extractUInt8(); break;
                case DataIndexes.name: this.#name = dataExtractor.extractString(); break;
                case DataIndexes.unitName: this.#unitName = dataExtractor.extractString(); break;
                case DataIndexes.groupName: this.#groupName = dataExtractor.extractString(); break;
                case DataIndexes.state: this.#state = enumToState(dataExtractor.extractUInt8()); updateMarker = true; break;
                case DataIndexes.task: this.#task = dataExtractor.extractString(); break;
                case DataIndexes.hasTask: this.#hasTask = dataExtractor.extractBool(); break;
                case DataIndexes.position: this.#position = dataExtractor.extractLatLng(); updateMarker = true; break;
                case DataIndexes.speed: this.#speed = dataExtractor.extractFloat64(); updateMarker = true; break;
                case DataIndexes.heading: this.#heading = dataExtractor.extractFloat64(); updateMarker = true; break;
                case DataIndexes.isTanker: this.#isTanker = dataExtractor.extractBool(); break;
                case DataIndexes.isAWACS: this.#isAWACS = dataExtractor.extractBool(); break;
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
                case DataIndexes.contacts: this.#contacts = dataExtractor.extractContacts(); break;
                case DataIndexes.activePath: this.#activePath = dataExtractor.extractActivePath(); break;
            }
        }
        
        /* Dead units can't be selected */
        this.setSelected(this.getSelected() && this.#alive && !this.getHidden())

        if (updateMarker)
            this.#updateMarker();

        // TODO dont delete the polylines of the detected units
        this.#clearContacts();
        if (this.getSelected()) {
            this.#drawPath();
            this.#drawContacts();
            this.#drawTarget();
        }
        else {
            this.#clearPath();
            this.#clearTarget();
        }

        document.dispatchEvent(new CustomEvent("unitUpdated", { detail: this }));
    }

    getData() {
        return {
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
            heading: this.#heading,
            isTanker: this.#isTanker,
            isAWACS: this.#isAWACS,
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
            activePath: this.#activePath
        }
    }

    getMarkerCategory(): string {
        return getMarkerCategoryByName(this.getName());
    }

    getDatabase(): UnitDatabase | null {
        return getUnitDatabaseByCategory(this.getMarkerCategory());
    }

    getIconOptions(): UnitIconOptions {
        // Default values, overloaded by child classes if needed
        return {
            showState: false,
            showVvi: false,
            showHotgroup: false,
            showUnitIcon: true,
            showShortLabel: false,
            showFuel: false,
            showAmmo: false,
            showSummary: false,
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
        if ((this.#alive || !selected) && this.getSelectable() && this.getSelected() != selected) {
            this.#selected = selected;
            this.getElement()?.querySelector(`[data-object|="unit"]`)?.toggleAttribute("data-is-selected", selected);
            if (selected) {
                document.dispatchEvent(new CustomEvent("unitSelection", { detail: this }));
                this.#updateMarker();
            }
            else {
                document.dispatchEvent(new CustomEvent("unitDeselection", { detail: this }));
                this.#clearContacts();
                this.#clearPath();
                this.#clearTarget();
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
        return Object.values(getUnitsManager().getUnits()).filter((unit: Unit) => { return unit != this && unit.#groupName === this.#groupName; });
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

        // Generate and append elements depending on active options          
        // Velocity vector
        if (this.getIconOptions().showVvi) {
            var vvi = document.createElement("div");
            vvi.classList.add("unit-vvi");
            vvi.toggleAttribute("data-rotate-to-heading");
            el.append(vvi);
        }

        // Hotgroup indicator
        if (this.getIconOptions().showHotgroup) {
            var hotgroup = document.createElement("div");
            hotgroup.classList.add("unit-hotgroup");
            var hotgroupId = document.createElement("div");
            hotgroupId.classList.add("unit-hotgroup-id");
            hotgroup.appendChild(hotgroupId);
            el.append(hotgroup);
        }

        // Main icon
        if (this.getIconOptions().showUnitIcon) {
            var unitIcon = document.createElement("div");
            unitIcon.classList.add("unit-icon");
            var img = document.createElement("img");
            img.src = `/resources/theme/images/units/${this.getMarkerCategory()}.svg`;
            img.onload = () => SVGInjector(img);
            unitIcon.appendChild(img);
            unitIcon.toggleAttribute("data-rotate-to-heading", this.getIconOptions().rotateToHeading);
            el.append(unitIcon);
        }

        // State icon
        if (this.getIconOptions().showState) {
            var state = document.createElement("div");
            state.classList.add("unit-state");
            el.appendChild(state);
        }

        // Short label
        if (this.getIconOptions().showShortLabel) {
            var shortLabel = document.createElement("div");
            shortLabel.classList.add("unit-short-label");
            shortLabel.innerText = getUnitDatabaseByCategory(this.getMarkerCategory())?.getByName(this.#name)?.shortLabel || "";
            el.append(shortLabel);
        }

        // Fuel indicator
        if (this.getIconOptions().showFuel) {
            var fuelIndicator = document.createElement("div");
            fuelIndicator.classList.add("unit-fuel");
            var fuelLevel = document.createElement("div");
            fuelLevel.classList.add("unit-fuel-level");
            fuelIndicator.appendChild(fuelLevel);
            el.append(fuelIndicator);
        }

        // Ammo indicator
        if (this.getIconOptions().showAmmo) {
            var ammoIndicator = document.createElement("div");
            ammoIndicator.classList.add("unit-ammo");
            for (let i = 0; i <= 3; i++)
                ammoIndicator.appendChild(document.createElement("div"));
            el.append(ammoIndicator);
        }

        // Unit summary
        if (this.getIconOptions().showSummary) {
            var summary = document.createElement("div");
            summary.classList.add("unit-summary");
            var callsign = document.createElement("div");
            callsign.classList.add("unit-callsign");
            callsign.innerText = this.#unitName;
            var altitude = document.createElement("div");
            altitude.classList.add("unit-altitude");
            var speed = document.createElement("div");
            speed.classList.add("unit-speed");
            summary.appendChild(callsign);
            summary.appendChild(altitude);
            summary.appendChild(speed);
            el.appendChild(summary);
        }

        this.getElement()?.appendChild(el);
    }

    /********************** Visibility *************************/
    updateVisibility() {
        var hidden = false;
        const hiddenUnits = getUnitsManager().getHiddenTypes();
        if (this.#human && hiddenUnits.includes("human"))
            hidden = true;
        else if (this.#controlled == false && hiddenUnits.includes("dcs"))
            hidden = true;
        else if (hiddenUnits.includes(this.getMarkerCategory()))
            hidden = true;
        else if (hiddenUnits.includes(this.#coalition))
            hidden = true;
        this.setHidden(hidden || !this.#alive);
    }

    setHidden(hidden: boolean) {
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
        return getUnitsManager().getUnitByID(this.#leaderID);
    }

    canFulfillRole(roles: string | string[]) {
        if (typeof (roles) === "string")
            roles = [roles];

        return this.getDatabase()?.getByName(this.#name)?.loadouts.some((loadout: LoadoutBlueprint) => {
            return (roles as string[]).some((role: string) => { return loadout.roles.includes(role) });
        });
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
            addDestination(this.ID, path);
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
                attackUnit(this.ID, targetID);
    }

    followUnit(targetID: number, offset: { "x": number, "y": number, "z": number }) {
        /* Units can't follow themselves */
        if (!this.#human)
            if (this.ID != targetID)
                followUnit(this.ID, targetID, offset);
    }

    landAt(latlng: LatLng) {
        if (!this.#human)
            landAt(this.ID, latlng);
    }

    changeSpeed(speedChange: string) {
        if (!this.#human)
            changeSpeed(this.ID, speedChange);
    }

    changeAltitude(altitudeChange: string) {
        if (!this.#human)
            changeAltitude(this.ID, altitudeChange);
    }

    setSpeed(speed: number) {
        if (!this.#human)
            setSpeed(this.ID, speed);
    }

    setSpeedType(speedType: string) {
        if (!this.#human)
            setSpeedType(this.ID, speedType);
    }

    setAltitude(altitude: number) {
        if (!this.#human)
            setAltitude(this.ID, altitude);
    }

    setAltitudeType(altitudeType: string) {
        if (!this.#human)
            setAltitudeType(this.ID, altitudeType);
    }

    setROE(ROE: string) {
        if (!this.#human)
            setROE(this.ID, ROE);
    }

    setReactionToThreat(reactionToThreat: string) {
        if (!this.#human)
            setReactionToThreat(this.ID, reactionToThreat);
    }

    setEmissionsCountermeasures(emissionCountermeasure: string) {
        if (!this.#human)
            setEmissionsCountermeasures(this.ID, emissionCountermeasure);
    }

    setLeader(isLeader: boolean, wingmenIDs: number[] = []) {
        if (!this.#human)
            setLeader(this.ID, isLeader, wingmenIDs);
    }

    setOnOff(onOff: boolean) {
        if (!this.#human)
            setOnOff(this.ID, onOff);
    }

    setFollowRoads(followRoads: boolean) {
        if (!this.#human)
            setFollowRoads(this.ID, followRoads);
    }

    delete(explosion: boolean) {
        deleteUnit(this.ID, explosion);
    }

    refuel() {
        if (!this.#human)
            refuel(this.ID);
    }

    setAdvancedOptions(isTanker: boolean, isAWACS: boolean, TACAN: TACAN, radio: Radio, generalSettings: GeneralSettings) {
        if (!this.#human)
            setAdvacedOptions(this.ID, isTanker, isAWACS, TACAN, radio, generalSettings);
    }

    bombPoint(latlng: LatLng) {
        bombPoint(this.ID, latlng);
    }

    carpetBomb(latlng: LatLng) {
        carpetBomb(this.ID, latlng);
    }

    bombBuilding(latlng: LatLng) {
        bombBuilding(this.ID, latlng);
    }

    fireAtArea(latlng: LatLng) {
        fireAtArea(this.ID, latlng);
    }

    /***********************************************/
    onAdd(map: Map): this {
        super.onAdd(map);
        /* If this is the first time adding this unit to the map, remove the temporary marker */
        getMap().removeTemporaryMarker(new LatLng(this.#position.lat, this.#position.lng));
        return this;
    }

    /***********************************************/
    #onClick(e: any) {
        if (!this.#preventClick) {
            if (getMap().getState() === IDLE || getMap().getState() === MOVE_UNIT || e.originalEvent.ctrlKey) {
                if (!e.originalEvent.ctrlKey)
                    getUnitsManager().deselectAllUnits();
                this.setSelected(!this.getSelected());
            }
        }

        this.#timer = window.setTimeout(() => {
            this.#preventClick = false;
        }, 200);
    }

    #onDoubleClick(e: any) {
        clearTimeout(this.#timer);
        this.#preventClick = true;
    }

    #onContextMenu(e: any) {
        var options: { [key: string]: { text: string, tooltip: string } } = {};
        const selectedUnits = getUnitsManager().getSelectedUnits();
        const selectedUnitTypes = getUnitsManager().getSelectedUnitsTypes();

        options["center-map"] = { text: "Center map", tooltip: "Center the map on the unit and follow it" };

        if (selectedUnits.length > 0 && !(selectedUnits.length == 1 && (selectedUnits.includes(this)))) {
            options["attack"] = { text: "Attack", tooltip: "Attack the unit using A/A or A/G weapons" };
            if (getUnitsManager().getSelectedUnitsTypes().length == 1 && getUnitsManager().getSelectedUnitsTypes()[0] === "Aircraft")
                options["follow"] = { text: "Follow", tooltip: "Follow the unit at a user defined distance and position" };;
        }
        else if ((selectedUnits.length > 0 && (selectedUnits.includes(this))) || selectedUnits.length == 0) {
            if (this.getCategory() == "Aircraft") {
                options["refuel"] = { text: "Air to air refuel", tooltip: "Refuel unit at the nearest AAR Tanker. If no tanker is available the unit will RTB." }; // TODO Add some way of knowing which aircraft can AAR
            }
        }

        if ((selectedUnits.length === 0 && this.getCategory() == "Aircraft") || (selectedUnitTypes.length === 1 && ["Aircraft"].includes(selectedUnitTypes[0]))) {
            if (selectedUnits.concat([this]).every((unit: Unit) => { return unit.canFulfillRole(["CAS", "Strike"]) })) {
                options["bomb"] = { text: "Precision bombing", tooltip: "Precision bombing of a specific point" };
                options["carpet-bomb"] = { text: "Carpet bombing", tooltip: "Carpet bombing close to a point" };
            }
        }

        if ((selectedUnits.length === 0 && this.getCategory() == "GroundUnit") || selectedUnitTypes.length === 1 && ["GroundUnit"].includes(selectedUnitTypes[0])) {
            if (selectedUnits.concat([this]).every((unit: Unit) => { return unit.canFulfillRole(["Gun Artillery", "Rocket Artillery", "Infantry", "IFV", "Tank"]) }))
                options["fire-at-area"] = { text: "Fire at area", tooltip: "Fire at a large area" };
        }

        if (Object.keys(options).length > 0) {
            getMap().showUnitContextMenu(e);
            getMap().getUnitContextMenu().setOptions(options, (option: string) => {
                getMap().hideUnitContextMenu();
                this.#executeAction(e, option);
            });
        }
    }

    #executeAction(e: any, action: string) {
        if (action === "center-map")
            getMap().centerOnUnit(this.ID);
        if (action === "attack")
            getUnitsManager().selectedUnitsAttackUnit(this.ID);
        else if (action === "refuel")
            getUnitsManager().selectedUnitsRefuel();
        else if (action === "follow")
            this.#showFollowOptions(e);
        else if (action === "bomb")
            getMap().setState(BOMBING);
        else if (action === "carpet-bomb")
            getMap().setState(CARPET_BOMBING);
        else if (action === "fire-at-area")
            getMap().setState(FIRE_AT_AREA);
    }

    #showFollowOptions(e: any) {
        var options: { [key: string]: { text: string, tooltip: string } } = {};

        options = {
            'trail': { text: "Trail", tooltip: "Follow unit in trail formation" },
            'echelon-lh': { text: "Echelon (LH)", tooltip: "Follow unit in echelon left formation" },
            'echelon-rh': { text: "Echelon (RH)", tooltip: "Follow unit in echelon right formation" },
            'line-abreast-lh': { text: "Line abreast (LH)", tooltip: "Follow unit in line abreast left formation" },
            'line-abreast-rh': { text: "Line abreast (RH)", tooltip: "Follow unit in line abreast right formation" },
            'front': { text: "Front", tooltip: "Fly in front of unit" },
            'diamond': { text: "Diamond", tooltip: "Follow unit in diamond formation" },
            'custom': { text: "Custom", tooltip: "Set a custom formation position" },
        }

        getMap().getUnitContextMenu().setOptions(options, (option: string) => {
            getMap().hideUnitContextMenu();
            this.#applyFollowOptions(option);
        });
        getMap().showUnitContextMenu(e);
    }

    #applyFollowOptions(action: string) {
        if (action === "custom") {
            document.getElementById("custom-formation-dialog")?.classList.remove("hide");
            getMap().getUnitContextMenu().setCustomFormationCallback((offset: { x: number, y: number, z: number }) => {
                getUnitsManager().selectedUnitsFollowUnit(this.ID, offset);
            })
        }
        else {
            getUnitsManager().selectedUnitsFollowUnit(this.ID, undefined, action);
        }
    }

    #updateMarker() {
        this.updateVisibility();

        /* Draw the minimap marker */
        if (this.#alive) {
            if (this.#miniMapMarker == null) {
                this.#miniMapMarker = new CircleMarker(new LatLng(this.#position.lat, this.#position.lng), { radius: 0.5 });
                if (this.#coalition == "neutral")
                    this.#miniMapMarker.setStyle({ color: "#CFD9E8" });
                else if (this.#coalition == "red")
                    this.#miniMapMarker.setStyle({ color: "#ff5858" });
                else
                    this.#miniMapMarker.setStyle({ color: "#247be2" });
                this.#miniMapMarker.addTo(getMap().getMiniMapLayerGroup());
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
            if (this.#miniMapMarker != null && getMap().getMiniMapLayerGroup().hasLayer(this.#miniMapMarker)) {
                getMap().getMiniMapLayerGroup().removeLayer(this.#miniMapMarker);
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
                if (this.#human)                       // Unit is human
                    element.querySelector(".unit")?.setAttribute("data-state", "human");
                else if (!this.#controlled)            // Unit is under DCS control (not Olympus)
                    element.querySelector(".unit")?.setAttribute("data-state", "dcs");
                else if ((this.getCategory() == "Aircraft" || this.getCategory() == "Helicopter") && !this.#hasTask)
                    element.querySelector(".unit")?.setAttribute("data-state", "no-task");
                else                                            // Unit is under Olympus control
                    element.querySelector(".unit")?.setAttribute("data-state", this.#state.toLowerCase());

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
            var pos = getMap().latLngToLayerPoint(this.getLatLng()).round();
            this.setZIndexOffset(1000 + Math.floor(this.#position.alt as number) - pos.y + (this.#highlighted || this.#selected ? 5000 : 0));
        }
    }

    #drawPath() {
        if (this.#activePath != undefined) {
            var points = [];
            points.push(new LatLng(this.#position.lat, this.#position.lng));

            /* Add markers if missing */
            while (this.#pathMarkers.length < Object.keys(this.#activePath).length) {
                var marker = new Marker([0, 0], { icon: pathIcon }).addTo(getMap());
                this.#pathMarkers.push(marker);
            }

            /* Remove markers if too many */
            while (this.#pathMarkers.length > Object.keys(this.#activePath).length) {
                getMap().removeLayer(this.#pathMarkers[this.#pathMarkers.length - 1]);
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
    }

    #clearPath() {
        for (let WP in this.#pathMarkers) {
            getMap().removeLayer(this.#pathMarkers[WP]);
        }
        this.#pathMarkers = [];
        this.#pathPolyline.setLatLngs([]);
    }

    #drawContacts() {
        for (let index in this.#contacts) {
            var contactData = this.#contacts[index];
            var contact = getUnitsManager().getUnitByID(contactData.ID)
            if (contact != null) {
                var startLatLng = new LatLng(this.#position.lat, this.#position.lng)
                var endLatLng = new LatLng(contact.#position.lat, contact.#position.lng)

                var color;
                if (contactData.detectionMethod === 1)
                    color = "#FF00FF";
                else if (contactData.detectionMethod === 4)
                    color = "#FFFF00";
                else if (contactData.detectionMethod === 16)
                    color = "#00FF00";
                else
                    color = "#FFFFFF";
                var contactPolyline = new Polyline([startLatLng, endLatLng], { color: color, weight: 3, opacity: 0.4, smoothFactor: 1, dashArray: "4, 8" });
                contactPolyline.addTo(getMap());
                this.#contactsPolylines.push(contactPolyline)
            }
        }
    }

    #clearContacts() {
        for (let index in this.#contactsPolylines) {
            getMap().removeLayer(this.#contactsPolylines[index])
        }
    }

    #drawTarget() {
        if (this.#targetPosition.lat != 0 && this.#targetPosition.lng != 0) {
            this.#drawtargetPosition(this.#targetPosition);
        }
        else if (this.#targetID != 0 && getUnitsManager().getUnitByID(this.#targetID)) {
            const position = getUnitsManager().getUnitByID(this.#targetID)?.getPosition();
            if (position)
                this.#drawtargetPosition(position);
        }
        else
            this.#clearTarget();
    }

    #drawtargetPosition(targetPosition: LatLng) {
        if (!getMap().hasLayer(this.#targetPositionMarker))
            this.#targetPositionMarker.addTo(getMap());
        if (!getMap().hasLayer(this.#targetPositionPolyline))
            this.#targetPositionPolyline.addTo(getMap());
        this.#targetPositionMarker.setLatLng(new LatLng(targetPosition.lat, targetPosition.lng));
        this.#targetPositionPolyline.setLatLngs([new LatLng(this.#position.lat, this.#position.lng), new LatLng(targetPosition.lat, targetPosition.lng)])
    }

    #clearTarget() {
        if (getMap().hasLayer(this.#targetPositionMarker))
            this.#targetPositionMarker.removeFrom(getMap());

        if (getMap().hasLayer(this.#targetPositionPolyline))
            this.#targetPositionPolyline.removeFrom(getMap());
    }
}

export class AirUnit extends Unit {
    getIconOptions() {
        return {
            showState: true,
            showVvi: true,
            showHotgroup: true,
            showUnitIcon: true,
            showShortLabel: true,
            showFuel: true,
            showAmmo: true,
            showSummary: true,
            rotateToHeading: false
        };
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
        return {
            showState: true,
            showVvi: false,
            showHotgroup: true,
            showUnitIcon: true,
            showShortLabel: false,
            showFuel: false,
            showAmmo: false,
            showSummary: false,
            rotateToHeading: false
        };
    }

    getCategory() {
        return "GroundUnit";
    }
}

export class NavyUnit extends Unit {
    constructor(ID: number) {
        super(ID);
    }

    getIconOptions() {
        return {
            showState: true,
            showVvi: false,
            showHotgroup: true,
            showUnitIcon: true,
            showShortLabel: true,
            showFuel: false,
            showAmmo: false,
            showSummary: false,
            rotateToHeading: false
        };
    }

    getCategory() {
        return "NavyUnit";
    }
}

export class Weapon extends Unit {
    constructor(ID: number) {
        super(ID);
        this.setSelectable(false);
    }

    getIconOptions() {
        return {
            showState: false,
            showVvi: false,
            showHotgroup: false,
            showUnitIcon: true,
            showShortLabel: false,
            showFuel: false,
            showAmmo: false,
            showSummary: false,
            rotateToHeading: true
        };
    }
}

export class Missile extends Weapon {
    constructor(ID: number) {
        super(ID);
    }

    getCategory() {
        return "Missile";
    }

    getMarkerCategory() {
        return "missile";
    }
}

export class Bomb extends Weapon {
    constructor(ID: number) {
        super(ID);
    }

    getCategory() {
        return "Bomb";
    }

    getMarkerCategory() {
        return "bomb";
    }
}
