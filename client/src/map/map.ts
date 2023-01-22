import * as L from "leaflet"
import { getSelectionWheel, getSelectionScroll, getUnitsManager, getActiveCoalition } from "..";
import { spawnAircraft, spawnGroundUnit, spawnSmoke } from "../dcs/dcs";
import { payloadNames } from "../units/payloadNames";
import { unitTypes } from "../units/unitTypes";
import { BoxSelect } from "./boxselect";

L.Map.addInitHook('addHandler', 'boxSelect', BoxSelect);

export interface ClickEvent {
    x: number;
    y: number;
    latlng: L.LatLng;
}

export interface SpawnEvent extends ClickEvent{
    airbaseName: string | null;
    coalitionID: number | null;
}

export class Map extends L.Map {
    #state: string;
    #layer?: L.TileLayer;
    #preventRightClick: boolean = false;
    #rightClickTimer: number = 0;

    constructor(ID: string) {
        /* Init the leaflet map */
        //@ts-ignore
        super(ID, { doubleClickZoom: false, zoomControl: false, boxZoom: false, boxSelect: true });
        this.setView([37.23, -115.8], 12);

        this.setLayer("ArcGIS Satellite");

        /* Init the state machine */
        this.#state = "IDLE";

        /* Register event handles */
        this.on("click", (e: any) => this.#onClick(e));
        this.on("dblclick", (e: any) => this.#onDoubleClick(e));      
        this.on("contextmenu", (e: any) => this.#onContextMenu(e));
        this.on('selectionend', (e: any) => this.#onSelectionEnd(e));
    }

    setLayer(layerName: string) {
        if (this.#layer != null) {
            this.removeLayer(this.#layer)
        }

        if (layerName == "ArcGIS Satellite") {
            this.#layer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
                attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
            });
        }
        else if (layerName == "USGS Topo") {
            this.#layer = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 20,
                attribution: 'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>'
            });
        }
        else if (layerName == "OpenStreetMap Mapnik") {
            this.#layer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            });
        }
        else if (layerName == "OPENVKarte") {
            this.#layer = L.tileLayer('https://tileserver.memomaps.de/tilegen/{z}/{x}/{y}.png', {
                maxZoom: 18,
                attribution: 'Map <a href="https://memomaps.de/">memomaps.de</a> <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            });
        }
        else if (layerName == "Esri.DeLorme") {
            this.#layer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Specialty/DeLorme_World_Base_Map/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Copyright: &copy;2012 DeLorme',
                minZoom: 1,
                maxZoom: 11
            });
        }
        else if (layerName == "CyclOSM") {
            this.#layer = L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
                maxZoom: 20,
                attribution: '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> | Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            });
        }
        this.#layer?.addTo(this);
    }

    getLayers() {
        return ["ArcGIS Satellite", "USGS Topo", "OpenStreetMap Mapnik", "OPENVKarte", "Esri.DeLorme", "CyclOSM"]
    }

    /* State machine */
    setState(state: string) {
        this.#state = state;

        if (this.#state === "IDLE") {

        }
        else if (this.#state === "MOVE_UNIT") {

        }
        else if (this.#state === "ATTACK") {

        }
        else if (this.#state === "FORMATION") {

        }
    }

    getState() {
        return this.#state;
    }

    /* Selection wheel */
    showSelectionWheel(e: ClickEvent | SpawnEvent, options: any, showCoalition: boolean) {
        var x = e.x;
        var y = e.y;
        getSelectionWheel().show(x, y, options, showCoalition);
    }

    hideSelectionWheel() {
        getSelectionWheel().hide();
    }

    /* Selection scroll */
    showSelectionScroll(e: ClickEvent | SpawnEvent, options: any, callback: CallableFunction) {
        var x = e.x;
        var y = e.y;
        getSelectionScroll().show(x, y, options, callback);
    }

    hideSelectionScroll() {
        getSelectionScroll().hide();
    }

    /* Event handlers */
    #onClick(e: any) {
        this.hideSelectionWheel();
        this.hideSelectionScroll();
        if (this.#state === "IDLE") {

        }
        else if (this.#state === "MOVE_UNIT") {
            if (!e.originalEvent.ctrlKey) {
                getUnitsManager().clearDestinations();
            }
            getUnitsManager().addDestination(e.latlng)
        }
    }

    #onDoubleClick(e: any) {
        var spawnEvent: SpawnEvent = {x: e.originalEvent.x, y: e.originalEvent.y, latlng: e.latlng, airbaseName: null, coalitionID: null};
        if (this.#state == "IDLE") {
            var options = [
                { "tooltip": "Spawn air unit", "src": "spawnAir.png", "callback": () => this.#aircraftSpawnMenu(spawnEvent) },
                { "tooltip": "Spawn ground unit", "src": "spawnGround.png", "callback": () => this.#groundUnitSpawnMenu(spawnEvent) },
                { "tooltip": "Smoke", "src": "spawnSmoke.png", "callback": () => this.#smokeSpawnMenu(spawnEvent) },
                //{ "tooltip": "Explosion", "src": "spawnExplosion.png", "callback": () => this.#explosionSpawnMenu(e) }
            ]
            this.showSelectionWheel(spawnEvent, options, true);
        }
    }

    #onContextMenu(e: any) {
        this.#rightClickTimer = setTimeout(() => {
            if (!this.#preventRightClick) {
                this.setState("IDLE");
                getUnitsManager().deselectAllUnits();
                this.hideSelectionWheel();
                this.hideSelectionScroll();
            }
            this.#preventRightClick = false;
        }, 200);
    }

    #onSelectionEnd(e: any)
    {
        clearTimeout(this.#rightClickTimer);
        this.#preventRightClick = true;
        getUnitsManager().selectFromBounds(e.selectionBounds);
    }

    /* Spawn from air base */
    spawnFromAirbase(e: SpawnEvent)
    {
        this.#aircraftSpawnMenu(e);
    }

    /* Spawning menus */
    #groundUnitSpawnMenu(e: SpawnEvent) {
        var options = [
            {'coalition': true, 'tooltip': 'Howitzer',   'src': 'spawnHowitzer.png', 'callback': () => this.#selectGroundUnit(e, "Howitzers")},
            {'coalition': true, 'tooltip': 'SAM',        'src': 'spawnSAM.png',      'callback': () => this.#selectGroundUnit(e, "SAM")},
            {'coalition': true, 'tooltip': 'IFV',        'src': 'spawnIFV.png',      'callback': () => this.#selectGroundUnit(e, "IFV")},
            {'coalition': true, 'tooltip': 'Tank',       'src': 'spawnTank.png',     'callback': () => this.#selectGroundUnit(e, "Tanks")},
            {'coalition': true, 'tooltip': 'MLRS',       'src': 'spawnMLRS.png',     'callback': () => this.#selectGroundUnit(e, "MLRS")},
            {'coalition': true, 'tooltip': 'Radar',      'src': 'spawnRadar.png',    'callback': () => this.#selectGroundUnit(e, "Radar")},
            {'coalition': true, 'tooltip': 'Unarmed',    'src': 'spawnUnarmed.png',  'callback': () => this.#selectGroundUnit(e, "Unarmed")}
        ]
        this.showSelectionWheel(e, options, true);
    }

    #smokeSpawnMenu(e: SpawnEvent) {
        this.hideSelectionWheel();
        this.hideSelectionScroll();
        var options = [
            {'tooltip': 'Red smoke',      'src': 'spawnSmoke.png',  'callback': () => {this.hideSelectionWheel(); this.hideSelectionScroll(); spawnSmoke('red', e.latlng)}, 'tint': 'red'},
            {'tooltip': 'White smoke',    'src': 'spawnSmoke.png',  'callback': () => {this.hideSelectionWheel(); this.hideSelectionScroll(); spawnSmoke('white', e.latlng)}, 'tint': 'white'},
            {'tooltip': 'Blue smoke',     'src': 'spawnSmoke.png',  'callback': () => {this.hideSelectionWheel(); this.hideSelectionScroll(); spawnSmoke('blue', e.latlng)}, 'tint': 'blue'},
            {'tooltip': 'Green smoke',    'src': 'spawnSmoke.png',  'callback': () => {this.hideSelectionWheel(); this.hideSelectionScroll(); spawnSmoke('green', e.latlng)}, 'tint': 'green'},
            {'tooltip': 'Orange smoke',   'src': 'spawnSmoke.png',  'callback': () => {this.hideSelectionWheel(); this.hideSelectionScroll(); spawnSmoke('orange', e.latlng)}, 'tint': 'orange'},
        ]
        this.showSelectionWheel(e, options, true);
    }

    #explosionSpawnMenu(e: SpawnEvent) {

    }

    #aircraftSpawnMenu(e: SpawnEvent) {
        var options = [
            { 'coalition': true, 'tooltip': 'CAP', 'src': 'spawnCAP.png', 'callback': () => this.#selectAircraft(e, "CAP") },
            { 'coalition': true, 'tooltip': 'CAS', 'src': 'spawnCAS.png', 'callback': () => this.#selectAircraft(e, "CAS") },
            { 'coalition': true, 'tooltip': 'Tanker', 'src': 'spawnTanker.png', 'callback': () => this.#selectAircraft(e, "tanker") },
            { 'coalition': true, 'tooltip': 'AWACS', 'src': 'spawnAWACS.png', 'callback': () => this.#selectAircraft(e, "awacs") },
            { 'coalition': true, 'tooltip': 'Strike', 'src': 'spawnStrike.png', 'callback': () => this.#selectAircraft(e, "strike") },
            { 'coalition': true, 'tooltip': 'Drone', 'src': 'spawnDrone.png', 'callback': () => this.#selectAircraft(e, "drone") },
            { 'coalition': true, 'tooltip': 'Transport', 'src': 'spawnTransport.png', 'callback': () => this.#selectAircraft(e, "transport") },
        ]
        this.showSelectionWheel(e, options, true);
    }

    /* Show unit selection for air units */
    #selectAircraft(e: SpawnEvent, group: string) {
        this.hideSelectionWheel();
        this.hideSelectionScroll();
        var options = unitTypes.air[group];
        options.sort();
        this.showSelectionScroll(e, options, (unitType: string) => {
            this.hideSelectionWheel();
            this.hideSelectionScroll();
            this.#unitSelectPayload(e, unitType);
        });
    }

    /* Show weapon selection for air units */
    #unitSelectPayload(e: SpawnEvent, unitType: string) {
        this.hideSelectionWheel();
        this.hideSelectionScroll();
        var options = [];
        options = payloadNames[unitType]
        if (options != undefined && options.length > 0) {
            options.sort();
            this.showSelectionScroll({x: e.x, y: e.y, latlng: e.latlng}, options, (payloadName: string) => {
                this.hideSelectionWheel();
                this.hideSelectionScroll();
                spawnAircraft(unitType, e.latlng, getActiveCoalition(), payloadName, e.airbaseName);
            });
        }
        else {
            spawnAircraft(unitType, e.latlng, getActiveCoalition());
        }
    }

    /* Show unit selection for ground units */
    #selectGroundUnit(e: any, group: string)
    {
        this.hideSelectionWheel();
        this.hideSelectionScroll();
        var options = unitTypes.vehicles[group];
        options.sort();
        this.showSelectionScroll(e, options, (unitType: string) => {
            this.hideSelectionWheel();
            this.hideSelectionScroll();
            spawnGroundUnit(unitType, e.latlng, getActiveCoalition());
        });
    }
} 
