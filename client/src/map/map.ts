import * as L from "leaflet"
import { getContextMenu, getUnitsManager, getActiveCoalition, getMouseInfoPanel } from "..";
import { spawnAircraft, spawnGroundUnit, spawnSmoke } from "../server/server";
import { bearing, distance, zeroAppend } from "../other/utils";
import { aircraftDatabase } from "../units/aircraftdatabase";
import { unitTypes } from "../units/unittypes";
import { BoxSelect } from "./boxselect";
import { ContextMenuOption } from "../@types/dom";

L.Map.addInitHook('addHandler', 'boxSelect', BoxSelect);

export interface ClickEvent {
    x: number;
    y: number;
    latlng: L.LatLng;
}

export interface SpawnEvent extends ClickEvent {
    airbaseName: string | null;
    coalitionID: number | null;
}

export class Map extends L.Map {
    #state: string;
    #layer: L.TileLayer | null = null;
    #preventLeftClick: boolean = false;
    #leftClickTimer: number = 0;
    #measurePoint: L.LatLng | null;
    #measureIcon: L.Icon;
    #measureMarker: L.Marker;
    #measureLine: L.Polyline = new L.Polyline([], { color: '#2d3e50', weight: 3, opacity: 0.5, smoothFactor: 1, interactive: false });
    #measureLineDiv: HTMLElement;
    #lastMousePosition: L.Point = new L.Point(0, 0);

