import * as L from "leaflet"
import { getApp } from "..";
import { BoxSelect } from "./boxselect";
import { MapContextMenu } from "../contextmenus/mapcontextmenu";
import { UnitContextMenu } from "../contextmenus/unitcontextmenu";
import { AirbaseContextMenu } from "../contextmenus/airbasecontextmenu";
import { Dropdown } from "../controls/dropdown";
import { Airbase } from "../mission/airbase";
import { Unit } from "../unit/unit";
import { bearing, createCheckboxOption, polyContains } from "../other/utils";
import { DestinationPreviewMarker } from "./markers/destinationpreviewmarker";
import { TemporaryUnitMarker } from "./markers/temporaryunitmarker";
import { ClickableMiniMap } from "./clickableminimap";
import { SVGInjector } from '@tanem/svg-injector'
import { mapLayers, mapBounds, minimapBoundaries, IDLE, COALITIONAREA_DRAW_POLYGON, MOVE_UNIT, SHOW_UNIT_CONTACTS, HIDE_GROUP_MEMBERS, SHOW_UNIT_PATHS, SHOW_UNIT_TARGETS, SHOW_UNIT_LABELS, SHOW_UNITS_ENGAGEMENT_RINGS, SHOW_UNITS_ACQUISITION_RINGS, HIDE_UNITS_SHORT_RANGE_RINGS, FILL_SELECTED_RING, MAP_MARKER_CONTROLS } from "../constants/constants";
import { CoalitionArea } from "./coalitionarea/coalitionarea";
import { CoalitionAreaContextMenu } from "../contextmenus/coalitionareacontextmenu";
import { DrawingCursor } from "./coalitionarea/drawingcursor";
import { AirbaseSpawnContextMenu } from "../contextmenus/airbasespawnmenu";
import { GestureHandling } from "leaflet-gesture-handling";
import { TouchBoxSelect } from "./touchboxselect";
import { DestinationPreviewHandle } from "./markers/destinationpreviewHandle";
import { ContextActionSet } from "../unit/contextactionset";

var hasTouchScreen = false;
//if ("maxTouchPoints" in navigator) 
//    hasTouchScreen = navigator.maxTouchPoints > 0;

if (hasTouchScreen)
    L.Map.addInitHook('addHandler', 'boxSelect', TouchBoxSelect);
else
    L.Map.addInitHook('addHandler', 'boxSelect', BoxSelect);

L.Map.addInitHook("addHandler", "gestureHandling", GestureHandling);

// TODO would be nice to convert to ts - yes
require("../../public/javascripts/leaflet.nauticscale.js")
require("../../public/javascripts/L.Path.Drag.js")

export type MapMarkerVisibilityControl = {
    "category"?: string;
    "image": string;
    "isProtected"?: boolean,
    "name": string,
    "protectable"?: boolean,
    "toggles": string[],
    "tooltip": string
}

export class Map extends L.Map {
    #ID: string;
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
    #shiftKey: boolean = false;
    #ctrlKey: boolean = false;
    #centerUnit: Unit | null = null;
    #miniMap: ClickableMiniMap | null = null;
    #miniMapLayerGroup: L.LayerGroup;
    #miniMapPolyline: L.Polyline;
    #temporaryMarkers: TemporaryUnitMarker[] = [];
    #selecting: boolean = false;
    #isZooming: boolean = false;
    #previousZoom: number = 0;

    #destinationGroupRotation: number = 0;
    #computeDestinationRotation: boolean = false;
    #destinationRotationCenter: L.LatLng | null = null;
    #coalitionAreas: CoalitionArea[] = [];

    #destinationPreviewCursors: DestinationPreviewMarker[] = [];
    #drawingCursor: DrawingCursor = new DrawingCursor();
    #destinationPreviewHandle: DestinationPreviewHandle = new DestinationPreviewHandle(new L.LatLng(0, 0));
    #destinationPreviewHandleLine: L.Polyline = new L.Polyline([], { color: "#000000", weight: 3, opacity: 0.5, smoothFactor: 1, dashArray: "4, 8" });
    #longPressHandled: boolean = false;
    #longPressTimer: number = 0;

