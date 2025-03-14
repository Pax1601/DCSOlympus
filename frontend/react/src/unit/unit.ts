import { Marker, LatLng, Polyline, Icon, DivIcon, CircleMarker, Map, Point, LeafletMouseEvent, DomEvent, DomUtil, Circle } from "leaflet";
import { getApp } from "../olympusapp";
import {
  enumToCoalition,
  enumToEmissionCountermeasure,
  enumToROE,
  enumToReactionToThreat,
  enumToState,
  mToFt,
  msToKnots,
  rad2deg,
  bearing,
  deg2rad,
  getGroundElevation,
  coalitionToEnum,
  nmToM,
  zeroAppend,
  computeBearingRangeString,
  adjustBrightness,
  bearingAndDistanceToLatLng,
} from "../other/utils";
import { CustomMarker } from "../map/markers/custommarker";
import { SVGInjector } from "@tanem/svg-injector";
import { TargetMarker } from "../map/markers/targetmarker";
import {
  DLINK,
  DataIndexes,
  GAME_MASTER,
  IRST,
  OPTIC,
  RADAR,
  ROEs,
  RWR,
  VISUAL,
  emissionsCountermeasures,
  reactionsToThreat,
  states,
  GROUPING_ZOOM_TRANSITION,
  MAX_SHOTS_SCATTER,
  SHOTS_SCATTER_DEGREES,
  OlympusState,
  JTACSubState,
  UnitControlSubState,
  ContextActions,
  ContextActionTarget,
  SHORT_PRESS_MILLISECONDS,
  TRAIL_LENGTH,
  colors,
  UnitState,
  SPOTS_EDIT_ZOOM_TRANSITION,
} from "../constants/constants";
import { DataExtractor } from "../server/dataextractor";
import { Weapon } from "../weapon/weapon";
import { Ammo, Contact, GeneralSettings, LoadoutBlueprint, ObjectIconOptions, Offset, Radio, TACAN, UnitBlueprint, UnitData } from "../interfaces";
import { RangeCircle } from "../map/rangecircle";
import { Group } from "./group";
import { ContextActionSet } from "./contextactionset";
import * as turf from "@turf/turf";
import { Carrier } from "../mission/carrier";
import {
  ContactsUpdatedEvent,
  HiddenTypesChangedEvent,
  MapOptionsChangedEvent,
  UnitContextMenuRequestEvent,
  UnitDeadEvent,
  UnitDeselectedEvent,
  UnitSelectedEvent,
  UnitUpdatedEvent,
} from "../events";
import { DraggableHandle } from "../map/coalitionarea/coalitionareahandle";
import { ArrowMarker } from "../map/markers/arrowmarker";
import { Spot } from "../mission/spot";
import { SpotEditMarker } from "../map/markers/spoteditmarker";
import { SpotMarker } from "../map/markers/spotmarker";

const bearingStrings = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west", "north"];

/**
 * Unit class which controls unit behaviour
 */
export abstract class Unit extends CustomMarker {
  ID: number;

