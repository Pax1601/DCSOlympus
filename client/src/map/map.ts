import * as L from "leaflet"
import { getContextMenu, getUnitsManager, getActiveCoalition } from "..";
import { spawnAircraft, spawnGroundUnit, spawnSmoke } from "../server/server";
import { aircraftDatabase } from "../units/aircraftdatabase";
import { unitTypes } from "../units/unittypes";
import { BoxSelect } from "./boxselect";
import { ContextMenuOption } from "../@types/dom";
import { SpawnOptions } from "../controls/contextmenu";

export const IDLE = "IDLE";
export const MOVE_UNIT = "MOVE_UNIT";

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
    #lastMousePosition: L.Point = new L.Point(0, 0);

    constructor(ID: string) {
        /* Init the leaflet map */
        //@ts-ignore
        super(ID, { doubleClickZoom: false, zoomControl: false, boxZoom: false, boxSelect: true });
        this.setView([37.23, -115.8], 12);

        this.setLayer("ArcGIS Satellite");

        /* Init the state machine */
        this.#state = IDLE;
       

        /* Register event handles */
        this.on("click", (e: any) => this.#onClick(e));
        this.on("dblclick", (e: any) => this.#onDoubleClick(e));      
        this.on("contextmenu", (e: any) => this.#onContextMenu(e));
        this.on('selectionend', (e: any) => this.#onSelectionEnd(e));
        this.on('mousedown', (e: any) => this.#onMouseDown(e));
        this.on('mouseup', (e: any) => this.#onMouseUp(e));
        this.on('mousemove', (e: any) => this.#onMouseMove(e));
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
        if (this.#state === IDLE) {
            L.DomUtil.removeClass(this.getContainer(),'crosshair-cursor-enabled');
        }
        else if (this.#state === MOVE_UNIT) {
            L.DomUtil.addClass(this.getContainer(),'crosshair-cursor-enabled');
        }
        document.dispatchEvent(new CustomEvent("mapStateChanged"));
    }

    getState() {
        return this.#state;
    }

    /* Context Menu */
    showContextMenu(e: any, spawnOptions: SpawnOptions | null = null) {
        var x = e.originalEvent.x;
        var y = e.originalEvent.y;
        getContextMenu()?.show(x, y, e.latlng);
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
        //this.#aircraftSpawnMenu(e);
    }

    /* Event handlers */
    #onClick(e: any) {
        if (!this.#preventLeftClick) {
            this.hideContextMenu();
            if (this.#state === IDLE) {
                
            }
            else if (this.#state === MOVE_UNIT) {
                this.setState(IDLE);
                getUnitsManager().deselectAllUnits();
                this.hideContextMenu();
            }
        }
    }

    #onDoubleClick(e: any) {
        
    }

    #onContextMenu(e: any) {
        this.hideContextMenu();
        if (this.#state === IDLE) {
            if (this.#state == IDLE) {
                this.showContextMenu(e);
            }
        }
        else if (this.#state === MOVE_UNIT) {
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
            this.dragging.disable();
    }

    #onMouseUp(e: any)
    {
        if ((e.originalEvent.which == 1) && (e.originalEvent.button == 0)) 
            this.dragging.enable();
    }

    #onMouseMove(e: any)
    {
        var selectedUnitPosition = null;
        var selectedUnits = getUnitsManager().getSelectedUnits();
        if (selectedUnits && selectedUnits.length == 1)
            selectedUnitPosition = new L.LatLng(selectedUnits[0].getFlightData().latitude, selectedUnits[0].getFlightData().longitude);

        this.#lastMousePosition.x = e.originalEvent.x;
        this.#lastMousePosition.y = e.originalEvent.y;
    }
} 
