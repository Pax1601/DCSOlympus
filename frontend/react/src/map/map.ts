import * as L from "leaflet";
import { getApp } from "../olympusapp";
import { BoxSelect } from "./boxselect";
import { Airbase } from "../mission/airbase";
import { Unit } from "../unit/unit";
import { areaContains, deepCopyTable, deg2rad, getGroundElevation, getMagvar, rad2deg } from "../other/utils";
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
  JTACSubState,
  UnitControlSubState,
  ContextActionTarget,
  ContextActionType,
  ContextActions,
  SHORT_PRESS_MILLISECONDS,
  DEBOUNCE_MILLISECONDS,
  DrawSubState,
  colors,
} from "../constants/constants";
import { MapHiddenTypes, MapOptions } from "../types/types";
import { EffectRequestTable, OlympusConfig, SpawnRequestTable } from "../interfaces";
import { ContextAction } from "../unit/contextaction";

/* Stylesheets */
import "./markers/stylesheets/airbase.css";
import "./markers/stylesheets/bullseye.css";
import "./markers/stylesheets/units.css";
import "./markers/stylesheets/spot.css";
import "./markers/stylesheets/measure.css";
import "./markers/stylesheets/navpoint.css";
import "./stylesheets/map.css";

import { initDraggablePath } from "./coalitionarea/draggablepath";
import { ExplosionMarker } from "./markers/explosionmarker";
import { TextMarker } from "./markers/textmarker";
import { TargetMarker } from "./markers/targetmarker";
import {
  AppStateChangedEvent,
  ConfigLoadedEvent,
  ContextActionChangedEvent,
  ContextActionSetChangedEvent,
  CoordinatesFreezeEvent,
  HiddenTypesChangedEvent,
  MapContextMenuRequestEvent,
  MapOptionsChangedEvent,
  MapSourceChangedEvent,
  MouseMovedEvent,
  PasteEnabledChangedEvent,
  SelectionClearedEvent,
  SelectionEnabledChangedEvent,
  SessionDataLoadedEvent,
  SpawnContextMenuRequestEvent,
  SpawnHeadingChangedEvent,
  StarredSpawnsChangedEvent,
  UnitDeselectedEvent,
  UnitSelectedEvent,
  UnitUpdatedEvent,
} from "../events";
import { ContextActionSet } from "../unit/contextactionset";
import { SmokeMarker } from "./markers/smokemarker";
import { Measure } from "./measure";
import { FlakMarker } from "./markers/flakmarker";
import { MapMouseHandler } from "./mapMouseHandler";

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
  #isZooming: boolean = false;
  #isDragging: boolean = false;
  #isSelecting: boolean = false;

  #mouseHandler: MapMouseHandler = new MapMouseHandler(this);

  #lastMousePosition: L.Point = new L.Point(0, 0);
  #lastMouseCoordinates: L.LatLng = new L.LatLng(0, 0);
  #previousZoom: number = 0;
  #keepRelativePositions: boolean = false;
  #selectionEnabled: boolean = false;
  #pasteEnabled: boolean = false;

  /* Camera control plugin */
  #slaveDCSCamera: boolean = false;
  #slaveDCSCameraAvailable: boolean = false;
  #cameraControlTimer: number = 0;
  #cameraControlPort: number = 3003;
  #cameraControlMode: string = "map";
  #cameraOptionsXmlHttp: XMLHttpRequest | null = null;
  #bradcastPositionXmlHttp: XMLHttpRequest | null = null;
  #cameraZoomRatio: number = 1.0;

  /* Units movement */
  #destinationPreviewMarkers: { [key: number]: TemporaryUnitMarker | TargetMarker } = {};
  #destinationRotation: number = 0;
  #isRotatingDestination: boolean = false;
  #destinationRotationCenter: L.LatLng = new L.LatLng(0, 0);

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
  #spawnHeading: number = 0;

  /* JTAC tools */
  #ECHOPoint: TextMarker | null = null;
  #IPPoint: TextMarker | null = null;
  #targetPoint: TargetMarker | null = null;
  #IPToTargetLine: L.Polygon | null = null;

  /* Measure tool */
  #measures: Measure[] = [];

  /* State variables */
  #previousAppState: OlympusState = OlympusState.IDLE;
  #previousAppSubstate: OlympusSubState = NO_SUBSTATE;

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
    this.#miniMapPolyline = new L.Polyline([], { color: colors.DARK_GRAY });
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

    this.on("move", (e: any) => this.#onMapMove(e));

    this.#mouseHandler.leftMousePressed = (e: L.LeafletMouseEvent) => this.#onLeftMousePressed(e);
    this.#mouseHandler.leftMouseReleased = (e: L.LeafletMouseEvent) => this.#onLeftMouseReleased(e);
    this.#mouseHandler.rightMousePressed = (e: L.LeafletMouseEvent) => this.#onRightMousePressed(e);
    this.#mouseHandler.rightMouseReleased = (e: L.LeafletMouseEvent) => this.#onRightMouseReleased(e);
    this.#mouseHandler.mouseWheelPressed = (e: L.LeafletMouseEvent) => this.#onMouseWheelPressed(e);
    this.#mouseHandler.mouseWheelReleased = (e: L.LeafletMouseEvent) => this.#onMouseWheelReleased(e);
    this.#mouseHandler.leftMouseShortClick = (e: L.LeafletMouseEvent) => this.#onLeftMouseShortClick(e);
    this.#mouseHandler.rightMouseShortClick = (e: L.LeafletMouseEvent) => this.#onRightMouseShortClick(e);
    this.#mouseHandler.leftMouseLongClick = (e: L.LeafletMouseEvent) => this.#onLeftMouseLongClick(e);
    this.#mouseHandler.rightMouseLongClick = (e: L.LeafletMouseEvent) => this.#onRightMouseLongClick(e);
    this.#mouseHandler.leftMouseDoubleClick = (e: L.LeafletMouseEvent) => this.#onLeftMouseDoubleClick(e);
    this.#mouseHandler.mouseMove = (e: L.LeafletMouseEvent) => this.#onMouseMove(e);

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
      this.getContainer().toggleAttribute("data-awacs-mode", options.AWACSMode);
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

      //TODO if (options.AWACSMode && this.#layerName !== "AWACS") this.setLayerName("AWACS");

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

    SessionDataLoadedEvent.on((sessionData) => {
      const localSessionData = deepCopyTable(sessionData);
      if (localSessionData.starredSpawns) {
        this.#starredSpawnRequestTables = localSessionData.starredSpawns;
        StarredSpawnsChangedEvent.dispatch(this.#starredSpawnRequestTables);
      }
    });

    window.addEventListener("blur", () => {
      this.setSelectionEnabled(false);
      this.setPasteEnabled(false);
    });

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
      .addShortcut("measure", {
        label: "Toggle measurement tool",
        keyUpCallback: () => {
          getApp().getState() === OlympusState.MEASURE ? getApp().setState(OlympusState.IDLE) : getApp().setState(OlympusState.MEASURE);
        },
        code: "KeyM",
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
      })
      .addShortcut("clearMeasures", {
        label: "Clear measures",
        keyUpCallback: () => {
          this.clearMeasures();
        },
        code: "Comma",
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
      })
      .addShortcut("toggleUnitLabels", {
        label: "Hide/show labels",
        keyUpCallback: () => this.setOption("showUnitLabels", !this.getOptions().showUnitLabels),
        code: "KeyL",
        shiftKey: true,
        altKey: false,
        ctrlKey: false,
      })
      .addShortcut("toggleAcquisitionRings", {
        label: "Hide/show acquisition rings",
        keyUpCallback: () => this.setOption("showUnitsAcquisitionRings", !this.getOptions().showUnitsAcquisitionRings),
        code: "KeyE",
        shiftKey: true,
        altKey: false,
        ctrlKey: false,
      })
      .addShortcut("toggleEngagementRings", {
        label: "Hide/show engagement rings",
        keyUpCallback: () => this.setOption("showUnitsEngagementRings", !this.getOptions().showUnitsEngagementRings),
        code: "KeyQ",
        shiftKey: true,
        altKey: false,
        ctrlKey: false,
      })
      .addShortcut("toggleHideShortEngagementRings", {
        label: "Hide/show short range rings",
        keyUpCallback: () => this.setOption("hideUnitsShortRangeRings", !this.getOptions().hideUnitsShortRangeRings),
        code: "KeyR",
        shiftKey: true,
        altKey: false,
        ctrlKey: false,
      })
      .addShortcut("toggleDetectionLines", {
        label: "Hide/show detection lines",
        keyUpCallback: () => this.setOption("showUnitTargets", !this.getOptions().showUnitTargets),
        code: "KeyF",
        shiftKey: true,
        altKey: false,
        ctrlKey: false,
      })
      .addShortcut("toggleGroupMembers", {
        label: "Hide/show group members",
        keyUpCallback: () => this.setOption("hideGroupMembers", !this.getOptions().hideGroupMembers),
        code: "KeyG",
        shiftKey: true,
        altKey: false,
        ctrlKey: false,
      })
      //.addShortcut("toggleRelativePositions", {
      //  label: "Toggle group movement mode",
      //  keyUpCallback: () => this.setKeepRelativePositions(false),
      //  keyDownCallback: () => this.setKeepRelativePositions(true),
      //  code: "AltLeft",
      //  shiftKey: false,
      //  ctrlKey: false,
      //})
      .addShortcut("toggleSelectionEnabled", {
        label: "Toggle box selection",
        keyUpCallback: () => this.setSelectionEnabled(false),
        keyDownCallback: () => this.setSelectionEnabled(true),
        code: "ShiftLeft",
        altKey: false,
        ctrlKey: false,
      })
      .addShortcut("increaseCameraZoom", {
        label: "Increase camera zoom",
        keyUpCallback: () => this.increaseCameraZoom(),
        code: "Equal",
        shiftKey: true,
        altKey: false,
        ctrlKey: false,
      })
      .addShortcut("decreaseCameraZoom", {
        label: "Decrease camera zoom",
        keyUpCallback: () => this.decreaseCameraZoom(),
        code: "Minus",
        shiftKey: true,
        altKey: false,
        ctrlKey: false,
      });

    for (let contextActionName in ContextActions) {
      const contextAction = ContextActions[contextActionName] as ContextAction;
      if (contextAction.getOptions().code) {
        getApp()
          .getShortcutManager()
          .addShortcut(`${contextActionName}Hotkey`, {
            label: contextAction.getLabel(),
            code: contextAction.getOptions().code as string,
            shiftKey: contextAction.getOptions().shiftKey,
            altKey: contextAction.getOptions().altKey,
            ctrlKey: contextAction.getOptions().ctrlKey,
            keyUpCallback: () => {
              const contextActionSet = this.getContextActionSet();
              if (this.getContextAction() === null || contextAction !== this.getContextAction()) {
                if (getApp().getState() === OlympusState.UNIT_CONTROL && contextActionSet && contextAction.getId() in contextActionSet.getContextActions()) {
                  if (contextAction.getTarget() === ContextActionTarget.NONE) contextAction.executeCallback(null, null);
                  else this.setContextAction(contextAction);
                }
              } else {
                this.setContextAction(null);
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
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
      })
      .addShortcut(`panDown`, {
        label: "Pan map down",
        keyUpCallback: (ev: KeyboardEvent) => (this.#panDown = false),
        keyDownCallback: (ev: KeyboardEvent) => (this.#panDown = true),
        code: "KeyS",
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
      })
      .addShortcut(`panLeft`, {
        label: "Pan map left",
        keyUpCallback: (ev: KeyboardEvent) => (this.#panLeft = false),
        keyDownCallback: (ev: KeyboardEvent) => (this.#panLeft = true),
        code: "KeyA",
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
      })
      .addShortcut(`panRight`, {
        label: "Pan map right",
        keyUpCallback: (ev: KeyboardEvent) => (this.#panRight = false),
        keyDownCallback: (ev: KeyboardEvent) => (this.#panRight = true),
        code: "KeyD",
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
      })
      .addShortcut(`panFast`, {
        label: "Pan map fast",
        keyUpCallback: (ev: KeyboardEvent) => (this.#panFast = false),
        keyDownCallback: (ev: KeyboardEvent) => (this.#panFast = true),
        code: "ShiftLeft",
        altKey: false,
        ctrlKey: false,
      });
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

  getMirrors() {
    return this.#mapMirrors;
  }

  setSpawnRequestTable(spawnRequestTable: SpawnRequestTable) {
    let redrawMarker = false;
    if (
      this.#spawnRequestTable?.unit.location !== spawnRequestTable.unit.location ||
      this.#spawnRequestTable?.unit.unitType !== spawnRequestTable.unit.unitType ||
      this.#spawnRequestTable?.coalition !== spawnRequestTable.coalition
    )
      redrawMarker = true;

    this.#spawnRequestTable = spawnRequestTable;

    if (redrawMarker) {
      this.#currentSpawnMarker?.removeFrom(this);
      this.#currentSpawnMarker = this.addTemporaryMarker(spawnRequestTable.unit.location, spawnRequestTable.unit.unitType, spawnRequestTable.coalition, true);
    }
  }

  getSpawnRequestTable() {
    return this.#spawnRequestTable;
  }

  setSpawnHeading(heading: number) {
    this.#spawnHeading = heading;
    SpawnHeadingChangedEvent.dispatch(heading);
  }

  getSpawnHeading() {
    return this.#spawnHeading;
  }

  addStarredSpawnRequestTable(key, spawnRequestTable: SpawnRequestTable, quickAccessName: string) {
    this.#starredSpawnRequestTables[key] = spawnRequestTable;
    this.#starredSpawnRequestTables[key].quickAccessName = quickAccessName;
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
    if (this.#contextAction) {
      this.getContainer().classList.remove(`${this.#contextAction.getId()}-cursor`);
      Object.values(getApp().getUnitsManager().getUnits()).forEach((unit) => {
        unit.getElement()?.querySelector(`[data-object|="unit"]`)?.classList.remove(`${this.#contextAction?.getId()}-cursor`);
      });
    }

    if (contextAction) {
      this.getContainer().classList.add(`${contextAction.getId()}-cursor`);
      Object.values(getApp().getUnitsManager().getUnits()).forEach((unit) => {
        unit.getElement()?.querySelector(`[data-object|="unit"]`)?.classList.add(`${contextAction.getId()}-cursor`);
      });
    }

    this.#contextAction = contextAction;
    ContextActionChangedEvent.dispatch(this.#contextAction);
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
    return this.#isSelecting;
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
        position: "bottomright",
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

  addTemporaryMarker(latlng: L.LatLng, name: string, coalition: string, headingHandle: boolean, commandHash?: string) {
    var marker = new TemporaryUnitMarker(latlng, name, coalition, headingHandle, commandHash);
    marker.addTo(this);
    this.#temporaryMarkers.push(marker);
    return marker;
  }

  addExplosionMarker(latlng: L.LatLng) {
    const explosionMarker = new ExplosionMarker(latlng, 5);
    explosionMarker.addTo(this);
    return explosionMarker;
  }

  addFlakMarker(latlng: L.LatLng) {
    const explosionMarker = new FlakMarker(latlng, 10);
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
    MapOptionsChangedEvent.dispatch(this.#options, key);
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

  setKeepRelativePositions(keepRelativePositions: boolean) {
    this.#keepRelativePositions = keepRelativePositions;
    this.#updateDestinationPreviewMarkers();
  }

  getKeepRelativePositions() {
    return this.#keepRelativePositions;
  }

  setSelectionEnabled(selectionEnabled: boolean) {
    this.#selectionEnabled = selectionEnabled;

    if (selectionEnabled) this.dragging.disable();
    else this.dragging.enable();

    SelectionEnabledChangedEvent.dispatch(selectionEnabled);
  }

  getSelectionEnabled() {
    return this.#selectionEnabled;
  }

  setPasteEnabled(pasteEnabled: boolean) {
    this.#pasteEnabled = pasteEnabled;
    PasteEnabledChangedEvent.dispatch(pasteEnabled);
  }

  getPasteEnabled() {
    return this.#pasteEnabled;
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

  getDefaultContextAction() {
    return this.#contextActionSet?.getDefaultContextAction();
  }

  executeDefaultContextAction(targetUnit: Unit | null, targetPosition: L.LatLng | null, originalEvent?: MouseEvent) {
    this.#contextActionSet?.getDefaultContextAction()?.executeCallback(targetUnit, targetPosition, originalEvent);
  }

  clearMeasures() {
    this.#measures.forEach((measure) => measure.remove());
    this.#measures = [];
  }

  getMapLayer(layerName: string) {
    return this.#mapLayers[layerName] && this.#mapLayers[layerName];
  }

  getAllMapLayers() {
    return this.#mapLayers;
  }

  /* Event handlers */
  #onStateChanged(state: OlympusState, subState: OlympusSubState) {
    /* Operations to perform when leaving a state */
    this.#currentSpawnMarker?.removeFrom(this);
    this.#currentSpawnMarker = null;
    this.#currentEffectMarker?.removeFrom(this);
    this.#currentEffectMarker = null;

    if (state !== OlympusState.UNIT_CONTROL) {
      getApp().getUnitsManager().deselectAllUnits();
      this.setContextAction(null);
      this.setContextActionSet(null);
    }
    this.getContainer().classList.remove(`explosion-cursor`);
    ["white", "blue", "red", "green", "orange"].forEach((color) => this.getContainer().classList.remove(`smoke-${color}-cursor`));
    this.getContainer().classList.remove(`plus-cursor`);
    this.getContainer().classList.remove(`measure-cursor`);

    /* Clear the last measure if the state is changed */
    if (this.#previousAppState === OlympusState.MEASURE) {
      if (this.#measures.length > 0 && this.#measures[this.#measures.length - 1].isActive()) {
        this.#measures[this.#measures.length - 1].remove();
        this.#measures.pop();
        if (this.#measures.length > 0) {
          if (this.#measures[this.#measures.length - 1].getDistance() < 1) {
            this.#measures[this.#measures.length - 1].remove();
            this.#measures.pop();
            this.#measures[this.#measures.length - 1].showEndMarker();
          } else {
            this.#measures[this.#measures.length - 1].showEndMarker();
          }
        }
      }
    }

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
          this.#spawnRequestTable?.coalition ?? "neutral",
          true
        );
        this.#currentSpawnMarker.addTo(this);
      } else if (subState === SpawnSubState.SPAWN_EFFECT) {
        console.log(`Effect request table:`);
        console.log(this.#effectRequestTable);
        if (this.#effectRequestTable?.type === "explosion") {
          this.getContainer().classList.add(`explosion-cursor`);
        } else if (this.#effectRequestTable?.type === "smoke") {
          this.getContainer().classList.add(`smoke-${this.#effectRequestTable?.smokeColor?.toLowerCase()}-cursor`);
        }
      }
    } else if (state === OlympusState.UNIT_CONTROL) {
      console.log(`Context action:`);
      console.log(this.#contextAction);
    } else if (state === OlympusState.DRAW) {
      if (subState === DrawSubState.DRAW_CIRCLE || subState === DrawSubState.DRAW_POLYGON) this.getContainer().classList.add(`plus-cursor`);
    } else if (state === OlympusState.MEASURE) {
      this.getContainer().classList.add(`measure-cursor`);
    }

    this.#previousAppState = state;
    this.#previousAppSubstate = subState;
  }

  #onDragStart(e: any) {
    this.#isDragging = true;
  }

  #onDragEnd(e: any) {
    /* Delay the drag end event so that any other event in the queue still sees the map in dragging mode */
    window.setTimeout(() => {
      this.#isDragging = false;
    }, SHORT_PRESS_MILLISECONDS + 100);
  }

  #onSelectionStart(e: any) {
    this.#isSelecting = true;
  }

  #onSelectionEnd(e: any) {
    getApp().getUnitsManager().selectFromBounds(e.selectionBounds);

    // Autodisable the selection mode if touchscreen
    if ("ontouchstart" in window) this.setSelectionEnabled(false);

    /* Delay the event so that any other event in the queue still sees the map in selection mode */
    window.setTimeout(() => {
      this.#isSelecting = false;
    }, SHORT_PRESS_MILLISECONDS + 100);
  }

  #onLeftMouseReleased(e: any) {
    this.dragging.enable();

    if (this.#isRotatingDestination && getApp().getState() === OlympusState.UNIT_CONTROL && this.getContextAction() !== null) {
      this.executeContextAction(null, this.#destinationRotationCenter, e.originalEvent);
    }
    this.#isRotatingDestination = false;
    this.setKeepRelativePositions(false);

    /* Delay the event so that any other event in the queue still sees the map in selection mode */
    window.setTimeout(() => {
      this.setSelectionEnabled(false);
      this.#isSelecting = false;
    }, SHORT_PRESS_MILLISECONDS + 100);
  }

  #onMouseWheelReleased(e: any) {
    this.dragging.enable();

    getApp().setState(getApp().getState() === OlympusState.MEASURE ? OlympusState.IDLE : OlympusState.MEASURE);
    if (getApp().getState() === OlympusState.MEASURE) {
      const newMeasure = new Measure(this);
      const previousMeasure = this.#measures[this.#measures.length - 1];
      this.#measures.push(newMeasure);
      newMeasure.onClick(e.latlng);
      if (previousMeasure && previousMeasure.isActive()) {
        previousMeasure.finish();
        previousMeasure.hideEndMarker();
        newMeasure.onMarkerMoved = (startLatLng, endLatLng) => {
          previousMeasure.moveMarkers(null, startLatLng);
        };
      }
    }
  }

  #onRightMouseReleased(e: any) {
    this.dragging.enable();

    if (this.#isRotatingDestination && getApp().getState() === OlympusState.UNIT_CONTROL) {
      this.executeDefaultContextAction(null, this.#destinationRotationCenter, e.originalEvent);
    }
    this.#isRotatingDestination = false;
    this.setKeepRelativePositions(false);
  }

  #onLeftMousePressed(e: any) {
    if (getApp().getState() === OlympusState.UNIT_CONTROL && getApp().getSubState() === UnitControlSubState.MAP_CONTEXT_MENU) {
      getApp().setState(OlympusState.UNIT_CONTROL);
    }
  }

  #onMouseWheelPressed(e: any) {}

  #onRightMousePressed(e: any) {
    this.dragging.disable();
  }

  #onLeftMouseShortClick(e: L.LeafletMouseEvent) {
    CoordinatesFreezeEvent.dispatch();

    if (this.#isDragging || this.#isSelecting) return;
    console.log(`Left short click at ${e.latlng}`);

    if (this.#pasteEnabled) {
      getApp().getUnitsManager().paste(e.latlng);
    }

    /* Execute the short click action */
    if (getApp().getState() === OlympusState.IDLE) {
      /* Do nothing */
    } else if (getApp().getState() === OlympusState.SPAWN) {
      if (getApp().getSubState() === SpawnSubState.SPAWN_UNIT) {
        if (this.#spawnRequestTable !== null) {
          this.#spawnRequestTable.unit.location = e.latlng;
          this.#spawnRequestTable.unit.heading = deg2rad(this.#spawnHeading);
          getApp()
            .getUnitsManager()
            .spawnUnits(
              this.#spawnRequestTable.category,
              Array(this.#spawnRequestTable.amount).fill(this.#spawnRequestTable.unit),
              this.#spawnRequestTable.coalition,
              false,
              undefined,
              undefined,
              (hash) => {
                this.addTemporaryMarker(
                  e.latlng,
                  this.#spawnRequestTable?.unit.unitType ?? "unknown",
                  this.#spawnRequestTable?.coalition ?? "blue",
                  false,
                  hash
                );
              }
            );
        }
      } else if (getApp().getSubState() === SpawnSubState.SPAWN_EFFECT) {
        if (this.#effectRequestTable !== null) {
          if (this.#effectRequestTable.type === "explosion") {
            if (this.#effectRequestTable.explosionType === "High explosive") getApp().getServerManager().spawnExplosion(50, "normal", e.latlng);
            else if (this.#effectRequestTable.explosionType === "Napalm") getApp().getServerManager().spawnExplosion(50, "napalm", e.latlng);
            else if (this.#effectRequestTable.explosionType === "White phosphorous") getApp().getServerManager().spawnExplosion(50, "phosphorous", e.latlng);

            this.addExplosionMarker(e.latlng);
          } else if (this.#effectRequestTable.type === "smoke") {
            getApp()
              .getServerManager()
              .spawnSmoke(this.#effectRequestTable.smokeColor ?? "white", e.latlng);
            this.addSmokeMarker(e.latlng, this.#effectRequestTable.smokeColor ?? "white");
          }
        }
      }
    } else if (getApp().getState() === OlympusState.DRAW) {
      getApp().getCoalitionAreasManager().onLeftShortClick(e);
    } else if (getApp().getState() === OlympusState.JTAC) {
      // TODO less redundant way to do this
      if (getApp().getSubState() === JTACSubState.SELECT_TARGET) {
        if (!this.#targetPoint) {
          this.#targetPoint = new TextMarker(e.latlng, "BP", "rgb(37 99 235)", { interactive: true, draggable: true });
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
        } else this.#targetPoint.setLatLng(e.latlng);
      } else if (getApp().getSubState() === JTACSubState.SELECT_ECHO_POINT) {
        if (!this.#ECHOPoint) {
          this.#ECHOPoint = new TextMarker(e.latlng, "BP", "rgb(37 99 235)", { interactive: true, draggable: true });
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
        } else this.#ECHOPoint.setLatLng(e.latlng);
      } else if (getApp().getSubState() === JTACSubState.SELECT_IP) {
        if (!this.#IPPoint) {
          this.#IPPoint = new TextMarker(e.latlng, "BP", "rgb(37 99 235)", { interactive: true, draggable: true });
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
        } else this.#IPPoint.setLatLng(e.latlng);
      }
      getApp().setState(OlympusState.JTAC);
      this.#drawIPToTargetLine();
    } else if (getApp().getState() === OlympusState.UNIT_CONTROL) {
      if (this.#contextAction !== null) this.executeContextAction(null, e.latlng, e.originalEvent);
      else if (getApp().getSubState() === NO_SUBSTATE) getApp().setState(OlympusState.IDLE);
      else getApp().setState(OlympusState.UNIT_CONTROL);
    } else if (getApp().getState() === OlympusState.MEASURE) {
      const newMeasure = new Measure(this);
      const previousMeasure = this.#measures[this.#measures.length - 1];
      this.#measures.push(newMeasure);
      newMeasure.onClick(e.latlng);
      if (previousMeasure && previousMeasure.isActive()) {
        previousMeasure.finish();
        previousMeasure.hideEndMarker();
        newMeasure.onMarkerMoved = (startLatLng, endLatLng) => {
          previousMeasure.moveMarkers(null, startLatLng);
        };
      }
    } else {
      if (getApp().getSubState() === NO_SUBSTATE) getApp().setState(OlympusState.IDLE);
      else getApp().setState(OlympusState.UNIT_CONTROL);
    }
  }

  #onLeftMouseLongClick(e: any) {
    if (this.#isDragging || this.#isSelecting) return;
    console.log(`Left long click at ${e.latlng}`);

    if (getApp().getState() === OlympusState.UNIT_CONTROL) {
      if (!this.getContextAction()) {
        getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.MAP_CONTEXT_MENU);
        MapContextMenuRequestEvent.dispatch(e.latlng);
      } else {
        this.#destinationRotationCenter = e.latlng;
        this.#isRotatingDestination = true;
        this.setKeepRelativePositions(true);
        this.dragging.disable();
      }
    } else {
      getApp().setState(OlympusState.IDLE);
      this.setSelectionEnabled(true);

      //@ts-ignore We force the boxselect to enter in selection mode
      this.boxSelect._onMouseDown(e.originalEvent);
    }
  }

  #onRightMouseShortClick(e: L.LeafletMouseEvent) {
    console.log(`Right short click at ${e.latlng}`);

    if (getApp().getState() === OlympusState.IDLE || getApp().getState() === OlympusState.SPAWN_CONTEXT) {
      SpawnContextMenuRequestEvent.dispatch(e.latlng);
      getApp().setState(OlympusState.SPAWN_CONTEXT);
    } else if (getApp().getState() === OlympusState.UNIT_CONTROL) {
      this.executeDefaultContextAction(null, e.latlng, e.originalEvent);
    }
  }

  #onRightMouseLongClick(e: L.LeafletMouseEvent) {
    console.log(`Right long click at ${e.latlng}`);

    this.#destinationRotationCenter = e.latlng;
    this.#isRotatingDestination = true;
    this.setKeepRelativePositions(true);
  }

  #onLeftMouseDoubleClick(e: L.LeafletMouseEvent) {
    console.log(`Double click at ${e.latlng}`);

    this.setPasteEnabled(false);

    if (getApp().getState() === OlympusState.DRAW) {
      getApp().getCoalitionAreasManager().onDoubleClick(e);
    } else {
      if (getApp().getSubState() === NO_SUBSTATE) getApp().setState(OlympusState.IDLE);
      else {
        if (getApp().getState() === OlympusState.UNIT_CONTROL) getApp().setState(OlympusState.IDLE);
        else getApp().setState(getApp().getState());
      }
    }
  }

  #onMouseMove(e: any) {
    if (!this.#isRotatingDestination) {
      this.#lastMousePosition.x = e.originalEvent.x;
      this.#lastMousePosition.y = e.originalEvent.y;
      this.#lastMouseCoordinates = e.latlng;

      MouseMovedEvent.dispatch(e.latlng);
      getGroundElevation(e.latlng, (elevation) => {
        MouseMovedEvent.dispatch(e.latlng, elevation);
      });

      if (getApp().getState() === OlympusState.SPAWN) {
        if (this.#currentSpawnMarker) this.#currentSpawnMarker.setLatLng(e.latlng);
        if (this.#currentEffectMarker) this.#currentEffectMarker.setLatLng(e.latlng);
      } else if (getApp().getState() === OlympusState.MEASURE) {
        //if (this.#debounceTimeout === null) {
        this.#measures[this.#measures.length - 1]?.onMouseMove(e.latlng);
        let totalLength = 0;
        this.#measures.forEach((measure) => {
          measure.setTotalDistance(totalLength);
          totalLength += measure.getDistance();
        });
        //}
      }
    } else {
      if (this.#destinationRotationCenter) {
        /* Compute the average heading of the units */
        const selectedUnits = getApp()
          .getUnitsManager()
          .getSelectedUnits()
          .filter((unit) => !unit.getHuman());

        let averageHeading = 0;
        selectedUnits.forEach((unit) => {
          averageHeading += unit.getHeading();
        });
        averageHeading /= selectedUnits.length;

        /* Compute the rotation of the destination */
        let angle = Math.atan2(e.latlng.lng - this.#destinationRotationCenter.lng, e.latlng.lat - this.#destinationRotationCenter.lat);
        this.#destinationRotation = -(rad2deg(angle) - getMagvar(e.latlng.lat, e.latlng.lng) - rad2deg(averageHeading));
      }
    }

    if (getApp().getState() === OlympusState.DRAW && (getApp().getSubState() === DrawSubState.NO_SUBSTATE || getApp().getSubState() === DrawSubState.EDIT)) {
      getApp()
        .getCoalitionAreasManager()
        .getAreas()
        .find((area) => areaContains(e.latlng, area))
        ? this.getContainer()?.classList.add("pointer-cursor")
        : this.getContainer()?.classList.remove("pointer-cursor");
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

    if (this.#keepRelativePositions) {
      selectedUnits.forEach((unit) => {
        if (this.#contextAction?.getOptions().type === ContextActionType.MOVE || this.#contextAction === null) {
          this.#destinationPreviewMarkers[unit.ID] = new TemporaryUnitMarker(new L.LatLng(0, 0), unit.getName(), unit.getCoalition(), false);
        } else if (this.#contextAction?.getTarget() === ContextActionTarget.POINT) {
          this.#destinationPreviewMarkers[unit.ID] = new TargetMarker(new L.LatLng(0, 0));
        }
        this.#destinationPreviewMarkers[unit.ID]?.addTo(this);
      });
    }
  }

  #moveDestinationPreviewMarkers() {
    if (this.#keepRelativePositions) {
      Object.entries(getApp().getUnitsManager().computeGroupDestination(this.#destinationRotationCenter, this.#destinationRotation)).forEach(([ID, latlng]) => {
        this.#destinationPreviewMarkers[ID]?.setLatLng(latlng);
      });
    } else {
      Object.values(this.#destinationPreviewMarkers).forEach((marker) => {
        marker.setLatLng(this.#lastMouseCoordinates);
      });
    }
  }
}
