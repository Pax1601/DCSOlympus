import { LatLng, LatLngBounds } from "leaflet";
import { MapMarkerVisibilityControl } from "../map/map";

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

export const states: string[] = ["none", "idle", "reach-destination", "attack", "follow", "land", "refuel", "AWACS", "tanker", "bomb-point", "carpet-bomb", "bomb-building", "fire-at-area", "simulate-fire-fight", "scenic-aaa", "miss-on-purpose", "land-at-point"];
export const ROEs: string[] = ["free", "designated", "", "return", "hold"];
export const reactionsToThreat: string[] = ["none", "manoeuvre", "passive", "evade"];
export const emissionsCountermeasures: string[] = ["silent", "attack", "defend", "free"];

export const ERAS = [{
    "name": "Early Cold War",
    "chronologicalOrder": 2
}, {
    "name": "Late Cold War",
    "chronologicalOrder": 4
}, {
    "name": "Mid Cold War",
    "chronologicalOrder": 3
}, {
    "name": "Modern",
    "chronologicalOrder": 5
}, {
    "name": "WW2",
    "chronologicalOrder": 1
}];

export const ROEDescriptions: string[] = [
    "Free (Attack anyone)",
    "Designated (Attack the designated target only) \nWARNING: Ground and Navy units don't respect this ROE, it will be equivalent to weapons FREE.",
    "",
    "Return (Only fire if fired upon) \nWARNING: Ground and Navy units don't respect this ROE, it will be equivalent to weapons FREE.",
    "Hold (Never fire)"
];

export const reactionsToThreatDescriptions: string[] = [
    "None (No reaction)",
    "Manoeuvre (no countermeasures)",
    "Passive (Countermeasures only, no manoeuvre)",
    "Evade (Countermeasures and manoeuvers)"
];

export const emissionsCountermeasuresDescriptions: string[] = [
    "Silent (Radar OFF, no ECM)",
    "Attack (Radar only for targeting, ECM only if locked)",
    "Defend (Radar for searching, ECM if locked)",
    "Always on (Radar and ECM always on)"
];

export const shotsScatterDescriptions: string[] = [
    "When performing scenic shooting tasks like simulated firefights, will shoot with a large scatter",
    "When performing scenic shooting tasks like simulated firefights, will shoot with a medium scatter",
    "When performing scenic shooting tasks like simulated firefights, will shoot with a small scatter (Radar guided units will track shots when the enemy unit is close)"
];

export const shotsIntensityDescriptions: string[] = [
    "When performing scenic shooting tasks like simulated firefights, will shoot with a low rate of fire",
    "When performing scenic shooting tasks like simulated firefights, will shoot with a medium rate of fire",
    "When performing scenic shooting tasks like simulated firefights, will shoot with a high rate of fire"
];

export const minSpeedValues: { [key: string]: number } = { Aircraft: 100, Helicopter: 0, NavyUnit: 0, GroundUnit: 0 };
export const maxSpeedValues: { [key: string]: number } = { Aircraft: 800, Helicopter: 300, NavyUnit: 60, GroundUnit: 60 };
export const speedIncrements: { [key: string]: number } = { Aircraft: 25, Helicopter: 10, NavyUnit: 5, GroundUnit: 5 };
export const minAltitudeValues: { [key: string]: number } = { Aircraft: 0, Helicopter: 0 };
export const maxAltitudeValues: { [key: string]: number } = { Aircraft: 50000, Helicopter: 10000 };
export const altitudeIncrements: { [key: string]: number } = { Aircraft: 500, Helicopter: 100 };

