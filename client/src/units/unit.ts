import { Marker, LatLng, Polyline, Icon, DivIcon, CircleMarker, Map } from 'leaflet';
import { getMap, getUnitsManager } from '..';
import { getMarkerCategoryByName, getUnitDatabaseByCategory, mToFt, msToKnots, rad2deg } from '../other/utils';
import { addDestination, attackUnit, changeAltitude, changeSpeed, createFormation as setLeader, deleteUnit, getUnits, landAt, setAltitude, setReactionToThreat, setROE, setSpeed, refuel, setAdvacedOptions, followUnit, setEmissionsCountermeasures, setSpeedType, setAltitudeType, setOnOff, setFollowRoads, bombPoint, carpetBomb, bombBuilding, fireAtArea } from '../server/server';
import { CustomMarker } from '../map/custommarker';
import { SVGInjector } from '@tanem/svg-injector';
import { UnitDatabase } from './unitdatabase';
import { TargetMarker } from '../map/targetmarker';
import { BOMBING, CARPET_BOMBING, FIRE_AT_AREA, IDLE, MOVE_UNIT, ROEs, emissionsCountermeasures, reactionsToThreat, states } from '../constants/constants';
import { GeneralSettings, Radio, TACAN, UnitData, UnitIconOptions } from '../@types/unit';

var pathIcon = new Icon({
    iconUrl: '/resources/theme/images/markers/marker-icon.png',
    shadowUrl: '/resources/theme/images/markers/marker-shadow.png',
    iconAnchor: [13, 41]
});

export class Unit extends CustomMarker {
    ID: number;

