import { LatLng, LatLngBounds } from "leaflet";
import { Coalition, MapOptions } from "../types/types";
import { CommandModeOptions } from "../interfaces";
import { ContextAction } from "../unit/contextaction";
import {
  faExplosion,
  faHand,
  faLocationCrosshairs,
  faLocationDot,
  faMapLocation,
  faPeopleGroup,
  faPlaneArrival,
  faRoute,
  faTrash,
  faWifi,
  faXmarksLines,
} from "@fortawesome/free-solid-svg-icons";
import { Unit } from "../unit/unit";
import { getApp } from "../olympusapp";
import {
  olButtonsContextAttack,
  olButtonsContextFollow,
  olButtonsContextLandAtPoint,
  olButtonsContextRefuel,
  olButtonsContextSimulateFireFight,
} from "../ui/components/olicons";
import { FormationCreationRequestEvent, UnitExplosionRequestEvent } from "../events";

export const SELECT_TOLERANCE_PX = 5;
export const SHORT_PRESS_MILLISECONDS = 200;
export const DEBOUNCE_MILLISECONDS = 200;

export const TRAIL_LENGTH = 10;

export const UNITS_URI = "units";
export const WEAPONS_URI = "weapons";
export const LOGS_URI = "logs";
export const AIRBASES_URI = "airbases";
export const BULLSEYE_URI = "bullseyes";
export const MISSION_URI = "mission";
export const COMMANDS_URI = "commands";

export const NONE = "None";
export const GAME_MASTER = "Game master";
export const BLUE_COMMANDER = "Blue commander";
export const RED_COMMANDER = "Red commander";

export const VISUAL = 1;
export const OPTIC = 2;
export const RADAR = 4;
export const IRST = 8;
export const RWR = 16;
export const DLINK = 32;

export const states: string[] = [
  "none",
  "idle",
  "reach-destination",
  "attack",
  "follow",
  "land",
  "refuel",
  "AWACS",
  "tanker",
  "bomb-point",
  "carpet-bomb",
  "bomb-building",
  "fire-at-area",
  "simulate-fire-fight",
  "scenic-aaa",
  "miss-on-purpose",
  "land-at-point",
];
export const ROEs: string[] = ["free", "designated", "", "return", "hold"];
export const reactionsToThreat: string[] = ["none", "manoeuvre", "passive", "evade"];
export const emissionsCountermeasures: string[] = ["silent", "attack", "defend", "free"];

export enum ERAS_ORDER {
  "WW2",
  "Early Cold War",
  "Mid Cold War",
  "Late Cold War",
  "Modern",
}

export const ROEDescriptions: string[] = [
  "Free (Attack anyone)",
  "Designated (Attack the designated target only) \nWARNING: Ground and Navy units don't respect this ROE, it will be equivalent to weapons FREE.",
  "",
  "Return (Only fire if fired upon) \nWARNING: Ground and Navy units don't respect this ROE, it will be equivalent to weapons FREE.",
  "Hold (Never fire)",
];

export const reactionsToThreatDescriptions: string[] = [
  "None (No reaction)",
  "Manoeuvre (no countermeasures)",
  "Passive (Countermeasures only, no manoeuvre)",
  "Evade (Countermeasures and manoeuvers)",
];

export const emissionsCountermeasuresDescriptions: string[] = [
  "Silent (Radar OFF, no ECM)",
  "Attack (Radar only for targeting, ECM only if locked)",
  "Defend (Radar for searching, ECM if locked)",
  "Always on (Radar and ECM always on)",
];

export const shotsScatterDescriptions: string[] = [
  "When performing scenic shooting tasks like simulated firefights, will shoot with a large scatter",
  "When performing scenic shooting tasks like simulated firefights, will shoot with a medium scatter",
  "When performing scenic shooting tasks like simulated firefights, will shoot with a small scatter (Radar guided units will track shots when the enemy unit is close)",
];