export const minimapBoundaries = {
    "Nevada": [    // NTTR
        new LatLng(39.7982463, -119.985425),
        new LatLng(34.4037128, -119.7806729),
        new LatLng(34.3483316, -112.4529351),
        new LatLng(39.7372411, -112.1130805),
        new LatLng(39.7982463, -119.985425)
    ],
    "Syria": [   // Syria
        new LatLng(37.3630556, 29.2686111),
        new LatLng(31.8472222, 29.8975),
        new LatLng(32.1358333, 42.1502778),
        new LatLng(37.7177778, 42.3716667),
        new LatLng(37.3630556, 29.2686111)
    ],
    "Caucasus": [   // Caucasus
        new LatLng(39.6170191, 27.634935),
        new LatLng(38.8735863, 47.1423108),
        new LatLng(47.3907982, 49.3101946),
        new LatLng(48.3955879, 26.7753625),
        new LatLng(39.6170191, 27.634935)
    ],
    "PersianGulf": [   // Persian Gulf
        new LatLng(32.9355285, 46.5623682),
        new LatLng(21.729393, 47.572675),
        new LatLng(21.8501348, 63.9734737),
        new LatLng(33.131584, 64.7313594),
        new LatLng(32.9355285, 46.5623682)
    ],
    "MarianaIslands": [   // Marianas
        new LatLng(22.09, 135.0572222),
        new LatLng(10.5777778, 135.7477778),
        new LatLng(10.7725, 149.3918333),
        new LatLng(22.5127778, 149.5427778),
        new LatLng(22.09, 135.0572222)
    ],
    "Falklands": [   // South Atlantic
        new LatLng(-49.097217, -79.418267),
        new LatLng(-56.874517, -79.418267),
        new LatLng(-56.874517, -43.316433),
        new LatLng(-49.097217, -43.316433),
        new LatLng(-49.097217, -79.418267)
    ],
    "Normandy": [   // Normandy
        new LatLng(50.44, -3.29),
        new LatLng(48.12, -3.29),
        new LatLng(48.12, 3.70),
        new LatLng(50.44, 3.70),
        new LatLng(50.44, -3.29)
    ],
    "SinaiMap": [   // Sinai
        new LatLng(34.312222, 28.523333),
        new LatLng(25.946944, 28.523333),
        new LatLng(25.946944, 36.897778),
        new LatLng(34.312222, 36.897778),
        new LatLng(34.312222, 28.523333)
    ],
    "Kola": [   // Kola
        new LatLng(72.055300, 4.0140000),
        new LatLng(64.421145, 10.353076),
        new LatLng(63.570300, 39.364000),
        new LatLng(71.48000, 48.091100),
        new LatLng(72.055300, 4.01400003)
    ],
    "Afghanistan": [   // Afghanistan
        new LatLng(39.27472222, 59.81138889),
        new LatLng(29.41166667, 60.04305556),
        new LatLng(28.97722222, 73.87666667),
        new LatLng(38.40055556, 75.07638889),
        new LatLng(39.27472222, 59.81138889)
    ]
};

export const mapBounds = {
    "Syria": { bounds: new LatLngBounds([31.8472222, 29.8975], [37.7177778, 42.3716667]), zoom: 5 },
    "MarianaIslands": { bounds: new LatLngBounds([10.5777778, 135.7477778], [22.5127778, 149.5427778]), zoom: 5 },
    "Nevada": { bounds: new LatLngBounds([34.4037128, -119.7806729], [39.7372411, -112.1130805]), zoom: 5 },
    "PersianGulf": { bounds: new LatLngBounds([21.729393, 47.572675], [33.131584, 64.7313594]), zoom: 4 },
    "Caucasus": { bounds: new LatLngBounds([39.6170191, 27.634935], [47.3907982, 49.3101946]), zoom: 4 },
    "Falklands": { bounds: new LatLngBounds([-49.097217, -79.418267], [-56.874517, -43.316433]), zoom: 3 },
    "Normandy": { bounds: new LatLngBounds([50.44, -3.29], [48.12, 3.70]), zoom: 5 },
    "SinaiMap": { bounds: new LatLngBounds([34.312222, 28.523333], [25.946944, 36.897778]), zoom: 4 },
    "Kola": { bounds: new LatLngBounds([61.59999, 4.29982], [75.05179, 44.29982]), zoom: 3},
    "Afghanistan": { bounds: new LatLngBounds([29.41166667, 60.04305556], [38.40055556, 75.07638889]), zoom: 3}
}

export const defaultMapMirrors = {}

export const defaultMapLayers = {}