    #mapContextMenu: MapContextMenu = new MapContextMenu("map-contextmenu");
    #unitContextMenu: UnitContextMenu = new UnitContextMenu("unit-contextmenu");
    #airbaseContextMenu: AirbaseContextMenu = new AirbaseContextMenu("airbase-contextmenu");
    #airbaseSpawnMenu: AirbaseSpawnContextMenu = new AirbaseSpawnContextMenu("airbase-spawn-contextmenu");
    #coalitionAreaContextMenu: CoalitionAreaContextMenu = new CoalitionAreaContextMenu("coalition-area-contextmenu");

    #mapSourceDropdown: Dropdown;
    #mapMarkerVisibilityControls: MapMarkerVisibilityControl[] = MAP_MARKER_CONTROLS;
    #mapVisibilityOptionsDropdown: Dropdown;
    #optionButtons: { [key: string]: HTMLButtonElement[] } = {}
    #visibilityOptions: { [key: string]: boolean } = {}
    #hiddenTypes: string[] = [];

    /**
     * 
     * @param ID - the ID of the HTML element which will contain the context menu
     */
    constructor(ID: string) {
        /* Init the leaflet map */
        super(ID, {
            preferCanvas: true,
            doubleClickZoom: false,
            zoomControl: false,
            boxZoom: false,
            //@ts-ignore Needed because the boxSelect option is non-standard
            boxSelect: true,
            zoomAnimation: true,
            maxBoundsViscosity: 1.0,
            minZoom: 7,
            keyboard: true,
            keyboardPanDelta: 0,
            gestureHandling: hasTouchScreen
        });
        this.setView([37.23, -115.8], 10);

        this.#ID = ID;

        this.setLayer(Object.keys(mapLayers)[0]);

        /* Minimap */
        var minimapLayer = new L.TileLayer(mapLayers[Object.keys(mapLayers)[0] as keyof typeof mapLayers].urlTemplate, { minZoom: 0, maxZoom: 13 });
        this.#miniMapLayerGroup = new L.LayerGroup([minimapLayer]);
        this.#miniMapPolyline = new L.Polyline([], { color: '#202831' });
        this.#miniMapPolyline.addTo(this.#miniMapLayerGroup);

        /* Scale */
        //@ts-ignore TODO more hacking because the module is provided as a pure javascript module only
        //L.control.scalenautic({ position: "topright", maxWidth: 300, nautic: true, metric: true, imperial: false }).addTo(this);

        /* Map source dropdown */
        this.#mapSourceDropdown = new Dropdown({
            "ID": "map-type",
            "callback": (layerName: string) => this.setLayer(layerName),
            "options": this.getLayers()
        });

        /* Visibility options dropdown */
        this.#mapVisibilityOptionsDropdown = new Dropdown({
            "ID": "map-visibility-options",
            "callback": (value: string) => {}
        });

        /* Init the state machine */
        this.#state = IDLE;

        /* Register event handles */
        this.on("click", (e: any) => this.#onClick(e));
        this.on("dblclick", (e: any) => this.#onDoubleClick(e));
        this.on("zoomstart", (e: any) => this.#onZoomStart(e));
        this.on("zoom", (e: any) => this.#onZoom(e));
        this.on("zoomend", (e: any) => this.#onZoomEnd(e));
        this.on("drag", (e: any) => this.centerOnUnit(null));
        this.on("contextmenu", (e: any) => this.#onContextMenu(e));
        this.on('selectionstart', (e: any) => this.#onSelectionStart(e));
        this.on('selectionend', (e: any) => this.#onSelectionEnd(e));
        this.on('mousedown', (e: any) => this.#onMouseDown(e));
        this.on('mouseup', (e: any) => this.#onMouseUp(e));
        this.on('mousemove', (e: any) => this.#onMouseMove(e));
        this.on('drag', (e: any) => this.#onMouseMove(e));
        this.on('keydown', (e: any) => this.#onKeyDown(e));
        this.on('keyup', (e: any) => this.#onKeyUp(e));

        /* Event listeners */
        document.addEventListener("toggleCoalitionVisibility", (ev: CustomEventInit) => {
            const el = ev.detail._element;
            el?.classList.toggle("off");
            this.setHiddenType(ev.detail.coalition, !el?.classList.contains("off"));
            Object.values(getApp().getUnitsManager().getUnits()).forEach((unit: Unit) => unit.updateVisibility());
        });

        document.addEventListener("toggleMarkerVisibility", (ev: CustomEventInit) => {
            const el = ev.detail._element;
            el?.classList.toggle("off");
            ev.detail.types.forEach((type: string) => this.setHiddenType(type, !el?.classList.contains("off")));
            Object.values(getApp().getUnitsManager().getUnits()).forEach((unit: Unit) => unit.updateVisibility());

            if (ev.detail.types.includes("airbase")) {
                Object.values(getApp().getMissionManager().getAirbases()).forEach((airbase: Airbase) => {
                    if (el?.classList.contains("off"))
                        airbase.removeFrom(this);
                    else
                        airbase.addTo(this);
                })
            }
        });

        document.addEventListener("toggleCoalitionAreaDraw", (ev: CustomEventInit) => {
            this.getMapContextMenu().hide();
            this.deselectAllCoalitionAreas();
            if (ev.detail?.type == "polygon") {
                if (this.getState() !== COALITIONAREA_DRAW_POLYGON)
                    this.setState(COALITIONAREA_DRAW_POLYGON);
                else
                    this.setState(IDLE);
            }
        });

        document.addEventListener("unitUpdated", (ev: CustomEvent) => {
            if (this.#centerUnit != null && ev.detail == this.#centerUnit)
                this.#panToUnit(this.#centerUnit);
        });

        document.addEventListener("mapOptionsChanged", () => {
            this.getContainer().toggleAttribute("data-hide-labels", !this.getVisibilityOptions()[SHOW_UNIT_LABELS]);
        });

        /* Pan interval */
        this.#panInterval = window.setInterval(() => {
            if (this.#panUp || this.#panDown || this.#panRight || this.#panLeft)
                this.panBy(new L.Point(((this.#panLeft ? -1 : 0) + (this.#panRight ? 1 : 0)) * this.#deafultPanDelta * (this.#shiftKey ? 3 : 1),
                    ((this.#panUp ? -1 : 0) + (this.#panDown ? 1 : 0)) * this.#deafultPanDelta * (this.#shiftKey ? 3 : 1)));
        }, 20);

        /* Option buttons */
        this.#createUnitMarkerControlButtons();

        /* Create the checkboxes to select the advanced visibility options */
        this.addVisibilityOption(SHOW_UNIT_CONTACTS, false);
        this.addVisibilityOption(HIDE_GROUP_MEMBERS, true);
        this.addVisibilityOption(SHOW_UNIT_PATHS, true);
        this.addVisibilityOption(SHOW_UNIT_TARGETS, true);
        this.addVisibilityOption(SHOW_UNIT_LABELS, true);
        this.addVisibilityOption(SHOW_UNITS_ENGAGEMENT_RINGS, true);
        this.addVisibilityOption(SHOW_UNITS_ACQUISITION_RINGS, true);
        this.addVisibilityOption(HIDE_UNITS_SHORT_RANGE_RINGS, true);
        /* this.addVisibilityOption(FILL_SELECTED_RING, false); Removed since currently broken: TODO fix!*/
    }

    addVisibilityOption(option: string, defaultValue: boolean) {
        this.#visibilityOptions[option] = defaultValue;
        this.#mapVisibilityOptionsDropdown.addOptionElement(createCheckboxOption(option, option, defaultValue, (ev: any) => { this.#setVisibilityOption(option, ev); }));
    }

    setLayer(layerName: string) {
        if (this.#layer != null)
            this.removeLayer(this.#layer)

        if (layerName in mapLayers) {
            const layerData = mapLayers[layerName as keyof typeof mapLayers];
            var options: L.TileLayerOptions = {
                attribution: layerData.attribution,
                minZoom: layerData.minZoom,
                maxZoom: layerData.maxZoom
            };
            this.#layer = new L.TileLayer(layerData.urlTemplate, options);
        }

        this.#layer?.addTo(this);
    }

    getLayers() {
        return Object.keys(mapLayers);
    }

    /* State machine */
    setState(state: string) {
        this.#state = state;
        this.#updateCursor();

        /* Operations to perform if you are NOT in a state */
        if (this.#state !== COALITIONAREA_DRAW_POLYGON) {
            this.#deselectSelectedCoalitionArea();
        }

        /* Operations to perform if you ARE in a state */
        if (this.#state === COALITIONAREA_DRAW_POLYGON) {
            this.#coalitionAreas.push(new CoalitionArea([]));
            this.#coalitionAreas[this.#coalitionAreas.length - 1].addTo(this);
        }
        document.dispatchEvent(new CustomEvent("mapStateChanged"));
    }

    getState() {
        return this.#state;
    }

    deselectAllCoalitionAreas() {
        this.#coalitionAreas.forEach((coalitionArea: CoalitionArea) => coalitionArea.setSelected(false));
    }

    deleteCoalitionArea(coalitionArea: CoalitionArea) {
        if (this.#coalitionAreas.includes(coalitionArea))
            this.#coalitionAreas.splice(this.#coalitionAreas.indexOf(coalitionArea), 1);
        if (this.hasLayer(coalitionArea))
            this.removeLayer(coalitionArea);
    }

    setHiddenType(key: string, value: boolean) {
        if (value) {
            if (this.#hiddenTypes.includes(key))
                delete this.#hiddenTypes[this.#hiddenTypes.indexOf(key)];
        }
        else {
            this.#hiddenTypes.push(key);
        }
    }

    getHiddenTypes() {
        return this.#hiddenTypes;
    }

    /* Context Menus */
    hideAllContextMenus() {
        this.hideMapContextMenu();
        this.hideUnitContextMenu();
        this.hideAirbaseContextMenu();
        this.hideAirbaseSpawnMenu();
        this.hideCoalitionAreaContextMenu();
    }

    showMapContextMenu(x: number, y: number, latlng: L.LatLng) {
        this.hideAllContextMenus();
        this.#mapContextMenu.show(x, y, latlng);
        document.dispatchEvent(new CustomEvent("mapContextMenu"));
    }

    hideMapContextMenu() {
        this.#mapContextMenu.hide();
        document.dispatchEvent(new CustomEvent("mapContextMenu"));
    }

    getMapContextMenu() {
        return this.#mapContextMenu;
    }

    showUnitContextMenu(x: number | undefined = undefined, y: number | undefined = undefined, latlng: L.LatLng | undefined = undefined) {
        this.hideAllContextMenus();
        this.#unitContextMenu.show(x, y, latlng);
    }

    getUnitContextMenu() {
        return this.#unitContextMenu;
    }

    hideUnitContextMenu() {
        this.#unitContextMenu.hide();
    }

    showAirbaseContextMenu(airbase: Airbase, x: number | undefined = undefined, y: number | undefined = undefined, latlng: L.LatLng | undefined = undefined) {
        this.hideAllContextMenus();
        this.#airbaseContextMenu.show(x, y, latlng);
        this.#airbaseContextMenu.setAirbase(airbase);
    }

    getAirbaseContextMenu() {
        return this.#airbaseContextMenu;
    }

    hideAirbaseContextMenu() {
        this.#airbaseContextMenu.hide();
    }

    showAirbaseSpawnMenu(airbase: Airbase, x: number | undefined = undefined, y: number | undefined = undefined, latlng: L.LatLng | undefined = undefined) {
        this.hideAllContextMenus();
        this.#airbaseSpawnMenu.show(x, y);
        this.#airbaseSpawnMenu.setAirbase(airbase);
    }

    getAirbaseSpawnMenu() {
        return this.#airbaseSpawnMenu;
    }

    hideAirbaseSpawnMenu() {
        this.#airbaseSpawnMenu.hide();
    }

    showCoalitionAreaContextMenu(x: number, y: number, latlng: L.LatLng, coalitionArea: CoalitionArea) {
        this.hideAllContextMenus();
        this.#coalitionAreaContextMenu.show(x, y, latlng);
        this.#coalitionAreaContextMenu.setCoalitionArea(coalitionArea);
    }

    getCoalitionAreaContextMenu() {
        return this.#coalitionAreaContextMenu;
    }

    hideCoalitionAreaContextMenu() {
        this.#coalitionAreaContextMenu.hide();
    }

    getMousePosition() {
        return this.#lastMousePosition;
    }

    getMouseCoordinates() {
        return this.containerPointToLatLng(this.#lastMousePosition);
    }

    centerOnUnit(ID: number | null) {
        if (ID != null) {
            this.options.scrollWheelZoom = 'center';
            this.#centerUnit = getApp().getUnitsManager().getUnitByID(ID);
        }
        else {
            this.options.scrollWheelZoom = undefined;
            this.#centerUnit = null;
        }
        this.#updateCursor();
    }

    getCenteredOnUnit() {
        return this.#centerUnit;
    }

    setTheatre(theatre: string) {
        var bounds = new L.LatLngBounds([-90, -180], [90, 180]);
        var miniMapZoom = 5;
        if (theatre in mapBounds) {
            bounds = mapBounds[theatre as keyof typeof mapBounds].bounds;
            miniMapZoom = mapBounds[theatre as keyof typeof mapBounds].zoom;
        }

        this.setView(bounds.getCenter(), 8);

        if (this.#miniMap)
            this.#miniMap.remove();

        //@ts-ignore // Needed because some of the inputs are wrong in the original module interface
        this.#miniMap = new ClickableMiniMap(this.#miniMapLayerGroup, { position: "topright", width: 192 * 1.5, height: 108 * 1.5, zoomLevelFixed: miniMapZoom, centerFixed: bounds.getCenter() }).addTo(this);
        this.#miniMap.disableInteractivity();
        this.#miniMap.getMap().on("click", (e: any) => {
            if (this.#miniMap)
                this.setView(e.latlng);
        })

        const boundaries = this.#getMinimapBoundaries();
        this.#miniMapPolyline.setLatLngs(boundaries[theatre as keyof typeof boundaries]);
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

    addTemporaryMarker(latlng: L.LatLng, name: string, coalition: string, commandHash?: string) {
        var marker = new TemporaryUnitMarker(latlng, name, coalition, commandHash);
        marker.addTo(this);
        this.#temporaryMarkers.push(marker);
        return marker;
    }

    getSelectedCoalitionArea() {
        return this.#coalitionAreas.find((area: CoalitionArea) => { return area.getSelected() });
    }

    bringCoalitionAreaToBack(coalitionArea: CoalitionArea) {
        coalitionArea.bringToBack();
        this.#coalitionAreas.splice(this.#coalitionAreas.indexOf(coalitionArea), 1);
        this.#coalitionAreas.unshift(coalitionArea);
    }

    getVisibilityOptions() {
        return this.#visibilityOptions;
    }

    isZooming() {
        return this.#isZooming;
    }

    getPreviousZoom() {
        return this.#previousZoom;
    }

    getIsUnitProtected(unit: Unit) {
        const toggles = this.#mapMarkerVisibilityControls.reduce((list, control: MapMarkerVisibilityControl) => {
            if (control.isProtected) {
                list = list.concat(control.toggles);
            }
            return list;
        }, [] as string[]);

        if (toggles.length === 0)
            return false;

        return toggles.some((toggle: string) => {
            //  Specific coding for robots - extend later if needed
            return (toggle === "dcs" && !unit.getControlled() && !unit.getHuman());
        });
    }

    getMapMarkerVisibilityControls() {
        return this.#mapMarkerVisibilityControls;
    }

    /* Event handlers */
    #onClick(e: any) {
        if (!this.#preventLeftClick) {
            this.hideAllContextMenus();
            if (this.#state === IDLE) {
                this.deselectAllCoalitionAreas();
            }
            else if (this.#state === COALITIONAREA_DRAW_POLYGON) {
                if (this.getSelectedCoalitionArea()?.getEditing()) {
                    this.getSelectedCoalitionArea()?.addTemporaryLatLng(e.latlng);
                }
                else {
                    this.deselectAllCoalitionAreas();
                }
            }
            else {
                this.setState(IDLE);
                getApp().getUnitsManager().deselectAllUnits();
            }
        }
    }

    #onDoubleClick(e: any) {

    }

    #onContextMenu(e: any) {
        /* A long press will show the point action context menu */
        window.clearInterval(this.#longPressTimer);
        if (this.#longPressHandled) {
            this.#longPressHandled = false;
            return;
        }

        this.hideMapContextMenu();
        if (this.#state === IDLE) {
            if (this.#state == IDLE) {
                this.showMapContextMenu(e.originalEvent.x, e.originalEvent.y, e.latlng);
                var clickedCoalitionArea = null;

                /* Coalition areas are ordered in the #coalitionAreas array according to their zindex. Select the upper one */
                for (let coalitionArea of this.#coalitionAreas) {
                    if (polyContains(e.latlng, coalitionArea)) {
                        if (coalitionArea.getSelected())
                            clickedCoalitionArea = coalitionArea;
                        else
                            this.getMapContextMenu().setCoalitionArea(coalitionArea);
                    }
                }
                if (clickedCoalitionArea)
                    this.showCoalitionAreaContextMenu(e.originalEvent.x, e.originalEvent.y, e.latlng, clickedCoalitionArea);
            }
        }
        else if (this.#state === MOVE_UNIT) {
            if (!e.originalEvent.shiftKey) {
                if (!e.originalEvent.ctrlKey) {
                    getApp().getUnitsManager().clearDestinations();
                }
                getApp().getUnitsManager().addDestination(this.#computeDestinationRotation && this.#destinationRotationCenter != null ? this.#destinationRotationCenter : e.latlng, this.#shiftKey, this.#destinationGroupRotation)

                this.#destinationGroupRotation = 0;
                this.#destinationRotationCenter = null;
                this.#computeDestinationRotation = false;
            }
        }
        else {
            this.setState(IDLE);
        }
    }

    #onSelectionStart(e: any) {
        this.#selecting = true;
        this.#updateCursor();
    }

    #onSelectionEnd(e: any) {
        this.#selecting = false;
        clearTimeout(this.#leftClickTimer);
        this.#preventLeftClick = true;
        this.#leftClickTimer = window.setTimeout(() => {
            this.#preventLeftClick = false;
        }, 200);
        getApp().getUnitsManager().selectFromBounds(e.selectionBounds);
        this.#updateCursor();
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

        this.#longPressTimer = window.setTimeout(() => {
            this.hideMapContextMenu();
            this.#longPressHandled = true;

            if (e.originalEvent.button != 2 || e.originalEvent.ctrlKey || e.originalEvent.shiftKey)
                return;

            var contextActionSet = new ContextActionSet();
            var units = getApp().getUnitsManager().getSelectedUnits();
            units.forEach((unit: Unit) => {
                unit.appendContextActions(contextActionSet, null, e.latlng);
            })

            if (Object.keys(contextActionSet.getContextActions()).length > 0) {
                getApp().getMap().showUnitContextMenu(e.originalEvent.x, e.originalEvent.y, e.latlng);
                getApp().getMap().getUnitContextMenu().setContextActions(contextActionSet);
            }
        }, 150);
        this.#longPressHandled = false;
    }

    #onMouseUp(e: any) {
        if (this.#state === MOVE_UNIT && e.originalEvent.button == 2 && e.originalEvent.shiftKey) {
            if (!e.originalEvent.ctrlKey) {
                getApp().getUnitsManager().clearDestinations();
            }
            getApp().getUnitsManager().addDestination(this.#computeDestinationRotation && this.#destinationRotationCenter != null ? this.#destinationRotationCenter : e.latlng, this.#shiftKey, this.#destinationGroupRotation)

            this.#destinationGroupRotation = 0;
            this.#destinationRotationCenter = null;
            this.#computeDestinationRotation = false;
        }
    }

    #onMouseMove(e: any) {
        this.#lastMousePosition.x = e.originalEvent.x;
        this.#lastMousePosition.y = e.originalEvent.y;

        this.#updateCursor();

        if (this.#state === MOVE_UNIT) {
            /* Update the position of the destination cursors depeding on mouse rotation */
            if (this.#computeDestinationRotation && this.#destinationRotationCenter != null)
                this.#destinationGroupRotation = -bearing(this.#destinationRotationCenter.lat, this.#destinationRotationCenter.lng, this.getMouseCoordinates().lat, this.getMouseCoordinates().lng);
            this.#updateDestinationCursors();
        }
        else if (this.#state === COALITIONAREA_DRAW_POLYGON && e.latlng !== undefined) {
            this.#drawingCursor.setLatLng(e.latlng);
            /* Update the polygon being drawn with the current position of the mouse cursor */
            this.getSelectedCoalitionArea()?.moveActiveVertex(e.latlng);
        }
    }

    #onKeyDown(e: any) {
        this.#shiftKey = e.originalEvent.shiftKey;
        this.#ctrlKey = e.originalEvent.ctrlKey;
        this.#updateCursor();
        this.#updateDestinationCursors();
    }

    #onKeyUp(e: any) {
        this.#shiftKey = e.originalEvent.shiftKey;
        this.#ctrlKey = e.originalEvent.ctrlKey;
        this.#updateCursor();
        this.#updateDestinationCursors();
    }

    #onZoomStart(e: any) {
        this.#previousZoom = this.getZoom();
        if (this.#centerUnit != null)
            this.#panToUnit(this.#centerUnit);
        this.#isZooming = true;
    }

    #onZoom(e: any) {
        if (this.#centerUnit != null)
            this.#panToUnit(this.#centerUnit);
    }

    #onZoomEnd(e: any) {
        this.#isZooming = false;
    }

    /* */
    #panToUnit(unit: Unit) {
        var unitPosition = new L.LatLng(unit.getPosition().lat, unit.getPosition().lng);
        this.setView(unitPosition, this.getZoom(), { animate: false });
        this.#updateCursor();
        this.#updateDestinationCursors();
    }

    #getMinimapBoundaries() {
        /* Draw the limits of the maps in the minimap*/
        return minimapBoundaries;
    }

    #createUnitMarkerControlButtons() {
        const unitVisibilityControls = <HTMLElement>document.getElementById("unit-visibility-control");
        const makeTitle = (isProtected: boolean) => {
            return (isProtected) ? "Unit type is protected and will ignore orders" : "Unit is NOT protected and will respond to orders";
        }
        this.getMapMarkerVisibilityControls().forEach((control: MapMarkerVisibilityControl) => {
            const toggles = `["${control.toggles.join('","')}"]`;
            const div = document.createElement("div");
            div.className = control.protectable === true ? "protectable" : "";

            // TODO: for consistency let's avoid using innerHTML. Let's create elements.
            div.innerHTML = `
                <button data-on-click="toggleMarkerVisibility" title="${control.tooltip}" data-on-click-params='{"types":${toggles}}'>
                    <img src="/resources/theme/images/buttons/${control.image}" />
                </button>
            `;
            unitVisibilityControls.appendChild(div);

            if (control.protectable) {
                div.innerHTML += `
                <button class="lock" ${control.isProtected ? "data-protected" : ""} title="${makeTitle(control.isProtected || false)}">
                    <img src="/resources/theme/images/buttons/other/lock-solid.svg" class="locked" />
                    <img src="/resources/theme/images/buttons/other/lock-open-solid.svg" class="unlocked" />
                </button>`;

                const btn = <HTMLButtonElement>div.querySelector("button.lock");
                btn.addEventListener("click", (ev: MouseEventInit) => {
                    control.isProtected = !control.isProtected;
                    btn.toggleAttribute("data-protected", control.isProtected);
                    btn.title = makeTitle(control.isProtected);
                    document.dispatchEvent(new CustomEvent("toggleMarkerProtection", {
                        detail: {
                            "_element": btn,
                            "control": control
                        }
                    }));
                });
            }
        });

        unitVisibilityControls.querySelectorAll(`img[src$=".svg"]`).forEach(img => SVGInjector(img));
    }

    #deselectSelectedCoalitionArea() {
        this.getSelectedCoalitionArea()?.setSelected(false);
    }

    /* Cursors */
    #updateCursor() {
        /* If the ctrl key is being pressed or we are performing an area selection, show the default cursor */
        if (this.#ctrlKey || this.#selecting) {
            /* Hide all non default cursors */
            this.#hideDestinationCursors();
            this.#hideDrawingCursor();

            this.#showDefaultCursor();
        } else {
            /* Hide all the unnecessary cursors depending on the active state */
            if (this.#state !== IDLE) this.#hideDefaultCursor();
            if (this.#state !== MOVE_UNIT) this.#hideDestinationCursors();
            if (this.#state !== COALITIONAREA_DRAW_POLYGON) this.#hideDrawingCursor();

            /* Show the active cursor depending on the active state */
            if (this.#state === IDLE) this.#showDefaultCursor();
            else if (this.#state === MOVE_UNIT) this.#showDestinationCursors();
            else if (this.#state === COALITIONAREA_DRAW_POLYGON) this.#showDrawingCursor();
        }
    }

    #showDefaultCursor() {
        document.getElementById(this.#ID)?.classList.remove("hidden-cursor");
    }

    #hideDefaultCursor() {
        document.getElementById(this.#ID)?.classList.add("hidden-cursor");
    }

    #showDestinationCursors() {
        const singleCursor = !this.#shiftKey;
        const selectedUnitsCount = getApp().getUnitsManager().getSelectedUnits({ excludeHumans: true, excludeProtected: true, onlyOnePerGroup: true }).length;
        if (singleCursor) {
            this.#hideDestinationCursors();
        }
        else if (!singleCursor) {
            if (selectedUnitsCount > 1) {
                while (this.#destinationPreviewCursors.length > selectedUnitsCount) {
                    this.removeLayer(this.#destinationPreviewCursors[0]);
                    this.#destinationPreviewCursors.splice(0, 1);
                }

                this.#destinationPreviewHandleLine.addTo(this);
                this.#destinationPreviewHandle.addTo(this);

                while (this.#destinationPreviewCursors.length < selectedUnitsCount) {
                    var cursor = new DestinationPreviewMarker(this.getMouseCoordinates(), { interactive: false });
                    cursor.addTo(this);
                    this.#destinationPreviewCursors.push(cursor);
                }

                this.#updateDestinationCursors();
            }
        }
    }

    #updateDestinationCursors() {
        const selectedUnitsCount = getApp().getUnitsManager().getSelectedUnits({ excludeHumans: true, excludeProtected: true, onlyOnePerGroup: true }).length;
        if (selectedUnitsCount > 1) {
            const groupLatLng = this.#computeDestinationRotation && this.#destinationRotationCenter != null ? this.#destinationRotationCenter : this.getMouseCoordinates();
            if (this.#destinationPreviewCursors.length == 1)
                this.#destinationPreviewCursors[0].setLatLng(this.getMouseCoordinates());
            else {
                Object.values(getApp().getUnitsManager().computeGroupDestination(groupLatLng, this.#destinationGroupRotation)).forEach((latlng: L.LatLng, idx: number) => {
                    if (idx < this.#destinationPreviewCursors.length)
                        this.#destinationPreviewCursors[idx].setLatLng(this.#shiftKey ? latlng : this.getMouseCoordinates());
                })
            };

            this.#destinationPreviewHandleLine.setLatLngs([groupLatLng, this.getMouseCoordinates()]);
            this.#destinationPreviewHandle.setLatLng(this.getMouseCoordinates());
        } else {
            this.#hideDestinationCursors();
        }
    }

    #hideDestinationCursors() {
        /* Remove all the destination cursors */
        this.#destinationPreviewCursors.forEach((marker: L.Marker) => {
            this.removeLayer(marker);
        })
        this.#destinationPreviewCursors = [];

        this.#destinationPreviewHandleLine.removeFrom(this);
        this.#destinationPreviewHandle.removeFrom(this);

        /* Reset the variables used to compute the rotation of the group cursors */
        this.#destinationGroupRotation = 0;
        this.#computeDestinationRotation = false;
        this.#destinationRotationCenter = null;
    }

    #showDrawingCursor() {
        this.#hideDefaultCursor();
        if (!this.hasLayer(this.#drawingCursor))
            this.#drawingCursor.addTo(this);
    }

    #hideDrawingCursor() {
        this.#drawingCursor.setLatLng(new L.LatLng(0, 0));
        if (this.hasLayer(this.#drawingCursor))
            this.#drawingCursor.removeFrom(this);
    }

    #setVisibilityOption(option: string, ev: any) {
        this.#visibilityOptions[option] = ev.currentTarget.checked;
        document.dispatchEvent(new CustomEvent("mapOptionsChanged"));
    }
}

