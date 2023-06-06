import { Marker, LatLng, Polyline, Icon, DivIcon, CircleMarker, Map } from 'leaflet';
import { getMap, getUnitsManager } from '..';
import { mToFt, msToKnots, rad2deg } from '../other/utils';
import { addDestination, attackUnit, changeAltitude, changeSpeed, createFormation as setLeader, deleteUnit, getUnits, landAt, setAltitude, setReactionToThreat, setROE, setSpeed, refuel, setAdvacedOptions, followUnit, setEmissionsCountermeasures, setSpeedType, setAltitudeType, setOnOff, setFollowRoads } from '../server/server';
import { aircraftDatabase } from './aircraftdatabase';
import { groundUnitsDatabase } from './groundunitsdatabase';
import { CustomMarker } from '../map/custommarker';
import { SVGInjector } from '@tanem/svg-injector';
import { UnitDatabase } from './unitdatabase';

var pathIcon = new Icon({
    iconUrl: '/resources/theme/images/markers/marker-icon.png',
    shadowUrl: '/resources/theme/images/markers/marker-shadow.png',
    iconAnchor: [13, 41]
});

export class Unit extends CustomMarker {
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
            leaderID: 0
        },
        taskData: {
            currentState: "NONE",
            currentTask: "",
            activePath: {},
            targetSpeed: 0,
            targetSpeedType: "GS",
            targetAltitude: 0,
            targetAltitudeType: "AGL",
            isTanker: false,
            isAWACS: false,
            onOff: true,
            followRoads: false
        },
        optionsData: {
            ROE: "",
            reactionToThreat: "",
            emissionsCountermeasures: "",
            TACAN: { isOn: false, channel: 0, XY: "X", callsign: "" },
            radio: { frequency: 0, callsign: 1, callsignNumber: 1},
            generalSettings: { prohibitJettison: false, prohibitAA: false, prohibitAG: false, prohibitAfterburner: false, prohibitAirWpn: false}
        }
    };

    #selectable: boolean;
    #selected: boolean = false;
    #hidden: boolean = false;
    #highlighted: boolean = false;

    #preventClick: boolean = false;

    #pathMarkers: Marker[] = [];
    #pathPolyline: Polyline;
    #targetsPolylines: Polyline[];
    #miniMapMarker: CircleMarker | null = null;

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

    constructor(ID: number, data: UpdateData) {
        super(new LatLng(0, 0), { riseOnHover: true, keyboard: false });

        this.ID = ID;

        this.#selectable = true;

        this.on('click', (e) => this.#onClick(e));
        this.on('dblclick', (e) => this.#onDoubleClick(e));
        this.on('contextmenu', (e) => this.#onContextMenu(e));
        this.on('mouseover', () => { this.setHighlighted(true); })
        this.on('mouseout', () => { this.setHighlighted(false); })

        this.#pathPolyline = new Polyline([], { color: '#2d3e50', weight: 3, opacity: 0.5, smoothFactor: 1 });
        this.#pathPolyline.addTo(getMap());
        this.#targetsPolylines = [];

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
        return "";
    }

    getDatabase(): UnitDatabase | null {
        // Overloaded by child classes
        return null;
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
        if ((this.getBaseData().alive || !selected) && this.getSelectable() && this.getSelected() != selected) {
            this.#selected = selected;
            this.getElement()?.querySelector(`[data-object|="unit"]`)?.toggleAttribute("data-is-selected", selected);
            if (selected)
                document.dispatchEvent(new CustomEvent("unitSelection", { detail: this }));
            else 
                document.dispatchEvent(new CustomEvent("unitDeselection", { detail: this }));
            this.getGroupMembers().forEach((unit: Unit) => unit.setSelected(selected));
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
        return Object.values(getUnitsManager().getUnits()).filter((unit: Unit) => {return unit != this && unit.getBaseData().groupName === this.getBaseData().groupName;});
    }

    /********************** Unit data *************************/
    setData(data: UpdateData) {
        /* Check if data has changed comparing new values to old values */
        const positionChanged = (data.flightData != undefined && data.flightData.latitude != undefined && data.flightData.longitude != undefined && (this.getFlightData().latitude != data.flightData.latitude || this.getFlightData().longitude != data.flightData.longitude));
        const headingChanged = (data.flightData != undefined && data.flightData.heading != undefined && this.getFlightData().heading != data.flightData.heading);
        const aliveChanged = (data.baseData != undefined && data.baseData.alive != undefined && this.getBaseData().alive != data.baseData.alive);
        var updateMarker = (positionChanged || headingChanged || aliveChanged || !getMap().hasLayer(this));

        /* Load the data from the received json */
        Object.keys(this.#data).forEach((key1: string) => {
            Object.keys(this.#data[key1 as keyof(UnitData)]).forEach((key2: string) => {
                if (key1 in data && key2 in data[key1]) {
                    var value1 = this.#data[key1 as keyof(UnitData)];
                    var value2 = value1[key2 as keyof typeof value1];
                    if (typeof data[key1][key2] === typeof value2 || typeof value2 === "undefined")
                        //@ts-ignore
                        this.#data[key1 as keyof(UnitData)][key2 as keyof typeof struct] = data[key1][key2];
                }
            });
        });
        
        /* Fire an event when a unit dies */
        if (aliveChanged && this.getBaseData().alive == false)
            document.dispatchEvent(new CustomEvent("unitDeath", { detail: this }));

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

        document.dispatchEvent(new CustomEvent("unitUpdated", { detail: this }));
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
        el.setAttribute("data-coalition", this.getMissionData().coalition);

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
            shortLabel.innerText = this.getDatabase()?.getByName(this.getBaseData().name)?.shortLabel || ""; 
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
            callsign.innerText = this.getBaseData().unitName;
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
        if (this.getMissionData().flags.Human && hiddenUnits.includes("human"))
            hidden = true;
        else if (this.getBaseData().AI == false && hiddenUnits.includes("dcs"))
            hidden = true;
        else if (hiddenUnits.includes(this.getMarkerCategory()))
            hidden = true;
        else if (hiddenUnits.includes(this.getMissionData().coalition))
            hidden = true;
        this.setHidden(hidden || !this.getBaseData().alive);
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
        return getUnitsManager().getUnitByID(this.getFormationData().leaderID);
    }

    /********************** Unit commands *************************/
    addDestination(latlng: L.LatLng) {
        if (!this.getMissionData().flags.Human) {
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
    }

    clearDestinations() {
        if (!this.getMissionData().flags.Human)
            this.getTaskData().activePath = undefined;
    }

    attackUnit(targetID: number) {
        /* Units can't attack themselves */
        if (!this.getMissionData().flags.Human)
            if (this.ID != targetID)
                attackUnit(this.ID, targetID);
    }

    followUnit(targetID: number, offset: { "x": number, "y": number, "z": number }) {
        /* Units can't follow themselves */
        if (!this.getMissionData().flags.Human)
            if (this.ID != targetID)
                followUnit(this.ID, targetID, offset);
    }

    landAt(latlng: LatLng) {
        if (!this.getMissionData().flags.Human)
            landAt(this.ID, latlng);
    }

    changeSpeed(speedChange: string) {
        if (!this.getMissionData().flags.Human)
            changeSpeed(this.ID, speedChange);
    }

    changeAltitude(altitudeChange: string) {
        if (!this.getMissionData().flags.Human)
            changeAltitude(this.ID, altitudeChange);
    }

    setSpeed(speed: number) {
        if (!this.getMissionData().flags.Human)
            setSpeed(this.ID, speed);
    }

    setSpeedType(speedType: string) {
        if (!this.getMissionData().flags.Human)
            setSpeedType(this.ID, speedType);
    }

    setAltitude(altitude: number) {
        if (!this.getMissionData().flags.Human)
            setAltitude(this.ID, altitude);
    }

    setAltitudeType(altitudeType: string) {
        if (!this.getMissionData().flags.Human)
            setAltitudeType(this.ID, altitudeType);
    }

    setROE(ROE: string) {
        if (!this.getMissionData().flags.Human)
            setROE(this.ID, ROE);
    }

    setReactionToThreat(reactionToThreat: string) {
        if (!this.getMissionData().flags.Human)
            setReactionToThreat(this.ID, reactionToThreat);
    }

    setEmissionsCountermeasures(emissionCountermeasure: string) {
        if (!this.getMissionData().flags.Human)
            setEmissionsCountermeasures(this.ID, emissionCountermeasure);
    }

    setLeader(isLeader: boolean, wingmenIDs: number[] = []) {
        if (!this.getMissionData().flags.Human)
            setLeader(this.ID, isLeader, wingmenIDs);
    }

    setOnOff(onOff: boolean) {
        if (!this.getMissionData().flags.Human)
            setOnOff(this.ID, onOff);
    }

    setFollowRoads(followRoads: boolean) {
        if (!this.getMissionData().flags.Human)
            setFollowRoads(this.ID, followRoads);
    }

    delete(explosion: boolean) {
        deleteUnit(this.ID, explosion);
    }

    refuel() {
        if (!this.getMissionData().flags.Human)
            refuel(this.ID);
    }

    setAdvancedOptions(isTanker: boolean, isAWACS: boolean, TACAN: TACAN, radio: Radio, generalSettings: GeneralSettings) {
        if (!this.getMissionData().flags.Human)
            setAdvacedOptions(this.ID, isTanker, isAWACS, TACAN, radio, generalSettings);
    }

    /***********************************************/
    onAdd(map: Map): this {
        super.onAdd(map);
        getMap().removeTemporaryMarker(new LatLng(this.getFlightData().latitude, this.getFlightData().longitude));
        return this;
    }

    /***********************************************/
    #onClick(e: any) {
        if (!this.#preventClick) {
            if (getMap().getState() === 'IDLE' || getMap().getState() === 'MOVE_UNIT' || e.originalEvent.ctrlKey) {
                if (!e.originalEvent.ctrlKey) {
                    getUnitsManager().deselectAllUnits();
                }
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

        options["center-map"] = {text: "Center map", tooltip: "Center the map on the unit and follow it"};

        if (getUnitsManager().getSelectedUnits().length > 0 && !(getUnitsManager().getSelectedUnits().length == 1 && (getUnitsManager().getSelectedUnits().includes(this)))) {
            options["attack"] = {text: "Attack", tooltip: "Attack the unit using A/A or A/G weapons"};
            if (getUnitsManager().getSelectedUnitsTypes().length == 1 && getUnitsManager().getSelectedUnitsTypes()[0] === "Aircraft")
                options["follow"] = {text: "Follow", tooltip: "Follow the unit at a user defined distance and position"};;
        }
        else if ((getUnitsManager().getSelectedUnits().length > 0 && (getUnitsManager().getSelectedUnits().includes(this))) || getUnitsManager().getSelectedUnits().length == 0) {
            if (this.getBaseData().category == "Aircraft") {
                options["refuel"] = {text: "AAR Refuel", tooltip: "Refuel unit at the nearest AAR Tanker. If no tanker is available the unit will RTB."}; // TODO Add some way of knowing which aircraft can AAR
            }
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
        if (this.getBaseData().alive) {
            if (this.#miniMapMarker == null) {
                this.#miniMapMarker = new CircleMarker(new LatLng(this.getFlightData().latitude, this.getFlightData().longitude), { radius: 0.5 });
                if (this.getMissionData().coalition == "neutral")
                    this.#miniMapMarker.setStyle({ color: "#CFD9E8" });
                else if (this.getMissionData().coalition == "red")
                    this.#miniMapMarker.setStyle({ color: "#ff5858" });
                else
                    this.#miniMapMarker.setStyle({ color: "#247be2" });
                this.#miniMapMarker.addTo(getMap().getMiniMapLayerGroup());
                this.#miniMapMarker.bringToBack();
            }
            else {
                this.#miniMapMarker.setLatLng(new LatLng(this.getFlightData().latitude, this.getFlightData().longitude));
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
            this.setLatLng(new LatLng(this.getFlightData().latitude, this.getFlightData().longitude));

            var element = this.getElement();
            if (element != null) {
                /* Draw the velocity vector */
                element.querySelector(".unit-vvi")?.setAttribute("style", `height: ${15 + this.getFlightData().speed / 5}px;`);

                /* Set fuel data */
                element.querySelector(".unit-fuel-level")?.setAttribute("style", `width: ${this.getMissionData().fuel}%`);
                element.querySelector(".unit")?.toggleAttribute("data-has-low-fuel", this.getMissionData().fuel < 20);

                /* Set dead/alive flag */
                element.querySelector(".unit")?.toggleAttribute("data-is-dead", !this.getBaseData().alive);

                /* Set current unit state */
                if (this.getMissionData().flags.Human)     // Unit is human
                    element.querySelector(".unit")?.setAttribute("data-state", "human");
                else if (!this.getBaseData().AI)            // Unit is under DCS control (not Olympus)
                    element.querySelector(".unit")?.setAttribute("data-state", "dcs");
                else                                        // Unit is under Olympus control
                    element.querySelector(".unit")?.setAttribute("data-state", this.getTaskData().currentState.toLowerCase());

                /* Set altitude and speed */
                if (element.querySelector(".unit-altitude"))
                    (<HTMLElement>element.querySelector(".unit-altitude")).innerText = "FL" + String(Math.floor(mToFt(this.getFlightData().altitude) / 100));
                if (element.querySelector(".unit-speed"))
                    (<HTMLElement>element.querySelector(".unit-speed")).innerText = String(Math.floor(msToKnots(this.getFlightData().speed))) + "GS";

                /* Rotate elements according to heading */
                element.querySelectorAll("[data-rotate-to-heading]").forEach(el => {
                    const headingDeg = rad2deg(this.getFlightData().heading);
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
                Object.values(this.getMissionData().ammo).forEach((ammo: any) => {
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
            this.setZIndexOffset(1000 + Math.floor(this.getFlightData().altitude) - pos.y + (this.#highlighted || this.#selected ? 5000 : 0));
        }
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

    #drawTargets() {
        for (let index in this.getMissionData().targets) {
            var targetData = this.getMissionData().targets[index];
            if (targetData.object != undefined){
                var target = getUnitsManager().getUnitByID(targetData.object["id_"])
                if (target != null) {
                    var startLatLng = new LatLng(this.getFlightData().latitude, this.getFlightData().longitude)
                    var endLatLng = new LatLng(target.getFlightData().latitude, target.getFlightData().longitude)

                    var color;
                    if (targetData.detectionMethod === "RADAR")
                        color = "#FFFF00";
                    else if (targetData.detectionMethod === "VISUAL")
                        color = "#FF00FF";
                    else if (targetData.detectionMethod === "RWR")
                        color = "#00FF00";
                    else
                        color = "#FFFFFF";
                    var targetPolyline = new Polyline([startLatLng, endLatLng], { color: color, weight: 3, opacity: 0.4, smoothFactor: 1 });
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

    getDatabase(): UnitDatabase | null {
        return aircraftDatabase;
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
        // TODO this is very messy
        var role = groundUnitsDatabase.getByName(this.getBaseData().name)?.loadouts[0].roles[0];
        var markerCategory = (role === "SAM") ? "groundunit-sam" : "groundunit-other";
        return markerCategory;
    }

    getDatabase(): UnitDatabase | null {
        return groundUnitsDatabase;
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
