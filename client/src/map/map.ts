import * as L from "leaflet"
import { getUnitsManager } from "..";
import { BoxSelect } from "./boxselect";
import { MapContextMenu, SpawnOptions } from "../controls/mapcontextmenu";
import { UnitContextMenu } from "../controls/unitcontextmenu";
import { AirbaseContextMenu } from "../controls/airbasecontextmenu";
import { Dropdown } from "../controls/dropdown";
import { Airbase } from "../missionhandler/airbase";
import { Unit } from "../units/unit";
import { bearing } from "../other/utils";
import { DestinationPreviewMarker } from "./destinationpreviewmarker";
import { TemporaryUnitMarker } from "./temporaryunitmarker";
import { ClickableMiniMap } from "./clickableminimap";
import { SVGInjector } from '@tanem/svg-injector'

L.Map.addInitHook('addHandler', 'boxSelect', BoxSelect);

// TODO would be nice to convert to ts
require("../../public/javascripts/leaflet.nauticscale.js")

/* Map constants */
export const IDLE = "IDLE";
export const MOVE_UNIT = "MOVE_UNIT";
export const visibilityControls: string[] = ["human", "dcs", "aircraft", "groundunit-sam", "groundunit-other", "navyunit", "airbase"];
export const visibilityControlsTootlips: string[] = ["Toggle human players visibility", "Toggle DCS controlled units visibility", "Toggle aircrafts visibility", "Toggle SAM units visibility", "Toggle ground units (not SAM) visibility", "Toggle navy units visibility", "Toggle airbases visibility"];

export class Map extends L.Map {
    #state: string;
    #layer: L.TileLayer | null = null;
    #preventLeftClick: boolean = false;
    #leftClickTimer: number = 0;
    #deafultPanDelta: number = 100;
    #panInterval: number | null = null;
    #panLeft: boolean = false;
    #panRight: boolean = false;
    #panUp: boolean = false;
    #panDown: boolean = false;
    #lastMousePosition: L.Point = new L.Point(0, 0);
    #centerUnit: Unit | null = null;
    #miniMap: ClickableMiniMap | null = null;
    #miniMapLayerGroup: L.LayerGroup;
    #temporaryMarkers: L.Marker[] = [];
    #destinationPreviewMarkers: L.Marker[] = [];
    #destinationGroupRotation: number = 0;
    #computeDestinationRotation: boolean = false;
    #destinationRotationCenter: L.LatLng | null = null;

    #mapContextMenu: MapContextMenu = new MapContextMenu("map-contextmenu");
    #unitContextMenu: UnitContextMenu = new UnitContextMenu("unit-contextmenu");
    #airbaseContextMenu: AirbaseContextMenu = new AirbaseContextMenu("airbase-contextmenu");

    #mapSourceDropdown: Dropdown;
    #optionButtons: { [key: string]: HTMLButtonElement[] } = {}