/* Map constants */
export const IDLE = "Idle";
export const MOVE_UNIT = "Move unit";
export const COALITIONAREA_DRAW_POLYGON = "Draw Coalition Area";
export const visibilityControls: string[] = ["human", "dcs", "aircraft", "helicopter", "groundunit-sam", "groundunit", "navyunit", "airbase"];
export const visibilityControlsTypes: string[][] = [["human"], ["dcs"], ["aircraft"], ["helicopter"], ["groundunit-sam"], ["groundunit"], ["navyunit"], ["airbase"]];
export const visibilityControlsTooltips: string[] = ["Toggle human players visibility", "Toggle DCS controlled units visibility", "Toggle aircrafts visibility", "Toggle helicopter visibility", "Toggle SAM units visibility", "Toggle ground units (not SAM) visibility", "Toggle navy units visibility", "Toggle airbases visibility"];

export const MAP_MARKER_CONTROLS: MapMarkerVisibilityControl[] = [{
    "name": "Human",
    "image": "visibility/human.svg",
    "toggles": ["human"],
    "tooltip": "Toggle human players' visibility"
}, {
    "image": "visibility/olympus.svg",
    "isProtected": false,
    "name": "Olympus",
    "protectable": false,
    "toggles": ["olympus"],
    "tooltip": "Toggle Olympus-controlled units' visibility"
}, {
    "image": "visibility/dcs.svg",
    "isProtected": true,
    "name": "DCS",
    "protectable": true,
    "toggles": ["dcs"],
    "tooltip": "Toggle DCS-controlled units' visibility"
}, {
    "category": "Aircraft",
    "image": "visibility/aircraft.svg",
    "name": "Aircraft",
    "toggles": ["aircraft"],
    "tooltip": "Toggle aircraft's visibility"
}, {
    "category": "Helicopter",
    "image": "visibility/helicopter.svg",
    "name": "Helicopter",
    "toggles": ["helicopter"],
    "tooltip": "Toggle helicopters' visibility"
}, {
    "category": "AirDefence",
    "image": "visibility/groundunit-sam.svg",
    "name": "Air defence",
    "toggles": ["groundunit-sam"],
    "tooltip": "Toggle air defence units' visibility"
}, {
    "image": "visibility/groundunit.svg",
    "name": "Ground units",
    "toggles": ["groundunit"],
    "tooltip": "Toggle ground units' visibility"
}, {
    "category": "GroundUnit",
    "image": "visibility/navyunit.svg",
    "name": "Naval",
    "toggles": ["navyunit"],
    "tooltip": "Toggle naval units' visibility"
}, {
    "image": "visibility/airbase.svg",
    "name": "Airbase",
    "toggles": ["airbase"],
    "tooltip": "Toggle airbase' visibility"
}];

export const IADSTypes = ["AAA", "SAM Site", "Radar (EWR)"];
export const IADSDensities: { [key: string]: number } = { "AAA": 0.8, "SAM Site": 0.1, "Radar (EWR)": 0.05 };
export const GROUND_UNIT_AIR_DEFENCE_REGEX: RegExp = /(\b(AAA|SAM|MANPADS?|[mM]anpads?)|[sS]tinger\b)/;
export const HIDE_GROUP_MEMBERS = "Hide group members when zoomed out";
export const SHOW_UNIT_LABELS = "Show unit labels (L)";
export const SHOW_UNITS_ENGAGEMENT_RINGS = "Show units threat range rings (Q)";
export const HIDE_UNITS_SHORT_RANGE_RINGS = "Hide short range units threat range rings (R)";
export const SHOW_UNITS_ACQUISITION_RINGS = "Show units detection range rings (E)";
export const FILL_SELECTED_RING = "Fill the threat range rings of selected units (F)";
export const SHOW_UNIT_CONTACTS = "Show selected units contact lines";
export const SHOW_UNIT_PATHS = "Show selected unit paths";
export const SHOW_UNIT_TARGETS = "Show selected unit targets";
export const DCS_LINK_PORT = "DCS Camera link port";
export const DCS_LINK_RATIO = "DCS Camera zoom";
export const SHOW_HUMAN_CONTROLLED_UNIT_ORIGINAL_CALLSIGN = "Show human controlled unit original callsign";

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
    endOfData = 255
};

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