    #data: UnitData = {
        ID: 0,
        alive: false,
        human: false,
        controlled: false,
        hasTask: false,
        desiredAltitudeType: false,
        desiredSpeedType: false,
        isTanker: false,
        isAWACS: false,
        onOff: false,
        followRoads: false,
        EPLRS: false,
        generalSettings: {
            prohibitAA: false,
            prohibitAfterburner: false,
            prohibitAG: false,
            prohibitAirWpn: false,
            prohibitJettison: false
        },
        position: new LatLng(0, 0),
        speed: 0,
        heading: 0,
        fuel: 0,
        desiredSpeed: 0,
        desiredAltitude: 0,
        targetID: 0,
        leaderID: 0,
        targetPosition:  new LatLng(0, 0),
        state: states[0],
        ROE: ROEs[0],
        reactionToThreat: reactionsToThreat[0],
        emissionsCountermeasures: emissionsCountermeasures[0],
        TACAN: {
            isOn: false,
            XY: 'X',
            callsign: '',
            channel: 0
        },
        radio: {
            frequency: 0,
            callsign: 0,
            callsignNumber: 0
        },
        activePath: [],
        ammo: [],
        contacts: [],
        name: "",
        unitName: "",
        groupName: "",
        category: "",
        coalition: "",    
        task: ""  
    };

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

    static getConstructor(type: string) {
        if (type === "GroundUnit") return GroundUnit;
        if (type === "Aircraft") return Aircraft;
        if (type === "Helicopter") return Helicopter;
        if (type === "Missile") return Missile;
        if (type === "Bomb") return Bomb;
        if (type === "NavyUnit") return NavyUnit;
    }

    constructor(ID: number, data: UnitData) {
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

        /* Set the unit data */
        this.setData(data);
    }

    getMarkerCategory() {
        // Overloaded by child classes
        // TODO convert to use getMarkerCategoryByName 
        return "";
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

    setSelected(selected: boolean) {
        /* Only alive units can be selected. Some units are not selectable (weapons) */
        if ((this.getData().alive || !selected) && this.getSelectable() && this.getSelected() != selected) {
            this.#selected = selected;
            this.getElement()?.querySelector(`[data-object|="unit"]`)?.toggleAttribute("data-is-selected", selected);
            if (selected) {
                document.dispatchEvent(new CustomEvent("unitSelection", { detail: this }));
                this.#updateMarker();
            }
            else {
                document.dispatchEvent(new CustomEvent("unitDeselection", { detail: this }));
                this.#clearDetectedUnits();
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
        return Object.values(getUnitsManager().getUnits()).filter((unit: Unit) => {return unit != this && unit.getData().groupName === this.getData().groupName;});
    }

    /********************** Unit data *************************/
    setData(data: UnitData) {
        /* Check if data has changed comparing new values to old values */
        const positionChanged = this.getData().position.lat != data.position.lat || this.getData().position.lng != data.position.lng;
        const headingChanged = this.getData().heading != data.heading;
        const aliveChanged = this.getData().alive != data.alive;
        const stateChanged = this.getData().state != data.state;
        const controlledChanged = this.getData().controlled != data.controlled;
        var updateMarker = positionChanged || headingChanged || aliveChanged || stateChanged || controlledChanged || !getMap().hasLayer(this);

        /* Assign the data */
        /* TODO Allow for partial updates */
        this.#data = data;
        
        /* Fire an event when a unit dies */
        if (aliveChanged && this.getData().alive == false)
            document.dispatchEvent(new CustomEvent("unitDeath", { detail: this }));

        /* Dead units can't be selected */
        this.setSelected(this.getSelected() && this.getData().alive && !this.getHidden())

        if (updateMarker)
            this.#updateMarker();

        // TODO dont delete the polylines of the detected units
        this.#clearDetectedUnits();
        if (this.getSelected()) {
            this.#drawPath();
            this.#drawDetectedUnits();
            this.#drawTarget();
        }
        else {
            this.#clearPath();
            this.#clearTarget();
        }
            
        document.dispatchEvent(new CustomEvent("unitUpdated", { detail: this }));
    }

    getData() {
        return this.#data;
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
        el.setAttribute("data-coalition", this.getData().coalition);

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
        if (this.getIconOptions().showState){
            var state = document.createElement("div");
            state.classList.add("unit-state");
            el.appendChild(state);
        }

        // Short label
        if (this.getIconOptions().showShortLabel) {
            var shortLabel = document.createElement("div");
            shortLabel.classList.add("unit-short-label");
            shortLabel.innerText = getUnitDatabaseByCategory(this.getMarkerCategory())?.getByName(this.getData().name)?.shortLabel || ""; 
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
        if (this.getIconOptions().showAmmo){ 
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
            callsign.innerText = this.getData().unitName;
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
        if (this.getData().human && hiddenUnits.includes("human"))
            hidden = true;
        else if (this.getData().controlled == false && hiddenUnits.includes("dcs"))
            hidden = true;
        else if (hiddenUnits.includes(this.getMarkerCategory()))
            hidden = true;
        else if (hiddenUnits.includes(this.getData().coalition))
            hidden = true;
        this.setHidden(hidden || !this.getData().alive);
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
        return getUnitsManager().getUnitByID(this.getData().leaderID);
    }

    canFulfillRole(roles: string | string[]) {
        if (typeof(roles) === "string") 
            roles = [roles];

        return this.getDatabase()?.getByName(this.getData().name)?.loadouts.some((loadout: LoadoutBlueprint) => {
            return (roles as string[]).some((role: string) => {return loadout.roles.includes(role)});
        });
    }

    /********************** Unit commands *************************/
    addDestination(latlng: L.LatLng) {
        if (!this.getData().human) {
            var path: any = {};
            if (this.getData().activePath.length > 0) {
                path = this.getData().activePath;
                path[(Object.keys(path).length + 1).toString()] = latlng;
            }
            else {
                path = { "1": latlng };
            }
            addDestination(this.ID, path);
        }
    }

    clearDestinations() {
        if (!this.getData().human)
            this.getData().activePath = [];
    }

    attackUnit(targetID: number) {
        /* Units can't attack themselves */
        if (!this.getData().human)
            if (this.ID != targetID)
                attackUnit(this.ID, targetID);
    }

    followUnit(targetID: number, offset: { "x": number, "y": number, "z": number }) {
        /* Units can't follow themselves */
        if (!this.getData().human)
            if (this.ID != targetID)
                followUnit(this.ID, targetID, offset);
    }

    landAt(latlng: LatLng) {
        if (!this.getData().human)
            landAt(this.ID, latlng);
    }

    changeSpeed(speedChange: string) {
        if (!this.getData().human)
            changeSpeed(this.ID, speedChange);
    }

    changeAltitude(altitudeChange: string) {
        if (!this.getData().human)
            changeAltitude(this.ID, altitudeChange);
    }

    setSpeed(speed: number) {
        if (!this.getData().human)
            setSpeed(this.ID, speed);
    }

    setSpeedType(speedType: string) {
        if (!this.getData().human)
            setSpeedType(this.ID, speedType);
    }

    setAltitude(altitude: number) {
        if (!this.getData().human)
            setAltitude(this.ID, altitude);
    }

    setAltitudeType(altitudeType: string) {
        if (!this.getData().human)
            setAltitudeType(this.ID, altitudeType);
    }

    setROE(ROE: string) {
        if (!this.getData().human)
            setROE(this.ID, ROE);
    }

    setReactionToThreat(reactionToThreat: string) {
        if (!this.getData().human)
            setReactionToThreat(this.ID, reactionToThreat);
    }

    setEmissionsCountermeasures(emissionCountermeasure: string) {
        if (!this.getData().human)
            setEmissionsCountermeasures(this.ID, emissionCountermeasure);
    }

    setLeader(isLeader: boolean, wingmenIDs: number[] = []) {
        if (!this.getData().human)
            setLeader(this.ID, isLeader, wingmenIDs);
    }

    setOnOff(onOff: boolean) {
        if (!this.getData().human)
            setOnOff(this.ID, onOff);
    }

    setFollowRoads(followRoads: boolean) {
        if (!this.getData().human)
            setFollowRoads(this.ID, followRoads);
    }

    delete(explosion: boolean) {
        deleteUnit(this.ID, explosion);
    }

    refuel() {
        if (!this.getData().human)
            refuel(this.ID);
    }

    setAdvancedOptions(isTanker: boolean, isAWACS: boolean, TACAN: TACAN, radio: Radio, generalSettings: GeneralSettings) {
        if (!this.getData().human)
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
        if (getUnitsManager().getUnitByID(this.ID) == null)
            getMap().removeTemporaryMarker(new LatLng(this.getData().position.lat, this.getData().position.lng));
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
        var options: {[key: string]: {text: string, tooltip: string}} = {};
        const selectedUnits = getUnitsManager().getSelectedUnits();
        const selectedUnitTypes = getUnitsManager().getSelectedUnitsTypes();

        options["center-map"] = {text: "Center map", tooltip: "Center the map on the unit and follow it"};

        if (selectedUnits.length > 0 && !(selectedUnits.length == 1 && (selectedUnits.includes(this)))) {
            options["attack"] = {text: "Attack", tooltip: "Attack the unit using A/A or A/G weapons"};
            if (getUnitsManager().getSelectedUnitsTypes().length == 1 && getUnitsManager().getSelectedUnitsTypes()[0] === "Aircraft")
                options["follow"] = {text: "Follow", tooltip: "Follow the unit at a user defined distance and position"};;
        }
        else if ((selectedUnits.length > 0 && (selectedUnits.includes(this))) || selectedUnits.length == 0) {
            if (this.getData().category == "Aircraft") {
                options["refuel"] = {text: "Air to air refuel", tooltip: "Refuel unit at the nearest AAR Tanker. If no tanker is available the unit will RTB."}; // TODO Add some way of knowing which aircraft can AAR
            }
        }

        if ((selectedUnits.length === 0 && this.getData().category == "Aircraft") || (selectedUnitTypes.length === 1 && ["Aircraft"].includes(selectedUnitTypes[0]))) 
        {
            if (selectedUnits.concat([this]).every((unit: Unit) => {return unit.canFulfillRole(["CAS", "Strike"])})) {
                options["bomb"] = {text: "Precision bombing", tooltip: "Precision bombing of a specific point"};
                options["carpet-bomb"] = {text: "Carpet bombing", tooltip: "Carpet bombing close to a point"};
            }
        }

        if ((selectedUnits.length === 0 && this.getData().category == "GroundUnit") || selectedUnitTypes.length === 1 && ["GroundUnit"].includes(selectedUnitTypes[0])) {
            if (selectedUnits.concat([this]).every((unit: Unit) => {return unit.canFulfillRole(["Gun Artillery", "Rocket Artillery", "Infantry", "IFV", "Tank"])}))
            options["fire-at-area"] = {text: "Fire at area", tooltip: "Fire at a large area"};  
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
        var options: {[key: string]: {text: string, tooltip: string}} = {};

        options = {
            'trail': {text: "Trail", tooltip: "Follow unit in trail formation"},
            'echelon-lh': {text: "Echelon (LH)", tooltip: "Follow unit in echelon left formation"},
            'echelon-rh': {text: "Echelon (RH)", tooltip: "Follow unit in echelon right formation"},
            'line-abreast-lh': {text: "Line abreast (LH)", tooltip: "Follow unit in line abreast left formation"},
            'line-abreast-rh': {text: "Line abreast (RH)", tooltip: "Follow unit in line abreast right formation"},
            'front': {text: "Front", tooltip: "Fly in front of unit"},
            'diamond': {text: "Diamond", tooltip: "Follow unit in diamond formation"},
            'custom': {text: "Custom", tooltip: "Set a custom formation position"},
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
        if (this.getData().alive) {
            if (this.#miniMapMarker == null) {
                this.#miniMapMarker = new CircleMarker(new LatLng(this.getData().position.lat, this.getData().position.lng), { radius: 0.5 });
                if (this.getData().coalition == "neutral")
                    this.#miniMapMarker.setStyle({ color: "#CFD9E8" });
                else if (this.getData().coalition == "red")
                    this.#miniMapMarker.setStyle({ color: "#ff5858" });
                else
                    this.#miniMapMarker.setStyle({ color: "#247be2" });
                this.#miniMapMarker.addTo(getMap().getMiniMapLayerGroup());
                this.#miniMapMarker.bringToBack();
            }
            else {
                this.#miniMapMarker.setLatLng(new LatLng(this.getData().position.lat, this.getData().position.lng));
                this.#miniMapMarker.bringToBack();
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
            this.setLatLng(new LatLng(this.getData().position.lat, this.getData().position.lng));

            var element = this.getElement();
            if (element != null) {
                /* Draw the velocity vector */
                element.querySelector(".unit-vvi")?.setAttribute("style", `height: ${15 + this.getData().speed / 5}px;`);

                /* Set fuel data */
                element.querySelector(".unit-fuel-level")?.setAttribute("style", `width: ${this.getData().fuel}%`);
                element.querySelector(".unit")?.toggleAttribute("data-has-low-fuel", this.getData().fuel < 20);

                /* Set dead/alive flag */
                element.querySelector(".unit")?.toggleAttribute("data-is-dead", !this.getData().alive);

                /* Set current unit state */
                if (this.getData().human)                       // Unit is human
                    element.querySelector(".unit")?.setAttribute("data-state", "human");
                else if (!this.getData().controlled)            // Unit is under DCS control (not Olympus)
                    element.querySelector(".unit")?.setAttribute("data-state", "dcs");
                else if ((this.getData().category == "Aircraft" || this.getData().category == "Helicopter") && !this.getData().hasTask)
                    element.querySelector(".unit")?.setAttribute("data-state", "no-task");
                else                                            // Unit is under Olympus control
                    element.querySelector(".unit")?.setAttribute("data-state", this.getData().state.toLowerCase());

                /* Set altitude and speed */
                if (element.querySelector(".unit-altitude"))
                    (<HTMLElement>element.querySelector(".unit-altitude")).innerText = "FL" + String(Math.floor(mToFt(this.getData().position.alt as number) / 100));
                if (element.querySelector(".unit-speed"))
                    (<HTMLElement>element.querySelector(".unit-speed")).innerText = String(Math.floor(msToKnots(this.getData().speed))) + "GS";

                /* Rotate elements according to heading */
                element.querySelectorAll("[data-rotate-to-heading]").forEach(el => {
                    const headingDeg = rad2deg(this.getData().heading);
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
                Object.values(this.getData().ammo).forEach((ammo: any) => {
                    if (ammo.desc.category == 1 && ammo.desc.missileCategory == 1) {
                        if (ammo.desc.guidance == 4 || ammo.desc.guidance == 5)
                            newHasFox1 = true;
                        else if (ammo.desc.guidance == 2)
                            newHasFox2 = true;
                        else if (ammo.desc.guidance == 3)
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
            this.setZIndexOffset(1000 + Math.floor(this.getData().position.alt as number) - pos.y + (this.#highlighted || this.#selected ? 5000 : 0));
        }
    }

    #drawPath() {
        if (this.getData().activePath != undefined) {
            var points = [];
            points.push(new LatLng(this.getData().position.lat, this.getData().position.lng));

            /* Add markers if missing */
            while (this.#pathMarkers.length < Object.keys(this.getData().activePath).length) {
                var marker = new Marker([0, 0], { icon: pathIcon }).addTo(getMap());
                this.#pathMarkers.push(marker);
            }

            /* Remove markers if too many */
            while (this.#pathMarkers.length > Object.keys(this.getData().activePath).length) {
                getMap().removeLayer(this.#pathMarkers[this.#pathMarkers.length - 1]);
                this.#pathMarkers.splice(this.#pathMarkers.length - 1, 1)
            }

            /* Update the position of the existing markers (to avoid creating markers uselessly) */
            for (let WP in this.getData().activePath) {
                var destination = this.getData().activePath[WP];
                this.#pathMarkers[parseInt(WP) - 1].setLatLng([destination.lat, destination.lng]);
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

    #drawDetectedUnits() {
        for (let index in this.getData().contacts) {
            var targetData = this.getData().contacts[index];
            var target = getUnitsManager().getUnitByID(targetData.ID)
            if (target != null) {
                var startLatLng = new LatLng(this.getData().position.lat, this.getData().position.lng)
                var endLatLng = new LatLng(target.getData().position.lat, target.getData().position.lng)

                var color;
                if (targetData.detectionMethod === 1)
                    color = "#FF00FF";
                else if (targetData.detectionMethod === 4)
                    color = "#FFFF00";
                else if (targetData.detectionMethod === 16)
                    color = "#00FF00";
                else
                    color = "#FFFFFF";
                var targetPolyline = new Polyline([startLatLng, endLatLng], { color: color, weight: 3, opacity: 0.4, smoothFactor: 1, dashArray: "4, 8" });
                targetPolyline.addTo(getMap());
                this.#contactsPolylines.push(targetPolyline)
            }
        }
    }

    #clearDetectedUnits() {
        for (let index in this.#contactsPolylines) {
            getMap().removeLayer(this.#contactsPolylines[index])
        }
    }

    #drawTarget() {
        if (this.getData().targetPosition.lat != 0 && this.getData().targetPosition.lng != 0) {
            this.#drawtargetPosition(this.getData().targetPosition);
        }
        else if (this.getData().targetID != 0 && getUnitsManager().getUnitByID(this.getData().targetID)) {
            const position = getUnitsManager().getUnitByID(this.getData().targetID)?.getData().position;
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
        this.#targetPositionPolyline.setLatLngs([new LatLng(this.getData().position.lat, this.getData().position.lng), new LatLng(targetPosition.lat, targetPosition.lng)])
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
    constructor(ID: number, data: UnitData) {
        super(ID, data);
    }

    getMarkerCategory() {
        return "aircraft";
    }
}

export class Helicopter extends AirUnit {
    constructor(ID: number, data: UnitData) {
        super(ID, data);
    }

    getMarkerCategory() {
        return "helicopter";
    }
}

export class GroundUnit extends Unit {
    constructor(ID: number, data: UnitData) {
        super(ID, data);
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

    getMarkerCategory() {
        return getMarkerCategoryByName(this.getData().name);
    }
}

export class NavyUnit extends Unit {
    constructor(ID: number, data: UnitData) {
        super(ID, data);
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

    getMarkerCategory() {
        return "navyunit";
    }
}

export class Weapon extends Unit {
    constructor(ID: number, data: UnitData) {
        super(ID, data);
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