    constructor(ID: string) {
        /* Init the leaflet map */
        //@ts-ignore
        super(ID, { doubleClickZoom: false, zoomControl: false, boxZoom: false, boxSelect: true, zoomAnimation: true, maxBoundsViscosity: 1.0, minZoom: 7, keyboard: true, keyboardPanDelta: 0 });
        this.setView([37.23, -115.8], 10);

        this.setLayer("ArcGIS Satellite");

        /* Minimap */
        var minimapLayer = new L.TileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { minZoom: 0, maxZoom: 13 });
        this.#miniMapLayerGroup = new L.LayerGroup([minimapLayer]);
        var miniMapPolyline = new L.Polyline(this.#getMinimapBoundaries(), { color: '#202831' });
        miniMapPolyline.addTo(this.#miniMapLayerGroup);

        /* Scale */
        //@ts-ignore TODO more hacking because the module is provided as a pure javascript module only
        L.control.scalenautic({ position: "topright", maxWidth: 300, nautic: true, metric: true, imperial: false }).addTo(this);

        /* Map source dropdown */
        this.#mapSourceDropdown = new Dropdown("map-type", (layerName: string) => this.setLayer(layerName), this.getLayers())

        /* Init the state machine */
        this.#state = IDLE;

        /* Register event handles */
        this.on("click", (e: any) => this.#onClick(e));
        this.on("dblclick", (e: any) => this.#onDoubleClick(e));
        this.on("zoomstart", (e: any) => this.#onZoom(e));
        this.on("drag", (e: any) => this.centerOnUnit(null));
        this.on("contextmenu", (e: any) => this.#onContextMenu(e));
        this.on('selectionend', (e: any) => this.#onSelectionEnd(e));
        this.on('mousedown', (e: any) => this.#onMouseDown(e));
        this.on('mouseup', (e: any) => this.#onMouseUp(e));
        this.on('mousemove', (e: any) => this.#onMouseMove(e));
        this.on('keydown', (e: any) => this.#updateDestinationPreview(e));
        this.on('keyup', (e: any) => this.#updateDestinationPreview(e));

        /* Event listeners */
        document.addEventListener("toggleCoalitionVisibility", (ev: CustomEventInit) => {
            const el = ev.detail._element;
            el?.classList.toggle("off");
            getUnitsManager().setHiddenType(ev.detail.coalition, (el?.currentTarget as HTMLElement)?.classList.contains("off"));
            Object.values(getUnitsManager().getUnits()).forEach((unit: Unit) => unit.updateVisibility());
        });

        document.addEventListener("toggleUnitVisibility", (ev: CustomEventInit) => {
            const el = ev.detail._element;
            el?.classList.toggle("off");
            getUnitsManager().setHiddenType(ev.detail.type, !el?.classList.contains("off"));
            Object.values(getUnitsManager().getUnits()).forEach((unit: Unit) => unit.updateVisibility());
        });

        document.addEventListener("unitUpdated", (ev: CustomEvent) => {
            if (this.#centerUnit != null && ev.detail == this.#centerUnit)
                this.#panToUnit(this.#centerUnit);
        });

        /* Pan interval */
        this.#panInterval = window.setInterval(() => {
            this.panBy(new L.Point(((this.#panLeft ? -1 : 0) + (this.#panRight ? 1 : 0)) * this.#deafultPanDelta,
                ((this.#panUp ? -1 : 0) + (this.#panDown ? 1 : 0)) * this.#deafultPanDelta));
        }, 20);

        /* Option buttons */
        this.#optionButtons["visibility"] = visibilityControls.map((option: string, index: number) => {
            return this.#createOptionButton(option, `visibility/${option.toLowerCase()}.svg`, visibilityControlsTootlips[index], "toggleUnitVisibility", `{"type": "${option}"}`);
        });
        document.querySelector("#unit-visibility-control")?.append(...this.#optionButtons["visibility"]);
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
            L.DomUtil.removeClass(this.getContainer(), 'crosshair-cursor-enabled');

            /* Remove all the destination preview markers */
            this.#destinationPreviewMarkers.forEach((marker: L.Marker) => {
                this.removeLayer(marker);
            })
            this.#destinationPreviewMarkers = [];

            this.#destinationGroupRotation = 0;
            this.#computeDestinationRotation = false;
            this.#destinationRotationCenter = null;
        }
        else if (this.#state === MOVE_UNIT) {
            L.DomUtil.addClass(this.getContainer(), 'crosshair-cursor-enabled');

            /* Remove all the exising destination preview markers */
            this.#destinationPreviewMarkers.forEach((marker: L.Marker) => {
                this.removeLayer(marker);
            })
            this.#destinationPreviewMarkers = [];

            if (getUnitsManager().getSelectedUnits({ excludeHumans: true }).length > 1 && getUnitsManager().getSelectedUnits({ excludeHumans: true }).length < 20) {
                /* Create the unit destination preview markers */
                this.#destinationPreviewMarkers = getUnitsManager().getSelectedUnits({ excludeHumans: true }).map((unit: Unit) => {
                    var marker = new DestinationPreviewMarker(this.getMouseCoordinates());
                    marker.addTo(this);
                    return marker;
                })
            }
        }
        document.dispatchEvent(new CustomEvent("mapStateChanged"));
    }

    getState() {
        return this.#state;
    }

    /* Context Menus */
    hideAllContextMenus() {
        this.hideMapContextMenu();
        this.hideUnitContextMenu();
        this.hideAirbaseContextMenu();
    }

    showMapContextMenu(e: any) {
        this.hideAllContextMenus();
        var x = e.originalEvent.x;
        var y = e.originalEvent.y;
        this.#mapContextMenu.show(x, y, e.latlng);
        document.dispatchEvent(new CustomEvent("mapContextMenu"));
    }

    hideMapContextMenu() {
        this.#mapContextMenu.hide();
        document.dispatchEvent(new CustomEvent("mapContextMenu"));
    }

    getMapContextMenu() {
        return this.#mapContextMenu;
    }

    showUnitContextMenu(e: any) {
        this.hideAllContextMenus();
        var x = e.originalEvent.x;
        var y = e.originalEvent.y;
        this.#unitContextMenu.show(x, y, e.latlng);
    }

    getUnitContextMenu() {
        return this.#unitContextMenu;
    }

    hideUnitContextMenu() {
        this.#unitContextMenu.hide();
    }

    showAirbaseContextMenu(e: any, airbase: Airbase) {
        this.hideAllContextMenus();
        var x = e.originalEvent.x;
        var y = e.originalEvent.y;
        this.#airbaseContextMenu.show(x, y, e.latlng);
        this.#airbaseContextMenu.setAirbase(airbase);
    }

    getAirbaseContextMenu() {
        return this.#airbaseContextMenu;
    }

    hideAirbaseContextMenu() {
        this.#airbaseContextMenu.hide();
    }

    /* Mouse coordinates */
    getMousePosition() {
        return this.#lastMousePosition;
    }

    getMouseCoordinates() {
        return this.containerPointToLatLng(this.#lastMousePosition);
    }

    /* Spawn from air base */
    spawnFromAirbase(e: any) {
        //this.#aircraftSpawnMenu(e);
    }

    centerOnUnit(ID: number | null) {
        if (ID != null) {
            this.options.scrollWheelZoom = 'center';
            this.#centerUnit = getUnitsManager().getUnitByID(ID);
        }
        else {
            this.options.scrollWheelZoom = undefined;
            this.#centerUnit = null;
        }
    }

    setTheatre(theatre: string) {
        var bounds = new L.LatLngBounds([-90, -180], [90, 180]);
        var miniMapZoom = 5;
        if (theatre == "Syria")
            bounds = new L.LatLngBounds([31.8472222, 29.8975], [37.7177778, 42.3716667]);
        else if (theatre == "MarianaIslands")
            bounds = new L.LatLngBounds([10.5777778, 135.7477778], [22.5127778, 149.5427778]);
        else if (theatre == "Nevada")
            bounds = new L.LatLngBounds([34.4037128, -119.7806729], [39.7372411, -112.1130805])
        else if (theatre == "PersianGulf")
            bounds = new L.LatLngBounds([21.729393, 47.572675], [33.131584, 64.7313594])
        else if (theatre == "Falklands") {
            // TODO
        }
        else if (theatre == "Caucasus") {
            bounds = new L.LatLngBounds([39.6170191, 27.634935], [47.3907982, 49.3101946])
            miniMapZoom = 4;
        }

        this.setView(bounds.getCenter(), 8);
        //this.setMaxBounds(bounds);

        if (this.#miniMap)
            this.#miniMap.remove();

        //@ts-ignore // Needed because some of the inputs are wrong in the original module interface
        this.#miniMap = new ClickableMiniMap(this.#miniMapLayerGroup, { position: "topright", width: 192 * 1.5, height: 108 * 1.5, zoomLevelFixed: miniMapZoom, centerFixed: bounds.getCenter() }).addTo(this);
        this.#miniMap.disableInteractivity();
        this.#miniMap.getMap().on("click", (e: any) => {
            if (this.#miniMap)
                this.setView(e.latlng);
        })
    }

    getMiniMapLayerGroup() {
        return this.#miniMapLayerGroup;
    }

    handleMapPanning(e: any) {
        if (e.type === "keyup") {
            switch (e.code) {
                case "KeyA":
                case "ArrowLeft":
                    this.#panLeft = false;
                    break;
                case "KeyD":
                case "ArrowRight":
                    this.#panRight = false;
                    break;
                case "KeyW":
                case "ArrowUp":
                    this.#panUp = false;
                    break;
                case "KeyS":
                case "ArrowDown":
                    this.#panDown = false;
                    break;
            }
        }
        else {
            switch (e.code) {
                case 'KeyA':
                case 'ArrowLeft':
                    this.#panLeft = true;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.#panRight = true;
                    break;
                case 'KeyW':
                case 'ArrowUp':
                    this.#panUp = true;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.#panDown = true;
                    break;
            }
        }
    }

    addTemporaryMarker(latlng: L.LatLng) {
        var marker = new TemporaryUnitMarker(latlng);
        marker.addTo(this);
        this.#temporaryMarkers.push(marker);
    }

    removeTemporaryMarker(latlng: L.LatLng) {
        var d: number | null = null;
        var closest: L.Marker | null = null;
        var i: number = 0;
        this.#temporaryMarkers.forEach((marker: L.Marker, idx: number) => {
            var t = latlng.distanceTo(marker.getLatLng());
            if (d == null || t < d) {
                d = t;
                closest = marker;
                i = idx;
            }
        });
        if (closest) {
            this.removeLayer(closest);
            delete this.#temporaryMarkers[i];
        }
    }

    /* Event handlers */
    #onClick(e: any) {
        if (!this.#preventLeftClick) {
            this.hideAllContextMenus();
            if (this.#state === IDLE) {

            }
            else if (this.#state === MOVE_UNIT) {
                this.setState(IDLE);
                getUnitsManager().deselectAllUnits();
            }
        }
    }

    #onDoubleClick(e: any) {

    }

    #onContextMenu(e: any) {
        this.hideMapContextMenu();
        if (this.#state === IDLE) {
            if (this.#state == IDLE) {
                this.showMapContextMenu(e);
            }
        }
        else if (this.#state === MOVE_UNIT) {
            if (!e.originalEvent.ctrlKey) {
                getUnitsManager().selectedUnitsClearDestinations();
            }
            getUnitsManager().selectedUnitsAddDestination(this.#computeDestinationRotation && this.#destinationRotationCenter != null ? this.#destinationRotationCenter : e.latlng, !e.originalEvent.shiftKey, this.#destinationGroupRotation)
            this.#destinationGroupRotation = 0; 
            this.#destinationRotationCenter = null;
            this.#computeDestinationRotation = false;
        }
    }

    #onSelectionEnd(e: any) {
        clearTimeout(this.#leftClickTimer);
        this.#preventLeftClick = true;
        this.#leftClickTimer = window.setTimeout(() => {
            this.#preventLeftClick = false;
        }, 200);
        getUnitsManager().selectFromBounds(e.selectionBounds);
    }

    #onMouseDown(e: any) {
        this.hideAllContextMenus();

        if (this.#state == MOVE_UNIT) {
            this.#destinationGroupRotation = 0; 
            this.#destinationRotationCenter = null;
            this.#computeDestinationRotation = false;
            if (e.originalEvent.button == 2) {
                this.#computeDestinationRotation = true;
                this.#destinationRotationCenter = this.getMouseCoordinates();
            }
        }
    }

    #onMouseUp(e: any) {
    }

    #onMouseMove(e: any) {
        this.#lastMousePosition.x = e.originalEvent.x;
        this.#lastMousePosition.y = e.originalEvent.y;

        if (this.#computeDestinationRotation && this.#destinationRotationCenter != null)
            this.#destinationGroupRotation = -bearing(this.#destinationRotationCenter.lat, this.#destinationRotationCenter.lng, this.getMouseCoordinates().lat, this.getMouseCoordinates().lng);

        this.#updateDestinationPreview(e);
    }

    #onZoom(e: any) {
        if (this.#centerUnit != null)
            this.#panToUnit(this.#centerUnit);
    }

    #panToUnit(unit: Unit) {
        var unitPosition = new L.LatLng(unit.getFlightData().latitude, unit.getFlightData().longitude);
        this.setView(unitPosition, this.getZoom(), { animate: false });
    }