  /* Data controlled directly by the backend. No setters are provided to avoid misalignments */
  #alive: boolean = false;
  #human: boolean = false;
  #controlled: boolean = false;
  #coalition: string = "neutral";
  #country: number = 0;
  #name: string = "";
  #unitName: string = "";
  #callsign: string = "";
  #groupName: string = "";
  #state: string = states[0];
  #task: string = "";
  #hasTask: boolean = false;
  #position: LatLng = new LatLng(0, 0, 0);
  #speed: number = 0;
  #horizontalVelocity: number = 0;
  #verticalVelocity: number = 0;
  #heading: number = 0;
  #track: number = 0;
  #isActiveTanker: boolean = false;
  #isActiveAWACS: boolean = false;
  #onOff: boolean = true;
  #followRoads: boolean = false;
  #fuel: number = 0;
  #desiredSpeed: number = 0;
  #desiredSpeedType: string = "CAS";
  #desiredAltitude: number = 0;
  #desiredAltitudeType: string = "ASL";
  #leaderID: number = 0;
  #formationOffset: Offset = {
    x: 0,
    y: 0,
    z: 0,
  };
  #targetID: number = 0;
  #targetPosition: LatLng = new LatLng(0, 0);
  #ROE: string = ROEs[1];
  #reactionToThreat: string = reactionsToThreat[2];
  #emissionsCountermeasures: string = emissionsCountermeasures[2];
  #TACAN: TACAN = {
    isOn: false,
    XY: "X",
    callsign: "TKR",
    channel: 0,
  };
  #radio: Radio = {
    frequency: 124000000,
    callsign: 1,
    callsignNumber: 1,
  };
  #generalSettings: GeneralSettings = {
    prohibitAA: false,
    prohibitAfterburner: false,
    prohibitAG: false,
    prohibitAirWpn: false,
    prohibitJettison: false,
  };
  #ammo: Ammo[] = [];
  #contacts: Contact[] = [];
  #activePath: LatLng[] = [];
  #isLeader: boolean = false;
  #operateAs: string = "blue";
  #shotsScatter: number = 2;
  #shotsIntensity: number = 2;
  #health: number = 100;
  #racetrackLength: number = 0;
  #racetrackAnchor: LatLng = new LatLng(0, 0);
  #racetrackBearing: number = 0;

  /* Other members used to draw the unit, mostly ancillary stuff like targets, ranges and so on */
  #blueprint: UnitBlueprint | null = null;
  #unitWhenGrouped: string | null = null;
  #blueprintWhenGrouped: UnitBlueprint | null = null;
  #group: Group | null = null;
  #selected: boolean = false;
  #hidden: boolean = false;
  #highlighted: boolean = false;
  #pathPolyline: Polyline;
  #contactsPolylines: Polyline[] = [];
  #engagementCircle: RangeCircle;
  #acquisitionCircle: RangeCircle;
  #miniMapMarker: CircleMarker | null = null;
  #targetPositionMarker: TargetMarker;
  #targetPositionPolyline: Polyline;
  #hotgroup: number | null = null;
  #detectionMethods: number[] = [];
  #trailPositions: LatLng[] = [];
  #trailPolylines: Polyline[] = [];
  #racetrackPolylines: Polyline[] = [];
  #racetrackArcs: Polyline[] = [];
  #racetrackAnchorMarkers: DraggableHandle[] = [new DraggableHandle(new LatLng(0, 0)), new DraggableHandle(new LatLng(0, 0))];
  #racetrackArrow: ArrowMarker = new ArrowMarker(new LatLng(0, 0));
  #inhibitRacetrackDraw: boolean = false;
  #spotLines: { [key: number]: Polyline } = {};
  #spotEditMarkers: { [key: number]: SpotEditMarker } = {};
  #spotMarkers: { [key: number]: SpotMarker } = {};
  #timeToNextTasking: number = 0;
  #barrelHeight: number = 0;
  #muzzleVelocity: number = 0;
  #aimTime: number = 0;
  #shotsToFire: number = 0;
  #shotsBaseInterval: number = 0;
  #shotsBaseScatter: number = 0;
  #engagementRange: number = 0;
  #targetingRange: number = 0;
  #aimMethodRange: number = 0;
  #acquisitionRange: number = 0;
  #totalAmmo: number = 0;
  #previousTotalAmmo: number = 0;

  /* Inputs timers */
  #debounceTimeout: number | null = null;
  #isLeftMouseDown: boolean = false;
  #isRightMouseDown: boolean = false;
  #leftMouseDownEpoch: number = 0;
  #rightMouseDownEpoch: number = 0;
  #leftMouseDownTimeout: number = 0;
  #rightMouseDownTimeout: number = 0;

  /* Getters for backend driven data */
  getAlive() {
    return this.#alive;
  }
  getHuman() {
    return this.#human;
  }
  getControlled() {
    return this.#controlled;
  }
  getCoalition() {
    return this.#coalition;
  }
  getCountry() {
    return this.#country;
  }
  getName() {
    return this.#name;
  }
  getUnitName() {
    return this.#unitName;
  }
  getCallsign() {
    return this.#callsign;
  }
  getGroupName() {
    return this.#groupName;
  }
  getState() {
    return this.#state;
  }
  getTask() {
    return this.#task;
  }
  getHasTask() {
    return this.#hasTask;
  }
  getPosition() {
    return this.#position;
  }
  getSpeed() {
    return this.#speed;
  }
  getHorizontalVelocity() {
    return this.#horizontalVelocity;
  }
  getVerticalVelocity() {
    return this.#verticalVelocity;
  }
  getHeading() {
    return this.#heading;
  }
  getTrack() {
    return this.#track;
  }
  getIsActiveAWACS() {
    return this.#isActiveAWACS;
  }
  getIsActiveTanker() {
    return this.#isActiveTanker;
  }
  getOnOff() {
    return this.#onOff;
  }
  getFollowRoads() {
    return this.#followRoads;
  }
  getFuel() {
    return this.#fuel;
  }
  getDesiredSpeed() {
    return this.#desiredSpeed;
  }
  getDesiredSpeedType() {
    return this.#desiredSpeedType;
  }
  getDesiredAltitude() {
    return this.#desiredAltitude;
  }
  getDesiredAltitudeType() {
    return this.#desiredAltitudeType;
  }
  getLeaderID() {
    return this.#leaderID;
  }
  getFormationOffset() {
    return this.#formationOffset;
  }
  getTargetID() {
    return this.#targetID;
  }
  getTargetPosition() {
    return this.#targetPosition;
  }
  getROE() {
    return this.#ROE;
  }
  getReactionToThreat() {
    return this.#reactionToThreat;
  }
  getEmissionsCountermeasures() {
    return this.#emissionsCountermeasures;
  }
  getTACAN() {
    return this.#TACAN;
  }
  getRadio() {
    return this.#radio;
  }
  getGeneralSettings() {
    return this.#generalSettings;
  }
  getAmmo() {
    return this.#ammo;
  }
  getContacts() {
    return this.#contacts;
  }
  getActivePath() {
    return this.#activePath;
  }
  getIsLeader() {
    return this.#isLeader;
  }
  getOperateAs() {
    return this.#operateAs;
  }
  getShotsScatter() {
    return this.#shotsScatter;
  }
  getShotsIntensity() {
    return this.#shotsIntensity;
  }
  getHealth() {
    return this.#health;
  }
  getRaceTrackLength() {
    return this.#racetrackLength;
  }
  getRaceTrackAnchor() {
    return this.#racetrackAnchor;
  }
  getRaceTrackBearing() {
    return this.#racetrackBearing;
  }
  getTimeToNextTasking() {
    return this.#timeToNextTasking;
  }
  getBarrelHeight() {
    return this.#barrelHeight;
  }
  getMuzzleVelocity() {
    return this.#muzzleVelocity;
  }
  getAimTime() {
    return this.#aimTime;
  }
  getShotsToFire() {
    return this.#shotsToFire;
  }
  getShotsBaseInterval() {
    return this.#shotsBaseInterval;
  }
  getShotsBaseScatter() {
    return this.#shotsBaseScatter;
  }
  getEngagementRange() {
    return this.#engagementRange;
  }
  getTargetingRange() {
    return this.#targetingRange;
  }
  getAimMethodRange() {
    return this.#aimMethodRange;
  }
  getAcquisitionRange() {
    return this.#acquisitionRange;
  }

  static getConstructor(type: string) {
    if (type === "GroundUnit") return GroundUnit;
    if (type === "Aircraft") return Aircraft;
    if (type === "Helicopter") return Helicopter;
    if (type === "NavyUnit") return NavyUnit;
  }

  constructor(ID: number) {
    super(new LatLng(0, 0), { riseOnHover: true, keyboard: false, bubblingMouseEvents: true });

    this.ID = ID;

    this.#pathPolyline = new Polyline([], {
      color: colors.OLYMPUS_BLUE,
      weight: 3,
      opacity: 0.5,
      smoothFactor: 1,
    });
    this.#pathPolyline.addTo(getApp().getMap());
    this.#targetPositionMarker = new TargetMarker(new LatLng(0, 0));
    this.#targetPositionPolyline = new Polyline([], {
      color: colors.WHITE,
      weight: 3,
      opacity: 0.5,
      smoothFactor: 1,
    });
    this.#engagementCircle = new RangeCircle(this.getPosition(), {
      radius: 0,
      weight: 4,
      opacity: 1,
      fillOpacity: 0,
      dashArray: "4 8",
      interactive: false,
      bubblingMouseEvents: false,
    });
    this.#acquisitionCircle = new RangeCircle(this.getPosition(), {
      radius: 0,
      weight: 2,
      opacity: 1,
      fillOpacity: 0,
      dashArray: "8 12",
      interactive: false,
      bubblingMouseEvents: false,
    });

    this.#racetrackPolylines = [
      new Polyline([], { color: colors.WHITE, weight: 3, smoothFactor: 1, dashArray: "5, 5" }),
      new Polyline([], { color: colors.WHITE, weight: 3, smoothFactor: 1, dashArray: "5, 5" }),
    ];

    this.#racetrackArcs = [
      new Polyline([], { color: colors.WHITE, weight: 3, smoothFactor: 1, dashArray: "5, 5" }),
      new Polyline([], { color: colors.WHITE, weight: 3, smoothFactor: 1, dashArray: "5, 5" }),
    ];

    this.#racetrackAnchorMarkers[0].on("drag", (e: any) => {
      this.#inhibitRacetrackDraw = true;
      this.#drawRacetrack();
    });

    this.#racetrackAnchorMarkers[1].on("drag", (e: any) => {
      this.#inhibitRacetrackDraw = true;
      this.#drawRacetrack();
    });

    this.#racetrackAnchorMarkers[0].on("dragend", (e: any) => {
      this.#applyRacetrackEdit();
    });
    this.#racetrackAnchorMarkers[1].on("dragend", (e: any) => {
      this.#applyRacetrackEdit();
    });

    /* Leaflet events listeners */
    this.on("mouseup", (e: any) => this.#onMouseUp(e));
    this.on("mousedown", (e: any) => this.#onMouseDown(e));
    this.on("dblclick", (e: any) => this.#onDoubleClick(e));
    this.on("click", (e: any) => e.originalEvent.preventDefault());
    this.on("contextmenu", (e: any) => e.originalEvent.preventDefault());

    this.on("mouseover", () => {
      if (this.belongsToCommandedCoalition()) this.setHighlighted(true);
    });
    this.on("mouseout", () => this.setHighlighted(false));
    getApp()
      .getMap()
      .on("zoomend", (e: any) => this.#onZoom(e));

    /* Deselect units if they are hidden */
    HiddenTypesChangedEvent.on((hiddenTypes) => {
      this.#updateMarker();
      this.setSelected(this.getSelected() && !this.getHidden());
    });

    /* Update the marker when the options change */
    MapOptionsChangedEvent.on(() => {
      this.#redrawMarker();

      /* Circles don't like to be updated when the map is zooming */
      if (!getApp().getMap().isZooming()) this.#drawRanges();
      else
        this.once("zoomend", () => {
          this.#drawRanges();
        });

      if (this.getSelected()) this.drawLines();
    });
  }

  /********************** Abstract methods  *************************/
  /** Get the unit category string
   *
   * @returns string The unit category
   */
  abstract getCategory(): string;

  /** Get the icon options
   * Used to configure how the marker appears on the map
   *
   * @returns ObjectIconOptions
   */
  abstract getIconOptions(): ObjectIconOptions;

  /**
   *
   * @returns string containing the marker category
   */
  abstract getMarkerCategory(): string;

  /**
   *
   * @returns string containing the default marker
   */
  abstract getDefaultMarker(): string;

  /********************** Unit data *************************/
  /** This function is called by the units manager to update all the data coming from the backend. It reads the binary raw data using a DataExtractor
   *
   * @param dataExtractor The DataExtractor object pointing to the binary buffer which contains the raw data coming from the backend
   */
  setData(dataExtractor: DataExtractor) {
    /* This variable controls if the marker must be updated. This is not always true since not all variables have an effect on the marker */
    var updateMarker = !getApp().getMap().hasLayer(this) && this.getAlive();

    var oldIsLeader = this.#isLeader;
    var datumIndex = 0;
    while (datumIndex != DataIndexes.endOfData) {
      datumIndex = dataExtractor.extractUInt8();
      switch (datumIndex) {
        case DataIndexes.category:
          dataExtractor.extractString();
          break;
        case DataIndexes.alive:
          this.setAlive(dataExtractor.extractBool());
          updateMarker = true;
          break;
        case DataIndexes.human:
          this.#human = dataExtractor.extractBool();
          break;
        case DataIndexes.controlled:
          this.#controlled = dataExtractor.extractBool();
          updateMarker = true;
          break;
        case DataIndexes.coalition:
          let newCoalition = enumToCoalition(dataExtractor.extractUInt8());
          updateMarker = true;
          if (newCoalition != this.#coalition) this.#clearRanges();
          this.#coalition = newCoalition;
          break; // If the coalition has changed, redraw the range circles to update the colour
        case DataIndexes.country:
          this.#country = dataExtractor.extractUInt8();
          break;
        case DataIndexes.name:
          this.#name = dataExtractor.extractString();
          break;
        case DataIndexes.unitName:
          this.#unitName = dataExtractor.extractString();
          break;
        case DataIndexes.callsign:
          this.#callsign = dataExtractor.extractString();
          break;
        case DataIndexes.groupName:
          this.#groupName = dataExtractor.extractString();
          updateMarker = true;
          break;
        case DataIndexes.state:
          this.#state = enumToState(dataExtractor.extractUInt8());
          updateMarker = true;
          break;
        case DataIndexes.task:
          this.#task = dataExtractor.extractString();
          break;
        case DataIndexes.hasTask:
          this.#hasTask = dataExtractor.extractBool();
          break;
        case DataIndexes.position:
          this.#trailPositions.unshift(this.#position);
          this.#trailPositions.splice(TRAIL_LENGTH);
          this.#position = dataExtractor.extractLatLng();
          updateMarker = true;
          break;
        case DataIndexes.speed:
          this.#speed = dataExtractor.extractFloat64();
          updateMarker = true;
          break;
        case DataIndexes.horizontalVelocity:
          this.#horizontalVelocity = dataExtractor.extractFloat64();
          break;
        case DataIndexes.verticalVelocity:
          this.#verticalVelocity = dataExtractor.extractFloat64();
          break;
        case DataIndexes.heading:
          this.#heading = dataExtractor.extractFloat64();
          updateMarker = true;
          break;
        case DataIndexes.track:
          this.#track = dataExtractor.extractFloat64();
          updateMarker = true;
          break;
        case DataIndexes.isActiveTanker:
          this.#isActiveTanker = dataExtractor.extractBool();
          break;
        case DataIndexes.isActiveAWACS:
          this.#isActiveAWACS = dataExtractor.extractBool();
          break;
        case DataIndexes.onOff:
          this.#onOff = dataExtractor.extractBool();
          break;
        case DataIndexes.followRoads:
          this.#followRoads = dataExtractor.extractBool();
          break;
        case DataIndexes.fuel:
          this.#fuel = dataExtractor.extractUInt16();
          break;
        case DataIndexes.desiredSpeed:
          this.#desiredSpeed = dataExtractor.extractFloat64();
          break;
        case DataIndexes.desiredSpeedType:
          this.#desiredSpeedType = dataExtractor.extractBool() ? "GS" : "CAS";
          break;
        case DataIndexes.desiredAltitude:
          this.#desiredAltitude = dataExtractor.extractFloat64();
          break;
        case DataIndexes.desiredAltitudeType:
          this.#desiredAltitudeType = dataExtractor.extractBool() ? "AGL" : "ASL";
          break;
        case DataIndexes.leaderID:
          this.#leaderID = dataExtractor.extractUInt32();
          break;
        case DataIndexes.formationOffset:
          this.#formationOffset = dataExtractor.extractOffset();
          break;
        case DataIndexes.targetID:
          this.#targetID = dataExtractor.extractUInt32();
          break;
        case DataIndexes.targetPosition:
          this.#targetPosition = dataExtractor.extractLatLng();
          break;
        case DataIndexes.ROE:
          this.#ROE = enumToROE(dataExtractor.extractUInt8());
          break;
        case DataIndexes.reactionToThreat:
          this.#reactionToThreat = enumToReactionToThreat(dataExtractor.extractUInt8());
          break;
        case DataIndexes.emissionsCountermeasures:
          this.#emissionsCountermeasures = enumToEmissionCountermeasure(dataExtractor.extractUInt8());
          break;
        case DataIndexes.TACAN:
          this.#TACAN = dataExtractor.extractTACAN();
          break;
        case DataIndexes.radio:
          this.#radio = dataExtractor.extractRadio();
          break;
        case DataIndexes.generalSettings:
          this.#generalSettings = dataExtractor.extractGeneralSettings();
          break;
        case DataIndexes.ammo:
          this.#ammo = dataExtractor.extractAmmo();
          this.#previousTotalAmmo = this.#totalAmmo;
          this.#totalAmmo = this.#ammo.reduce((prev: number, ammo: Ammo) => prev + ammo.quantity, 0);
          break;
        case DataIndexes.contacts:
          this.#contacts = dataExtractor.extractContacts();
          ContactsUpdatedEvent.dispatch();
          break;
        case DataIndexes.activePath:
          this.#activePath = dataExtractor.extractActivePath();
          break;
        case DataIndexes.isLeader:
          this.#isLeader = dataExtractor.extractBool();
          break;
        case DataIndexes.operateAs:
          this.#operateAs = enumToCoalition(dataExtractor.extractUInt8());
          updateMarker = true;
          break;
        case DataIndexes.shotsScatter:
          this.#shotsScatter = dataExtractor.extractUInt8();
          break;
        case DataIndexes.shotsIntensity:
          this.#shotsIntensity = dataExtractor.extractUInt8();
          break;
        case DataIndexes.health:
          this.#health = dataExtractor.extractUInt8();
          updateMarker = true;
          break;
        case DataIndexes.racetrackLength:
          this.#racetrackLength = dataExtractor.extractFloat64();
          break;
        case DataIndexes.racetrackAnchor:
          this.#racetrackAnchor = dataExtractor.extractLatLng();
          break;
        case DataIndexes.racetrackBearing:
          this.#racetrackBearing = dataExtractor.extractFloat64();
          break;
        case DataIndexes.timeToNextTasking:
          this.#timeToNextTasking = dataExtractor.extractFloat64();
          break;
        case DataIndexes.barrelHeight:
          this.#barrelHeight = dataExtractor.extractFloat64();
          break;
        case DataIndexes.muzzleVelocity:
          this.#muzzleVelocity = dataExtractor.extractFloat64();
          break;
        case DataIndexes.aimTime:
          this.#aimTime = dataExtractor.extractFloat64();
          break;
        case DataIndexes.shotsToFire:
          this.#shotsToFire = dataExtractor.extractUInt32();
          break;
        case DataIndexes.shotsBaseInterval:
          this.#shotsBaseInterval = dataExtractor.extractFloat64();
          break;
        case DataIndexes.shotsBaseScatter:
          this.#shotsBaseScatter = dataExtractor.extractFloat64();
          break;
        case DataIndexes.engagementRange:
          this.#engagementRange = dataExtractor.extractFloat64();
          break;
        case DataIndexes.targetingRange:
          this.#targetingRange = dataExtractor.extractFloat64();
          break;
        case DataIndexes.aimMethodRange:
          this.#aimMethodRange = dataExtractor.extractFloat64();
          break;
        case DataIndexes.acquisitionRange:
          this.#acquisitionRange = dataExtractor.extractFloat64();
          break;
        default:
          break;
      }
    }

    /* Dead and hidden units can't be selected */
    this.setSelected(this.getSelected() && this.#alive && !this.getHidden());

    /* Update the marker if required */
    if (updateMarker) this.#updateMarker();

    /* Redraw the marker if isLeader has changed. TODO I don't love this approach, observables may be more elegant */
    if (oldIsLeader !== this.#isLeader) {
      this.#redrawMarker();

      /* Reapply selection */
      if (this.getSelected()) {
        this.setSelected(false);
        this.setSelected(true);
      }
    }

    /* If not done already, update the unit blueprint */
    if (!this.#blueprint && this.#name !== "") {
      const blueprint = getApp().getUnitsManager().getDatabase().getByName(this.#name);
      this.#blueprint = blueprint ?? null;
      if (this.#blueprint)
        /* Refresh the marker */
        this.#redrawMarker();
    }

    /* Update the blueprint to use when the unit is grouped */
    if (this.#name !== "") {
      let unitWhenGrouped: string | null = this.getBlueprint()?.unitWhenGrouped ?? null;
      let member = this.getGroupMembers().reduce((prev: Unit | null, unit: Unit, index: number) => {
        if (unit.getBlueprint()?.unitWhenGrouped != undefined) return unit;
        return prev;
      }, null);
      unitWhenGrouped = member !== null ? (member?.getBlueprint()?.unitWhenGrouped ?? null) : unitWhenGrouped;
      if (unitWhenGrouped !== this.#unitWhenGrouped) {
        this.#unitWhenGrouped = unitWhenGrouped;
        if (unitWhenGrouped) {
          const blueprint = getApp().getUnitsManager().getDatabase().getByName(unitWhenGrouped);
          this.#blueprintWhenGrouped = blueprint ?? null;
        }
      }
    }

    UnitUpdatedEvent.dispatch(this);
  }

  /** Get unit data collated into an object
   *
   * @returns object populated by unit information which can also be retrieved using getters
   */
  getData(): UnitData {
    return {
      category: this.getCategory(),
      markerCategory: this.getMarkerCategory(),
      ID: this.ID,
      alive: this.#alive,
      human: this.#human,
      controlled: this.#controlled,
      coalition: this.#coalition,
      country: this.#country,
      name: this.#name,
      unitName: this.#unitName,
      callsign: this.#callsign,
      groupName: this.#groupName,
      state: this.#state,
      task: this.#task,
      hasTask: this.#hasTask,
      position: this.#position,
      speed: this.#speed,
      horizontalVelocity: this.#horizontalVelocity,
      verticalVelocity: this.#verticalVelocity,
      heading: this.#heading,
      track: this.#track,
      isActiveTanker: this.#isActiveTanker,
      isActiveAWACS: this.#isActiveAWACS,
      onOff: this.#onOff,
      followRoads: this.#followRoads,
      fuel: this.#fuel,
      desiredSpeed: this.#desiredSpeed,
      desiredSpeedType: this.#desiredSpeedType,
      desiredAltitude: this.#desiredAltitude,
      desiredAltitudeType: this.#desiredAltitudeType,
      leaderID: this.#leaderID,
      formationOffset: this.#formationOffset,
      targetID: this.#targetID,
      targetPosition: this.#targetPosition,
      ROE: this.#ROE,
      reactionToThreat: this.#reactionToThreat,
      emissionsCountermeasures: this.#emissionsCountermeasures,
      TACAN: this.#TACAN,
      radio: this.#radio,
      generalSettings: this.#generalSettings,
      ammo: this.#ammo,
      contacts: this.#contacts,
      activePath: this.#activePath,
      isLeader: this.#isLeader,
      operateAs: this.#operateAs,
      shotsScatter: this.#shotsScatter,
      shotsIntensity: this.#shotsIntensity,
      health: this.#health,
      racetrackLength: this.#racetrackLength,
      racetrackAnchor: this.#racetrackAnchor,
      racetrackBearing: this.#racetrackBearing,
      timeToNextTasking: this.#timeToNextTasking,
      barrelHeight: this.#barrelHeight,
      muzzleVelocity: this.#muzzleVelocity,
      aimTime: this.#aimTime,
      shotsToFire: this.#shotsToFire,
      shotsBaseInterval: this.#shotsBaseInterval,
      shotsBaseScatter: this.#shotsBaseScatter,
      engagementRange: this.#engagementRange,
      targetingRange: this.#targetingRange,
      aimMethodRange: this.#aimMethodRange,
      acquisitionRange: this.#acquisitionRange,
    };
  }

  /** Set the unit as alive or dead
   *
   * @param newAlive (boolean) true = alive, false = dead
   */
  setAlive(newAlive: boolean) {
    if (newAlive != this.#alive) {
      this.#alive = newAlive;
      UnitDeadEvent.dispatch(this);
    }
  }

  /** Set the unit as user-selected
   *
   * @param selected (boolean)
   */
  setSelected(selected: boolean) {
    /* Only alive units can be selected that belong to the commanded coalition can be selected */
    if ((this.#alive || !selected) && this.belongsToCommandedCoalition() && this.getSelected() != selected) {
      this.#selected = selected;

      /* If selected, update the marker to show the selected effects, else clear all the drawings that are only shown for selected units. */
      if (selected) {
        this.#updateMarker();
      } else {
        this.#clearContacts();
        this.#clearPath();
        this.#clearTargetPosition();
        this.#clearRacetrack();
        this.#clearSpots();
      }

      /* When the group leader is selected, if grouping is active, all the other group members are also selected */
      if (this.getCategory() === "GroundUnit" && getApp().getMap().getZoom() < GROUPING_ZOOM_TRANSITION) {
        if (this.#isLeader) {
          /* Redraw the marker in case the leader unit was replaced by a group marker, like for SAM Sites */
          this.#redrawMarker();
          this.getGroupMembers().forEach((unit: Unit) => unit.setSelected(selected));
        } else {
          this.#updateMarker();
        }
      }

      /* Activate the selection effects on the marker */
      this.getElement()?.querySelector(`.unit`)?.toggleAttribute("data-is-selected", selected);

      /* Trigger events after all (de-)selecting has been done */
      selected ? UnitSelectedEvent.dispatch(this) : UnitDeselectedEvent.dispatch(this);

      this.#inhibitRacetrackDraw = false;
    }
  }

  /** Is this unit selected?
   *
   * @returns boolean
   */
  getSelected() {
    return this.#selected;
  }

  /** Set the number of the hotgroup to which the unit belongss
   *
   * @param hotgroup (number)
   */
  setHotgroup(hotgroup: number | null) {
    this.#hotgroup = hotgroup;
    this.#updateMarker();
  }

  /** Get the unit's hotgroup number
   *
   * @returns number
   */
  getHotgroup() {
    return this.#hotgroup;
  }

  /** Set the unit as highlighted
   *
   * @param highlighted (boolean)
   */
  setHighlighted(highlighted: boolean) {
    if (this.#highlighted != highlighted) {
      this.#highlighted = highlighted;
      this.getElement()?.querySelector(`[data-object|="unit"]`)?.toggleAttribute("data-is-highlighted", highlighted);
      this.getGroupMembers().forEach((unit: Unit) => unit.setHighlighted(highlighted));
    }
  }

  /** Get whether the unit is highlighted or not
   *
   * @returns boolean
   */
  getHighlighted() {
    return this.#highlighted;
  }

  /** Get the other members of the group which this unit is in
   *
   * @returns Unit[]
   */
  getGroupMembers() {
    if (this.#group !== null)
      return this.#group.getMembers().filter((unit: Unit) => {
        return unit != this;
      });
    return [];
  }

  /** Return the leader of the group
   *
   * @returns Unit The leader of the group
   */
  getGroupLeader() {
    if (this.#group !== null) return this.#group.getLeader();
    return null;
  }

  /** Returns whether the user is allowed to command this unit, based on coalition
   *
   * @returns boolean
   */
  belongsToCommandedCoalition() {
    return getApp().getMissionManager().getCommandModeOptions().commandMode !== GAME_MASTER &&
      getApp().getMissionManager().getCommandedCoalition() !== this.#coalition
      ? false
      : true;
  }

  getType() {
    return "";
  }

  getBlueprint() {
    if (
      !this.getSelected() &&
      this.getIsLeader() &&
      getApp().getMap().getOptions().hideGroupMembers &&
      getApp().getMap().getZoom() < GROUPING_ZOOM_TRANSITION &&
      this.#blueprintWhenGrouped
    )
      return this.#blueprintWhenGrouped;
    else return this.#blueprint;
  }

  getGroup() {
    return this.#group;
  }

  setGroup(group: Group | null) {
    this.#group = group;
  }

  /** Get the actions that this unit can perform
   *
   */
  appendContextActions(contextActionSet: ContextActionSet) {
    contextActionSet.addContextAction(this, ContextActions.STOP);
    contextActionSet.addContextAction(this, ContextActions.MOVE);
    contextActionSet.addContextAction(this, ContextActions.PATH);
    contextActionSet.addContextAction(this, ContextActions.DELETE);
    contextActionSet.addContextAction(this, ContextActions.EXPLODE);
    contextActionSet.addContextAction(this, ContextActions.CENTER_MAP);
    contextActionSet.addContextAction(this, ContextActions.CLONE);
    contextActionSet.addContextAction(this, ContextActions.ATTACK);
    contextActionSet.addContextAction(this, ContextActions.FIRE_LASER);
    contextActionSet.addContextAction(this, ContextActions.FIRE_INFRARED);

    contextActionSet.addDefaultContextAction(this, ContextActions.MOVE);
  }

  drawLines() {
    /* Leaflet does not like it when you change coordinates when the map is zooming */
    if (!getApp().getMap().isZooming()) {
      this.#drawPath();
      this.#drawRacetrack();
      this.#drawContacts();
      this.#drawTarget();
      this.#drawSpots();
    }
  }

  checkZoomRedraw() {
    return false;
  }

  isControlledByDCS() {
    return this.getControlled() === false && this.getHuman() === false;
  }

  isControlledByOlympus() {
    return this.getControlled() === true;
  }

  /********************** Icon *************************/
  async createIcon() {
    /* Set the icon */
    var icon = new DivIcon({
      className: "leaflet-unit-icon",
      iconAnchor: [25, 25],
      iconSize: [50, 50],
    });
    this.setIcon(icon);

    /* Create the base element */
    var el = document.createElement("div");
    el.classList.add("unit");
    el.setAttribute("data-object", `unit-${this.getMarkerCategory()}`);
    el.setAttribute("data-coalition", this.#coalition);

    var iconOptions = this.getIconOptions();

    /* Generate and append elements depending on active options */
    /* Velocity vector */
    if (iconOptions.showVvi) {
      var vvi = document.createElement("div");
      vvi.classList.add("unit-vvi");
      vvi.toggleAttribute("data-rotate-to-heading");
      el.append(vvi);
    }

    /* Hotgroup indicator */
    if (iconOptions.showHotgroup) {
      var hotgroup = document.createElement("div");
      hotgroup.classList.add("unit-hotgroup");
      var hotgroupId = document.createElement("div");
      hotgroupId.classList.add("unit-hotgroup-id");
      hotgroup.appendChild(hotgroupId);
      el.append(hotgroup);
    }

    /* Main icon */
    if (iconOptions.showUnitIcon) {
      var unitIcon = document.createElement("div");
      unitIcon.classList.add("unit-icon");
      var img = document.createElement("img");

      /* If a unit does not belong to the commanded coalition or it is not visually detected, show it with the generic aircraft square */
      var marker;
      if (this.belongsToCommandedCoalition() || this.getDetectionMethods().some((value) => [VISUAL, OPTIC].includes(value)))
        marker = this.getBlueprint()?.markerFile ?? this.getDefaultMarker();
      else marker = "aircraft";
      img.src = `./images/units/map/${/*TODO getApp().getMap().getOptions().AWACSMode ? "awacs" : */ "normal"}/${this.getCoalition()}/${marker}.svg`;
      img.onload = () => SVGInjector(img);
      unitIcon.appendChild(img);

      unitIcon.toggleAttribute("data-rotate-to-heading", iconOptions.rotateToHeading);
      el.append(unitIcon);
    }

    /* State icon */
    if (iconOptions.showState) {
      var state = document.createElement("div");
      state.classList.add("unit-state");
      el.appendChild(state);
    }

    /* Short label */
    if (iconOptions.showShortLabel) {
      var shortLabel = document.createElement("div");
      shortLabel.classList.add("unit-short-label");
      shortLabel.innerText = this.getBlueprint()?.shortLabel || "";
      el.append(shortLabel);
    }

    /* Fuel indicator */
    if (iconOptions.showFuel) {
      var fuelIndicator = document.createElement("div");
      fuelIndicator.classList.add("unit-fuel");
      var fuelLevel = document.createElement("div");
      fuelLevel.classList.add("unit-fuel-level");
      fuelIndicator.appendChild(fuelLevel);
      el.append(fuelIndicator);
    }

    /* Health indicator */
    if (iconOptions.showHealth) {
      var healthIndicator = document.createElement("div");
      healthIndicator.classList.add("unit-health");
      var healthLevel = document.createElement("div");
      healthLevel.classList.add("unit-health-level");
      healthIndicator.appendChild(healthLevel);
      el.append(healthIndicator);
    }

    /* Ammo indicator */
    if (iconOptions.showAmmo) {
      var ammoIndicator = document.createElement("div");
      ammoIndicator.classList.add("unit-ammo");
      for (let i = 0; i <= 3; i++) ammoIndicator.appendChild(document.createElement("div"));
      el.append(ammoIndicator);
    }

    /* Unit summary */
    if (iconOptions.showSummary) {
      var summary = document.createElement("div");
      summary.classList.add("unit-summary");
      var callsign = document.createElement("div");
      callsign.classList.add("unit-callsign");
      callsign.innerText = this.#unitName;
      var altitude = document.createElement("div");
      altitude.classList.add("unit-altitude");
      var speed = document.createElement("div");
      speed.classList.add("unit-speed");
      if (iconOptions.showCallsign) summary.appendChild(callsign);
      summary.appendChild(altitude);
      summary.appendChild(speed);
      el.appendChild(summary);

      var bullseye = document.createElement("div");
      bullseye.classList.add("unit-bullseye");
      summary.appendChild(bullseye);

      var BRAA = document.createElement("div");
      BRAA.classList.add("unit-braa");
      summary.appendChild(BRAA);
    }

    this.getElement()?.appendChild(el);
  }

  /********************** Visibility *************************/
  updateVisibility() {
    const hiddenTypes = getApp().getMap().getHiddenTypes();
    var hidden =
      /* Hide the unit if it is a human and humans are hidden */
      (this.getHuman() && hiddenTypes["human"]) ||
      /* Hide the unit if it is DCS-controlled and DCS controlled units are hidden */
      (this.isControlledByDCS() && hiddenTypes["dcs"]) ||
      /* Hide the unit if it is Olympus-controlled and Olympus-controlled units are hidden */
      (this.isControlledByOlympus() && hiddenTypes["olympus"]) ||
      /* Hide the unit if this specific category is hidden */
      hiddenTypes[this.getMarkerCategory()] ||
      /* Hide the unit if this coalition is hidden */
      hiddenTypes[this.#coalition] ||
      /* Hide the unit if it does not belong to the commanded coalition and it is not detected by a method that can pinpoint its location (RWR does not count) */
      (!this.belongsToCommandedCoalition() &&
        (this.#detectionMethods.length == 0 || (this.#detectionMethods.length == 1 && this.#detectionMethods[0] === RWR))) ||
      /* Hide the unit if grouping is activated, the unit is not the group leader, it is not selected, and the zoom is higher than the grouping threshold */
      (getApp().getMap().getOptions().hideGroupMembers &&
        !this.#isLeader &&
        !this.getSelected() &&
        this.getCategory() == "GroundUnit" &&
        getApp().getMap().getZoom() < GROUPING_ZOOM_TRANSITION &&
        (this.belongsToCommandedCoalition() || (!this.belongsToCommandedCoalition() && this.#detectionMethods.length == 0)));

    /* Force dead units to be hidden */
    this.setHidden(hidden || !this.getAlive());
  }

  setHidden(hidden: boolean) {
    this.#hidden = hidden;

    /* Add the marker if not present */
    if (!getApp().getMap().hasLayer(this) && !this.getHidden()) {
      if (getApp().getMap().isZooming())
        this.once("zoomend", () => {
          this.addTo(getApp().getMap());
        });
      else this.addTo(getApp().getMap());
    }

    /* Hide the marker if necessary*/
    if (getApp().getMap().hasLayer(this) && this.getHidden()) {
      getApp().getMap().removeLayer(this);
    }

    /* Draw the range circles if the unit is not hidden */
    if (!this.getHidden()) {
      /* Circles don't like to be updated when the map is zooming */
      if (!getApp().getMap().isZooming()) this.#drawRanges();
      else
        this.once("zoomend", () => {
          this.#drawRanges();
        });
    } else {
      this.#clearRanges();
    }
  }

  getHidden() {
    return this.#hidden;
  }

  setDetectionMethods(newDetectionMethods: number[]) {
    if (!this.belongsToCommandedCoalition()) {
      /* Check if the detection methods of this unit have changed */
      if (this.#detectionMethods.length !== newDetectionMethods.length || this.getDetectionMethods().some((value) => !newDetectionMethods.includes(value))) {
        /* Force a redraw of the unit to reflect the new status of the detection methods */
        this.setHidden(true);
        this.#detectionMethods = newDetectionMethods;
        this.#updateMarker();
      }
    }
  }

  getDetectionMethods() {
    return this.#detectionMethods;
  }

  getLeader() {
    return getApp().getUnitsManager().getUnitByID(this.#leaderID);
  }

  canFulfillRole(roles: string | string[]) {
    if (typeof roles === "string") roles = [roles];

    var loadouts = this.getBlueprint()?.loadouts;
    if (loadouts) {
      return loadouts.some((loadout: LoadoutBlueprint) => {
        return (roles as string[]).some((role: string) => {
          return loadout.roles.includes(role);
        });
      });
    } else return false;
  }

  isInViewport() {
    return getApp().getMap().getBounds().contains(this.getPosition());
  }

  canTargetPoint() {
    return this.getBlueprint()?.canTargetPoint === true;
  }

  canRearm() {
    return this.getBlueprint()?.canRearm === true;
  }

  canAAA() {
    return this.getBlueprint()?.canAAA === true;
  }

  isIndirectFire() {
    return this.getBlueprint()?.indirectFire === true;
  }

  isTanker() {
    return this.canFulfillRole("Tanker");
  }

  isAWACS() {
    return this.canFulfillRole("AWACS");
  }

  /********************** Unit commands *************************/
  addDestination(latlng: L.LatLng) {
    if (!this.#human) {
      var path: any = {};
      if (this.#activePath.length > 0) {
        path = this.#activePath;
        path[Object.keys(path).length.toString()] = latlng;
      } else {
        path = [latlng];
      }
      getApp().getServerManager().addDestination(this.ID, path);
    }
  }

  clearDestinations() {
    if (!this.#human) this.#activePath = [];
  }

  attackUnit(targetID: number) {
    /* Units can't attack themselves */
    if (!this.#human) if (this.ID != targetID) getApp().getServerManager().attackUnit(this.ID, targetID);
  }

  followUnit(targetID: number, offset: { x: number; y: number; z: number }) {
    /* Units can't follow themselves */
    if (!this.#human) if (this.ID != targetID) getApp().getServerManager().followUnit(this.ID, targetID, offset);
  }

  landAt(latlng: LatLng) {
    if (!this.#human) getApp().getServerManager().landAt(this.ID, latlng);
  }

  changeSpeed(speedChange: string) {
    if (!this.#human) getApp().getServerManager().changeSpeed(this.ID, speedChange);
  }

  changeAltitude(altitudeChange: string) {
    if (!this.#human) getApp().getServerManager().changeAltitude(this.ID, altitudeChange);
  }

  setSpeed(speed: number) {
    if (!this.#human) getApp().getServerManager().setSpeed(this.ID, speed);
  }

  setSpeedType(speedType: string) {
    if (!this.#human) getApp().getServerManager().setSpeedType(this.ID, speedType);
  }

  setAltitude(altitude: number) {
    if (!this.#human) getApp().getServerManager().setAltitude(this.ID, altitude);
  }

  setAltitudeType(altitudeType: string) {
    if (!this.#human) getApp().getServerManager().setAltitudeType(this.ID, altitudeType);
  }

  setROE(ROE: string) {
    if (!this.#human) getApp().getServerManager().setROE(this.ID, ROE);
  }

  setReactionToThreat(reactionToThreat: string) {
    if (!this.#human) getApp().getServerManager().setReactionToThreat(this.ID, reactionToThreat);
  }

  setEmissionsCountermeasures(emissionCountermeasure: string) {
    if (!this.#human) getApp().getServerManager().setEmissionsCountermeasures(this.ID, emissionCountermeasure);
  }

  setOnOff(onOff: boolean) {
    if (!this.#human) getApp().getServerManager().setOnOff(this.ID, onOff);
  }

  setFollowRoads(followRoads: boolean) {
    if (!this.#human) getApp().getServerManager().setFollowRoads(this.ID, followRoads);
  }

  setOperateAs(operateAs: string) {
    if (!this.#human) getApp().getServerManager().setOperateAs(this.ID, coalitionToEnum(operateAs));
  }

  delete(explosion: boolean, explosionType: string, immediate: boolean) {
    getApp()
      .getServerManager()
      .deleteUnit(this.ID, explosion, explosionType, immediate, (commandHash) => {
        /* When the command is executed, add an explosion marker where the unit was */
        if (explosion) {
          // TODO some commands don't currently return a commandHash, fix that!
          let timer = window.setTimeout(() => {
            //getApp()
            //  .getServerManager()
            //  .isCommandExecuted((res: any) => {
            //    if (res.commandExecuted) {
            getApp().getMap().addExplosionMarker(this.getPosition());
            window.clearInterval(timer);
            //    }
            //  }, commandHash);
          }, 500);
        }
      });
  }

  refuel() {
    if (!this.#human) getApp().getServerManager().refuel(this.ID);
  }

  setAdvancedOptions(isActiveTanker: boolean, isActiveAWACS: boolean, TACAN: TACAN, radio: Radio, generalSettings: GeneralSettings) {
    if (!this.#human) getApp().getServerManager().setAdvancedOptions(this.ID, isActiveTanker, isActiveAWACS, TACAN, radio, generalSettings);
  }

  setEngagementProperties(
    barrelHeight: number,
    muzzleVelocity: number,
    aimTime: number,
    shotsToFire: number,
    shotsBaseInterval: number,
    shotsBaseScatter: number,
    engagementRange: number,
    targetingRange: number,
    aimMethodRange: number,
    acquisitionRange: number
  ) {
    if (!this.#human)
      getApp()
        .getServerManager()
        .setEngagementProperties(
          this.ID,
          barrelHeight,
          muzzleVelocity,
          aimTime,
          shotsToFire,
          shotsBaseInterval,
          shotsBaseScatter,
          engagementRange,
          targetingRange,
          aimMethodRange,
          acquisitionRange
        );
  }

  bombPoint(latlng: LatLng) {
    getApp().getServerManager().bombPoint(this.ID, latlng);
  }

  carpetBomb(latlng: LatLng) {
    getApp().getServerManager().carpetBomb(this.ID, latlng);
  }

  bombBuilding(latlng: LatLng) {
    getApp().getServerManager().bombBuilding(this.ID, latlng);
  }

  fireAtArea(latlng: LatLng) {
    getApp().getServerManager().fireAtArea(this.ID, latlng);
  }

  fireLaser(latlng: LatLng) {
    getApp().getServerManager().fireLaser(this.ID, latlng);
  }

  fireInfrared(latlng: LatLng) {
    getApp().getServerManager().fireInfrared(this.ID, latlng);
  }

  simulateFireFight(latlng: LatLng, targetGroundElevation: number | null) {
    getGroundElevation(this.getPosition(), (response: string) => {
      var unitGroundElevation: number | null = null;
      try {
        unitGroundElevation = parseFloat(response);
      } catch {
        console.log("Simulate fire fight: could not retrieve ground elevation");
      }

      /* DCS and SRTM altitude data is not exactly the same so to minimize error we use SRTM only to compute relative elevation difference */
      var altitude = this.getPosition().alt;
      if (altitude !== undefined && targetGroundElevation !== null && unitGroundElevation !== null)
        getApp()
          .getServerManager()
          .simulateFireFight(this.ID, latlng, altitude + targetGroundElevation - unitGroundElevation);
    });
  }

  // TODO: Remove coalition
  scenicAAA() {
    var coalition = "neutral";
    if (this.getCoalition() === "red") coalition = "blue";
    else if (this.getCoalition() == "blue") coalition = "red";
    getApp().getServerManager().scenicAAA(this.ID, coalition);
  }

  // TODO: Remove coalition
  missOnPurpose() {
    var coalition = "neutral";
    if (this.getCoalition() === "red") coalition = "blue";
    else if (this.getCoalition() == "blue") coalition = "red";
    getApp().getServerManager().missOnPurpose(this.ID, coalition);
  }

  landAtPoint(latlng: LatLng) {
    getApp().getServerManager().landAtPoint(this.ID, latlng);
  }

  setShotsScatter(shotsScatter: number) {
    if (!this.#human) getApp().getServerManager().setShotsScatter(this.ID, shotsScatter);
  }

  setShotsIntensity(shotsIntensity: number) {
    if (!this.#human) getApp().getServerManager().setShotsIntensity(this.ID, shotsIntensity);
  }

  setRacetrack(length: number, anchor: LatLng, bearing: number, callback: () => void) {
    if (!this.#human) getApp().getServerManager().setRacetrack(this.ID, length, anchor, bearing, callback);
  }

  /***********************************************/
  onAdd(map: Map): this {
    super.onAdd(map);
    return this;
  }

  onGroupChanged(member: Unit) {
    this.#redrawMarker();
  }

  /***********************************************/
  #onMouseUp(e: any) {
    if (e.originalEvent?.button === 0) {
      DomEvent.stop(e);
      DomEvent.preventDefault(e);
      e.originalEvent.stopImmediatePropagation();

      if (Date.now() - this.#leftMouseDownEpoch < SHORT_PRESS_MILLISECONDS) this.#onLeftShortClick(e);
      this.#isLeftMouseDown = false;
    } else if (e.originalEvent?.button === 2) {
      if (getApp().getState() === OlympusState.UNIT_CONTROL && getApp().getMap().getContextAction()?.getTarget() !== ContextActionTarget.POINT) {
        DomEvent.stop(e);
        DomEvent.preventDefault(e);
        e.originalEvent.stopImmediatePropagation();
      }

      if (Date.now() - this.#rightMouseDownEpoch < SHORT_PRESS_MILLISECONDS) this.#onRightShortClick(e);
      this.#isRightMouseDown = false;
    }
  }

  #onMouseDown(e: any) {
    if (e.originalEvent?.button === 0) {
      DomEvent.stop(e);
      DomEvent.preventDefault(e);
      e.originalEvent.stopImmediatePropagation();

      this.#isLeftMouseDown = true;
      this.#leftMouseDownEpoch = Date.now();
    } else if (e.originalEvent?.button === 2) {
      if (
        getApp().getState() === OlympusState.IDLE ||
        (getApp().getState() === OlympusState.UNIT_CONTROL && getApp().getMap().getContextAction()?.getTarget() !== ContextActionTarget.POINT)
      ) {
        DomEvent.stop(e);
        DomEvent.preventDefault(e);
        e.originalEvent.stopImmediatePropagation();
      }

      this.#isRightMouseDown = true;
      this.#rightMouseDownEpoch = Date.now();
      this.#rightMouseDownTimeout = window.setTimeout(() => {
        this.#onRightLongClick(e);
      }, SHORT_PRESS_MILLISECONDS);
    }
  }

  #onLeftShortClick(e: any) {
    DomEvent.stop(e);
    DomEvent.preventDefault(e);
    e.originalEvent.stopImmediatePropagation();

    if (this.#debounceTimeout) window.clearTimeout(this.#debounceTimeout);
    this.#debounceTimeout = window.setTimeout(() => {
      console.log(`Left short click on ${this.getUnitName()}`);

      if (getApp().getState() === OlympusState.UNIT_CONTROL && getApp().getMap().getContextAction()) {
        if (getApp().getMap().getContextAction()?.getTarget() === ContextActionTarget.UNIT) getApp().getMap().executeContextAction(this, null, e.originalEvent);
        else getApp().getMap().executeContextAction(null, this.getPosition(), e.originalEvent);
      } else {
        if (!e.originalEvent.ctrlKey) getApp().getUnitsManager().deselectAllUnits();
        this.setSelected(!this.getSelected());
      }
    }, SHORT_PRESS_MILLISECONDS);
  }

  #onRightShortClick(e: any) {
    console.log(`Right short click on ${this.getUnitName()}`);

    window.clearTimeout(this.#rightMouseDownTimeout);
    if (
      getApp().getState() === OlympusState.UNIT_CONTROL &&
      getApp().getMap().getDefaultContextAction() &&
      getApp().getMap().getDefaultContextAction()?.getTarget() === ContextActionTarget.POINT
    )
      getApp().getMap().executeDefaultContextAction(null, this.getPosition(), e.originalEvent);
  }

  #onRightLongClick(e: any) {
    console.log(`Right long click on ${this.getUnitName()}`);

    if (getApp().getState() === OlympusState.IDLE) {
      this.setSelected(!this.getSelected());

      DomEvent.stop(e);
      DomEvent.preventDefault(e);
      e.originalEvent.stopImmediatePropagation();

      window.setTimeout(() => {
        getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.UNIT_CONTEXT_MENU);
        UnitContextMenuRequestEvent.dispatch(this);
      }, 200);
    }

    if (getApp().getState() === OlympusState.UNIT_CONTROL && !getApp().getMap().getContextAction()) {
      DomEvent.stop(e);
      DomEvent.preventDefault(e);
      e.originalEvent.stopImmediatePropagation();

      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.UNIT_CONTEXT_MENU);
      UnitContextMenuRequestEvent.dispatch(this);
    }
  }

  #onDoubleClick(e: any) {
    DomEvent.stop(e);
    DomEvent.preventDefault(e);
    e.originalEvent.stopImmediatePropagation();

    console.log(`Double click on ${this.getUnitName()}`);

    if (this.#debounceTimeout) window.clearTimeout(this.#debounceTimeout);

    /* Select all matching units in the viewport */
    const unitsManager = getApp().getUnitsManager();
    Object.values(unitsManager.getUnits()).forEach((unit: Unit) => {
      if (unit.getAlive() === true && unit.getName() === this.getName() && unit.isInViewport()) unitsManager.selectUnit(unit.ID, false);
    });
  }

  #updateMarker() {
    /* Delete existing trails */
    this.#trailPolylines.forEach((polyline) => polyline.removeFrom(getApp().getMap()));
    this.#trailPolylines = [];

    this.updateVisibility();

    /* Draw the minimap marker */
    var drawMiniMapMarker =
      this.belongsToCommandedCoalition() || this.getDetectionMethods().some((value) => [VISUAL, OPTIC, RADAR, IRST, DLINK].includes(value));
    if (this.#alive && drawMiniMapMarker) {
      if (this.#miniMapMarker == null) {
        this.#miniMapMarker = new CircleMarker(new LatLng(this.#position.lat, this.#position.lng), { radius: 0.5 });
        if (this.#coalition == "neutral") this.#miniMapMarker.setStyle({ color: colors.NEUTRAL_COALITION, radius: 2 });
        else if (this.#coalition == "red") this.#miniMapMarker.setStyle({ color: colors.RED_COALITION, radius: 2 });
        else this.#miniMapMarker.setStyle({ color: colors.BLUE_COALITION, radius: 2 });
        this.#miniMapMarker.addTo(getApp().getMap().getMiniMapLayerGroup());
        this.#miniMapMarker.bringToBack();
      } else {
        if (this.#miniMapMarker.getLatLng().lat !== this.getPosition().lat || this.#miniMapMarker.getLatLng().lng !== this.getPosition().lng) {
          this.#miniMapMarker.setLatLng(new LatLng(this.#position.lat, this.#position.lng));
          this.#miniMapMarker.bringToBack();
        }
      }
    } else {
      if (this.#miniMapMarker != null && getApp().getMap().getMiniMapLayerGroup().hasLayer(this.#miniMapMarker)) {
        getApp().getMap().getMiniMapLayerGroup().removeLayer(this.#miniMapMarker);
        this.#miniMapMarker = null;
      }
    }

    /* Draw the marker */
    if (!this.getHidden()) {
      if (this.getLatLng().lat !== this.#position.lat || this.getLatLng().lng !== this.#position.lng) {
        this.setLatLng(new LatLng(this.#position.lat, this.#position.lng));
      }

      var element = this.getElement();
      if (element != null) {
        /* Draw the velocity vector */
        element.querySelector(".unit-vvi")?.setAttribute("style", `height: ${15 + this.#speed / 5}px;`);

        /* Set fuel data */
        element.querySelector(".unit-fuel-level")?.setAttribute("style", `width: ${this.#fuel}%`);
        element.querySelector(".unit")?.toggleAttribute("data-has-low-fuel", this.#fuel < 20);

        /* Set health data */
        element.querySelector(".unit-health-level")?.setAttribute("style", `width: ${this.#health}%`);
        element.querySelector(".unit")?.toggleAttribute("data-has-low-health", this.#health < 20);

        /* Set dead/alive flag */
        element.querySelector(".unit")?.toggleAttribute("data-is-dead", !this.#alive);

        /* Set current unit state */
        if (this.#human) {
          // Unit is human
          element.querySelector(".unit")?.setAttribute("data-state", "human");
        } else if (!this.#controlled) {
          // Unit is under DCS control (not Olympus)
          element.querySelector(".unit")?.setAttribute("data-state", "dcs");
        } else if ((this.getCategory() == "Aircraft" || this.getCategory() == "Helicopter") && !this.#hasTask) {
          element.querySelector(".unit")?.setAttribute("data-state", "no-task");
        } else {
          // Unit is under Olympus control
          if (this.#onOff) {
            if (this.#isActiveTanker) element.querySelector(".unit")?.setAttribute("data-state", "tanker");
            else if (this.#isActiveAWACS) element.querySelector(".unit")?.setAttribute("data-state", "AWACS");
            else element.querySelector(".unit")?.setAttribute("data-state", this.#state.toLowerCase());
          } else {
            element.querySelector(".unit")?.setAttribute("data-state", "off");
          }
        }

        /* Set altitude and speed */
        if (element.querySelector(".unit-altitude"))
          (<HTMLElement>element.querySelector(".unit-altitude")).innerText = "FL" + zeroAppend(Math.floor(mToFt(this.#position.alt as number) / 100), 3);
        if (element.querySelector(".unit-speed"))
          (<HTMLElement>element.querySelector(".unit-speed")).innerText = String(Math.floor(msToKnots(this.#speed))) + "GS";

        /* Rotate elements according to heading */
        element.querySelectorAll("[data-rotate-to-heading]").forEach((el) => {
          const headingDeg = rad2deg(this.#track);
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
        Object.values(this.#ammo).forEach((ammo: Ammo) => {
          if (ammo.category == 1 && ammo.missileCategory == 1) {
            if (ammo.guidance == 4 || ammo.guidance == 5) newHasFox1 = true;
            else if (ammo.guidance == 2) newHasFox2 = true;
            else if (ammo.guidance == 3) newHasFox3 = true;
          } else newHasOtherAmmo = true;
        });

        if (hasFox1 != newHasFox1) element.querySelector(".unit")?.toggleAttribute("data-has-fox-1", newHasFox1);
        if (hasFox2 != newHasFox2) element.querySelector(".unit")?.toggleAttribute("data-has-fox-2", newHasFox2);
        if (hasFox3 != newHasFox3) element.querySelector(".unit")?.toggleAttribute("data-has-fox-3", newHasFox3);
        if (hasOtherAmmo != newHasOtherAmmo) element.querySelector(".unit")?.toggleAttribute("data-has-other-ammo", newHasOtherAmmo);

        /* Draw the hotgroup element */
        element.querySelector(".unit")?.toggleAttribute("data-is-in-hotgroup", this.#hotgroup != null);
        if (this.#hotgroup) {
          const hotgroupEl = element.querySelector(".unit-hotgroup-id") as HTMLElement;
          if (hotgroupEl) hotgroupEl.innerText = String(this.#hotgroup);
        }

        /* Set bullseyes positions */
        const bullseyes = getApp().getMissionManager().getBullseyes();
        if (Object.keys(bullseyes).length > 0) {
          const bullseye = `${computeBearingRangeString(bullseyes[coalitionToEnum(getApp().getMap().getOptions().AWACSCoalition)].getLatLng(), this.getPosition())}`;
          if (element.querySelector(".unit-bullseye")) (<HTMLElement>element.querySelector(".unit-bullseye")).innerText = `${bullseye}`;
        }

        /* Set BRAA */
        const reference = getApp().getUnitsManager().getAWACSReference();
        if (reference && reference !== this && reference.getAlive()) {
          const BRAA = `${computeBearingRangeString(reference.getPosition(), this.getPosition())}`;
          if (element.querySelector(".unit-braa")) (<HTMLElement>element.querySelector(".unit-braa")).innerText = `${BRAA}`;
        } else if (element.querySelector(".unit-braa")) (<HTMLElement>element.querySelector(".unit-braa")).innerText = ``;

        /* Set operate as */
        element
          .querySelector(".unit")
          ?.setAttribute(
            "data-operate-as",
            this.getState() === UnitState.MISS_ON_PURPOSE || this.getState() === UnitState.SCENIC_AAA || this.getState() === UnitState.SIMULATE_FIRE_FIGHT
              ? this.#operateAs
              : "neutral"
          );
      }

      /* Set vertical offset for altitude stacking */
      var pos = getApp().getMap().latLngToLayerPoint(this.getLatLng()).round();
      this.setZIndexOffset(1000 + Math.floor(this.#position.alt as number) - pos.y + (this.#highlighted || this.#selected ? 5000 : 0));

      /* Get the cluster this unit is in to position the label correctly */
      let cluster = Object.values(getApp().getUnitsManager().getClusters()).find((cluster) => cluster.includes(this));
      if (cluster && cluster.length > 1) {
        let clusterMean = turf.centroid(turf.featureCollection(cluster.map((unit) => turf.point([unit.getPosition().lng, unit.getPosition().lat]))));
        let bearingFromCluster = bearing(
          clusterMean.geometry.coordinates[1],
          clusterMean.geometry.coordinates[0],
          this.getPosition().lat,
          this.getPosition().lng,
          false
        );

        if (bearingFromCluster < 0) bearingFromCluster += 360;
        let trackIndex = Math.round(bearingFromCluster / 45);

        for (let idx = 0; idx < bearingStrings.length; idx++) element?.querySelector(".unit-summary")?.classList.remove("cluster-" + bearingStrings[idx]);
        element?.querySelector(".unit-summary")?.classList.add("cluster-" + bearingStrings[trackIndex]);
      } else {
        for (let idx = 0; idx < bearingStrings.length; idx++) element?.querySelector(".unit-summary")?.classList.remove("cluster-" + bearingStrings[idx]);
        element?.querySelector(".unit-summary")?.classList.add("cluster-north-east");
      }

      /* Draw the contact trail */
      if (/*TODO getApp().getMap().getOptions().AWACSMode*/ false) {
        this.#trailPolylines = this.#trailPositions.map(
          (latlng, idx) => new Polyline([latlng, latlng], { color: colors.WHITE, opacity: 1 - (idx + 1) / TRAIL_LENGTH })
        );
        this.#trailPolylines.forEach((polyline) => polyline.addTo(getApp().getMap()));
      }
    }
  }

  #redrawMarker() {
    this.removeFrom(getApp().getMap());
    this.#updateMarker();

    /* Activate the selection effects on the marker */
    this.getElement()?.querySelector(`.unit`)?.toggleAttribute("data-is-selected", this.getSelected());
  }

  #drawPath() {
    if (this.#activePath != undefined && getApp().getMap().getOptions().showUnitPaths) {
      var points: LatLng[] = [];
      points.push(new LatLng(this.#position.lat, this.#position.lng));

      for (let WP in this.#activePath) {
        var destination = this.#activePath[WP];
        points.push(new LatLng(destination.lat, destination.lng));
      }

      /* Add racetrack anchor to the path, but only if we are an active tanker or AWACS */
      if (this.getState() !== UnitState.IDLE && (this.getIsActiveAWACS() || this.getIsActiveTanker())) points.push(this.#racetrackAnchor);

      this.#pathPolyline.setLatLngs(points);

      if (points.length == 1) this.#clearPath();
    } else {
      this.#clearPath();
    }
  }

  #clearPath() {
    if (this.#pathPolyline.getLatLngs().length != 0) {
      this.#pathPolyline.setLatLngs([]);
    }
  }

  #drawRacetrack() {
    if (getApp().getMap().getOptions().showRacetracks) {
      let groundspeed = this.#speed;

      // Determine racetrack length
      let racetrackLength = this.#racetrackLength;
      if (racetrackLength === 0) {
        if (this.getIsActiveTanker())
          racetrackLength = nmToM(50); // Default length for active tanker
        else racetrackLength = this.#desiredSpeed * 30; // Default length based on desired speed
      }

      // Calculate the radius of the racetrack turns
      const radius = Math.pow(groundspeed, 2) / 9.81 / Math.tan(deg2rad(22.5));

      let point1;
      let point2;

      // Determine the anchor points of the racetrack
      if (!this.#inhibitRacetrackDraw) {
        point1 = this.#racetrackAnchor;
        point2 = bearingAndDistanceToLatLng(point1.lat, point1.lng, this.#racetrackBearing, racetrackLength);
      } else {
        point1 = this.#racetrackAnchorMarkers[0].getLatLng();
        point2 = this.#racetrackAnchorMarkers[1].getLatLng();
        this.#racetrackBearing = deg2rad(bearing(point1.lat, point1.lng, point2.lat, point2.lng, false));
        this.#racetrackLength = point1.distanceTo(point2);
      }

      // Calculate the other points of the racetrack
      const point3 = bearingAndDistanceToLatLng(point2.lat, point2.lng, this.#racetrackBearing - deg2rad(90), radius * 2);
      const point4 = bearingAndDistanceToLatLng(point1.lat, point1.lng, this.#racetrackBearing - deg2rad(90), radius * 2);
      const pointArrow = bearingAndDistanceToLatLng(point1.lat, point1.lng, this.#racetrackBearing, racetrackLength / 2);

      // Calculate the centers of the racetrack turns
      const center1 = bearingAndDistanceToLatLng(point2.lat, point2.lng, this.#racetrackBearing - deg2rad(90), radius);
      const center2 = bearingAndDistanceToLatLng(point1.lat, point1.lng, this.#racetrackBearing - deg2rad(90), radius);

      // Draw or update the straight segments of the racetrack
      if (!getApp().getMap().hasLayer(this.#racetrackPolylines[0])) this.#racetrackPolylines[0].addTo(getApp().getMap());
      this.#racetrackPolylines[0].setLatLngs([point1, point2]);

      if (!getApp().getMap().hasLayer(this.#racetrackPolylines[1])) this.#racetrackPolylines[1].addTo(getApp().getMap());
      this.#racetrackPolylines[1].setLatLngs([point3, point4]);

      const arc1Points: LatLng[] = [];
      const arc2Points: LatLng[] = [];

      // Calculate the points for the racetrack arcs
      for (let theta = 0; theta <= 180; theta += 5) {
        arc1Points.push(bearingAndDistanceToLatLng(center1.lat, center1.lng, this.#racetrackBearing + deg2rad(theta - 90), radius));
        arc2Points.push(bearingAndDistanceToLatLng(center2.lat, center2.lng, this.#racetrackBearing + deg2rad(theta + 90), radius));
      }

      // Draw or update the racetrack arcs
      if (!getApp().getMap().hasLayer(this.#racetrackArcs[0])) this.#racetrackArcs[0].addTo(getApp().getMap());
      this.#racetrackArcs[0].setLatLngs(arc1Points);

      if (!getApp().getMap().hasLayer(this.#racetrackArcs[1])) this.#racetrackArcs[1].addTo(getApp().getMap());

      this.#racetrackArcs[1].setLatLngs(arc2Points);

      // Update the positions of the racetrack anchor markers
      this.#racetrackAnchorMarkers[0].setLatLng(point1);
      this.#racetrackAnchorMarkers[1].setLatLng(point2);

      // Add the racetrack anchor markers to the map if they are not already present
      if (!getApp().getMap().hasLayer(this.#racetrackAnchorMarkers[0])) {
        this.#racetrackAnchorMarkers[0].addTo(getApp().getMap());
      }

      if (!getApp().getMap().hasLayer(this.#racetrackAnchorMarkers[1])) {
        this.#racetrackAnchorMarkers[1].addTo(getApp().getMap());
      }

      if (!getApp().getMap().hasLayer(this.#racetrackArrow)) {
        this.#racetrackArrow.addTo(getApp().getMap());
      }
      this.#racetrackArrow.setLatLng(pointArrow);
      this.#racetrackArrow.setBearing(this.#racetrackBearing);
    } else {
      this.#clearRacetrack();
    }
  }

  #clearRacetrack() {
    this.#racetrackPolylines.forEach((polyline) => getApp().getMap().removeLayer(polyline));
    this.#racetrackArcs.forEach((arc) => getApp().getMap().removeLayer(arc));
    this.#racetrackAnchorMarkers.forEach((marker) => getApp().getMap().removeLayer(marker));
    this.#racetrackArrow.removeFrom(getApp().getMap());
  }

  #applyRacetrackEdit() {
    const point1 = this.#racetrackAnchorMarkers[0].getLatLng();
    const point2 = this.#racetrackAnchorMarkers[1].getLatLng();
    const racetrackLength = point1.distanceTo(point2);
    const racetrackBearing = deg2rad(bearing(point1.lat, point1.lng, point2.lat, point2.lng, false));
    this.setRacetrack(racetrackLength, this.#racetrackAnchorMarkers[0].getLatLng(), racetrackBearing, () => {
      this.#inhibitRacetrackDraw = false;
    });
  }

  #drawSpots() {
    // Iterate over all spots and draw lines, edit markers, and markers
    Object.values(getApp().getMissionManager().getSpots()).forEach((spot: Spot) => {
      if (spot.getSourceUnitID() === this.ID) {
        const spotBearing = deg2rad(bearing(this.getPosition().lat, this.getPosition().lng, spot.getTargetPosition().lat, spot.getTargetPosition().lng, false));
        const spotDistance = this.getPosition().distanceTo(spot.getTargetPosition());
        const midPosition = bearingAndDistanceToLatLng(this.getPosition().lat, this.getPosition().lng, spotBearing, spotDistance / 2);

        // Draw the spot line
        this.#drawSpotLine(spot, spotBearing);

        // Draw the spot edit marker if the map is zoomed in enough
        if (getApp().getMap().getZoom() >= SPOTS_EDIT_ZOOM_TRANSITION) {
          // Draw the spot edit marker
          this.#drawSpotEditMarker(spot, midPosition, spotBearing);
        }

        // Draw the spot marker
        this.#drawSpotMarker(spot);
      }
    });
  }

  /**
   * Draws or updates the spot line.
   * @param {Spot} spot - The spot object.
   * @param {number} spotBearing - The bearing of the spot.
   */
  #drawSpotLine(spot: Spot, spotBearing: number) {
    if (this.#spotLines[spot.getID()] === undefined) {
      // Create a new polyline for the spot
      this.#spotLines[spot.getID()] = new Polyline([this.getPosition(), spot.getTargetPosition()], {
        color: spot.getType() === "laser" ? colors.BLUE_VIOLET : colors.DARK_RED,
        dashArray: "1, 8",
      });
      this.#spotLines[spot.getID()].addTo(getApp().getMap());
    } else {
      // Update the existing polyline
      if (!getApp().getMap().hasLayer(this.#spotLines[spot.getID()])) this.#spotLines[spot.getID()].addTo(getApp().getMap());
      this.#spotLines[spot.getID()].setLatLngs([this.getPosition(), spot.getTargetPosition()]);
    }

    /* Iterate all existing lines and remove those associated to a spot that no longer exists */
    Object.keys(this.#spotLines).forEach((spotID) => {
      if (getApp().getMissionManager().getSpotByID(Number(spotID)) === undefined) {
        getApp().getMap().removeLayer(this.#spotLines[spotID]);
        delete this.#spotLines[spotID];
      }
    });
  }

  /**
   * Draws or updates the spot edit marker.
   * @param {Spot} spot - The spot object.
   * @param {LatLng} midPosition - The midpoint position between the unit and the spot.
   * @param {number} spotBearing - The bearing of the spot.
   */
  #drawSpotEditMarker(spot: Spot, midPosition: LatLng, spotBearing: number) {
    if (this.#spotEditMarkers[spot.getID()] === undefined) {
      // Create a new spot edit marker
      this.#spotEditMarkers[spot.getID()] = new SpotEditMarker(midPosition, `${spot.getCode() ?? ""}`, 0, spot.getType());
      this.#spotEditMarkers[spot.getID()].addTo(getApp().getMap());
      this.#spotEditMarkers[spot.getID()].setRotationAngle(spotBearing + Math.PI / 2);
      this.#spotEditMarkers[spot.getID()].onDeleteButtonClicked = () => {
        getApp().getServerManager().deleteSpot(spot.getID());
      };
      this.#spotEditMarkers[spot.getID()].onValueUpdated = (value) => {
        getApp().getServerManager().setLaserCode(spot.getID(), value);
      };
    } else {
      // Update the existing spot edit marker
      if (!getApp().getMap().hasLayer(this.#spotEditMarkers[spot.getID()])) this.#spotEditMarkers[spot.getID()].addTo(getApp().getMap());
      this.#spotEditMarkers[spot.getID()].setLatLng(midPosition);
    }
    this.#spotEditMarkers[spot.getID()].setRotationAngle(spotBearing + Math.PI / 2);
    this.#spotEditMarkers[spot.getID()].setTextValue(`${spot.getCode() ?? ""}`);

    /* Iterate all existing edit markers and remove those associated to a spot that no longer exists */
    Object.keys(this.#spotEditMarkers).forEach((spotID) => {
      if (getApp().getMissionManager().getSpotByID(Number(spotID)) === undefined) {
        getApp().getMap().removeLayer(this.#spotEditMarkers[spotID]);
        delete this.#spotEditMarkers[spotID];
      }
    });
  }

  /**
   * Draws or updates the spot marker.
   * @param {Spot} spot - The spot object.
   */
  #drawSpotMarker(spot: Spot) {
    if (this.#spotMarkers[spot.getID()] === undefined) {
      // Create a new spot marker
      this.#spotMarkers[spot.getID()] = new SpotMarker(spot.getTargetPosition());
      this.#spotMarkers[spot.getID()].addTo(getApp().getMap());
      this.#spotMarkers[spot.getID()].on("dragstart", (event) => {
        event.target.options["freeze"] = true;
      });
      this.#spotMarkers[spot.getID()].on("dragend", (event) => {
        getApp().getServerManager().moveSpot(spot.getID(), event.target.getLatLng());
        event.target.options["freeze"] = false;
      });
    } else {
      // Update the existing spot marker
      if (!getApp().getMap().hasLayer(this.#spotMarkers[spot.getID()])) this.#spotMarkers[spot.getID()].addTo(getApp().getMap());
      var frozen = this.#spotMarkers[spot.getID()].options["freeze"];
      if (!frozen) {
        this.#spotMarkers[spot.getID()].setLatLng(spot.getTargetPosition());
      }
    }

    /* Iterate all existing markers and remove those associated to a spot that no longer exists */
    Object.keys(this.#spotMarkers).forEach((spotID) => {
      if (getApp().getMissionManager().getSpotByID(Number(spotID)) === undefined) {
        getApp().getMap().removeLayer(this.#spotMarkers[spotID]);
        delete this.#spotMarkers[spotID];
      }
    });
  }

  #clearSpots() {
    // Clear all spot lines, edit markers, and markers
    this.#clearSpotLines();
    this.#clearSpotEditMarkers();
    this.#clearSpotMarkers();
  }

  /**
   * Clears all spot lines from the map.
   */
  #clearSpotLines() {
    Object.values(this.#spotLines).forEach((spot) => getApp().getMap().removeLayer(spot));
  }

  /**
   * Clears all spot edit markers from the map.
   */
  #clearSpotEditMarkers() {
    Object.values(this.#spotEditMarkers).forEach((spotEditMarker) => getApp().getMap().removeLayer(spotEditMarker));
  }

  /**
   * Clears all spot markers from the map.
   */
  #clearSpotMarkers() {
    Object.values(this.#spotMarkers).forEach((spotMarker) => getApp().getMap().removeLayer(spotMarker));
  }

  #drawContacts() {
    this.#clearContacts();
    if (getApp().getMap().getOptions().showUnitContacts) {
      for (let index in this.#contacts) {
        var contactData = this.#contacts[index];
        var contact: Unit | Weapon | null;

        if (contactData.ID in getApp().getUnitsManager().getUnits()) contact = getApp().getUnitsManager().getUnitByID(contactData.ID);
        else contact = getApp().getWeaponsManager().getWeaponByID(contactData.ID);

        if (contact != null && contact.getAlive()) {
          var startLatLng = new LatLng(this.#position.lat, this.#position.lng);
          var endLatLng: LatLng;
          if (contactData.detectionMethod === RWR) {
            var bearingToContact = bearing(this.#position.lat, this.#position.lng, contact.getPosition().lat, contact.getPosition().lng, false);
            var startXY = getApp().getMap().latLngToContainerPoint(startLatLng);
            var endX = startXY.x + 80 * Math.sin(deg2rad(bearingToContact));
            var endY = startXY.y - 80 * Math.cos(deg2rad(bearingToContact));
            endLatLng = getApp().getMap().containerPointToLatLng(new Point(endX, endY));
          } else endLatLng = new LatLng(contact.getPosition().lat, contact.getPosition().lng);

          var color;
          if (contactData.detectionMethod === VISUAL || contactData.detectionMethod === OPTIC) color = colors.MAGENTA;
          else if (contactData.detectionMethod === RADAR || contactData.detectionMethod === IRST) color = colors.YELLOW;
          else if (contactData.detectionMethod === RWR) color = colors.GREEN_YELLOW;
          else color = colors.LIGHT_GREY;
          var contactPolyline = new Polyline([startLatLng, endLatLng], {
            color: color,
            weight: 3,
            opacity: 1,
            smoothFactor: 1,
            dashArray: "4, 8",
          });
          contactPolyline.addTo(getApp().getMap());
          this.#contactsPolylines.push(contactPolyline);
        }
      }
    }
  }

  #clearContacts() {
    for (let index in this.#contactsPolylines) {
      getApp().getMap().removeLayer(this.#contactsPolylines[index]);
    }
  }

  #drawRanges() {
    var engagementRange = 0;
    var acquisitionRange = 0;

    /* Get the acquisition and engagement ranges of the entire group, not for each unit */
    if (this.getIsLeader()) {
      var engagementRange = this.getBlueprint()?.engagementRange ?? 0;
      var acquisitionRange = this.getBlueprint()?.acquisitionRange ?? 0;

      this.getGroupMembers().forEach((unit: Unit) => {
        if (unit.getAlive()) {
          let unitEngagementRange = unit.getBlueprint()?.engagementRange ?? 0;
          let unitAcquisitionRange = unit.getBlueprint()?.acquisitionRange ?? 0;

          if (unitEngagementRange > engagementRange) engagementRange = unitEngagementRange;

          if (unitAcquisitionRange > acquisitionRange) acquisitionRange = unitAcquisitionRange;
        }
      });

      if (acquisitionRange !== this.#acquisitionCircle.getRadius()) {
        this.#acquisitionCircle.setRadius(acquisitionRange);
      }

      if (engagementRange !== this.#engagementCircle.getRadius()) this.#engagementCircle.setRadius(engagementRange);

      this.#engagementCircle.options.fillOpacity = this.getSelected() && getApp().getMap().getOptions().fillSelectedRing ? 0.3 : 0;

      /* Acquisition circles */
      var shortAcquisitionRangeCheck = acquisitionRange > nmToM(3) || !getApp().getMap().getOptions().hideUnitsShortRangeRings;

      if (
        getApp().getMap().getOptions().showUnitsAcquisitionRings &&
        shortAcquisitionRangeCheck &&
        (this.belongsToCommandedCoalition() || this.getDetectionMethods().some((value) => [VISUAL, OPTIC, IRST, RWR].includes(value)))
      ) {
        if (!getApp().getMap().hasLayer(this.#acquisitionCircle)) {
          this.#acquisitionCircle.addTo(getApp().getMap());
          switch (this.getCoalition()) {
            case "red":
              this.#acquisitionCircle.options.color = adjustBrightness(colors.RED_COALITION, -20);
              break;
            case "blue":
              this.#acquisitionCircle.options.color = adjustBrightness(colors.BLUE_COALITION, -20);
              break;
            default:
              this.#acquisitionCircle.options.color = adjustBrightness(colors.NEUTRAL_COALITION, -20);
              break;
          }
        }
        if (this.getPosition() != this.#acquisitionCircle.getLatLng()) this.#acquisitionCircle.setLatLng(this.getPosition());
      } else {
        if (getApp().getMap().hasLayer(this.#acquisitionCircle)) this.#acquisitionCircle.removeFrom(getApp().getMap());
      }

      /* Engagement circles */
      var shortEngagementRangeCheck = engagementRange > nmToM(3) || !getApp().getMap().getOptions().hideUnitsShortRangeRings;
      if (
        getApp().getMap().getOptions().showUnitsEngagementRings &&
        shortEngagementRangeCheck &&
        (this.belongsToCommandedCoalition() || this.getDetectionMethods().some((value) => [VISUAL, OPTIC, IRST, RWR].includes(value)))
      ) {
        if (!getApp().getMap().hasLayer(this.#engagementCircle)) {
          this.#engagementCircle.addTo(getApp().getMap());
          switch (this.getCoalition()) {
            case "red":
              this.#engagementCircle.options.color = colors.RED_COALITION;
              break;
            case "blue":
              this.#engagementCircle.options.color = colors.BLUE_COALITION;
              break;
            default:
              this.#engagementCircle.options.color = colors.NEUTRAL_COALITION;
              break;
          }
        }
        if (this.getPosition() != this.#engagementCircle.getLatLng()) this.#engagementCircle.setLatLng(this.getPosition());
      } else {
        if (getApp().getMap().hasLayer(this.#engagementCircle)) this.#engagementCircle.removeFrom(getApp().getMap());
      }
    }
  }

  #clearRanges() {
    if (getApp().getMap().hasLayer(this.#acquisitionCircle)) this.#acquisitionCircle.removeFrom(getApp().getMap());

    if (getApp().getMap().hasLayer(this.#engagementCircle)) this.#engagementCircle.removeFrom(getApp().getMap());
  }

  #drawTarget() {
    if (this.#targetPosition.lat != 0 && this.#targetPosition.lng != 0 && getApp().getMap().getOptions().showUnitPaths) {
      this.#drawTargetPosition(this.#targetPosition);
    } else if (this.#targetID != 0 && getApp().getMap().getOptions().showUnitTargets) {
      const target = getApp().getUnitsManager().getUnitByID(this.#targetID);
      if (
        target &&
        (getApp().getMissionManager().getCommandModeOptions().commandMode == GAME_MASTER ||
          (this.belongsToCommandedCoalition() &&
            getApp()
              .getUnitsManager()
              .getUnitDetectedMethods(target)
              .some((value) => [VISUAL, OPTIC, RADAR, IRST, DLINK].includes(value))))
      ) {
        this.#drawTargetPosition(target.getPosition());
      }
    } else this.#clearTargetPosition();
  }

  #drawTargetPosition(targetPosition: LatLng) {
    if (!getApp().getMap().hasLayer(this.#targetPositionMarker)) this.#targetPositionMarker.addTo(getApp().getMap());
    if (!getApp().getMap().hasLayer(this.#targetPositionPolyline)) this.#targetPositionPolyline.addTo(getApp().getMap());
    this.#targetPositionMarker.setLatLng(new LatLng(targetPosition.lat, targetPosition.lng));

    if (this.getState() === "simulate-fire-fight" && this.getShotsScatter() != MAX_SHOTS_SCATTER) {
      let turfUnitPosition = turf.point([this.getPosition().lng, this.getPosition().lat]);
      let turfTargetPosition = turf.point([targetPosition.lng, targetPosition.lat]);

      let bearing = turf.bearing(turfUnitPosition, turfTargetPosition);
      let scatterDistance =
        turf.distance(turfUnitPosition, turfTargetPosition) * Math.tan((MAX_SHOTS_SCATTER - this.getShotsScatter()) * deg2rad(SHOTS_SCATTER_DEGREES));
      let destination1 = turf.destination(turfTargetPosition, scatterDistance, bearing + 90);
      let destination2 = turf.destination(turfTargetPosition, scatterDistance, bearing - 90);

      this.#targetPositionPolyline.setStyle({ dashArray: "4, 8" });
      this.#targetPositionPolyline.setLatLngs([
        new LatLng(destination1.geometry.coordinates[1], destination1.geometry.coordinates[0]),
        new LatLng(this.#position.lat, this.#position.lng),
        new LatLng(destination2.geometry.coordinates[1], destination2.geometry.coordinates[0]),
      ]);
    } else {
      this.#targetPositionPolyline.setStyle({ dashArray: "" });
      this.#targetPositionPolyline.setLatLngs([new LatLng(this.#position.lat, this.#position.lng), new LatLng(targetPosition.lat, targetPosition.lng)]);
    }
  }

  #clearTargetPosition() {
    if (getApp().getMap().hasLayer(this.#targetPositionMarker)) this.#targetPositionMarker.removeFrom(getApp().getMap());

    if (getApp().getMap().hasLayer(this.#targetPositionPolyline)) this.#targetPositionPolyline.removeFrom(getApp().getMap());
  }

  #onZoom(e: any) {
    if (this.checkZoomRedraw()) this.#redrawMarker();
    this.#updateMarker();

    // Clear the spot edit markers if the map is zoomed out too much
    if (getApp().getMap().getZoom() < SPOTS_EDIT_ZOOM_TRANSITION) {
      this.#clearSpotEditMarkers();
    }
  }
}

export abstract class AirUnit extends Unit {
  getIconOptions() {
    var belongsToCommandedCoalition = this.belongsToCommandedCoalition();
    return {
      showState: belongsToCommandedCoalition,
      showVvi: belongsToCommandedCoalition || this.getDetectionMethods().some((value) => [VISUAL, OPTIC, RADAR, IRST, DLINK].includes(value)),
      showHealth: false,
      showHotgroup: belongsToCommandedCoalition,
      showUnitIcon: belongsToCommandedCoalition || this.getDetectionMethods().some((value) => [VISUAL, OPTIC, RADAR, IRST, DLINK].includes(value)),
      showShortLabel: belongsToCommandedCoalition || this.getDetectionMethods().some((value) => [VISUAL, OPTIC].includes(value)),
      showFuel: belongsToCommandedCoalition,
      showAmmo: belongsToCommandedCoalition,
      showSummary: belongsToCommandedCoalition || this.getDetectionMethods().some((value) => [VISUAL, OPTIC, RADAR, IRST, DLINK].includes(value)),
      showCallsign: belongsToCommandedCoalition && /*TODO !getApp().getMap().getOptions().AWACSMode || */ this.getHuman(),
      rotateToHeading: false,
    } as ObjectIconOptions;
  }

  appendContextActions(contextActionSet: ContextActionSet) {
    super.appendContextActions(contextActionSet);

    /* Context actions to be executed immediately */
    contextActionSet.addContextAction(this, ContextActions.REFUEL);

    /* Context actions that require a target unit */
    contextActionSet.addContextAction(this, ContextActions.FOLLOW);
    contextActionSet.addContextAction(this, ContextActions.SET_AWACS_REFERENCE);

    if (this.canTargetPoint()) {
      /* Context actions that require a target position */
      contextActionSet.addContextAction(this, ContextActions.BOMB);
      contextActionSet.addContextAction(this, ContextActions.CARPET_BOMB);
    }

    contextActionSet.addContextAction(this, ContextActions.LAND);
  }
}

export class Aircraft extends AirUnit {
  constructor(ID: number) {
    super(ID);
  }

  getCategory() {
    return "Aircraft";
  }

  appendContextActions(contextActionSet: ContextActionSet) {
    super.appendContextActions(contextActionSet);
  }

  getMarkerCategory() {
    return "aircraft";
  }

  getDefaultMarker() {
    return "aircraft";
  }
}

export class Helicopter extends AirUnit {
  constructor(ID: number) {
    super(ID);
  }

  getCategory() {
    return "Helicopter";
  }

  appendContextActions(contextActionSet: ContextActionSet) {
    super.appendContextActions(contextActionSet);
    contextActionSet.addContextAction(this, ContextActions.LAND_AT_POINT);
  }

  getMarkerCategory() {
    return "helicopter";
  }

  getDefaultMarker() {
    return "helicopter";
  }
}

export class GroundUnit extends Unit {
  constructor(ID: number) {
    super(ID);
  }

  getIconOptions() {
    var belongsToCommandedCoalition = this.belongsToCommandedCoalition();
    return {
      showState: belongsToCommandedCoalition,
      showVvi: false,
      showHealth: true,
      showHotgroup: belongsToCommandedCoalition,
      showUnitIcon: belongsToCommandedCoalition || this.getDetectionMethods().some((value) => [VISUAL, OPTIC, RADAR, IRST, DLINK].includes(value)),
      showShortLabel: this.getBlueprint()?.type === "SAM Site",
      showFuel: false,
      showAmmo: false,
      showSummary: false,
      showCallsign: belongsToCommandedCoalition && /*TODO !getApp().getMap().getOptions().AWACSMode || */ this.getHuman(),
      rotateToHeading: false,
    } as ObjectIconOptions;
  }

  appendContextActions(contextActionSet: ContextActionSet) {
    super.appendContextActions(contextActionSet);

    /* Context actions to be executed immediately */
    contextActionSet.addContextAction(this, ContextActions.GROUP);

    /* Context actions that require a target position */
    if (this.canTargetPoint()) {
      contextActionSet.addContextAction(this, ContextActions.FIRE_AT_AREA);
      contextActionSet.addContextAction(this, ContextActions.SIMULATE_FIRE_FIGHT);
    }
  }

  getCategory() {
    return "GroundUnit";
  }

  getType() {
    return this.getBlueprint()?.type ?? "";
  }

  /* When we zoom past the grouping limit, grouping is enabled and the unit is a leader, we redraw the unit to apply any possible grouped marker */
  checkZoomRedraw(): boolean {
    return (
      this.getIsLeader() &&
      (getApp().getMap().getOptions().hideGroupMembers as boolean) &&
      ((getApp().getMap().getZoom() >= GROUPING_ZOOM_TRANSITION && getApp().getMap().getPreviousZoom() < GROUPING_ZOOM_TRANSITION) ||
        (getApp().getMap().getZoom() < GROUPING_ZOOM_TRANSITION && getApp().getMap().getPreviousZoom() >= GROUPING_ZOOM_TRANSITION))
    );
  }

  getMarkerCategory() {
    if (/\bAAA|SAM\b/.test(this.getType()) || /\bmanpad|stinger\b/i.test(this.getType())) return "groundunit-sam";
    else return "groundunit";
  }

  getDefaultMarker() {
    return "groundunit";
  }
}

export class NavyUnit extends Unit {
  #carrier: Carrier;

  constructor(ID: number) {
    super(ID);
  }

  getIconOptions() {
    var belongsToCommandedCoalition = this.belongsToCommandedCoalition();
    return {
      showState: belongsToCommandedCoalition,
      showVvi: false,
      showHealth: true,
      showHotgroup: true,
      showUnitIcon: belongsToCommandedCoalition || this.getDetectionMethods().some((value) => [VISUAL, OPTIC, RADAR, IRST, DLINK].includes(value)),
      showShortLabel: false,
      showFuel: false,
      showAmmo: false,
      showSummary: false,
      showCallsign: belongsToCommandedCoalition && /*TODO !getApp().getMap().getOptions().AWACSMode || */ this.getHuman(),
      rotateToHeading: false,
    } as ObjectIconOptions;
  }

  appendContextActions(contextActionSet: ContextActionSet) {
    super.appendContextActions(contextActionSet);

    /* Context actions to be executed immediately */
    contextActionSet.addContextAction(this, ContextActions.GROUP);

    /* Context actions that require a target position */
    contextActionSet.addContextAction(this, ContextActions.FIRE_AT_AREA);
  }

  getCategory() {
    return "NavyUnit";
  }

  getType() {
    return this.getBlueprint()?.type ?? "";
  }

  getMarkerCategory() {
    return "navyunit";
  }

  getDefaultMarker() {
    return "navyunit";
  }

  setData(dataExtractor: DataExtractor) {
    super.setData(dataExtractor);

    if (this.#carrier) {
      this.#carrier.setLatLng(this.getPosition());
      this.#carrier.setHeading(this.getHeading());
      this.#carrier.updateSize();
    }
  }

  onAdd(map: Map): this {
    super.onAdd(map);
    if (this.getBlueprint()?.type === "Aircraft Carrier")
      this.#carrier = new Carrier(this, {
        position: this.getPosition(),
        name: this.getUnitName(),
      }).addTo(getApp().getMap());
    return this;
  }

  onRemove(map: Map): this {
    super.onRemove(map);
    if (this.#carrier) this.#carrier.removeFrom(getApp().getMap());
    return this;
  }
}