export const shotsIntensityDescriptions: string[] = [
  "When performing scenic shooting tasks like simulated firefights, will shoot with a low rate of fire",
  "When performing scenic shooting tasks like simulated firefights, will shoot with a medium rate of fire",
  "When performing scenic shooting tasks like simulated firefights, will shoot with a high rate of fire",
];

export const minSpeedValues: { [key: string]: number } = {
  aircraft: 100,
  helicopter: 0,
  navyunit: 0,
  groundunit: 0,
};
export const maxSpeedValues: { [key: string]: number } = {
  aircraft: 800,
  helicopter: 300,
  navyunit: 60,
  groundunit: 60,
};
export const speedIncrements: { [key: string]: number } = {
  aircraft: 25,
  helicopter: 10,
  navyunit: 5,
  groundunit: 5,
};
export const minAltitudeValues: { [key: string]: number } = {
  aircraft: 0,
  helicopter: 0,
};
export const maxAltitudeValues: { [key: string]: number } = {
  aircraft: 50000,
  helicopter: 10000,
};
export const altitudeIncrements: { [key: string]: number } = {
  aircraft: 500,
  helicopter: 100,
};
export const groupUnitCount: { [key: string]: number } = {
  aircraft: 4,
  helicopter: 4,
  navyunit: 20,
  groundunit: 20,
};

export const minimapBoundaries = {
  Nevada: [
    // NTTR
    new LatLng(39.7982463, -119.985425),
    new LatLng(34.4037128, -119.7806729),
    new LatLng(34.3483316, -112.4529351),
    new LatLng(39.7372411, -112.1130805),
    new LatLng(39.7982463, -119.985425),
  ],
  Syria: [
    // Syria
    new LatLng(37.3630556, 29.2686111),
    new LatLng(31.8472222, 29.8975),
    new LatLng(32.1358333, 42.1502778),
    new LatLng(37.7177778, 42.3716667),
    new LatLng(37.3630556, 29.2686111),
  ],
  Caucasus: [
    // Caucasus
    new LatLng(39.6170191, 27.634935),
    new LatLng(38.8735863, 47.1423108),
    new LatLng(47.3907982, 49.3101946),
    new LatLng(48.3955879, 26.7753625),
    new LatLng(39.6170191, 27.634935),
  ],
  PersianGulf: [
    // Persian Gulf
    new LatLng(32.9355285, 46.5623682),
    new LatLng(21.729393, 47.572675),
    new LatLng(21.8501348, 63.9734737),
    new LatLng(33.131584, 64.7313594),
    new LatLng(32.9355285, 46.5623682),
  ],
  MarianaIslands: [
    // Marianas
    new LatLng(22.09, 135.0572222),
    new LatLng(10.5777778, 135.7477778),
    new LatLng(10.7725, 149.3918333),
    new LatLng(22.5127778, 149.5427778),
    new LatLng(22.09, 135.0572222),
  ],
  Falklands: [
    // South Atlantic
    new LatLng(-49.097217, -79.418267),
    new LatLng(-56.874517, -79.418267),
    new LatLng(-56.874517, -43.316433),
    new LatLng(-49.097217, -43.316433),
    new LatLng(-49.097217, -79.418267),
  ],
  Normandy: [
    // Normandy
    new LatLng(50.44, -3.29),
    new LatLng(48.12, -3.29),
    new LatLng(48.12, 3.7),
    new LatLng(50.44, 3.7),
    new LatLng(50.44, -3.29),
  ],
  SinaiMap: [
    // Sinai
    new LatLng(34.312222, 28.523333),
    new LatLng(25.946944, 28.523333),
    new LatLng(25.946944, 36.897778),
    new LatLng(34.312222, 36.897778),
    new LatLng(34.312222, 28.523333),
  ],
  Afghanistan: [
    // Sinai
    new LatLng(36.22, 61.21),
    new LatLng(30.42, 61.21),
    new LatLng(30.42, 68.05),
    new LatLng(36.22, 68.05),
    new LatLng(36.22, 61.21),
  ],
};