    #getMinimapBoundaries() {
        /* Draw the limits of the maps in the minimap*/
        return [[    // NTTR
            new L.LatLng(39.7982463, -119.985425),
            new L.LatLng(34.4037128, -119.7806729),
            new L.LatLng(34.3483316, -112.4529351),
            new L.LatLng(39.7372411, -112.1130805),
            new L.LatLng(39.7982463, -119.985425)
        ],
        [   // Syria
            new L.LatLng(37.3630556, 29.2686111),
            new L.LatLng(31.8472222, 29.8975),
            new L.LatLng(32.1358333, 42.1502778),
            new L.LatLng(37.7177778, 42.3716667),
            new L.LatLng(37.3630556, 29.2686111)
        ],
        [   // Caucasus
            new L.LatLng(39.6170191, 27.634935),
            new L.LatLng(38.8735863, 47.1423108),
            new L.LatLng(47.3907982, 49.3101946),
            new L.LatLng(48.3955879, 26.7753625),
            new L.LatLng(39.6170191, 27.634935)
        ],
        [   // Persian Gulf
            new L.LatLng(32.9355285, 46.5623682),
            new L.LatLng(21.729393, 47.572675),
            new L.LatLng(21.8501348, 63.9734737),
            new L.LatLng(33.131584, 64.7313594),
            new L.LatLng(32.9355285, 46.5623682)
        ],
        [   // Marianas
            new L.LatLng(22.09, 135.0572222),
            new L.LatLng(10.5777778, 135.7477778),
            new L.LatLng(10.7725, 149.3918333),
            new L.LatLng(22.5127778, 149.5427778),
            new L.LatLng(22.09, 135.0572222)
        ]
        ];
    }

    #updateDestinationPreview(e: any) {
        Object.values(getUnitsManager().selectedUnitsComputeGroupDestination(this.#computeDestinationRotation && this.#destinationRotationCenter != null ? this.#destinationRotationCenter : this.getMouseCoordinates(), this.#destinationGroupRotation)).forEach((latlng: L.LatLng, idx: number) => {
            if (idx < this.#destinationPreviewMarkers.length)
                this.#destinationPreviewMarkers[idx].setLatLng(!e.originalEvent.shiftKey ? latlng : this.getMouseCoordinates());
        })
    }

    #createOptionButton(value: string, url: string, title: string, callback: string, argument: string) {
        var button = document.createElement("button");
        const img = document.createElement("img");
        img.src = `/resources/theme/images/buttons/${url}`;
        img.onload = () => SVGInjector(img);
        button.title = title;
        button.value = value;
        button.appendChild(img);
        button.setAttribute("data-on-click", callback);
        button.setAttribute("data-on-click-params", argument);
        return button;
    }
} 