    constructor(ID: string) {
        /* Init the leaflet map */
        //@ts-ignore
        super(ID, { doubleClickZoom: false, zoomControl: false, boxZoom: false, boxSelect: true });
        this.setView([37.23, -115.8], 12);

        this.setLayer("ArcGIS Satellite");

        /* Init the state machine */
        this.#state = "IDLE";
        this.#measurePoint = null;

        this.#measureIcon = new L.Icon({ iconUrl: 'images/pin.png', iconAnchor: [16, 32]});
        this.#measureMarker = new L.Marker([0, 0], {icon: this.#measureIcon, interactive: false});
        this.#measureLineDiv = document.createElement("div");
        this.#measureLineDiv.classList.add("ol-measure-box");
        this.#measureLineDiv.style.display = 'none';

        document.body.appendChild(this.#measureLineDiv);

        /* Register event handles */
        this.on("click", (e: any) => this.#onClick(e));
        this.on("dblclick", (e: any) => this.#onDoubleClick(e));      
        this.on("contextmenu", (e: any) => this.#onContextMenu(e));
        this.on('selectionend', (e: any) => this.#onSelectionEnd(e));
        this.on('mousedown', (e: any) => this.#onMouseDown(e));
        this.on('mouseup', (e: any) => this.#onMouseUp(e));
        this.on('mousemove', (e: any) => this.#onMouseMove(e));
        this.on('zoom', (e: any) => this.#onZoom(e));
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
            L.DomUtil.removeClass(this.getContainer(),'crosshair-cursor-enabled');
        }
        else if (this.#state === "MOVE_UNIT") {
            L.DomUtil.addClass(this.getContainer(),'crosshair-cursor-enabled');
        }
        document.dispatchEvent(new CustomEvent("mapStateChanged"));
    }

    getState() {
        return this.#state;
    }

    /* Context Menu */
    showContextMenu(e: ClickEvent | SpawnEvent, title: string, options: ContextMenuOption[], showCoalition: boolean = false) {
        var x = e.x;
        var y = e.y;
        getContextMenu()?.show(x, y, title, options, showCoalition);
        document.dispatchEvent(new CustomEvent("mapContextMenu"));
    }

    hideContextMenu() {
        getContextMenu()?.hide();
        document.dispatchEvent(new CustomEvent("mapContextMenu"));
    }

    getMousePosition() {
        return this.#lastMousePosition;
    }

    getMouseCoordinates() {
        return this.containerPointToLatLng(this.#lastMousePosition);
    }

    /* Spawn from air base */
    spawnFromAirbase(e: SpawnEvent)
    {
        this.#aircraftSpawnMenu(e);
    }

    /* Event handlers */
    #onClick(e: any) {
        if (!this.#preventLeftClick) {
            this.hideContextMenu();
            if (this.#state === "IDLE") {
                if (e.originalEvent.ctrlKey)
                    if (!this.#measurePoint)
                    {
                        this.#measurePoint = e.latlng;
                        this.#measureMarker.setLatLng(e.latlng);
                        this.#measureMarker.addTo(this);
                    }
                    else
                    {
                        this.#measurePoint = null;
                        if (this.hasLayer(this.#measureMarker))
                            this.removeLayer(this.#measureMarker);
                    }
            }
            else if (this.#state === "MOVE_UNIT") {
                this.setState("IDLE");
                getUnitsManager().deselectAllUnits();
                this.hideContextMenu();
            }
        }
    }

    #onDoubleClick(e: any) {
        
    }

    #onContextMenu(e: any) {
        this.hideContextMenu();
        if (this.#state === "IDLE") {
            var spawnEvent: SpawnEvent = {x: e.originalEvent.x, y: e.originalEvent.y, latlng: e.latlng, airbaseName: null, coalitionID: null};
            if (this.#state == "IDLE") {
                var options = [
                    { "tooltip": "Spawn air unit", "src": "spawnAir.png", "callback": () => this.#aircraftSpawnMenu(spawnEvent) },
                    { "tooltip": "Spawn ground unit", "src": "spawnGround.png", "callback": () => this.#groundUnitSpawnMenu(spawnEvent) },
                    { "tooltip": "Smoke", "src": "spawnSmoke.png", "callback": () => this.#smokeSpawnMenu(spawnEvent) },
                    //{ "tooltip": "Explosion", "src": "spawnExplosion.png", "callback": () => this.#explosionSpawnMenu(e) }
                ]
                this.showContextMenu(spawnEvent, "Action", options, false);
            }
        }
        else if (this.#state === "MOVE_UNIT") {
            if (!e.originalEvent.ctrlKey) {
                getUnitsManager().selectedUnitsClearDestinations();
            }
            getUnitsManager().selectedUnitsAddDestination(e.latlng)
        }
    }

    #onSelectionEnd(e: any)
    {
        clearTimeout(this.#leftClickTimer);
        this.#preventLeftClick = true;
        this.#leftClickTimer = setTimeout(() => {
            this.#preventLeftClick = false;  
        }, 200);
        getUnitsManager().selectFromBounds(e.selectionBounds);
    }

    #onMouseDown(e: any)
    {
        if ((e.originalEvent.which == 1) && (e.originalEvent.button == 0)) 
        {
            this.dragging.disable();
        }
    }

    #onMouseUp(e: any)
    {
        if ((e.originalEvent.which == 1) && (e.originalEvent.button == 0)) 
        {
            this.dragging.enable();
        }
    }

    #onMouseMove(e: any)
    {
        var selectedUnitPosition = null;
        var selectedUnits = getUnitsManager().getSelectedUnits();
        if (selectedUnits && selectedUnits.length == 1)
        {
            selectedUnitPosition = new L.LatLng(selectedUnits[0].getFlightData().latitude, selectedUnits[0].getFlightData().longitude);
        }
        getMouseInfoPanel()?.update(<L.LatLng>e.latlng, this.#measurePoint, selectedUnitPosition);

        this.#lastMousePosition.x = e.originalEvent.x;
        this.#lastMousePosition.y = e.originalEvent.y;

        if ( this.#measurePoint)
            this.#drawMeasureLine();
        else
            this.#hideMeasureLine();
    }

    #onZoom(e: any)
    {
        if (this.#measurePoint)
            this.#drawMeasureLine();
        else
            this.#hideMeasureLine();
    }

    /* Spawning menus */
    #aircraftSpawnMenu(e: SpawnEvent) {
        var options = [
            { 'coalition': true, 'tooltip': 'CAP', 'src': 'spawnCAP.png', 'callback': () => this.#selectAircraft(e, "cap") },
            { 'coalition': true, 'tooltip': 'CAS', 'src': 'spawnCAS.png', 'callback': () => this.#selectAircraft(e, "cas") },
            { 'coalition': true, 'tooltip': 'Strike', 'src': 'spawnStrike.png', 'callback': () => this.#selectAircraft(e, "strike") },
            { 'coalition': true, 'tooltip': 'Recce', 'src': 'spawnStrike.png', 'callback': () => this.#selectAircraft(e, "reconnaissance") },
            { 'coalition': true, 'tooltip': 'Tanker', 'src': 'spawnTanker.png', 'callback': () => this.#selectAircraft(e, "tanker") },
            { 'coalition': true, 'tooltip': 'AWACS', 'src': 'spawnAWACS.png', 'callback': () => this.#selectAircraft(e, "awacs") },
            { 'coalition': true, 'tooltip': 'Drone', 'src': 'spawnDrone.png', 'callback': () => this.#selectAircraft(e, "drone") },
            { 'coalition': true, 'tooltip': 'Transport', 'src': 'spawnTransport.png', 'callback': () => this.#selectAircraft(e, "transport") },
        ]
        if (e.airbaseName != null)
            this.showContextMenu(e, "Spawn at " + e.airbaseName, options, true);
        else
            this.showContextMenu(e, "Spawn air unit", options, true);
    }

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
        this.showContextMenu(e, "Spawn ground unit", options, true);
    }

    #smokeSpawnMenu(e: SpawnEvent) {
        this.hideContextMenu();
        var options = [
            {'tooltip': 'Red smoke',      'src': 'spawnSmoke.png',  'callback': () => {this.hideContextMenu(); spawnSmoke('red', e.latlng)}, 'tint': 'red'},
            {'tooltip': 'White smoke',    'src': 'spawnSmoke.png',  'callback': () => {this.hideContextMenu(); spawnSmoke('white', e.latlng)}, 'tint': 'white'},
            {'tooltip': 'Blue smoke',     'src': 'spawnSmoke.png',  'callback': () => {this.hideContextMenu(); spawnSmoke('blue', e.latlng)}, 'tint': 'blue'},
            {'tooltip': 'Green smoke',    'src': 'spawnSmoke.png',  'callback': () => {this.hideContextMenu(); spawnSmoke('green', e.latlng)}, 'tint': 'green'},
            {'tooltip': 'Orange smoke',   'src': 'spawnSmoke.png',  'callback': () => {this.hideContextMenu(); spawnSmoke('orange', e.latlng)}, 'tint': 'orange'},
        ]
        this.showContextMenu(e, "Spawn smoke", options, false);
    }

    #explosionSpawnMenu(e: SpawnEvent) {

    }

    /* Show unit selection for air units */
    #selectAircraft(e: SpawnEvent, role: string) {
        this.hideContextMenu();
        var options = aircraftDatabase.getLabelsByRole(role);
        this.showContextMenu(e, "Select aircraft", 
            options.map((option: string) => {
                return {tooltip: option, src: "", callback: (label: string) => {
                    this.hideContextMenu();
                    var name = aircraftDatabase.getNameByLabel(label);
                    if (name != null)
                        this.#unitSelectPayload(e, name, role);
                }}}), true);
    }

    /* Show weapon selection for air units */
    #unitSelectPayload(e: SpawnEvent, unitType: string, role: string) {
        this.hideContextMenu();
        var options = aircraftDatabase.getLoadoutNamesByRole(unitType, role);
        //options = payloadNames[unitType]
        if (options != undefined && options.length > 0) {
            options.sort();
            this.showContextMenu({x: e.x, y: e.y, latlng: e.latlng}, "Select loadout", 
                options.map((option: string) => {
                    return {tooltip: option, src: "", callback: (loadoutName: string) => {
                        this.hideContextMenu();
                        var loadout = aircraftDatabase.getLoadoutsByName(unitType, loadoutName);
                        spawnAircraft(unitType, e.latlng, getActiveCoalition(), loadout != null? loadout.code: "", e.airbaseName);
                }}}), true);
        }
        else {
            spawnAircraft(unitType, e.latlng, getActiveCoalition());
        }
    }

    /* Show unit selection for ground units */
    #selectGroundUnit(e: any, group: string)
    {
        this.hideContextMenu();
        var options = unitTypes.vehicles[group];
        options.sort();
        this.showContextMenu(e, "Select ground unit", 
            options.map((option: string) => {
                return {tooltip: option, src: "", callback: (unitType: string) => {
                this.hideContextMenu();
                spawnGroundUnit(unitType, e.latlng, getActiveCoalition());
        }}}), true);
    }

    #drawMeasureLine()
    {
        var mouseLatLng = this.containerPointToLatLng(this.#lastMousePosition);
        if (this.#measurePoint != null)
        {
            var points = [this.#measurePoint, mouseLatLng];
            this.#measureLine.setLatLngs(points);
            var dist = distance(this.#measurePoint.lat, this.#measurePoint.lng, mouseLatLng.lat, mouseLatLng.lng);
            var bear = bearing(this.#measurePoint.lat, this.#measurePoint.lng, mouseLatLng.lat, mouseLatLng.lng);
            var startXY = this.latLngToContainerPoint(this.#measurePoint);
            var dx = (this.#lastMousePosition.x - startXY.x);
            var dy = (this.#lastMousePosition.y - startXY.y);

            var angle = Math.atan2(dy, dx);
            if (angle > Math.PI / 2) 
                angle = angle - Math.PI;

            if (angle < -Math.PI / 2) 
                angle = angle + Math.PI;

            this.#measureLineDiv.innerHTML = `${zeroAppend(Math.floor(bear), 3)}° / ${zeroAppend(Math.floor(dist*0.000539957), 3)} NM`
            this.#measureLineDiv.style.left = (this.#lastMousePosition.x + startXY.x) / 2 - this.#measureLineDiv.offsetWidth / 2 + "px";
            this.#measureLineDiv.style.top = (this.#lastMousePosition.y + startXY.y) / 2 - this.#measureLineDiv.offsetHeight / 2 + "px";
            this.#measureLineDiv.style.rotate = angle + "rad";
            this.#measureLineDiv.style.display = "";
        }
        
        if (!this.hasLayer(this.#measureLine))
            this.#measureLine.addTo(this);
    }

    #hideMeasureLine()
    {
        this.#measureLineDiv.style.display = "none";

        if (this.hasLayer(this.#measureLine))
            this.removeLayer(this.#measureLine)
    }
} 