export const mapBounds = {
  Syria: {
    bounds: new LatLngBounds([31.8472222, 29.8975], [37.7177778, 42.3716667]),
    zoom: 5,
  },
  MarianaIslands: {
    bounds: new LatLngBounds([10.5777778, 135.7477778], [22.5127778, 149.5427778]),
    zoom: 5,
  },
  Nevada: {
    bounds: new LatLngBounds([34.4037128, -119.7806729], [39.7372411, -112.1130805]),
    zoom: 5,
  },
  PersianGulf: {
    bounds: new LatLngBounds([21.729393, 47.572675], [33.131584, 64.7313594]),
    zoom: 4,
  },
  Caucasus: {
    bounds: new LatLngBounds([39.6170191, 27.634935], [47.3907982, 49.3101946]),
    zoom: 4,
  },
  Falklands: {
    bounds: new LatLngBounds([-49.097217, -79.418267], [-56.874517, -43.316433]),
    zoom: 3,
  },
  Normandy: { bounds: new LatLngBounds([50.44, -3.29], [48.12, 3.7]), zoom: 5 },
  SinaiMap: {
    bounds: new LatLngBounds([34.312222, 28.523333], [25.946944, 36.897778]),
    zoom: 4,
  },
  Afghanistan: { bounds: new LatLngBounds([36.22, 61.21], [30.42, 68.05]), zoom: 5 },
};

export const defaultMapMirrors = {};
export const defaultMapLayers = {
  "AWACS": {
				"urlTemplate": 'https://abcd.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
				"minZoom": 1,
				"maxZoom": 19,
				"attribution": `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'`
			},
};

export enum OlympusState {
  NOT_INITIALIZED = "Not initialized",
  LOGIN = "Login",
  IDLE = "Idle",
  MAIN_MENU = "Main menu",
  UNIT_CONTROL = "Unit control",
  SPAWN = "Spawn",
  SPAWN_CONTEXT = "Spawn context",
  DRAW = "Draw",
  JTAC = "JTAC",
  AWACS = "AWACS",
  OPTIONS = "Options",
  AUDIO = "Audio",
  AIRBASE = "Airbase",
  GAME_MASTER = "Game master"
}

export const NO_SUBSTATE = "No substate";

export enum UnitControlSubState {
  NO_SUBSTATE = "No substate",
  FORMATION = "Formation",
  PROTECTION = "Protection",
  MAP_CONTEXT_MENU = "Map context menu",
  UNIT_CONTEXT_MENU = "Unit context menu",
  UNIT_EXPLOSION_MENU = "Unit explosion menu",
}

export enum DrawSubState {
  NO_SUBSTATE = "No substate",
  DRAW_POLYGON = "Polygon",
  DRAW_CIRCLE = "Circle",
  EDIT = "Edit",
}

export enum JTACSubState {
  NO_SUBSTATE = "No substate",
  SELECT_ECHO_POINT = "ECHO",
  SELECT_IP = "IP",
  SELECT_TARGET = "Target",
}

export enum SpawnSubState {
  NO_SUBSTATE = "No substate",
  SPAWN_UNIT = "Unit",
  SPAWN_EFFECT = "Effect",
}

export enum OptionsSubstate {
  NO_SUBSTATE = "No substate",
  KEYBIND = "Keybind",
}

export type OlympusSubState = DrawSubState | JTACSubState | SpawnSubState | OptionsSubstate | string;

export const IADSTypes = ["AAA", "SAM Site", "Radar (EWR)"];
export const IADSDensities: { [key: string]: number } = {
  AAA: 0.8,
  "SAM Site": 0.1,
  "Radar (EWR)": 0.05,
};

