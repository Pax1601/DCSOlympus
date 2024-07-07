import * as L from "leaflet";
import { getApp } from "../olympusapp";
import { BoxSelect } from "./boxselect";
import { Airbase } from "../mission/airbase";
import { Unit } from "../unit/unit";
import {
  bearing,
  deg2rad,
  getGroundElevation,
  polyContains,
} from "../other/utils";
import { DestinationPreviewMarker } from "./markers/destinationpreviewmarker";
import { TemporaryUnitMarker } from "./markers/temporaryunitmarker";
import { ClickableMiniMap } from "./clickableminimap";
import {
  defaultMapLayers,
  mapBounds,
  minimapBoundaries,
  IDLE,
  COALITIONAREA_DRAW_POLYGON,
  defaultMapMirrors,
  SPAWN_UNIT,
  CONTEXT_ACTION,
  MAP_OPTIONS_DEFAULTS,
  MAP_HIDDEN_TYPES_DEFAULTS,
} from "../constants/constants";
import { CoalitionArea } from "./coalitionarea/coalitionarea";
import { TouchBoxSelect } from "./touchboxselect";
import { DestinationPreviewHandle } from "./markers/destinationpreviewHandle";

import "./markers/stylesheets/airbase.css";
import "./markers/stylesheets/bullseye.css";
import "./markers/stylesheets/units.css";

// Temporary
import "./theme.css";
import { MapHiddenTypes, MapOptions } from "../types/types";
import { SpawnRequestTable } from "../interfaces";
import { ContextAction } from "../unit/contextaction";

L.Map.addInitHook("addHandler", "boxSelect", BoxSelect);

export class Map extends L.Map {
  /* Options */
  #options: MapOptions = MAP_OPTIONS_DEFAULTS;
  #hiddenTypes: MapHiddenTypes = MAP_HIDDEN_TYPES_DEFAULTS;

  #ID: string;
  #state: string;
  #layer: L.TileLayer | L.LayerGroup | null = null;

  #spawnRequestTable: SpawnRequestTable | null = null;

  #preventLeftClick: boolean = false;
  #leftClickTimer: number = 0;
  #deafultPanDelta: number = 100;
  #panInterval: number | null = null;
  #panLeft: boolean = false;
  #panRight: boolean = false;
  #panUp: boolean = false;
  #panDown: boolean = false;

  #lastMousePosition: L.Point = new L.Point(0, 0);
  #lastMouseCoordinates: L.LatLng = new L.LatLng(0, 0);

  #shiftKey: boolean = false;
  #centerUnit: Unit | null = null;

  #miniMap: ClickableMiniMap | null = null;
  #miniMapLayerGroup: L.LayerGroup;
  #miniMapPolyline: L.Polyline;

  #temporaryMarkers: TemporaryUnitMarker[] = [];

  #isSelecting: boolean = false;
  #isZooming: boolean = false;
  #previousZoom: number = 0;

  #slaveDCSCamera: boolean = false;
  #slaveDCSCameraAvailable: boolean = false;
  #cameraControlTimer: number = 0;
  #cameraControlPort: number = 3003;
  #cameraControlMode: string = "map";

  #coalitionAreas: CoalitionArea[] = [];

  #mapLayers: any = defaultMapLayers;
  #mapMirrors: any = defaultMapMirrors;
  #layerName: string = "";
  #cameraOptionsXmlHttp: XMLHttpRequest | null = null;
  #bradcastPositionXmlHttp: XMLHttpRequest | null = null;
  #cameraZoomRatio: number = 1.0;

