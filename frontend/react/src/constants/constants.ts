import { LatLng, LatLngBounds } from "leaflet";
import { Context, MapOptions } from "../types/types";

export const DEFAULT_CONTEXT: Context = "default context";

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

export const ERAS = [
  {
    name: "Early Cold War",
    chronologicalOrder: 2,
  },
  {
    name: "Late Cold War",
    chronologicalOrder: 4,
  },
  {
    name: "Mid Cold War",
    chronologicalOrder: 3,
  },
  {
    name: "Modern",
    chronologicalOrder: 5,
  },
  {
    name: "WW2",
    chronologicalOrder: 1,
  },
];

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
  Aircraft: 100,
  Helicopter: 0,
  NavyUnit: 0,
  GroundUnit: 0,
};
export const maxSpeedValues: { [key: string]: number } = {
  Aircraft: 800,
  Helicopter: 300,
  NavyUnit: 60,
  GroundUnit: 60,
};
export const speedIncrements: { [key: string]: number } = {
  Aircraft: 25,
  Helicopter: 10,
  NavyUnit: 5,
  GroundUnit: 5,
};
export const minAltitudeValues: { [key: string]: number } = {
  Aircraft: 0,
  Helicopter: 0,
};
export const maxAltitudeValues: { [key: string]: number } = {
  Aircraft: 50000,
  Helicopter: 10000,
};
export const altitudeIncrements: { [key: string]: number } = {
  Aircraft: 500,
  Helicopter: 100,
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
};

export const defaultMapMirrors = {};
export const defaultMapLayers = {};

/* Map constants */
export const IDLE = "Idle";
export const SPAWN_UNIT = "Spawn unit";
export const CONTEXT_ACTION = "Context action";
export const COALITIONAREA_DRAW_POLYGON = "Draw Coalition Area polygon";
export const COALITIONAREA_DRAW_CIRCLE = "Draw Coalition Area circle";
export const COALITIONAREA_EDIT = "Edit Coalition Area";

export const IADSTypes = ["AAA", "SAM Site", "Radar (EWR)"];
export const IADSDensities: { [key: string]: number } = {
  AAA: 0.8,
  "SAM Site": 0.1,
  "Radar (EWR)": 0.05,
};
export const GROUND_UNIT_AIR_DEFENCE_REGEX: RegExp = /(\b(AAA|SAM|MANPADS?|[mM]anpads?)|[sS]tinger\b)/;

export const MAP_OPTIONS_TOOLTIPS = {
  hideGroupMembers: "Hide group members when zoomed out",
  hideUnitsShortRangeRings: "Hide short range units threat range rings (R)",
  showUnitContacts: "Show selected units contact lines",
  showUnitPaths: "Show selected unit paths",
  showUnitTargets: "Show selected unit targets",
  showUnitLabels: "Show unit labels (L)",
  showUnitsEngagementRings: "Show units threat range rings (Q)",
  showUnitsAcquisitionRings: "Show units detection range rings (E)",
};

export const MAP_OPTIONS_DEFAULTS = {
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
} as MapOptions;

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

export const MGRS_PRECISION_10KM = 2;
export const MGRS_PRECISION_1KM = 3;
export const MGRS_PRECISION_100M = 4;
export const MGRS_PRECISION_10M = 5;
export const MGRS_PRECISION_1M = 6;

export const DELETE_CYCLE_TIME = 0.05;
export const DELETE_SLOW_THRESHOLD = 50;

export const GROUPING_ZOOM_TRANSITION = 13;

export const MAX_SHOTS_SCATTER = 3;
export const MAX_SHOTS_INTENSITY = 3;
export const SHOTS_SCATTER_DEGREES = 10;