export const MAP_OPTIONS_DEFAULTS: MapOptions = {
  hideGroupMembers: true,
  hideUnitsShortRangeRings: true,
  showUnitContacts: true,
  showUnitPaths: true,
  showUnitTargets: false,
  showUnitLabels: true,
  showUnitsEngagementRings: true,
  showUnitsAcquisitionRings: true,
  fillSelectedRing: false,
  showMinimap: false,
  protectDCSUnits: true,
  cameraPluginPort: 3003,
  cameraPluginRatio: 1,
  cameraPluginEnabled: false,
  cameraPluginMode: "map",
  tabletMode: false,
  AWACSMode: false,
  AWACSCoalition: "blue"
};

export const MAP_HIDDEN_TYPES_DEFAULTS = {
  human: false,
  olympus: false,
  dcs: false,
  aircraft: false,
  helicopter: false,
  "groundunit-sam": false,
  groundunit: false,
  navyunit: false,
  airbase: false,
  dead: false,
  blue: false,
  red: false,
  neutral: false,
};

export const COMMAND_MODE_OPTIONS_DEFAULTS: CommandModeOptions = {
  commandMode: GAME_MASTER,
  eras: [] as string[],
  restrictSpawns: false,
  restrictToCoalition: false,
  setupTime: 0,
  spawnPoints: { blue: 0, red: 0 },
};

export enum DataIndexes {
  startOfData = 0,
  category,
  alive,
  human,
  controlled,
  coalition,
  country,
  name,
  unitName,
  groupName,
  state,
  task,
  hasTask,
  position,
  speed,
  horizontalVelocity,
  verticalVelocity,
  heading,
  track,
  isActiveTanker,
  isActiveAWACS,
  onOff,
  followRoads,
  fuel,
  desiredSpeed,
  desiredSpeedType,
  desiredAltitude,
  desiredAltitudeType,
  leaderID,
  formationOffset,
  targetID,
  targetPosition,
  ROE,
  reactionToThreat,
  emissionsCountermeasures,
  TACAN,
  radio,
  generalSettings,
  ammo,
  contacts,
  activePath,
  isLeader,
  operateAs,
  shotsScatter,
  shotsIntensity,
  health,
  endOfData = 255,
}

export const DELETE_CYCLE_TIME = 0.05;
export const DELETE_SLOW_THRESHOLD = 50;

export const GROUPING_ZOOM_TRANSITION = 13;

export const MAX_SHOTS_SCATTER = 3;
export const MAX_SHOTS_INTENSITY = 3;
export const SHOTS_SCATTER_DEGREES = 10;

export enum AudioMessageType {
  audio,
  settings,
}

export enum ContextActionTarget {
  NONE,
  UNIT,
  POINT,
}

export enum ContextActionType {
  NO_COLOR,
  MOVE,
  OTHER,
  ADMIN,
  ENGAGE,
  DELETE,
}

export const CONTEXT_ACTION_COLORS = [null, "white", "green", "purple", "blue", "red"];

export namespace ContextActions {
  export const STOP = new ContextAction(
    "stop",
    "Stop unit",
    "Stops the unit",
    faHand,
    ContextActionTarget.NONE,
    (units: Unit[], _1, _2) => {
      getApp().getUnitsManager().stop(units);
    },
    {
      type: ContextActionType.MOVE,
      code: "Space",
    }
  );

  export const MOVE = new ContextAction(
    "move",
    "Set destination",
    "Click on the map to move the units there",
    faLocationDot,
    ContextActionTarget.POINT,
    (units: Unit[], _, targetPosition, originalEvent) => {
      if (!originalEvent?.ctrlKey) getApp().getUnitsManager().clearDestinations(units);
      if (targetPosition)
        getApp()
          .getUnitsManager()
          .addDestination(targetPosition, getApp().getMap().getKeepRelativePositions(), getApp().getMap().getDestinationRotation(), units);
    },
    { type: ContextActionType.MOVE, code: null }
  );