  #contextAction: null | ContextAction = null;
  #theatre: string = "";
  #waitingForDoubleClick: boolean = false;
  #doubleClickTimer: number = 0;
  #longPressTimer: number = 0;
  #isDragging: boolean = false;

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
      keyboardPanDelta: 0
    });
    this.setView([37.23, -115.8], 10);

    this.#ID = ID;

    /* Minimap */
    var minimapLayer = new L.TileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { minZoom: 0, maxZoom: 13 }
    );
    this.#miniMapLayerGroup = new L.LayerGroup([minimapLayer]);
    this.#miniMapPolyline = new L.Polyline([], { color: "#202831" });
    this.#miniMapPolyline.addTo(this.#miniMapLayerGroup);

    /* Init the state machine */
    this.#state = IDLE;

    /* Register event handles */
    this.on("click", (e: any) => this.#onClick(e));
    this.on("dblclick", (e: any) => this.#onDoubleClick(e));
    this.on("zoomstart", (e: any) => this.#onZoomStart(e));
    this.on("zoom", (e: any) => this.#onZoom(e));
    this.on("zoomend", (e: any) => this.#onZoomEnd(e));
    this.on("drag", (e: any) => this.centerOnUnit(null));
    this.on("dragstart", (e: any) => this.#onDragStart());
    this.on("dragend", (e: any) => this.#onDragEnd(null));
    this.on("contextmenu", (e: any) => this.#onContextMenu(e));
    this.on("selectionstart", (e: any) => this.#onSelectionStart(e));
    this.on("selectionend", (e: any) => this.#onSelectionEnd(e));
    this.on("mouseup", (e: any) => this.#onMouseUp(e));
    this.on("mousedown", (e: any) => this.#onMouseDown(e));
    this.on("mousemove", (e: any) => this.#onMouseMove(e));
    this.on("keydown", (e: any) => this.#onKeyDown(e));
    this.on("keyup", (e: any) => this.#onKeyUp(e));
    this.on("move", (e: any) => {
      if (this.#slaveDCSCamera) this.#broadcastPosition();
    });

    L.DomEvent.on(this.getContainer(), "touchstart", this.#onMouseDown, this);
    L.DomEvent.on(this.getContainer(), "touchend", this.#onMouseUp, this);

    /* Event listeners */
    document.addEventListener("hiddenTypesChanged", (ev: CustomEventInit) => {
      Object.values(getApp().getUnitsManager().getUnits()).forEach(
        (unit: Unit) => unit.updateVisibility()
      );
      Object.values(getApp().getMissionManager().getAirbases()).forEach(
        (airbase: Airbase) => {
          if (this.getHiddenTypes().airbase) airbase.removeFrom(this);
          else airbase.addTo(this);
        }
      );
    });

    document.addEventListener(
      "toggleCoalitionAreaDraw",
      (ev: CustomEventInit) => {
        //this.getMapContextMenu().hide();
        this.deselectAllCoalitionAreas();
        if (ev.detail?.type == "polygon") {
          if (this.getState() !== COALITIONAREA_DRAW_POLYGON)
            this.setState(COALITIONAREA_DRAW_POLYGON);
          else this.setState(IDLE);
        }
      }
    );

    //document.addEventListener("unitUpdated", (ev: CustomEvent) => {
    //    if (this.#centerUnit != null && ev.detail == this.#centerUnit)
    //        this.#panToUnit(this.#centerUnit);
    //});

    document.addEventListener("mapOptionsChanged", () => {
      this.getContainer().toggleAttribute(
        "data-hide-labels",
        !this.getOptions().showUnitLabels
      );
      //this.#cameraControlPort = this.getOptions()[DCS_LINK_PORT] as number;
      //this.#cameraZoomRatio = 50 / (20 + (this.getOptions()[DCS_LINK_RATIO] as number));

      if (this.#slaveDCSCamera) {
        this.#broadcastPosition();
        window.setTimeout(() => {
          this.#broadcastPosition();
        }, 500); // DCS does not always apply the altitude correctly at the first set when changing map type
      }

      this.updateMinimap();
    });

    document.addEventListener("configLoaded", () => {
      let config = getApp().getConfig();
      let layerSet = false;

      /* First load the map mirrors */
      if (config.mapMirrors) {
        let mapMirrors = config.mapMirrors;
        this.#mapMirrors = {
          ...this.#mapMirrors,
          ...mapMirrors,
        };
        this.setLayerName(Object.keys(mapMirrors)[0]);
      }

      /* Set the options, and if at least one mirror is available, select the first */
      if (Object.keys(this.#mapMirrors).length > 0) {
        this.setLayerName(Object.keys(this.#mapMirrors)[0]);
        layerSet = true; // Needed because this is async
      }

      /* Then load the map layers */
      if (config.mapLayers) {
        let mapLayers = config.mapLayers;
        this.#mapLayers = {
          ...this.#mapLayers,
          ...mapLayers,
        };
      }

      /* Append this options, and if no mirror was selected, select the first on (if available). Mirrors have the precedence */
      if (!layerSet && Object.keys(this.#mapLayers).length > 0) {
        this.setLayerName(Object.keys(this.#mapLayers)[0]);
      }
    });

    document.addEventListener("toggleCameraLinkStatus", () => {
      // if (this.#slaveDCSCameraAvailable) { // Commented to experiment with usability
      this.setSlaveDCSCamera(!this.#slaveDCSCamera);
      // }
    });

    document.addEventListener("slewCameraToPosition", () => {
      // if (this.#slaveDCSCameraAvailable) { // Commented to experiment with usability
      this.#broadcastPosition();
      // }
    });

    /* Pan interval */
    this.#panInterval = window.setInterval(() => {
      if (this.#panUp || this.#panDown || this.#panRight || this.#panLeft)
        this.panBy(
          new L.Point(
            ((this.#panLeft ? -1 : 0) + (this.#panRight ? 1 : 0)) *
              this.#deafultPanDelta *
              (this.#shiftKey ? 3 : 1),
            ((this.#panUp ? -1 : 0) + (this.#panDown ? 1 : 0)) *
              this.#deafultPanDelta *
              (this.#shiftKey ? 3 : 1)
          )
        );
    }, 20);

    /* Periodically check if the camera control endpoint is available */
    this.#cameraControlTimer = window.setInterval(() => {
      this.#checkCameraPort();
    }, 1000);
  }

  setLayerName(layerName: string) {
    if (this.#layer) this.removeLayer(this.#layer);

    let theatre = getApp().getMissionManager()?.getTheatre();

    /* Normal or custom layers are handled here */
    if (layerName in this.#mapLayers) {
      const layerData = this.#mapLayers[layerName];
      if (layerData instanceof Array) {
        let layers = layerData.map((layer: any) => {
          return new L.TileLayer(
            layer.urlTemplate.replace("{theatre}", theatre.toLowerCase()),
            layer
          );
        });
        this.#layer = new L.LayerGroup(layers);
        this.#layer?.addTo(this);
      } else {
        this.#layer = new L.TileLayer(layerData.urlTemplate, layerData);
        this.#layer?.addTo(this);
      }

      /* Mirrored layers are handled here */
    } else if (Object.keys(this.#mapMirrors).includes(layerName)) {
      let layers: L.TileLayer[] = [];

      /* Load the configuration file */
      const mirror = this.#mapMirrors[layerName as any];
      const request = new Request(mirror + "/config.json");
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            return response.json();
          } else {
            return {};
          }
        })
        .then((res: any) => {
          if ("alt-" + theatre.toLowerCase() in res) {
            let template = `${mirror}/alt-${theatre.toLowerCase()}/{z}/{x}/{y}.png`;
            layers.push(
              ...res["alt-" + theatre.toLowerCase()].map((layerConfig: any) => {
                return new L.TileLayer(template, {
                  ...layerConfig,
                  crossOrigin: "",
                });
              })
            );
          }
          this.#layer = new L.LayerGroup(layers);
          this.#layer?.addTo(this);
        })
        .catch(() => {
          this.#layer = new L.LayerGroup(layers);
          this.#layer?.addTo(this);
        });
    }
    this.#layerName = layerName;

    document.dispatchEvent(
      new CustomEvent("mapSourceChanged", { detail: layerName })
    );
  }

  getLayerName() {
    return this.#layerName;
  }

  getLayers() {
    return Object.keys(this.#mapLayers);
  }

  /* State machine */
  setState(
    state: string,
    options?: {
      spawnRequestTable?: SpawnRequestTable;
      contextAction?: ContextAction | null;
    }
  ) {
    this.#state = state;

    /* Operations to perform if you are NOT in a state */
    if (this.#state !== COALITIONAREA_DRAW_POLYGON) {
      this.#deselectSelectedCoalitionArea();
    }

    /* Operations to perform if you ARE in a state */
    if (this.#state === IDLE) {
      getApp().getUnitsManager().deselectAllUnits();
    } else if (this.#state === SPAWN_UNIT) {
      this.#spawnRequestTable = options?.spawnRequestTable ?? null;
    } else if (this.#state === CONTEXT_ACTION) {
      this.#contextAction = options?.contextAction ?? null;
    } else if (this.#state === COALITIONAREA_DRAW_POLYGON) {
      this.#coalitionAreas.push(new CoalitionArea([]));
      this.#coalitionAreas[this.#coalitionAreas.length - 1].addTo(this);
    }

    document.dispatchEvent(
      new CustomEvent("mapStateChanged", { detail: this.#state })
    );
  }

  getState() {
    return this.#state;
  }

  deselectAllCoalitionAreas() {
    this.#coalitionAreas.forEach((coalitionArea: CoalitionArea) =>
      coalitionArea.setSelected(false)
    );
  }

  deleteCoalitionArea(coalitionArea: CoalitionArea) {
    if (this.#coalitionAreas.includes(coalitionArea))
      this.#coalitionAreas.splice(
        this.#coalitionAreas.indexOf(coalitionArea),
        1
      );
    if (this.hasLayer(coalitionArea)) this.removeLayer(coalitionArea);
  }

  setHiddenType(key: string, value: boolean) {
    this.#hiddenTypes[key] = value;
    document.dispatchEvent(new CustomEvent("hiddenTypesChanged"));
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
    //this.hideAllContextMenus();
    //this.#mapContextMenu.show(x, y, latlng);
    //document.dispatchEvent(new CustomEvent("mapContextMenu"));
  }

  hideMapContextMenu() {
    //this.#mapContextMenu.hide();
    //document.dispatchEvent(new CustomEvent("mapContextMenu"));
  }

  getMapContextMenu() {
    return null; //this.#mapContextMenu;
  }

  showUnitContextMenu(
    x: number | undefined = undefined,
    y: number | undefined = undefined,
    latlng: L.LatLng | undefined = undefined
  ) {
    //this.hideAllContextMenus();
    //this.#unitContextMenu.show(x, y, latlng);
  }

  getUnitContextMenu() {
    return null; //this.#unitContextMenu;
  }

  hideUnitContextMenu() {
    //this.#unitContextMenu.hide();
  }

  showAirbaseContextMenu(
    airbase: Airbase,
    x: number | undefined = undefined,
    y: number | undefined = undefined,
    latlng: L.LatLng | undefined = undefined
  ) {
    //this.hideAllContextMenus();
    //this.#airbaseContextMenu.show(x, y, latlng);
    //this.#airbaseContextMenu.setAirbase(airbase);
  }

  getAirbaseContextMenu() {
    return null; //this.#airbaseContextMenu;
  }

  hideAirbaseContextMenu() {
    //this.#airbaseContextMenu.hide();
  }

  showAirbaseSpawnMenu(
    airbase: Airbase,
    x: number | undefined = undefined,
    y: number | undefined = undefined,
    latlng: L.LatLng | undefined = undefined
  ) {
    //this.hideAllContextMenus();
    //this.#airbaseSpawnMenu.show(x, y);
    //this.#airbaseSpawnMenu.setAirbase(airbase);
  }

  getAirbaseSpawnMenu() {
    return null; //this.#airbaseSpawnMenu;
  }

  hideAirbaseSpawnMenu() {
    //this.#airbaseSpawnMenu.hide();
  }

  showCoalitionAreaContextMenu(
    x: number,
    y: number,
    latlng: L.LatLng,
    coalitionArea: CoalitionArea
  ) {
    //this.hideAllContextMenus();
    //this.#coalitionAreaContextMenu.show(x, y, latlng);
    //this.#coalitionAreaContextMenu.setCoalitionArea(coalitionArea);
  }

  getCoalitionAreaContextMenu() {
    return null; //this.#coalitionAreaContextMenu;
  }

  hideCoalitionAreaContextMenu() {
    //this.#coalitionAreaContextMenu.hide();
  }

  getMousePosition() {
    return this.#lastMousePosition;
  }

  getMouseCoordinates() {
    return this.#lastMouseCoordinates;
  }

  centerOnUnit(unit: Unit | null) {
    if (unit !== null) {
      this.options.scrollWheelZoom = "center";
      this.#centerUnit = unit;
    } else {
      this.options.scrollWheelZoom = undefined;
      this.#centerUnit = null;
    }
  }

  getCenteredOnUnit() {
    return this.#centerUnit;
  }

  setTheatre(theatre: string) {
    this.#theatre = theatre;

    var bounds = new L.LatLngBounds([-90, -180], [90, 180]);
    if (theatre in mapBounds) {
      bounds = mapBounds[theatre as keyof typeof mapBounds].bounds;
    }

    this.setView(bounds.getCenter(), 8);

    this.updateMinimap();

    const boundaries = this.#getMinimapBoundaries();
    this.#miniMapPolyline.setLatLngs(
      boundaries[theatre as keyof typeof boundaries]
    );

    this.setLayerName(this.#layerName);
  }

  updateMinimap() {
    if (this.#miniMap) this.#miniMap.remove();

    if (this.#options.showMinimap) {
      var bounds = new L.LatLngBounds([-90, -180], [90, 180]);
      var miniMapZoom = 5;
      if (this.#theatre in mapBounds) {
        bounds = mapBounds[this.#theatre as keyof typeof mapBounds].bounds;
        miniMapZoom = mapBounds[this.#theatre as keyof typeof mapBounds].zoom;
      }

      this.#miniMap = new ClickableMiniMap(this.#miniMapLayerGroup, {
        position: "topright",
        width: 192 * 1.5,
        height: 108 * 1.5,
        //@ts-ignore Needed because some of the inputs are wrong in the original module interface
        zoomLevelFixed: miniMapZoom,
        //@ts-ignore Needed because some of the inputs are wrong in the original module interface
        centerFixed: bounds.getCenter(),
      }).addTo(this);
      this.#miniMap.disableInteractivity();
      this.#miniMap.getMap().on("click", (e: any) => {
        if (this.#miniMap) this.setView(e.latlng);
      });
    }
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
    } else {
      switch (e.code) {
        case "KeyA":
        case "ArrowLeft":
          this.#panLeft = true;
          break;
        case "KeyD":
        case "ArrowRight":
          this.#panRight = true;
          break;
        case "KeyW":
        case "ArrowUp":
          this.#panUp = true;
          break;
        case "KeyS":
        case "ArrowDown":
          this.#panDown = true;
          break;
      }
    }
  }

  addTemporaryMarker(
    latlng: L.LatLng,
    name: string,
    coalition: string,
    commandHash?: string
  ) {
    var marker = new TemporaryUnitMarker(latlng, name, coalition, commandHash);
    marker.addTo(this);
    this.#temporaryMarkers.push(marker);
    return marker;
  }

  getSelectedCoalitionArea() {
    return this.#coalitionAreas.find((area: CoalitionArea) => {
      return area.getSelected();
    });
  }

  bringCoalitionAreaToBack(coalitionArea: CoalitionArea) {
    coalitionArea.bringToBack();
    this.#coalitionAreas.splice(this.#coalitionAreas.indexOf(coalitionArea), 1);
    this.#coalitionAreas.unshift(coalitionArea);
  }

  setOption(key, value) {
    this.#options[key] = value;
    document.dispatchEvent(new CustomEvent("mapOptionsChanged"));
  }

  getOptions() {
    return this.#options;
  }

  isZooming() {
    return this.#isZooming;
  }

  getPreviousZoom() {
    return this.#previousZoom;
  }

  getIsUnitProtected(unit: Unit) {
    //const toggles = this.#mapMarkerVisibilityControls.reduce((list, control: MapMarkerVisibilityControl) => {
    //    if (control.isProtected) {
    //        list = list.concat(control.toggles);
    //    }
    //    return list;
    //}, [] as string[]);
    //
    //if (toggles.length === 0)
    //    return false;
    //
    //return toggles.some((toggle: string) => {
    //    //  Specific coding for robots - extend later if needed
    //    return (toggle === "dcs" && !unit.getControlled() && !unit.getHuman());
    //});
    return false;
  }

  getMapMarkerVisibilityControls() {
    return null; //this.#mapMarkerVisibilityControls;
  }

  setSlaveDCSCamera(newSlaveDCSCamera: boolean) {
    this.#slaveDCSCamera = newSlaveDCSCamera;
    let button = document.getElementById("camera-link-control");
    button?.classList.toggle("off", !newSlaveDCSCamera);
    if (this.#slaveDCSCamera) {
      this.#broadcastPosition();
      window.setTimeout(() => {
        this.#broadcastPosition();
      }, 500); // DCS does not always apply the altitude correctly at the first set when changing map type
    }
  }

  setCameraControlMode(newCameraControlMode: string) {
    this.#cameraControlMode = newCameraControlMode;
    if (this.#slaveDCSCamera) {
      this.#broadcastPosition();
      window.setTimeout(() => {
        this.#broadcastPosition();
      }, 500); // DCS does not always apply the altitude correctly at the first set when changing map type
    }
  }

  increaseCameraZoom() {
    //const slider = document.querySelector(`label[title="${DCS_LINK_RATIO}"] input`);
    //if (slider instanceof HTMLInputElement) {
    //    slider.value = String(Math.min(Number(slider.max), Number(slider.value) + 10));
    //    slider.dispatchEvent(new Event('input'));
    //    slider.dispatchEvent(new Event('mouseup'));
    //}
  }

  decreaseCameraZoom() {
    //const slider = document.querySelector(`label[title="${DCS_LINK_RATIO}"] input`);
    //if (slider instanceof HTMLInputElement) {
    //    slider.value = String(Math.max(Number(slider.min), Number(slider.value) - 10));
    //    slider.dispatchEvent(new Event('input'));
    //    slider.dispatchEvent(new Event('mouseup'));
    //}
  }

  executeContextAction(
    targetUnit: Unit | null,
    targetPosition: L.LatLng | null
  ) {
    this.#contextAction?.executeCallback(targetUnit, targetPosition);
  }

  /* Event handlers */
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
        if (!this.#preventLeftClick) {

          /* Execute the short click action */
          if (this.#state === IDLE) {
            this.deselectAllCoalitionAreas();
          } else if (this.#state === SPAWN_UNIT) {
            if (this.#spawnRequestTable !== null) {
              const location = e.latlng;
              this.#spawnRequestTable.unit.location = e.latlng;
              getApp()
                .getUnitsManager()
                .spawnUnits(
                  this.#spawnRequestTable.category,
                  [this.#spawnRequestTable.unit],
                  this.#spawnRequestTable.coalition,
                  false,
                  undefined,
                  undefined,
                  (hash) => {
                    this.addTemporaryMarker(
                      location,
                      this.#spawnRequestTable?.unit.unitType ?? "unknown",
                      this.#spawnRequestTable?.coalition ?? "blue",
                      hash
                    );
                  }
                );
            }
          } else if (this.#state === COALITIONAREA_DRAW_POLYGON) {
            if (this.getSelectedCoalitionArea()?.getEditing()) {
              this.getSelectedCoalitionArea()?.addTemporaryLatLng(e.latlng);
            } else {
              this.deselectAllCoalitionAreas();
            }
          } else if (this.#state === CONTEXT_ACTION) {
            this.executeContextAction(null, e.latlng);
          } else {
            this.setState(IDLE);
            getApp().getUnitsManager().deselectAllUnits();
          }
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

    this.setState(IDLE);
  }

  #onContextMenu(e: any) {}

  #onDragStart(e: any) {
    this.#isDragging = true;
  }

  #onDragEnd(e: any) {
    this.#isDragging = false;
  }

  #onSelectionStart(e: any) {
    this.#isSelecting = true;
  }

  #onSelectionEnd(e: any) {
    this.#isSelecting = false;
    clearTimeout(this.#leftClickTimer);
    this.#preventLeftClick = true;
    this.#leftClickTimer = window.setTimeout(() => {
      this.#preventLeftClick = false;
    }, 200);
    getApp().getUnitsManager().selectFromBounds(e.selectionBounds);
    document.dispatchEvent(new CustomEvent("mapSelectionEnd"));
  }

  #onMouseUp(e: any) {
    window.clearTimeout(this.#longPressTimer);
  }

  #onMouseDown(e: any) {
    this.#longPressTimer = window.setTimeout(()=> {
      if (!this.#isDragging && !this.#isZooming)
        if (e.type === "touchstart")
          document.dispatchEvent(new CustomEvent("mapForceBoxSelect", {detail: e}));
        else
          document.dispatchEvent(new CustomEvent("mapForceBoxSelect", {detail: e.originalEvent}));
    }, 500);
  }

  #onMouseMove(e: any) {
    this.#lastMousePosition.x = e.originalEvent.x;
    this.#lastMousePosition.y = e.originalEvent.y;
    this.#lastMouseCoordinates = this.mouseEventToLatLng(e.originalEvent);

    if (
      this.#state === COALITIONAREA_DRAW_POLYGON &&
      e.latlng !== undefined
    ) {
      /* Update the polygon being drawn with the current position of the mouse cursor */
      this.getSelectedCoalitionArea()?.moveActiveVertex(e.latlng);
    }
  }

  #onKeyDown(e: any) {
    this.#shiftKey = e.originalEvent.shiftKey;
  }

  #onKeyUp(e: any) {
    this.#shiftKey = e.originalEvent.shiftKey;
  }

  #onZoomStart(e: any) {
    this.#previousZoom = this.getZoom();
    if (this.#centerUnit != null) this.#panToUnit(this.#centerUnit);
    this.#isZooming = true;
  }

  #onZoom(e: any) {
    if (this.#centerUnit != null) this.#panToUnit(this.#centerUnit);
  }

  #onZoomEnd(e: any) {
    this.#isZooming = false;
  }

  #broadcastPosition() {
    if (
      this.#bradcastPositionXmlHttp?.readyState !== 4 &&
      this.#bradcastPositionXmlHttp !== null
    )
      return;

    getGroundElevation(this.getCenter(), (response: string) => {
      var groundElevation: number | null = null;
      try {
        groundElevation = parseFloat(response);
        this.#bradcastPositionXmlHttp = new XMLHttpRequest();
        /* Using 127.0.0.1 instead of localhost because the LuaSocket version used in DCS only listens to IPv4. This avoids the lag caused by the
                browser if it first tries to send the request on the IPv6 address for localhost */
        this.#bradcastPositionXmlHttp.open(
          "POST",
          `http://127.0.0.1:${this.#cameraControlPort}`
        );

        const C = 40075016.686;
        let mpp =
          (C * Math.cos(deg2rad(this.getCenter().lat))) /
          Math.pow(2, this.getZoom() + 8);
        let d = mpp * 1920;
        let alt =
          (((d / 2) * 1) / Math.tan(deg2rad(40))) * this.#cameraZoomRatio;
        alt = Math.min(alt, 50000);
        this.#bradcastPositionXmlHttp.send(
          JSON.stringify({
            lat: this.getCenter().lat,
            lng: this.getCenter().lng,
            alt: alt + groundElevation,
            mode: this.#cameraControlMode,
          })
        );
      } catch {
        console.warn("broadcastPosition: could not retrieve ground elevation");
      }
    });
  }

  /* */
  #panToUnit(unit: Unit) {
    var unitPosition = new L.LatLng(
      unit.getPosition().lat,
      unit.getPosition().lng
    );
    this.setView(unitPosition, this.getZoom(), { animate: false });
  }

  #getMinimapBoundaries() {
    /* Draw the limits of the maps in the minimap*/
    return minimapBoundaries;
  }

  #deselectSelectedCoalitionArea() {
    this.getSelectedCoalitionArea()?.setSelected(false);
  }

  #setSlaveDCSCameraAvailable(newSlaveDCSCameraAvailable: boolean) {
    this.#slaveDCSCameraAvailable = newSlaveDCSCameraAvailable;
    let linkButton = document.getElementById("camera-link-control");
    if (linkButton) {
      if (!newSlaveDCSCameraAvailable) {
        //this.setSlaveDCSCamera(false); // Commented to experiment with usability
        linkButton.classList.add("red");
        linkButton.title = "Camera link to DCS is not available";
      } else {
        linkButton.classList.remove("red");
        linkButton.title = "Link/Unlink DCS camera with Olympus position";
      }
    }
  }

  /* Check if the camera control plugin is available. Right now this will only change the color of the button, no changes in functionality */
  #checkCameraPort() {
    if (this.#cameraOptionsXmlHttp?.readyState !== 4)
      this.#cameraOptionsXmlHttp?.abort();

    this.#cameraOptionsXmlHttp = new XMLHttpRequest();

    /* Using 127.0.0.1 instead of localhost because the LuaSocket version used in DCS only listens to IPv4. This avoids the lag caused by the
        browser if it first tries to send the request on the IPv6 address for localhost */
    this.#cameraOptionsXmlHttp.open(
      "OPTIONS",
      `http://127.0.0.1:${this.#cameraControlPort}`
    );
    this.#cameraOptionsXmlHttp.onload = (res: any) => {
      if (
        this.#cameraOptionsXmlHttp !== null &&
        this.#cameraOptionsXmlHttp.status == 204
      )
        this.#setSlaveDCSCameraAvailable(true);
      else this.#setSlaveDCSCameraAvailable(false);
    };
    this.#cameraOptionsXmlHttp.onerror = (res: any) => {
      this.#setSlaveDCSCameraAvailable(false);
    };
    this.#cameraOptionsXmlHttp.ontimeout = (res: any) => {
      this.#setSlaveDCSCameraAvailable(false);
    };
    this.#cameraOptionsXmlHttp.timeout = 500;
    this.#cameraOptionsXmlHttp.send("");
  }
}
