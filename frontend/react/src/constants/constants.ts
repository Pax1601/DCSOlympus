import { LatLng, LatLngBounds } from "leaflet";
import { Coalition, MapOptions } from "../types/types";
import { CommandModeOptions } from "../interfaces";
import { ContextAction } from "../unit/contextaction";
import {
  faClone,
  faExplosion,
  faHand,
  faLightbulb,
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
export const SPOTS_URI = "spots";
export const MISSION_URI = "mission";
export const COMMANDS_URI = "commands";
export const DRAWINGS_URI = "drawings";

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

export enum UnitState {
  NONE = "none",
  IDLE = "idle",
  REACH_DESTINATION = "reach-destination",
  ATTACK = "attack",
  FOLLOW = "follow",
  LAND = "land",
  REFUEL = "refuel",
  AWACS = "AWACS",
  TANKER = "tanker",
  BOMB_POINT = "bomb-point",
  CARPET_BOMB = "carpet-bomb",
  BOMB_BUILDING = "bomb-building",
  FIRE_AT_AREA = "fire-at-area",
  SIMULATE_FIRE_FIGHT = "simulate-fire-fight",
  SCENIC_AAA = "scenic-aaa",
  MISS_ON_PURPOSE = "miss-on-purpose",
  LAND_AT_POINT = "land-at-point",
}

export const states: string[] = [
  UnitState.NONE,
  UnitState.IDLE,
  UnitState.REACH_DESTINATION,
  UnitState.ATTACK,
  UnitState.FOLLOW,
  UnitState.LAND,
  UnitState.REFUEL,
  UnitState.AWACS,
  UnitState.TANKER,
  UnitState.BOMB_POINT,
  UnitState.CARPET_BOMB,
  UnitState.BOMB_BUILDING,
  UnitState.FIRE_AT_AREA,
  UnitState.SIMULATE_FIRE_FIGHT,
  UnitState.SCENIC_AAA,
  UnitState.MISS_ON_PURPOSE,
  UnitState.LAND_AT_POINT,
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
  AWACS: {
    urlTemplate: "https://abcd.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
    minZoom: 1,
    maxZoom: 19,
    attribution: `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'`,
  },
};

export const formationTypes = {
  "echelon-lh": "Echelon left",
  "echelon-rh": "Echelon right",
  "line-abreast-rh": "Line abreast right",
  "line-abreast-lh": "Line abreast left",
  trail: "Trail",
  front: "Front",
  diamond: "Diamond",
  custom: "Custom",
};

export enum OlympusState {
  NOT_INITIALIZED = "Not initialized",
  SERVER = "Server",
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
  GAME_MASTER = "Game master",
  IMPORT_EXPORT = "Import/export",
  WARNING = "Warning modal",
  DATABASE_EDITOR = "Database editor",
  MEASURE = "Measure",
  TRAINING = "Training",
  ADMIN = "Admin",
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

export enum LoginSubState {
  NO_SUBSTATE = "No substate",
  CREDENTIALS = "Credentials",
  COMMAND_MODE = "Command mode",
  CONNECT = "Connect",
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

export enum ImportExportSubstate {
  NO_SUBSTATE = "No substate",
  IMPORT = "IMPORT",
  EXPORT = "EXPORT",
}

export enum WarningSubstate {
  NO_SUBSTATE = "No substate",
  NOT_CHROME = "Not chrome",
  NOT_SECURE = "Not secure",
  ERROR_UPLOADING_CONFIG = "Error uploading config",
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
  showUnitTargets: true,
  showUnitLabels: true,
  showUnitsEngagementRings: true,
  showUnitsAcquisitionRings: true,
  showRacetracks: true,
  fillSelectedRing: false,
  showMinimap: false,
  protectDCSUnits: true,
  cameraPluginPort: 3003,
  cameraPluginRatio: 1,
  cameraPluginEnabled: false,
  cameraPluginMode: "map",
  AWACSMode: false,
  AWACSCoalition: "blue",
  hideChromeWarning: false,
  hideSecureWarning: false,
  showMissionDrawings: false,
  clusterGroundUnits: true,
  showUnitCallsigns: true,
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
  alarmState,
  radarState,
  human,
  controlled,
  coalition,
  country,
  name,
  unitName,
  callsign,
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
  racetrackLength,
  racetrackAnchor,
  racetrackBearing,
  timeToNextTasking,
  barrelHeight,
  muzzleVelocity,
  aimTime,
  shotsToFire,
  shotsBaseInterval,
  shotsBaseScatter,
  engagementRange,
  targetingRange,
  aimMethodRange,
  acquisitionRange,
  endOfData = 255,
}

export const DELETE_CYCLE_TIME = 0.05;
export const DELETE_SLOW_THRESHOLD = 50;

export const GROUPING_ZOOM_TRANSITION = 13;
export const CLUSTERING_ZOOM_TRANSITION = 13;
export const SPOTS_EDIT_ZOOM_TRANSITION = 13;

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

export enum colors {
  ALICE_BLUE = "#F0F8FF",
  ANTIQUE_WHITE = "#FAEBD7",
  AQUA = "#00FFFF",
  AQUAMARINE = "#7FFFD4",
  AZURE = "#F0FFFF",
  BEIGE = "#F5F5DC",
  BISQUE = "#FFE4C4",
  BLACK = "#000000",
  BLANCHED_ALMOND = "#FFEBCD",
  BLUE = "#0000FF",
  BLUE_VIOLET = "#8A2BE2",
  BROWN = "#A52A2A",
  BURLY_WOOD = "#DEB887",
  CADET_BLUE = "#5F9EA0",
  CHARTREUSE = "#7FFF00",
  CHOCOLATE = "#D2691E",
  CORAL = "#FF7F50",
  CORNFLOWER_BLUE = "#6495ED",
  CORNSILK = "#FFF8DC",
  CRIMSON = "#DC143C",
  CYAN = "#00FFFF",
  DARK_BLUE = "#00008B",
  DARK_CYAN = "#008B8B",
  DARK_GOLDEN_ROD = "#B8860B",
  DARK_GRAY = "#A9A9A9",
  DARK_GREEN = "#006400",
  DARK_KHAKI = "#BDB76B",
  DARK_MAGENTA = "#8B008B",
  DARK_OLIVE_GREEN = "#556B2F",
  DARKORANGE = "#FF8C00",
  DARK_ORCHID = "#9932CC",
  DARK_RED = "#8B0000",
  DARK_SALMON = "#E9967A",
  DARK_SEA_GREEN = "#8FBC8F",
  DARK_SLATE_BLUE = "#483D8B",
  DARK_SLATE_GRAY = "#2F4F4F",
  DARK_TURQUOISE = "#00CED1",
  DARK_VIOLET = "#9400D3",
  DEEP_PINK = "#FF1493",
  DEEP_SKY_BLUE = "#00BFFF",
  DIM_GRAY = "#696969",
  DODGER_BLUE = "#1E90FF",
  FIRE_BRICK = "#B22222",
  FLORAL_WHITE = "#FFFAF0",
  FOREST_GREEN = "#228B22",
  FUCHSIA = "#FF00FF",
  GAINSBORO = "#DCDCDC",
  GHOST_WHITE = "#F8F8FF",
  GOLD = "#FFD700",
  GOLDEN_ROD = "#DAA520",
  GRAY = "#808080",
  GREEN = "#008000",
  GREEN_YELLOW = "#ADFF2F",
  HONEY_DEW = "#F0FFF0",
  HOT_PINK = "#FF69B4",
  INDIAN_RED = "#CD5C5C",
  INDIGO = "#4B0082",
  IVORY = "#FFFFF0",
  KHAKI = "#F0E68C",
  LAVENDER = "#E6E6FA",
  LAVENDER_BLUSH = "#FFF0F5",
  LAWN_GREEN = "#7CFC00",
  LEMON_CHIFFON = "#FFFACD",
  LIGHT_BLUE = "#ADD8E6",
  LIGHT_CORAL = "#F08080",
  LIGHT_CYAN = "#E0FFFF",
  LIGHT_GOLDEN_ROD_YELLOW = "#FAFAD2",
  LIGHT_GREY = "#D3D3D3",
  LIGHT_GREEN = "#90EE90",
  LIGHT_PINK = "#FFB6C1",
  LIGHT_SALMON = "#FFA07A",
  LIGHT_SEA_GREEN = "#20B2AA",
  LIGHT_SKY_BLUE = "#87CEFA",
  LIGHT_SLATE_GRAY = "#778899",
  LIGHT_STEEL_BLUE = "#B0C4DE",
  LIGHT_YELLOW = "#FFFFE0",
  LIME = "#00FF00",
  LIME_GREEN = "#32CD32",
  LINEN = "#FAF0E6",
  MAGENTA = "#FF00FF",
  MAROON = "#800000",
  MEDIUM_AQUA_MARINE = "#66CDAA",
  MEDIUM_BLUE = "#0000CD",
  MEDIUM_ORCHID = "#BA55D3",
  MEDIUM_PURPLE = "#9370D8",
  MEDIUM_SEA_GREEN = "#3CB371",
  MEDIUM_SLATE_BLUE = "#7B68EE",
  MEDIUM_SPRING_GREEN = "#00FA9A",
  MEDIUM_TURQUOISE = "#48D1CC",
  MEDIUM_VIOLET_RED = "#C71585",
  MIDNIGHT_BLUE = "#191970",
  MINT_CREAM = "#F5FFFA",
  MISTY_ROSE = "#FFE4E1",
  MOCCASIN = "#FFE4B5",
  NAVAJO_WHITE = "#FFDEAD",
  NAVY = "#000080",
  OLD_LACE = "#FDF5E6",
  OLIVE = "#808000",
  OLIVE_DRAB = "#6B8E23",
  ORANGE = "#FFA500",
  ORANGE_RED = "#FF4500",
  ORCHID = "#DA70D6",
  PALE_GOLDEN_ROD = "#EEE8AA",
  PALE_GREEN = "#98FB98",
  PALE_TURQUOISE = "#AFEEEE",
  PALE_VIOLET_RED = "#D87093",
  PAPAYA_WHIP = "#FFEFD5",
  PEACH_PUFF = "#FFDAB9",
  PERU = "#CD853F",
  PINK = "#FFC0CB",
  PLUM = "#DDA0DD",
  POWDER_BLUE = "#B0E0E6",
  PURPLE = "#800080",
  RED = "#FF0000",
  ROSY_BROWN = "#BC8F8F",
  ROYAL_BLUE = "#4169E1",
  SADDLE_BROWN = "#8B4513",
  SALMON = "#FA8072",
  SANDY_BROWN = "#F4A460",
  SEA_GREEN = "#2E8B57",
  SEA_SHELL = "#FFF5EE",
  SIENNA = "#A0522D",
  SILVER = "#C0C0C0",
  SKY_BLUE = "#87CEEB",
  SLATE_BLUE = "#6A5ACD",
  SLATE_GRAY = "#708090",
  SNOW = "#FFFAFA",
  SPRING_GREEN = "#00FF7F",
  STEEL_BLUE = "#4682B4",
  TAN = "#D2B48C",
  TEAL = "#008080",
  THISTLE = "#D8BFD8",
  TOMATO = "#FF6347",
  TURQUOISE = "#40E0D0",
  VIOLET = "#EE82EE",
  WHEAT = "#F5DEB3",
  WHITE = "#FFFFFF",
  WHITE_SMOKE = "#F5F5F5",
  YELLOW = "#FFFF00",
  YELLOW_GREEN = "#9ACD32",
  BLUE_COALITION = "#2563EB",
  NEUTRAL_COALITION = "#9CA3AF",
  RED_COALITION = "#EF4444",
  OLYMPUS_LIGHT_BLUE = "#3B82F6",
  OLYMPUS_BLUE = "#243141",
  OLYMPUS_RED = "#F05252",
  OLYMPUS_ORANGE = "#FF9900",
  OLYMPUS_GREEN = "#8BFF63",
}

export const CONTEXT_ACTION_COLORS = [undefined, colors.WHITE, colors.GREEN, colors.PURPLE, colors.BLUE, colors.RED];

export namespace ContextActions {
  export const STOP = new ContextAction(
    "stop",
    "Stop unit",
    "Stops the unit, removing any currently assigned task. Air units will orbin in place, while ground unit will halt.",
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
    "Click on the map to directly move the units there, overriding any existing command.",
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
    "Click on the map to add a destination at the end of the path. This allows to create a more complex route.",
    faRoute,
    ContextActionTarget.POINT,
    (units: Unit[], _, targetPosition) => {
      if (targetPosition)
        getApp()
          .getUnitsManager()
          .addDestination(targetPosition, getApp().getMap().getKeepRelativePositions(), getApp().getMap().getDestinationRotation(), units);
    },
    { type: ContextActionType.MOVE, code: null }
  );

  export const DELETE = new ContextAction(
    "delete",
    "Delete unit",
    "Deletes the unit immediately with no effect.",
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
    "Explodes the unit using different explosions effects. WARNING: may affect surrounding units too!",
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
    "Center the map on the unit and follow it.",
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
    "Refuel units at the nearest Air-to-Air refuelling tanker of the appropriate type. If no tanker is available the unit will return to the nearest base.",
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
    "Click on a unit to follow it in formation. A menu allows to choose the formation type.",
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
    "Click on a point to execute a precision bombing attack with the available A/G weapons.",
    faLocationCrosshairs,
    ContextActionTarget.POINT,
    (units: Unit[], _, targetPosition: LatLng | null) => {
      if (targetPosition)
        getApp().getUnitsManager().bombPoint(targetPosition, getApp().getMap().getKeepRelativePositions(), getApp().getMap().getDestinationRotation(), units);
    },
    { type: ContextActionType.ENGAGE, code: "KeyB", ctrlKey: false, shiftKey: false }
  );

  export const CARPET_BOMB = new ContextAction(
    "carpet-bomb",
    "Carpet bomb location",
    "Click on a point to execute a carpet bombing attack with the available A/G weapons.",
    faXmarksLines,
    ContextActionTarget.POINT,
    (units: Unit[], _, targetPosition: LatLng | null) => {
      if (targetPosition)
        getApp().getUnitsManager().carpetBomb(targetPosition, getApp().getMap().getKeepRelativePositions(), getApp().getMap().getDestinationRotation(), units);
    },
    { type: ContextActionType.ENGAGE, code: "KeyH", ctrlKey: false, shiftKey: false }
  );

  export const LAND = new ContextAction(
    "land",
    "Land",
    "Click on a point to land at the nearest airbase.",
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
    "Click on a point to land there. WARNING: if multiple units are selected make sure to choose a different point for each or the units will crash!",
    olButtonsContextLandAtPoint,
    ContextActionTarget.POINT,
    (units: Unit[], _, targetPosition: LatLng | null) => {
      if (targetPosition)
        getApp().getUnitsManager().landAtPoint(targetPosition, getApp().getMap().getKeepRelativePositions(), getApp().getMap().getDestinationRotation(), units);
    },
    { type: ContextActionType.ADMIN, code: "KeyK", ctrlKey: false, shiftKey: false }
  );

  export const GROUP = new ContextAction(
    "group-ground",
    "Group ground units",
    "Create a DCS group of ground units. This is different from hotgroups or formations and is used primarily to create functioning SAM sites. When a group is created, units will no longer be individually controllable.",
    faPeopleGroup,
    ContextActionTarget.NONE,
    (units: Unit[], _1, _2) => {
      getApp().getUnitsManager().createGroup(units);
    },
    { type: ContextActionType.OTHER, code: "KeyG", ctrlKey: false, shiftKey: false, altKey: false }
  );

  export const ATTACK = new ContextAction(
    "attack",
    "Attack unit",
    "Click on a unit to attack it using A/A or A/G weapons, depending on the target.",
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
    "Click on a point to precisely fire at it, if possible. WARNING: this requires the unit to be able to reach the target and not be obstructed by obstacles.",
    faLocationCrosshairs,
    ContextActionTarget.POINT,
    (units: Unit[], _, targetPosition: LatLng | null) => {
      if (targetPosition)
        getApp().getUnitsManager().fireAtArea(targetPosition, getApp().getMap().getKeepRelativePositions(), getApp().getMap().getDestinationRotation(), units);
    },
    { type: ContextActionType.ENGAGE, code: "KeyV", ctrlKey: false, shiftKey: false }
  );

  export const FIRE_LASER = new ContextAction(
    "fire-laser",
    "Shine laser at point",
    "Click on a point to shine a laser with the given code from the unit to the ground.",
    faLightbulb,
    ContextActionTarget.POINT,
    (units: Unit[], _, targetPosition: LatLng | null) => {
      if (targetPosition)
        getApp().getUnitsManager().fireLaser(targetPosition, getApp().getMap().getKeepRelativePositions(), getApp().getMap().getDestinationRotation(), units);
    },
    { type: ContextActionType.ENGAGE, code: "KeyL", ctrlKey: true, shiftKey: false }
  );

  export const FIRE_INFRARED = new ContextAction(
    "fire-infrared",
    "Shine infrared at point",
    "Click on a point to shine a infrared beam from the unit to the ground.",
    faLightbulb,
    ContextActionTarget.POINT,
    (units: Unit[], _, targetPosition: LatLng | null) => {
      if (targetPosition)
        getApp()
          .getUnitsManager()
          .fireInfrared(targetPosition, getApp().getMap().getKeepRelativePositions(), getApp().getMap().getDestinationRotation(), units);
    },
    { type: ContextActionType.ENGAGE, code: "KeyL", ctrlKey: true, shiftKey: false }
  );

  export const SIMULATE_FIRE_FIGHT = new ContextAction(
    "simulate-fire-fight",
    "Simulate fire fight",
    "Click on a point to simulate a fire fight by shooting randomly in that general direction. WARNING: works correctly only on neutral units, blue or red units will aim",
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
    "Set unit as AWACS reference. BRAA indicators will be shown next to Air unit markers.",
    faWifi,
    ContextActionTarget.NONE,
    (units: Unit[], _1, _2) => {
      getApp().getUnitsManager().setAWACSReference(units[0].ID);
    },
    { type: ContextActionType.ADMIN, code: "KeyU", ctrlKey: false, shiftKey: false, altKey: false }
  );

  export const CLONE = new ContextAction(
    "clone",
    "Clone unit",
    "Click on a point to clone the units there.",
    faClone,
    ContextActionTarget.POINT,
    (units: Unit[], _1, targetPosition) => {
      getApp().getUnitsManager().copy(units);
      if (targetPosition) getApp().getUnitsManager().paste(targetPosition);
    },
    { type: ContextActionType.ADMIN, code: "KeyC", ctrlKey: false, shiftKey: false, altKey: false }
  );
}