  export const PATH = new ContextAction(
    "path",
    "Create route",
    "Click on the map to add a destination to the path",
    faRoute,
    ContextActionTarget.POINT,
    (units: Unit[], _, targetPosition) => {
      if (targetPosition)
        getApp()
          .getUnitsManager()
          .addDestination(targetPosition, getApp().getMap().getKeepRelativePositions(), getApp().getMap().getDestinationRotation(), units);
    },
    { type: ContextActionType.MOVE, code: "ControlLeft", shiftKey: false }
  );

  export const DELETE = new ContextAction(
    "delete",
    "Delete unit",
    "Deletes the unit",
    faTrash,
    ContextActionTarget.NONE,
    (units: Unit[], _1, _2) => {
      getApp().getUnitsManager().delete(false);
    },
    {
      type: ContextActionType.DELETE,
      code: "Delete",
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
    }
  );

  export const EXPLODE = new ContextAction(
    "explode",
    "Explode unit",
    "Explodes the unit",
    faExplosion,
    ContextActionTarget.NONE,
    (units: Unit[], _1, _2) => {
      getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.UNIT_EXPLOSION_MENU);
      UnitExplosionRequestEvent.dispatch(units);
    },
    {
      type: ContextActionType.DELETE,
      code: "Delete",
      ctrlKey: false,
      shiftKey: true,
      altKey: false,
    }
  );

  export const CENTER_MAP = new ContextAction(
    "center-map",
    "Center map",
    "Center the map on the unit and follow it",
    faMapLocation,
    ContextActionTarget.NONE,
    (units: Unit[]) => {
      getApp().getMap().centerOnUnit(units[0]);
    },
    { type: ContextActionType.OTHER, code: "KeyM", ctrlKey: false, shiftKey: false, altKey: false }
  );

  export const REFUEL = new ContextAction(
    "refuel",
    "Refuel at tanker",
    "Refuel units at the nearest AAR Tanker. If no tanker is available the unit will RTB",
    olButtonsContextRefuel,
    ContextActionTarget.NONE,
    (units: Unit[]) => {
      getApp().getUnitsManager().refuel(units);
    },
    { type: ContextActionType.ADMIN, code: "KeyR", ctrlKey: false, shiftKey: false, altKey: false }
  );

  export const FOLLOW = new ContextAction(
    "follow",
    "Follow unit",
    "Right-click on a unit to follow it in formation",
    olButtonsContextFollow,
    ContextActionTarget.UNIT,
    (units: Unit[], targetUnit: Unit | null, _) => {
      if (targetUnit) {
        getApp().setState(OlympusState.UNIT_CONTROL, UnitControlSubState.FORMATION);
        FormationCreationRequestEvent.dispatch(
          targetUnit,
          units.filter((unit) => unit !== targetUnit)
        );
      }
    },
    { type: ContextActionType.ADMIN, code: "KeyF", ctrlKey: false, shiftKey: false, altKey: false }
  );

  export const BOMB = new ContextAction(
    "bomb",
    "Precision bomb location",
    "Right-click on a point to execute a precision bombing attack",
    faLocationCrosshairs,
    ContextActionTarget.POINT,
    (units: Unit[], _, targetPosition: LatLng | null) => {
      if (targetPosition)
        getApp()
          .getUnitsManager()
          .bombPoint(targetPosition, getApp().getMap().getKeepRelativePositions(), getApp().getMap().getDestinationRotation(), units);
    },
    { type: ContextActionType.ENGAGE, code: "KeyB", ctrlKey: false, shiftKey: false }
  );

  export const CARPET_BOMB = new ContextAction(
    "carpet-bomb",
    "Carpet bomb location",
    "Right-click on a point to execute a carpet bombing attack",
    faXmarksLines,
    ContextActionTarget.POINT,
    (units: Unit[], _, targetPosition: LatLng | null) => {
      if (targetPosition)
        getApp()
          .getUnitsManager()
          .carpetBomb(targetPosition, getApp().getMap().getKeepRelativePositions(), getApp().getMap().getDestinationRotation(), units);
    },
    { type: ContextActionType.ENGAGE, code: "KeyC", ctrlKey: false, shiftKey: false }
  );

  export const LAND = new ContextAction(
    "land",
    "Land",
    "Right-click on a point to land at the nearest airbase",
    faPlaneArrival,
    ContextActionTarget.POINT,
    (units: Unit[], _, targetPosition: LatLng | null) => {
      if (targetPosition) getApp().getUnitsManager().landAt(targetPosition, units);
    },
    { type: ContextActionType.ADMIN, code: "KeyL", ctrlKey: false, shiftKey: false }
  );

  export const LAND_AT_POINT = new ContextAction(
    "land-at-point",
    "Land at location",
    "Right-click on a point to land there",
    olButtonsContextLandAtPoint,
    ContextActionTarget.POINT,
    (units: Unit[], _, targetPosition: LatLng | null) => {
      if (targetPosition)
        getApp()
          .getUnitsManager()
          .landAtPoint(targetPosition, getApp().getMap().getKeepRelativePositions(), getApp().getMap().getDestinationRotation(), units);
    },
    { type: ContextActionType.ADMIN, code: "KeyK", ctrlKey: false, shiftKey: false }
  );

  export const GROUP = new ContextAction(
    "group-ground",
    "Group ground units",
    "Create a group of ground units",
    faPeopleGroup,
    ContextActionTarget.NONE,
    (units: Unit[], _1, _2) => {
      getApp().getUnitsManager().createGroup(units);
    },
    {  type: ContextActionType.OTHER, code: "KeyG", ctrlKey: false, shiftKey: false, altKey: false }
  );

  export const ATTACK = new ContextAction(
    "attack",
    "Attack unit",
    "Right-click on a unit to attack it",
    olButtonsContextAttack,
    ContextActionTarget.UNIT,
    (units: Unit[], targetUnit: Unit | null, _) => {
      if (targetUnit) getApp().getUnitsManager().attackUnit(targetUnit.ID, units);
    },
    { type: ContextActionType.ENGAGE, code: "KeyZ", ctrlKey: false, shiftKey: false, altKey: false }
  );

  export const FIRE_AT_AREA = new ContextAction(
    "fire-at-area",
    "Fire at area",
    "Right-click on a point to precisely fire at it (if possible)",
    faLocationCrosshairs,
    ContextActionTarget.POINT,
    (units: Unit[], _, targetPosition: LatLng | null) => {
      if (targetPosition)
        getApp()
          .getUnitsManager()
          .fireAtArea(targetPosition, getApp().getMap().getKeepRelativePositions(), getApp().getMap().getDestinationRotation(), units);
    },
    { type: ContextActionType.ENGAGE, code: "KeyV", ctrlKey: false, shiftKey: false }
  );

  export const SIMULATE_FIRE_FIGHT = new ContextAction(
    "simulate-fire-fight",
    "Simulate fire fight",
    "Simulate a fire fight by shooting randomly in a certain large area. WARNING: works correctly only on neutral units, blue or red units will aim",
    olButtonsContextSimulateFireFight,
    ContextActionTarget.POINT,
    (units: Unit[], _, targetPosition: LatLng | null) => {
      if (targetPosition)
        getApp()
          .getUnitsManager()
          .simulateFireFight(targetPosition, getApp().getMap().getKeepRelativePositions(), getApp().getMap().getDestinationRotation(), units);
    },
    { type: ContextActionType.ADMIN, code: "KeyX", ctrlKey: false, shiftKey: false }
  );

  export const SET_AWACS_REFERENCE = new ContextAction(
    "set-awacs-reference",
    "Set AWACS reference",
    "Set unit as AWACS reference",
    faWifi,
    ContextActionTarget.NONE,
    (units: Unit[], _1, _2) => {
      getApp().getUnitsManager().setAWACSReference(units[0].ID);
    },
    {  type: ContextActionType.ADMIN, code: "KeyU", ctrlKey: false, shiftKey: false, altKey: false }
  );
}
