import * as L from "leaflet";
import { getApp } from "../olympusapp";
import { BoxSelect } from "./boxselect";
import { Airbase } from "../mission/airbase";
import { Unit } from "../unit/unit";
import { areaContains, deg2rad, getGroundElevation } from "../other/utils";
import { TemporaryUnitMarker } from "./markers/temporaryunitmarker";
import { ClickableMiniMap } from "./clickableminimap";
import {
  defaultMapLayers,
  mapBounds,
  minimapBoundaries,
  defaultMapMirrors,
  MAP_OPTIONS_DEFAULTS,
  MAP_HIDDEN_TYPES_DEFAULTS,
  OlympusState,
  OlympusSubState,
  NO_SUBSTATE,
  SpawnSubState,
  DrawSubState,
  JTACSubState,
  UnitControlSubState,
  ContextActionTarget,
  ContextActionType,
  ContextActions,
} from "../constants/constants";
import { CoalitionPolygon } from "./coalitionarea/coalitionpolygon";
import { MapHiddenTypes, MapOptions } from "../types/types";
import { EffectRequestTable, OlympusConfig, SpawnRequestTable } from "../interfaces";
import { ContextAction } from "../unit/contextaction";

/* Stylesheets */
import "./markers/stylesheets/airbase.css";
import "./markers/stylesheets/bullseye.css";
import "./markers/stylesheets/units.css";
import "./stylesheets/map.css";
import { CoalitionCircle } from "./coalitionarea/coalitioncircle";

import { initDraggablePath } from "./coalitionarea/draggablepath";
import { ExplosionMarker } from "./markers/explosionmarker";
import { TextMarker } from "./markers/textmarker";
import { TargetMarker } from "./markers/targetmarker";
import {
  AirbaseSelectedEvent,
  AppStateChangedEvent,
  CoalitionAreaSelectedEvent,
  ConfigLoadedEvent,
  ContextActionChangedEvent,
  ContextActionSetChangedEvent,
  HiddenTypesChangedEvent,
  MapContextMenuRequestEvent,
  MapOptionsChangedEvent,
  MapSourceChangedEvent,
  SelectionClearedEvent,
  StarredSpawnContextMenuRequestEvent,
  StarredSpawnsChangedEvent,
  UnitDeselectedEvent,
  UnitSelectedEvent,
  UnitUpdatedEvent,
} from "../events";
import { ContextActionSet } from "../unit/contextactionset";
import { SmokeMarker } from "./markers/smokemarker";

/* Register the handler for the box selection */
L.Map.addInitHook("addHandler", "boxSelect", BoxSelect);

initDraggablePath(L);

export class Map extends L.Map {
  /* Options */
  #options: MapOptions = MAP_OPTIONS_DEFAULTS;
  #hiddenTypes: MapHiddenTypes = MAP_HIDDEN_TYPES_DEFAULTS;

  /* Map layers */
  #theatre: string = "";
  #layer: L.TileLayer | L.LayerGroup | null = null;
  #layerName: string = "";
  #mapLayers: any = defaultMapLayers;
  #mapMirrors: any = defaultMapMirrors;

  /* Inputs timers */
  #mouseCooldownTimer: number = 0;
  #shortPressTimer: number = 0;
  #longPressTimer: number = 0;
  #selecting: boolean = false;

  /* Camera keyboard panning control */
  defaultPanDelta: number = 100;
  #panInterval: number | null = null;
  #panLeft: boolean = false;
  #panRight: boolean = false;
  #panUp: boolean = false;
  #panDown: boolean = false;
  #panFast: boolean = false;

  /* Center on unit target */
  #centeredUnit: Unit | null = null;

  /* Minimap */
  #miniMap: ClickableMiniMap | null = null;
  #miniMapLayerGroup: L.LayerGroup;
  #miniMapPolyline: L.Polyline;

  /* Other state controls */
  #isMouseOnCooldown: boolean = false;
  #isZooming: boolean = false;
  #isDragging: boolean = false;
  #isMouseDown: boolean = false;
  #lastMousePosition: L.Point = new L.Point(0, 0);
  #lastMouseCoordinates: L.LatLng = new L.LatLng(0, 0);
  #previousZoom: number = 0;

  /* Camera control plugin */
  #slaveDCSCamera: boolean = false;
  #slaveDCSCameraAvailable: boolean = false;
  #cameraControlTimer: number = 0;
  #cameraControlPort: number = 3003;
  #cameraControlMode: string = "map";
  #cameraOptionsXmlHttp: XMLHttpRequest | null = null;
  #bradcastPositionXmlHttp: XMLHttpRequest | null = null;
  #cameraZoomRatio: number = 1.0;

  /* Coalition areas drawing */
  #coalitionAreas: (CoalitionPolygon | CoalitionCircle)[] = [];

  /* Units movement */
  #destinationPreviewMarkers: { [key: number]: TemporaryUnitMarker | TargetMarker } = {};
  #destinationRotation: number = 0;
  #isRotatingDestination: boolean = false;

  /* Unit context actions */
  #contextActionSet: null | ContextActionSet = null;
  #contextAction: null | ContextAction = null;

  /* Unit spawning */
  #spawnRequestTable: SpawnRequestTable | null = null;
  #starredSpawnRequestTables: { [key: string]: SpawnRequestTable } = {};
  #effectRequestTable: EffectRequestTable | null = null;
  #temporaryMarkers: TemporaryUnitMarker[] = [];
  #currentSpawnMarker: TemporaryUnitMarker | null = null;
  #currentEffectMarker: ExplosionMarker | SmokeMarker | null = null;

  /* JTAC tools */
  #ECHOPoint: TextMarker | null = null;
  #IPPoint: TextMarker | null = null;
  #targetPoint: TargetMarker | null = null;
  #IPToTargetLine: L.Polygon | null = null;

