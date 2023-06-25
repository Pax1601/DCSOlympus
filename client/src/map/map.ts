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
import { layers as mapLayers, mapBounds, minimapBoundaries, IDLE, COALITIONAREA_DRAW_POLYGON, visibilityControls, visibilityControlsTootlips, FIRE_AT_AREA, MOVE_UNIT, CARPET_BOMBING, BOMBING, COALITIONAREA_INTERACT } from "../constants/constants";
import { TargetMarker } from "./targetmarker";
import { CoalitionArea } from "./coalitionarea";
import { CoalitionAreaContextMenu } from "../controls/coalitionareacontextmenu";
import { DrawingCursor } from "./drawingmarker";

L.Map.addInitHook('addHandler', 'boxSelect', BoxSelect);

// TODO would be nice to convert to ts
require("../../public/javascripts/leaflet.nauticscale.js")
require("../../public/javascripts/L.Path.Drag.js")

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
    #centerUnit: Unit | null = null;
    #miniMap: ClickableMiniMap | null = null;
    #miniMapLayerGroup: L.LayerGroup;
    #temporaryMarkers: TemporaryUnitMarker[] = [];
    #selecting: boolean = false;

    #destinationGroupRotation: number = 0;
    #computeDestinationRotation: boolean = false;
    #destinationRotationCenter: L.LatLng | null = null;
    #coalitionAreas: CoalitionArea[] = [];

    #targetCursor: TargetMarker = new TargetMarker(new L.LatLng(0, 0), { interactive: false });
    #destinationPreviewCursors: DestinationPreviewMarker[] = [];
    #drawingCursor: DrawingCursor = new DrawingCursor();

    #mapContextMenu: MapContextMenu = new MapContextMenu("map-contextmenu");
    #unitContextMenu: UnitContextMenu = new UnitContextMenu("unit-contextmenu");
    #airbaseContextMenu: AirbaseContextMenu = new AirbaseContextMenu("airbase-contextmenu");
    #coalitionAreaContextMenu: CoalitionAreaContextMenu = new CoalitionAreaContextMenu("coalition-area-contextmenu");

    #mapSourceDropdown: Dropdown;
    #optionButtons: { [key: string]: HTMLButtonElement[] } = {}

    constructor(ID: string) {
        /* Init the leaflet map */
        //@ts-ignore Needed because the boxSelect option is non-standard
        super(ID, { doubleClickZoom: false, zoomControl: false, boxZoom: false, boxSelect: true, zoomAnimation: true, maxBoundsViscosity: 1.0, minZoom: 7, keyboard: true, keyboardPanDelta: 0 });
        this.setView([37.23, -115.8], 10);

        this.#ID = ID;

        this.setLayer(Object.keys(mapLayers)[0]);

        /* Minimap */
        var minimapLayer = new L.TileLayer(mapLayers[Object.keys(mapLayers)[0] as keyof typeof mapLayers].urlTemplate, { minZoom: 0, maxZoom: 13 });
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
        this.on('selectionstart', (e: any) => this.#onSelectionStart(e));
        this.on('selectionend', (e: any) => this.#onSelectionEnd(e));
        this.on('mousedown', (e: any) => this.#onMouseDown(e));
        this.on('mouseup', (e: any) => this.#onMouseUp(e));
        this.on('mousemove', (e: any) => this.#onMouseMove(e));
        this.on('keydown', (e: any) => this.#onKeyDown(e));
        this.on('keyup', (e: any) => this.#onKeyUp(e));

        /* Event listeners */
        document.addEventListener("toggleCoalitionVisibility", (ev: CustomEventInit) => {
            const el = ev.detail._element;
            el?.classList.toggle("off");
            getUnitsManager().setHiddenType(ev.detail.coalition, !el?.classList.contains("off"));
            Object.values(getUnitsManager().getUnits()).forEach((unit: Unit) => unit.updateVisibility());
        });

        document.addEventListener("toggleUnitVisibility", (ev: CustomEventInit) => {
            const el = ev.detail._element;
            el?.classList.toggle("off");
            getUnitsManager().setHiddenType(ev.detail.type, !el?.classList.contains("off"));
            Object.values(getUnitsManager().getUnits()).forEach((unit: Unit) => unit.updateVisibility());
        });

        document.addEventListener("toggleCoalitionAreaInteraction", (ev: CustomEventInit) => {
            const el = ev.detail._element;
            /* Add listener to set the button to off if the state changes */
            document.addEventListener("mapStateChanged", () => el?.classList.toggle("off", !(this.getState() === COALITIONAREA_INTERACT)));
            if (this.getState() !== COALITIONAREA_INTERACT)
                this.setState(COALITIONAREA_INTERACT);
            else
                this.setState(IDLE);
        });       

        document.addEventListener("toggleCoalitionAreaDraw", (ev: CustomEventInit) => {
            const el = ev.detail._element;
            /* Add listener to set the button to off if the state changes */
            document.addEventListener("mapStateChanged", () => el?.classList.toggle("off", !(this.getState() === COALITIONAREA_DRAW_POLYGON)));
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

        /* Pan interval */
        this.#panInterval = window.setInterval(() => {
            if (this.#panLeft || this.#panDown || this.#panRight || this.#panLeft)
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
        if (this.#state !== COALITIONAREA_INTERACT) {
            this.#coalitionAreas.forEach((coalitionArea: CoalitionArea) => {
                coalitionArea.setInteractive(false);
            });            
        }
        if (this.#state !== COALITIONAREA_DRAW_POLYGON) {
            this.#deselectCoalitionAreas();
        }

        /* Operations to perform if you ARE in a state */
        if (this.#state === COALITIONAREA_INTERACT) {
            this.#coalitionAreas.forEach((coalitionArea: CoalitionArea) => {
                coalitionArea.setInteractive(true);
            });       
        }
        else if (this.#state === COALITIONAREA_DRAW_POLYGON) {
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

    /* Context Menus */
    hideAllContextMenus() {
        this.hideMapContextMenu();
        this.hideUnitContextMenu();
        this.hideAirbaseContextMenu();
        this.hideCoalitionAreaContextMenu();
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

    showCoalitionAreaContextMenu(e: any, coalitionArea: CoalitionArea) {
        this.hideAllContextMenus();
        var x = e.originalEvent.x;
        var y = e.originalEvent.y;
        this.#coalitionAreaContextMenu.show(x, y, e.latlng);
        this.#coalitionAreaContextMenu.setCoalitionArea(coalitionArea);
    }

    getCoalitionAreaContextMenu() {
        return this.#coalitionAreaContextMenu;
    }

    hideCoalitionAreaContextMenu() {
        this.#coalitionAreaContextMenu.hide();
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
        if (theatre in mapBounds) {
            bounds = mapBounds[theatre as keyof typeof mapBounds].bounds;
            miniMapZoom = mapBounds[theatre as keyof typeof mapBounds].zoom;
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

    addTemporaryMarker(spawnOptions: SpawnOptions) {
        var marker = new TemporaryUnitMarker(spawnOptions);
        marker.addTo(this);
        this.#temporaryMarkers.push(marker);
    }

    removeTemporaryMarker(latlng: L.LatLng) {
        // TODO something more refined than this
        var dist: number | null = null;
        var closest: L.Marker | null = null;
        var i: number = 0;
        this.#temporaryMarkers.forEach((marker: L.Marker, idx: number) => {
            var t = latlng.distanceTo(marker.getLatLng());
            if (dist == null || t < dist) {
                dist = t;
                closest = marker;
                i = idx;
            }
        });
        if (closest && dist != null && dist < 100) {
            this.removeLayer(closest);
            this.#temporaryMarkers.splice(i, 1);
        }
    }

    getSelectedCoalitionArea() {
        return this.#coalitionAreas.find((area: CoalitionArea) => { return area.getSelected() });
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
                getUnitsManager().deselectAllUnits();
            }
        }
    }

    #onDoubleClick(e: any) {
        this.deselectAllCoalitionAreas();
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
            getUnitsManager().selectedUnitsAddDestination(this.#computeDestinationRotation && this.#destinationRotationCenter != null ? this.#destinationRotationCenter : e.latlng, e.originalEvent.shiftKey, this.#destinationGroupRotation)
            this.#destinationGroupRotation = 0;
            this.#destinationRotationCenter = null;
            this.#computeDestinationRotation = false;
        }
        else if (this.#state === BOMBING) {
            getUnitsManager().getSelectedUnits().length > 0 ? this.setState(MOVE_UNIT) : this.setState(IDLE);
            getUnitsManager().selectedUnitsBombPoint(this.getMouseCoordinates());
        }
        else if (this.#state === CARPET_BOMBING) {
            getUnitsManager().getSelectedUnits().length > 0 ? this.setState(MOVE_UNIT) : this.setState(IDLE);
            getUnitsManager().selectedUnitsCarpetBomb(this.getMouseCoordinates());
        }
        else if (this.#state === FIRE_AT_AREA) {
            getUnitsManager().getSelectedUnits().length > 0 ? this.setState(MOVE_UNIT) : this.setState(IDLE);
            getUnitsManager().selectedUnitsFireAtArea(this.getMouseCoordinates());
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
        getUnitsManager().selectFromBounds(e.selectionBounds);
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
    }

    #onMouseUp(e: any) {
    }

    #onMouseMove(e: any) {
        this.#lastMousePosition.x = e.originalEvent.x;
        this.#lastMousePosition.y = e.originalEvent.y;

        this.#updateCursor(e);

        if (this.#state === MOVE_UNIT) {
            /* Update the position of the destination cursors depeding on mouse rotation */
            if (this.#computeDestinationRotation && this.#destinationRotationCenter != null)
                this.#destinationGroupRotation = -bearing(this.#destinationRotationCenter.lat, this.#destinationRotationCenter.lng, this.getMouseCoordinates().lat, this.getMouseCoordinates().lng);
            this.#updateDestinationCursors(e);
        }
        else if ([BOMBING, CARPET_BOMBING, FIRE_AT_AREA].includes(this.#state)) {
            this.#targetCursor.setLatLng(this.getMouseCoordinates());
        }
        else if (this.#state === COALITIONAREA_DRAW_POLYGON) {
            this.#drawingCursor.setLatLng(e.latlng);
            /* Update the polygon being drawn with the current position of the mouse cursor */
            this.getSelectedCoalitionArea()?.moveActiveVertex(e.latlng);
        }
    }

    #onKeyDown(e: any) {
        this.#updateDestinationCursors(e);
        this.#updateCursor(e);
    }

    #onKeyUp(e: any) {
        this.#updateDestinationCursors(e);
        this.#updateCursor(e);
    }

    #onZoom(e: any) {
        if (this.#centerUnit != null)
            this.#panToUnit(this.#centerUnit);
    }

    #panToUnit(unit: Unit) {
        var unitPosition = new L.LatLng(unit.getData().position.lat, unit.getData().position.lng);
        this.setView(unitPosition, this.getZoom(), { animate: false });
    }

    #getMinimapBoundaries() {
        /* Draw the limits of the maps in the minimap*/
        return minimapBoundaries;
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

    #deselectCoalitionAreas() {
        this.getSelectedCoalitionArea()?.setSelected(false);
    }

    /* Cursors */
    #showDefaultCursor() {
        document.getElementById(this.#ID)?.classList.remove("hidden-cursor");
    }

    #hideDefaultCursor() {
        document.getElementById(this.#ID)?.classList.add("hidden-cursor");
    }

    #showDestinationCursors(singleCursor: boolean) {
        /* Don't create the cursors if there already are the correct number of them available */
        if (singleCursor || getUnitsManager().getSelectedUnits({ excludeHumans: true, onlyOnePerGroup: true }).length != this.#destinationPreviewCursors.length) {
            /* Reset the cursors to start from a clean condition */
            this.#hideDestinationCursors();

            if (getUnitsManager().getSelectedUnits({ excludeHumans: true, onlyOnePerGroup: true }).length > 0) {
                if (singleCursor) {
                    var marker = new DestinationPreviewMarker(this.getMouseCoordinates(), { interactive: false });
                    marker.addTo(this);
                    this.#destinationPreviewCursors = [marker];
                }
                else {
                /* Create the cursors. If a group is selected only one cursor is shown for it, because you can't control single units in a group */
                    this.#destinationPreviewCursors = getUnitsManager().getSelectedUnits({ excludeHumans: true, onlyOnePerGroup: true }).map((unit: Unit) => {
                        var marker = new DestinationPreviewMarker(this.getMouseCoordinates(), { interactive: false });
                        marker.addTo(this);
                        return marker;
                    });
                }
            }
        }
    }

    #updateDestinationCursors(e: any) {
        const groupLatLng = this.#computeDestinationRotation && this.#destinationRotationCenter != null ? this.#destinationRotationCenter : this.getMouseCoordinates();
        if (this.#destinationPreviewCursors.length == 1)
            this.#destinationPreviewCursors[0].setLatLng(this.getMouseCoordinates());
        else {
            Object.values(getUnitsManager().selectedUnitsComputeGroupDestination(groupLatLng, this.#destinationGroupRotation)).forEach((latlng: L.LatLng, idx: number) => {
                if (idx < this.#destinationPreviewCursors.length)
                    this.#destinationPreviewCursors[idx].setLatLng(e.originalEvent.shiftKey ? latlng : this.getMouseCoordinates());
            })
        };
    }

    #hideDestinationCursors() {
        /* Remove all the destination cursors */
        this.#destinationPreviewCursors.forEach((marker: L.Marker) => {
            this.removeLayer(marker);
        })
        this.#destinationPreviewCursors = [];

        /* Reset the variables used to compute the rotation of the group cursors */
        this.#destinationGroupRotation = 0;
        this.#computeDestinationRotation = false;
        this.#destinationRotationCenter = null;
    }

    #showTargetCursor() {
        this.#hideTargetCursor();
        this.#targetCursor.addTo(this);
    }

    #hideTargetCursor() {
        this.#targetCursor.setLatLng(new L.LatLng(0, 0));
        this.removeLayer(this.#targetCursor);
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

    #updateCursor(e?: any) {
        /* If the ctrl key is being pressed or we are performing an area selection, show the default cursor */
        if (e?.originalEvent.ctrlKey || this.#selecting) {
            /* Hide all non default cursors */
            this.#hideDestinationCursors();
            this.#hideTargetCursor();
            this.#hideDrawingCursor();

            this.#showDefaultCursor();
        } else {
            /* Hide all the unnecessary cursors depending on the active state */
            if (this.#state !== IDLE && this.#state !== COALITIONAREA_INTERACT) this.#hideDefaultCursor();
            if (this.#state !== MOVE_UNIT) this.#hideDestinationCursors();
            if (![BOMBING, CARPET_BOMBING, FIRE_AT_AREA].includes(this.#state)) this.#hideTargetCursor();
            if (this.#state !== COALITIONAREA_DRAW_POLYGON) this.#hideDrawingCursor();

            /* Show the active cursor depending on the active state */
            if (this.#state === IDLE || this.#state === COALITIONAREA_INTERACT) this.#showDefaultCursor();
            else if (this.#state === MOVE_UNIT) this.#showDestinationCursors(e && e.originaleEvent && !e.originalEvent.shiftKey);
            else if ([BOMBING, CARPET_BOMBING, FIRE_AT_AREA].includes(this.#state)) this.#showTargetCursor();
            else if (this.#state === COALITIONAREA_DRAW_POLYGON) this.#showDrawingCursor();
        }
    }
}