  /**
   *
   * @param ID - the ID of the HTML element which will contain the map
   */
  constructor(ID: string) {
    /* Init the leaflet map */
    super(ID, {
      preferCanvas: true,
      doubleClickZoom: false,
      zoomControl: false,
      boxZoom: false,
      //@ts-ignore Needed because the boxSelect option is non-standard and unsuppoerted
      boxSelect: true,
      zoomAnimation: true,
      maxBoundsViscosity: 1.0,
      minZoom: 7,
      keyboard: true,
      keyboardPanDelta: 0,
    });
    this.setView([37.23, -115.8], 10);

    /* Minimap */
    var minimapLayer = new L.TileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      minZoom: 0,
      maxZoom: 13,
    });
    this.#miniMapLayerGroup = new L.LayerGroup([minimapLayer]);
    this.#miniMapPolyline = new L.Polyline([], { color: "#202831" });
    this.#miniMapPolyline.addTo(this.#miniMapLayerGroup);

    /* Register event handles */
    this.on("zoomstart", (e: any) => this.#onZoomStart(e));
    this.on("zoom", (e: any) => this.#onZoom(e));
    this.on("zoomend", (e: any) => this.#onZoomEnd(e));

    this.on("dragstart", (e: any) => this.#onDragStart(e));
    this.on("drag", (e: any) => this.centerOnUnit(null));
    this.on("dragend", (e: any) => this.#onDragEnd(e));

    this.on("selectionstart", (e: any) => this.#onSelectionStart(e));
    this.on("selectionend", (e: any) => this.#onSelectionEnd(e));

    this.on("dblclick", (e: any) => this.#onDoubleClick(e));
    this.on("mouseup", (e: any) => this.#onMouseUp(e));
    this.on("mousedown", (e: any) => this.#onMouseDown(e));
    this.on("contextmenu", (e: any) => e.originalEvent.preventDefault());

    this.on("mousemove", (e: any) => this.#onMouseMove(e));

    this.on("move", (e: any) => this.#onMapMove(e));

    /* Custom touch events for touchscreen support */
    L.DomEvent.on(this.getContainer(), "touchstart", this.#onMouseDown, this);
    L.DomEvent.on(this.getContainer(), "touchend", this.#onMouseUp, this);

    /* Event listeners */
    AppStateChangedEvent.on((state, subState) => this.#onStateChanged(state, subState));

    HiddenTypesChangedEvent.on((hiddenTypes) => {
      Object.values(getApp().getUnitsManager().getUnits()).forEach((unit: Unit) => unit.updateVisibility());
      Object.values(getApp().getMissionManager().getAirbases()).forEach((airbase: Airbase) => {
        if (this.getHiddenTypes().airbase) airbase.removeFrom(this);
        else airbase.addTo(this);
      });
    });

    UnitUpdatedEvent.on((unit) => {
      if (this.#centeredUnit != null && unit == this.#centeredUnit) this.#panToUnit(this.#centeredUnit);
      if (unit.getSelected()) this.#moveDestinationPreviewMarkers();
    });

    MapOptionsChangedEvent.on((options: MapOptions) => {
      this.getContainer().toggleAttribute("data-hide-labels", !options.showUnitLabels);
      this.#cameraControlPort = options.cameraPluginPort;
      this.#cameraZoomRatio = 50 / (20 + options.cameraPluginRatio);
      this.#slaveDCSCamera = options.cameraPluginEnabled;
      this.#cameraControlMode = options.cameraPluginMode;

      if (this.#slaveDCSCamera) {
        this.#broadcastPosition();
        window.setTimeout(() => {
          this.#broadcastPosition();
        }, 500); // DCS does not always apply the altitude correctly at the first set when changing map type
      }

      this.updateMinimap();
    });

    ConfigLoadedEvent.on((config: OlympusConfig) => {
      let layerSet = false;

      /* First load the map mirrors */
      if (config.frontend.mapMirrors) {
        let mapMirrors = config.frontend.mapMirrors;
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
      if (config.frontend.mapLayers) {
        let mapLayers = config.frontend.mapLayers;
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

    UnitSelectedEvent.on((unit) => {
      this.#updateDestinationPreviewMarkers();
      this.#destinationRotation = 0;
    });
    UnitDeselectedEvent.on(() => {
      this.#updateDestinationPreviewMarkers();
      this.#destinationRotation = 0;
    });
    SelectionClearedEvent.on(() => {
      this.#updateDestinationPreviewMarkers();
      this.#destinationRotation = 0;
    });
    ContextActionChangedEvent.on((contextAction) => this.#updateDestinationPreviewMarkers());
    MapOptionsChangedEvent.on((mapOptions) => this.#moveDestinationPreviewMarkers());

    /* Pan interval */
    this.#panInterval = window.setInterval(() => {
      if (this.#panUp || this.#panDown || this.#panRight || this.#panLeft)
        this.panBy(
          new L.Point(
            ((this.#panLeft ? -1 : 0) + (this.#panRight ? 1 : 0)) * this.defaultPanDelta * (this.#panFast ? 3 : 1),
            ((this.#panUp ? -1 : 0) + (this.#panDown ? 1 : 0)) * this.defaultPanDelta * (this.#panFast ? 3 : 1)
          )
        );
    }, 20);

    getApp()
      .getShortcutManager()
      .addShortcut("toggleUnitLabels", {
        label: "Hide/show labels",
        keyUpCallback: () => this.setOption("showUnitLabels", !this.getOptions().showUnitLabels),
        code: "KeyL",
      })
      .addShortcut("toggleAcquisitionRings", {
        label: "Hide/show acquisition rings",
        keyUpCallback: () => this.setOption("showUnitsAcquisitionRings", !this.getOptions().showUnitsAcquisitionRings),
        code: "KeyE",
      })
      .addShortcut("toggleEngagementRings", {
        label: "Hide/show engagement rings",
        keyUpCallback: () => this.setOption("showUnitsEngagementRings", !this.getOptions().showUnitsEngagementRings),
        code: "KeyQ",
      })
      .addShortcut("toggleHideShortEngagementRings", {
        label: "Hide/show short range rings",
        keyUpCallback: () => this.setOption("hideUnitsShortRangeRings", !this.getOptions().hideUnitsShortRangeRings),
        code: "KeyR",
      })
      .addShortcut("toggleDetectionLines", {
        label: "Hide/show detection lines",
        keyUpCallback: () => this.setOption("showUnitTargets", !this.getOptions().showUnitTargets),
        code: "KeyF",
      })
      .addShortcut("toggleGroupMembers", {
        label: "Hide/show group members",
        keyUpCallback: () => this.setOption("hideGroupMembers", !this.getOptions().hideGroupMembers),
        code: "KeyG",
      })
      .addShortcut("toggleRelativePositions", {
        label: "Toggle group movement mode",
        keyUpCallback: () => this.setOption("keepRelativePositions", !this.getOptions().keepRelativePositions),
        code: "KeyP",
      })
      .addShortcut("increaseCameraZoom", {
        label: "Increase camera zoom",
        altKey: true,
        keyUpCallback: () => this.increaseCameraZoom(),
        code: "Equal",
      })
      .addShortcut("decreaseCameraZoom", {
        label: "Decrease camera zoom",
        altKey: true,
        keyUpCallback: () => this.decreaseCameraZoom(),
        code: "Minus",
      });

    for (let contextActionName in ContextActions) {
      if (ContextActions[contextActionName].getOptions().hotkey) {
        getApp()
          .getShortcutManager()
          .addShortcut(`${contextActionName}Hotkey`, {
            label: ContextActions[contextActionName].getLabel(),
            code: ContextActions[contextActionName].getOptions().hotkey,
            shiftKey: true,
            keyUpCallback: () => {
              const contextActionSet = this.getContextActionSet();
              if (
                getApp().getState() === OlympusState.UNIT_CONTROL &&
                contextActionSet &&
                ContextActions[contextActionName].getId() in contextActionSet.getContextActions()
              ) {
                if (ContextActions[contextActionName].getOptions().executeImmediately) ContextActions[contextActionName].executeCallback();
                else this.setContextAction(ContextActions[contextActionName]);
              }
            },
          });
      }
    }

    /* Map panning shortcuts */
    getApp()
      .getShortcutManager()
      .addShortcut(`panUp`, {
        label: "Pan map up",
        keyUpCallback: (ev: KeyboardEvent) => (this.#panUp = false),
        keyDownCallback: (ev: KeyboardEvent) => (this.#panUp = true),
        code: "KeyW",
      })
      .addShortcut(`panDown`, {
        label: "Pan map down",
        keyUpCallback: (ev: KeyboardEvent) => (this.#panDown = false),
        keyDownCallback: (ev: KeyboardEvent) => (this.#panDown = true),
        code: "KeyS",
      })
      .addShortcut(`panLeft`, {
        label: "Pan map left",
        keyUpCallback: (ev: KeyboardEvent) => (this.#panLeft = false),
        keyDownCallback: (ev: KeyboardEvent) => (this.#panLeft = true),
        code: "KeyA",
      })
      .addShortcut(`panRight`, {
        label: "Pan map right",
        keyUpCallback: (ev: KeyboardEvent) => (this.#panRight = false),
        keyDownCallback: (ev: KeyboardEvent) => (this.#panRight = true),
        code: "KeyD",
      })
      .addShortcut(`panFast`, {
        label: "Pan map fast",
        keyUpCallback: (ev: KeyboardEvent) => (this.#panFast = false),
        keyDownCallback: (ev: KeyboardEvent) => (this.#panFast = true),
        code: "ShiftLeft",
      });

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
          return new L.TileLayer(layer.urlTemplate.replace("{theatre}", theatre.toLowerCase()), layer);
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

      layers.push(
        new L.TileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
          minZoom: 1,
          maxZoom: 19,
        })
      );

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

    MapSourceChangedEvent.dispatch(layerName);
  }

  getLayerName() {
    return this.#layerName;
  }

  getLayers() {
    return Object.keys(this.#mapLayers);
  }

  setSpawnRequestTable(spawnRequestTable: SpawnRequestTable) {
    this.#spawnRequestTable = spawnRequestTable;
  }

  addStarredSpawnRequestTable(key, spawnRequestTable: SpawnRequestTable) {
    this.#starredSpawnRequestTables[key] = spawnRequestTable;
    StarredSpawnsChangedEvent.dispatch(this.#starredSpawnRequestTables);
  }

  removeStarredSpawnRequestTable(key) {
    if (key in this.#starredSpawnRequestTables) delete this.#starredSpawnRequestTables[key];
    StarredSpawnsChangedEvent.dispatch(this.#starredSpawnRequestTables);
  }

  setEffectRequestTable(effectRequestTable: EffectRequestTable) {
    this.#effectRequestTable = effectRequestTable;
    if (getApp().getState() === OlympusState.SPAWN && getApp().getSubState() === SpawnSubState.SPAWN_EFFECT) {
      this.#currentEffectMarker?.removeFrom(this);
      this.#currentEffectMarker = null;
      if (this.#effectRequestTable?.type === "smoke")
        this.#currentEffectMarker = new SmokeMarker(new L.LatLng(0, 0), this.#effectRequestTable.smokeColor ?? "white");
      this.#currentEffectMarker?.addTo(this);
    }
  }

  setContextActionSet(contextActionSet: ContextActionSet | null) {
    this.#contextActionSet = contextActionSet;
    ContextActionSetChangedEvent.dispatch(this.#contextActionSet);
  }

  setContextAction(contextAction: ContextAction | null) {
    this.#contextAction = contextAction;
    ContextActionChangedEvent.dispatch(this.#contextAction);
  }

  getCurrentControls() {
    const touch = matchMedia("(hover: none)").matches;
    return [];
    // TODO, is this a good idea? I never look at the thing
    //if (getApp().getState() === IDLE) {
    //  return [
    //    {
    //      actions: [touch ? faHandPointer : "LMB"],
    //      target: faJetFighter,
    //      text: "Select unit",
    //    },
    //    touch
    //      ? {
    //          actions: [faHandPointer, "Drag"],
    //          target: faMap,
    //          text: "Box selection",
    //        }
    //      : {
    //          actions: ["Shift", "LMB", "Drag"],
    //          target: faMap,
    //          text: "Box selection",
    //        },
    //    {
    //      actions: [touch ? faHandPointer : "LMB", "Drag"],
    //      target: faMap,
    //      text: "Move map location",
    //    },
    //  ];
    //} else if (getApp().getState() === SPAWN_UNIT) {
    //  return [
    //    {
    //      actions: [touch ? faHandPointer : "LMB"],
    //      target: faMap,
    //      text: "Spawn unit",
    //    },
    //    {
    //      actions: [touch ? faHandPointer : "LMB", 2],
    //      target: faMap,
    //      text: "Exit spawn mode",
    //    },
    //    {
    //      actions: [touch ? faHandPointer : "LMB", "Drag"],
    //      target: faMap,
    //      text: "Move map location",
    //    },
    //  ];
    //} else if (getApp().getState() === SPAWN_EFFECT) {
    //  return [
    //    {
    //      actions: [touch ? faHandPointer : "LMB"],
    //      target: faMap,
    //      text: "Spawn effect",
    //    },
    //    {
    //      actions: [touch ? faHandPointer : "LMB", 2],
    //      target: faMap,
    //      text: "Exit spawn mode",
    //    },
    //    {
    //      actions: [touch ? faHandPointer : "LMB", "Drag"],
    //      target: faMap,
    //      text: "Move map location",
    //    },
    //  ];
    //} else if (getApp().getState() === CONTEXT_ACTION) {
    //  let controls = [
    //    {
    //      actions: [touch ? faHandPointer : "LMB"],
    //      target: faMap,
    //      text: "Deselect units",
    //    },
    //    {
    //      actions: [touch ? faHandPointer : "LMB", "Drag"],
    //      target: faMap,
    //      text: "Move map location",
    //    },
    //  ];
    //
    //  if (this.#contextAction) {
    //    controls.push({
    //      actions: [touch ? faHandPointer : "LMB"],
    //      target: this.#contextAction.getTarget() === "unit" ? faJetFighter : faMap,
    //      text: this.#contextAction?.getLabel() ?? "",
    //    });
    //  }
    //
    //  if (!touch && this.#defaultContextAction) {
    //    controls.push({
    //      actions: ["RMB"],
    //      target: faMap,
    //      text: this.#defaultContextAction?.getLabel() ?? "",
    //    });
    //    controls.push({
    //      actions: ["RMB", "hold"],
    //      target: faMap,
    //      text: "Open context menu",
    //    });
    //  }
    //
    //  return controls;
    //} else if (getApp().getState() === COALITIONAREA_EDIT) {
    //  return [
    //    {
    //      actions: [touch ? faHandPointer : "LMB"],
    //      target: faDrawPolygon,
    //      text: "Select shape",
    //    },
    //    {
    //      actions: [touch ? faHandPointer : "LMB", 2],
    //      target: faMap,
    //      text: "Exit drawing mode",
    //    },
    //    {
    //      actions: [touch ? faHandPointer : "LMB", "Drag"],
    //      target: faMap,
    //      text: "Move map location",
    //    },
    //  ];
    //} else if (getApp().getState() === COALITIONAREA_DRAW_POLYGON) {
    //  return [
    //    {
    //      actions: [touch ? faHandPointer : "LMB"],
    //      target: faMap,
    //      text: "Add vertex to polygon",
    //    },
    //    {
    //      actions: [touch ? faHandPointer : "LMB", 2],
    //      target: faMap,
    //      text: "Finalize polygon",
    //    },
    //    {
    //      actions: [touch ? faHandPointer : "LMB", "Drag"],
    //      target: faMap,
    //      text: "Move map location",
    //    },
    //  ];
    //} else if (getApp().getState() === COALITIONAREA_DRAW_CIRCLE) {
    //  return [
    //    {
    //      actions: [touch ? faHandPointer : "LMB"],
    //      target: faMap,
    //      text: "Add circle",
    //    },
    //    {
    //      actions: [touch ? faHandPointer : "LMB", "Drag"],
    //      target: faMap,
    //      text: "Move map location",
    //    },
    //  ];
    //} else if (getApp().getState() === SELECT_JTAC_TARGET) {
    //  return [
    //    {
    //      actions: [touch ? faHandPointer : "LMB"],
    //      target: faMap,
    //      text: "Set unit/location as target",
    //    },
    //    {
    //      actions: [touch ? faHandPointer : "LMB", 2],
    //      target: faMap,
    //      text: "Exit selection mode",
    //    },
    //    {
    //      actions: [touch ? faHandPointer : "LMB", "Drag"],
    //      target: faMap,
    //      text: "Move map location",
    //    },
    //  ];
    //} else if (getApp().getState() === SELECT_JTAC_ECHO) {
    //  return [
    //    {
    //      actions: [touch ? faHandPointer : "LMB"],
    //      target: faMap,
    //      text: "Set location as ECHO point",
    //    },
    //    {
    //      actions: [touch ? faHandPointer : "LMB", 2],
    //      target: faMap,
    //      text: "Exit selection mode",
    //    },
    //    {
    //      actions: [touch ? faHandPointer : "LMB", "Drag"],
    //      target: faMap,
    //      text: "Move map location",
    //    },
    //  ];
    //} else if (getApp().getState() === SELECT_JTAC_IP) {
    //  return [
    //    {
    //      actions: [touch ? faHandPointer : "LMB"],
    //      target: faMap,
    //      text: "Set location as IP point",
    //    },
    //    {
    //      actions: [touch ? faHandPointer : "LMB", 2],
    //      target: faMap,
    //      text: "Exit selection mode",
    //    },
    //    {
    //      actions: [touch ? faHandPointer : "LMB", "Drag"],
    //      target: faMap,
    //      text: "Move map location",
    //    },
    //  ];
    //} else {
    //  return [];
    //}
  }

  deselectAllCoalitionAreas() {
    if (this.getSelectedCoalitionArea() !== null) {
      CoalitionAreaSelectedEvent.dispatch(null);
      this.#coalitionAreas.forEach((coalitionArea: CoalitionPolygon | CoalitionCircle) => coalitionArea.setSelected(false));
    }
  }

  deleteCoalitionArea(coalitionArea: CoalitionPolygon | CoalitionCircle) {
    if (this.#coalitionAreas.includes(coalitionArea)) this.#coalitionAreas.splice(this.#coalitionAreas.indexOf(coalitionArea), 1);

    if (this.hasLayer(coalitionArea)) this.removeLayer(coalitionArea);
  }

  getSelectedCoalitionArea() {
    const coalitionArea = this.#coalitionAreas.find((coalitionArea: CoalitionPolygon | CoalitionCircle) => {
      return coalitionArea.getSelected();
    });

    return coalitionArea ?? null;
  }

  setHiddenType(key: string, value: boolean) {
    this.#hiddenTypes[key] = value;
    HiddenTypesChangedEvent.dispatch(this.#hiddenTypes);
  }

  getHiddenTypes() {
    return this.#hiddenTypes;
  }

  getMousePosition() {
    return this.#lastMousePosition;
  }

  getMouseCoordinates() {
    return this.#lastMouseCoordinates;
  }

  getDestinationRotation() {
    return this.#destinationRotation;
  }

  centerOnUnit(unit: Unit | null) {
    if (unit !== null) {
      this.options.scrollWheelZoom = "center";
      this.#centeredUnit = unit;
      this.#panToUnit(unit);
    } else {
      this.options.scrollWheelZoom = undefined;
      this.#centeredUnit = null;
    }
  }

  getCenteredOnUnit() {
    return this.#centeredUnit;
  }

  isSelecting() {
    return this.#selecting;
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
    this.#miniMapPolyline.setLatLngs(boundaries[theatre as keyof typeof boundaries]);
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

  addTemporaryMarker(latlng: L.LatLng, name: string, coalition: string, commandHash?: string) {
    var marker = new TemporaryUnitMarker(latlng, name, coalition, commandHash);
    marker.addTo(this);
    this.#temporaryMarkers.push(marker);
    return marker;
  }

  addExplosionMarker(latlng: L.LatLng) {
    const explosionMarker = new ExplosionMarker(latlng, 5);
    explosionMarker.addTo(this);
    return explosionMarker;
  }

  addSmokeMarker(latlng: L.LatLng, color: string) {
    const smokeMarker = new SmokeMarker(latlng, color);
    smokeMarker.addTo(this);
    return smokeMarker;
  }

  setOption(key, value) {
    this.#options[key] = value;
    MapOptionsChangedEvent.dispatch(this.#options);
  }

  setOptions(options) {
    this.#options = { ...options };
    MapOptionsChangedEvent.dispatch(this.#options);
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

  executeContextAction(targetUnit: Unit | null, targetPosition: L.LatLng | null, originalEvent?: MouseEvent) {
    this.#contextAction?.executeCallback(targetUnit, targetPosition, originalEvent);
  }

  getContextActionSet() {
    return this.#contextActionSet;
  }

  getContextAction() {
    return this.#contextAction;
  }

  executeDefaultContextAction(targetUnit: Unit | null, targetPosition: L.LatLng | null, originalEvent?: MouseEvent) {
    this.#contextActionSet?.getDefaultContextAction()?.executeCallback(targetUnit, targetPosition, originalEvent);
  }

  preventClicks() {
    console.log("Preventing clicks on map");
    window.clearTimeout(this.#shortPressTimer);
    window.clearTimeout(this.#longPressTimer);
  }

  /* Event handlers */
  #onStateChanged(state: OlympusState, subState: OlympusSubState) {
    /* Operations to perform when leaving a state */
    this.getSelectedCoalitionArea()?.setEditing(false);
    this.#currentSpawnMarker?.removeFrom(this);
    this.#currentSpawnMarker = null;
    this.#currentEffectMarker?.removeFrom(this);
    this.#currentEffectMarker = null;
    if (state !== OlympusState.UNIT_CONTROL) getApp().getUnitsManager().deselectAllUnits();
    if (state !== OlympusState.DRAW || (state === OlympusState.DRAW && subState !== DrawSubState.EDIT)) this.deselectAllCoalitionAreas();
    AirbaseSelectedEvent.dispatch(null);

    /* Operations to perform when entering a state */
    if (state === OlympusState.IDLE) {
      getApp().getUnitsManager()?.deselectAllUnits();
    } else if (state === OlympusState.SPAWN) {
      if (subState === SpawnSubState.SPAWN_UNIT) {
        console.log(`Spawn request table:`);
        console.log(this.#spawnRequestTable);
        this.#currentSpawnMarker = new TemporaryUnitMarker(
          new L.LatLng(0, 0),
          this.#spawnRequestTable?.unit.unitType ?? "",
          this.#spawnRequestTable?.coalition ?? "neutral"
        );
        this.#currentSpawnMarker.addTo(this);
      } else if (subState === SpawnSubState.SPAWN_EFFECT) {
        console.log(`Effect request table:`);
        console.log(this.#effectRequestTable);
        if (this.#effectRequestTable?.type === "explosion") this.#currentEffectMarker = new ExplosionMarker(new L.LatLng(0, 0));
        else if (this.#effectRequestTable?.type === "smoke")
          this.#currentEffectMarker = new SmokeMarker(new L.LatLng(0, 0), this.#effectRequestTable.smokeColor ?? "white");
        this.#currentEffectMarker?.addTo(this);
      }
    } else if (state === OlympusState.UNIT_CONTROL) {
      console.log(`Context action:`);
      console.log(this.#contextAction);
    } else if (state === OlympusState.DRAW) {
      if (subState == DrawSubState.DRAW_POLYGON) {
        this.#coalitionAreas.push(new CoalitionPolygon([]));
        this.#coalitionAreas[this.#coalitionAreas.length - 1].addTo(this);
        this.#coalitionAreas[this.#coalitionAreas.length - 1].setSelected(true);
      } else if (subState === DrawSubState.DRAW_CIRCLE) {
        this.#coalitionAreas.push(new CoalitionCircle(new L.LatLng(0, 0), { radius: 1000 }));
        this.#coalitionAreas[this.#coalitionAreas.length - 1].addTo(this);
        this.#coalitionAreas[this.#coalitionAreas.length - 1].setSelected(true);
      }
    }
  }

  #onDragStart(e: any) {
    this.#isDragging = true;
  }

  #onDragEnd(e: any) {
    this.#isDragging = false;
  }

  #onSelectionStart(e: any) {
    this.#selecting = true;
  }

  #onSelectionEnd(e: any) {
    getApp().getUnitsManager().selectFromBounds(e.selectionBounds);
    this.#selecting = false;
  }

  #onMouseUp(e: any) {
    this.#isMouseDown = false;
    window.clearTimeout(this.#longPressTimer);

    this.scrollWheelZoom.enable();
    this.dragging.enable();

    this.#isRotatingDestination = false;
    this.#isMouseOnCooldown = true;
    this.#mouseCooldownTimer = window.setTimeout(() => {
      this.#isMouseOnCooldown = false;
    }, 200);
  }

  #onMouseDown(e: any) {
    this.#isMouseDown = true;

    if (this.#isMouseOnCooldown) {
      return;
    }

    if (this.#contextAction?.getTarget() === ContextActionTarget.POINT && e.originalEvent.button === 2) this.#isRotatingDestination = true;
    this.scrollWheelZoom.disable();

    this.#shortPressTimer = window.setTimeout(() => {
      /* If the mouse is no longer being pressed, execute the short press action */
      if (!this.#isMouseDown) this.#onShortPress(e);
    }, 200);

    this.#longPressTimer = window.setTimeout(() => {
      /* If the mouse is still being pressed, execute the long press action */
      if (this.#isMouseDown && !this.#isDragging && !this.#isZooming) this.#onLongPress(e);
    }, 350);
  }

  #onDoubleClick(e: any) {
    console.log(`Double click at ${e.latlng}`);

    window.clearTimeout(this.#shortPressTimer);
    window.clearTimeout(this.#longPressTimer);

    if (getApp().getState() === OlympusState.IDLE) {
      StarredSpawnContextMenuRequestEvent.dispatch(e.latlng);
      getApp().setState(OlympusState.STARRED_SPAWN);
    } else {
      if (getApp().getSubState() !== NO_SUBSTATE) {
        getApp().setState(getApp().getState(), NO_SUBSTATE);
      } else {
        getApp().setState(OlympusState.IDLE);
      }
    }
  }

  #onShortPress(e: any) {
    let pressLocation: L.LatLng;
    if (e.type === "touchstart") pressLocation = this.containerPointToLatLng(this.mouseEventToContainerPoint(e.touches[0]));
    else pressLocation = new L.LatLng(e.latlng.lat, e.latlng.lng);

    console.log(`Short press at ${pressLocation}`);

    /* Execute the short click action */
    if (getApp().getState() === OlympusState.IDLE) {
      /* Do nothing */
    } else if (getApp().getState() === OlympusState.SPAWN) {
      if (getApp().getSubState() === SpawnSubState.SPAWN_UNIT) {
        if (e.originalEvent.button != 2 && this.#spawnRequestTable !== null) {
          this.#spawnRequestTable.unit.location = pressLocation;
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
                this.addTemporaryMarker(pressLocation, this.#spawnRequestTable?.unit.unitType ?? "unknown", this.#spawnRequestTable?.coalition ?? "blue", hash);
              }
            );
        }
      } else if (getApp().getSubState() === SpawnSubState.SPAWN_EFFECT) {
        if (e.originalEvent.button != 2 && this.#effectRequestTable !== null) {
          if (this.#effectRequestTable.type === "explosion") {
            if (this.#effectRequestTable.explosionType === "High explosive") getApp().getServerManager().spawnExplosion(50, "normal", pressLocation);
            else if (this.#effectRequestTable.explosionType === "Napalm") getApp().getServerManager().spawnExplosion(50, "napalm", pressLocation);
            else if (this.#effectRequestTable.explosionType === "White phosphorous")
              getApp().getServerManager().spawnExplosion(50, "phosphorous", pressLocation);

            this.addExplosionMarker(pressLocation);
          } else if (this.#effectRequestTable.type === "smoke") {
            getApp()
              .getServerManager()
              .spawnSmoke(this.#effectRequestTable.smokeColor ?? "white", pressLocation);
            this.addSmokeMarker(pressLocation, this.#effectRequestTable.smokeColor ?? "white");
          }
        }
      }
    } else if (getApp().getState() === OlympusState.DRAW) {
      if (getApp().getSubState() === DrawSubState.DRAW_POLYGON) {
        const selectedArea = this.getSelectedCoalitionArea();
        if (selectedArea && selectedArea instanceof CoalitionPolygon) {
          selectedArea.addTemporaryLatLng(pressLocation);
        }
      } else if (getApp().getSubState() === DrawSubState.DRAW_CIRCLE) {
        const selectedArea = this.getSelectedCoalitionArea();
        if (selectedArea && selectedArea instanceof CoalitionCircle) {
          if (selectedArea.getLatLng().lat == 0 && selectedArea.getLatLng().lng == 0) selectedArea.setLatLng(pressLocation);
          getApp().setState(OlympusState.DRAW, DrawSubState.EDIT);
        }
      } else if (getApp().getSubState() == DrawSubState.NO_SUBSTATE) {
        this.deselectAllCoalitionAreas();
        for (let idx = 0; idx < this.#coalitionAreas.length; idx++) {
          if (areaContains(pressLocation, this.#coalitionAreas[idx])) {
            this.#coalitionAreas[idx].setSelected(true);
            getApp().setState(OlympusState.DRAW, DrawSubState.EDIT);
            break;
          }
        }
      }
    } else if (getApp().getState() === OlympusState.UNIT_CONTROL) {
      if (e.type === "touchstart" || e.originalEvent.buttons === 1) {
        if (this.#contextAction !== null) this.executeContextAction(null, pressLocation, e.originalEvent);
        else getApp().setState(OlympusState.IDLE);
      } else if (e.originalEvent.buttons === 2) {
        this.executeDefaultContextAction(null, pressLocation, e.originalEvent);
      }
    } else if (getApp().getState() === OlympusState.JTAC) {
      // TODO less redundant way to do this
      if (getApp().getSubState() === JTACSubState.SELECT_TARGET) {
        if (!this.#targetPoint) {
          this.#targetPoint = new TextMarker(pressLocation, "BP", "rgb(37 99 235)", { interactive: true, draggable: true });
          this.#targetPoint.addTo(this);
          this.#targetPoint.on("dragstart", (event) => {
            event.target.options["freeze"] = true;
          });
          this.#targetPoint.on("dragend", (event) => {
            getApp().setState(OlympusState.JTAC);
            event.target.options["freeze"] = false;
          });
          this.#targetPoint.on("click", (event) => {
            getApp().setState(OlympusState.JTAC);
          });
        } else this.#targetPoint.setLatLng(pressLocation);
      } else if (getApp().getSubState() === JTACSubState.SELECT_ECHO_POINT) {
        if (!this.#ECHOPoint) {
          this.#ECHOPoint = new TextMarker(pressLocation, "BP", "rgb(37 99 235)", { interactive: true, draggable: true });
          this.#ECHOPoint.addTo(this);
          this.#ECHOPoint.on("dragstart", (event) => {
            event.target.options["freeze"] = true;
          });
          this.#ECHOPoint.on("dragend", (event) => {
            getApp().setState(OlympusState.JTAC);
            event.target.options["freeze"] = false;
          });
          this.#ECHOPoint.on("click", (event) => {
            getApp().setState(OlympusState.JTAC);
          });
        } else this.#ECHOPoint.setLatLng(pressLocation);
      } else if (getApp().getSubState() === JTACSubState.SELECT_IP) {
        if (!this.#IPPoint) {
          this.#IPPoint = new TextMarker(pressLocation, "BP", "rgb(37 99 235)", { interactive: true, draggable: true });
          this.#IPPoint.addTo(this);
          this.#IPPoint.on("dragstart", (event) => {
            event.target.options["freeze"] = true;
          });
          this.#IPPoint.on("dragend", (event) => {
            getApp().setState(OlympusState.JTAC);
            event.target.options["freeze"] = false;
          });
          this.#IPPoint.on("click", (event) => {
            getApp().setState(OlympusState.JTAC);
          });
        } else this.#IPPoint.setLatLng(pressLocation);
      }
      getApp().setState(OlympusState.JTAC);
      this.#drawIPToTargetLine();
    } else {
    }
  }

  #onLongPress(e: any) {
    let pressLocation: L.LatLng;
    if (e.type === "touchstart") pressLocation = this.containerPointToLatLng(this.mouseEventToContainerPoint(e.touches[0]));
    else pressLocation = new L.LatLng(e.latlng.lat, e.latlng.lng);

    console.log(`Long press at ${pressLocation}`);

    if (!this.#isDragging && !this.#isZooming) {
      this.deselectAllCoalitionAreas();
      if (getApp().getState() === OlympusState.IDLE) {
        if (e.type === "touchstart") document.dispatchEvent(new CustomEvent("forceboxselect", { detail: e }));
        else document.dispatchEvent(new CustomEvent("forceboxselect", { detail: e.originalEvent }));
      } else if (getApp().getState() === OlympusState.UNIT_CONTROL) {
        if (e.originalEvent.button === 2) {
          if (!this.getContextAction()) {
            getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.MAP_CONTEXT_MENU);
            MapContextMenuRequestEvent.dispatch(pressLocation);
          }
        } else {
          if (this.#contextAction?.getTarget() === ContextActionTarget.POINT) {
            this.dragging.disable();
            this.#isRotatingDestination = true;
          } else {
            if (e.type === "touchstart") document.dispatchEvent(new CustomEvent("forceboxselect", { detail: e }));
            else document.dispatchEvent(new CustomEvent("forceboxselect", { detail: e.originalEvent }));
          }
        }
      }
    }
  }

  #onMouseMove(e: any) {
    window.clearTimeout(this.#longPressTimer);

    if (!this.#isRotatingDestination) {
      this.#lastMousePosition.x = e.originalEvent.x;
      this.#lastMousePosition.y = e.originalEvent.y;
      this.#lastMouseCoordinates = e.latlng;

      if (this.#currentSpawnMarker) this.#currentSpawnMarker.setLatLng(e.latlng);
      if (this.#currentEffectMarker) this.#currentEffectMarker.setLatLng(e.latlng);
    } else {
      this.#destinationRotation -= e.originalEvent.movementX;
    }

    this.#moveDestinationPreviewMarkers();
  }

  #onMapMove(e: any) {
    if (this.#slaveDCSCamera) this.#broadcastPosition();
  }

  #onZoomStart(e: any) {
    this.#previousZoom = this.getZoom();
    if (this.#centeredUnit != null) this.#panToUnit(this.#centeredUnit);
    this.#isZooming = true;
  }

  #onZoom(e: any) {
    if (this.#centeredUnit != null) this.#panToUnit(this.#centeredUnit);
  }

  #onZoomEnd(e: any) {
    this.#isZooming = false;
  }

  #broadcastPosition() {
    if (this.#bradcastPositionXmlHttp?.readyState !== 4 && this.#bradcastPositionXmlHttp !== null) return;

    getGroundElevation(this.getCenter(), (response: string) => {
      var groundElevation: number | null = null;
      try {
        groundElevation = parseFloat(response);
        this.#bradcastPositionXmlHttp = new XMLHttpRequest();
        /* Using 127.0.0.1 instead of localhost because the LuaSocket version used in DCS only listens to IPv4. This avoids the lag caused by the
                browser if it first tries to send the request on the IPv6 address for localhost */
        this.#bradcastPositionXmlHttp.open("POST", `http://127.0.0.1:${this.#cameraControlPort}`);

        const C = 40075016.686;
        let mpp = (C * Math.cos(deg2rad(this.getCenter().lat))) / Math.pow(2, this.getZoom() + 8);
        let d = mpp * 1920;
        let alt = (((d / 2) * 1) / Math.tan(deg2rad(40))) * this.#cameraZoomRatio;
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
    var unitPosition = new L.LatLng(unit.getPosition().lat, unit.getPosition().lng);
    this.setView(unitPosition, this.getZoom(), { animate: false });
  }

  #getMinimapBoundaries() {
    /* Draw the limits of the maps in the minimap*/
    return minimapBoundaries;
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
    if (this.#cameraOptionsXmlHttp?.readyState !== 4) this.#cameraOptionsXmlHttp?.abort();

    this.#cameraOptionsXmlHttp = new XMLHttpRequest();

    /* Using 127.0.0.1 instead of localhost because the LuaSocket version used in DCS only listens to IPv4. This avoids the lag caused by the
        browser if it first tries to send the request on the IPv6 address for localhost */
    this.#cameraOptionsXmlHttp.open("OPTIONS", `http://127.0.0.1:${this.#cameraControlPort}`);
    this.#cameraOptionsXmlHttp.onload = (res: any) => {
      if (this.#cameraOptionsXmlHttp !== null && this.#cameraOptionsXmlHttp.status == 204) this.#setSlaveDCSCameraAvailable(true);
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

  #drawIPToTargetLine() {
    if (this.#targetPoint && this.#IPPoint) {
      if (!this.#IPToTargetLine) {
        this.#IPToTargetLine = new L.Polygon([this.#targetPoint.getLatLng(), this.#IPPoint.getLatLng()]);
        this.#IPToTargetLine.addTo(this);
      } else this.#IPToTargetLine.setLatLngs([this.#targetPoint.getLatLng(), this.#IPPoint.getLatLng()]);
    }
  }

  #updateDestinationPreviewMarkers() {
    const selectedUnits = getApp()
      .getUnitsManager()
      .getSelectedUnits()
      .filter((unit) => !unit.getHuman());

    Object.keys(this.#destinationPreviewMarkers).forEach((ID) => {
      this.#destinationPreviewMarkers[ID].removeFrom(this);
      delete this.#destinationPreviewMarkers[ID];
    });

    selectedUnits.forEach((unit) => {
      if (this.#contextAction?.getOptions().type === ContextActionType.MOVE) {
        this.#destinationPreviewMarkers[unit.ID] = new TemporaryUnitMarker(new L.LatLng(0, 0), unit.getName(), unit.getCoalition());
      } else if (this.#contextAction?.getTarget() === ContextActionTarget.POINT) {
        this.#destinationPreviewMarkers[unit.ID] = new TargetMarker(new L.LatLng(0, 0));
      }
      this.#destinationPreviewMarkers[unit.ID]?.addTo(this);
    });
  }

  #moveDestinationPreviewMarkers() {
    if (this.#options.keepRelativePositions) {
      Object.entries(getApp().getUnitsManager().computeGroupDestination(this.#lastMouseCoordinates, this.#destinationRotation)).forEach(([ID, latlng]) => {
        this.#destinationPreviewMarkers[ID]?.setLatLng(latlng);
      });
    } else {
      Object.values(this.#destinationPreviewMarkers).forEach((marker) => {
        marker.setLatLng(this.#lastMouseCoordinates);
      });
    }
  }
}
