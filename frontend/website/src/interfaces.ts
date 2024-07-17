import { LatLng } from "leaflet";
import { OlympusApp } from "./olympusapp";
import { Airbase } from "./mission/airbase";

export interface OlympusPlugin {
    getName: () => string;
    initialize: (app: OlympusApp) => boolean;
}

declare global {
    function getOlympusPlugin(): OlympusPlugin;
}

export interface ContextMenuOption {
    tooltip: string;
    src: string;
    callback: CallableFunction;
}

export interface AirbasesData {
    airbases: { [key: string]: any },
    sessionHash: string;
    time: number;
}

export interface BullseyesData {
    bullseyes: { [key: string]: { latitude: number, longitude: number, coalition: string } },
    sessionHash: string;
    time: number;
}

export interface MissionData {
    mission: {
        theatre: string,
        dateAndTime: DateAndTime;
        commandModeOptions: CommandModeOptions;
        coalitions: { red: string[], blue: string[] };
    }
    time: number;
    sessionHash: string;
}

export interface CommandModeOptions {
    commandMode: string;
    restrictSpawns: boolean;
    restrictToCoalition: boolean;
    setupTime: number;
    spawnPoints: {
        red: number,
        blue: number
    },
    eras: string[]
}

export interface DateAndTime {
    date: { Year: number, Month: number, Day: number };
    time: { h: number, m: number, s: number };
    elapsedTime: number;
    startTime: number;
}

export interface LogData {
    logs: { [key: string]: string },
    sessionHash: string;
    time: number;
}

export interface ServerRequestOptions {
    time?: number;
    commandHash?: string;
}

export interface UnitSpawnTable {
    unitType: string,
    location: LatLng,
    altitude?: number,
    loadout?: string,
    skill: string,
    liveryID: string
}

export interface ObjectIconOptions {
    showState: boolean,
    showVvi: boolean,
    showHealth: boolean,
    showHotgroup: boolean,
    showUnitIcon: boolean,
    showShortLabel: boolean,
    showFuel: boolean,
    showAmmo: boolean,
    showSummary: boolean,
    showCallsign: boolean,
    rotateToHeading: boolean
}

export interface GeneralSettings {
    prohibitJettison: boolean;
    prohibitAA: boolean;
    prohibitAG: boolean;
    prohibitAfterburner: boolean;
    prohibitAirWpn: boolean;
}

export interface TACAN {
    isOn: boolean;
    channel: number;
    XY: string;
    callsign: string;
}

export interface Radio {
    frequency: number;
    callsign: number;
    callsignNumber: number;
}

export interface Ammo {
    quantity: number,
    name: string,
    guidance: number,
    category: number,
    missileCategory: number
}

export interface Contact {
    ID: number,
    detectionMethod: number
}

export interface Offset {
    x: number,
    y: number,
    z: number
}

export interface UnitData {
    category: string,
    categoryDisplayName: string,
    ID: number;
    alive: boolean;
    human: boolean;
    controlled: boolean;
    coalition: string;
    country: number;
    name: string;
    unitName: string;
    groupName: string;
    state: string;
    task: string;
    hasTask: boolean;
    position: LatLng;
    speed: number;
    horizontalVelocity: number;
    verticalVelocity: number;
    heading: number;
    track: number;
    isActiveTanker: boolean;
    isActiveAWACS: boolean;
    onOff: boolean;
    followRoads: boolean;
    fuel: number;
    desiredSpeed: number;
    desiredSpeedType: string;
    desiredAltitude: number;
    desiredAltitudeType: string;
    leaderID: number;
    formationOffset: Offset;
    targetID: number;
    targetPosition: LatLng;
    ROE: string;
    reactionToThreat: string;
    emissionsCountermeasures: string;
    TACAN: TACAN;
    radio: Radio;
    generalSettings: GeneralSettings;
    ammo: Ammo[];
    contacts: Contact[];
    activePath: LatLng[];
    isLeader: boolean;
    operateAs: string;
    shotsScatter: number;
    shotsIntensity: number;
    health: number;
}

export interface LoadoutItemBlueprint {
    name: string;
    quantity: number;
    effectiveAgainst?: string;
}

export interface LoadoutBlueprint {
    fuel: number;
    items: LoadoutItemBlueprint[];
    roles: string[];
    code: string;
    name: string;
    enabled: boolean;
}

export interface UnitBlueprint {
    name: string;
    enabled: boolean;
    coalition: string;
    era: string;
    label: string;
    shortLabel: string;
    type?: string;
    loadouts?: LoadoutBlueprint[];
    filename?: string;
    liveries?: { [key: string]: { name: string, countries: string[] } };
    cost?: number;
    barrelHeight?: number;
    muzzleVelocity?: number;
    aimTime?: number;
    shotsToFire?: number;
    shotsBaseInterval?: number;
    shotsBaseScatter?: number;
    description?: string;
    abilities?: string;
    tags?: string;
    acquisitionRange?: number;
    engagementRange?: number;
    targetingRange?: number;
    aimMethodRange?: number;
    alertnessTimeConstant?: number;
    canTargetPoint?: boolean;
    canRearm?: boolean;
    canAAA?: boolean;
    indirectFire?: boolean;
    markerFile?: string;
    unitWhenGrouped?: string;
}

export interface UnitSpawnOptions {
    roleType: string;
    name: string;
    latlng: LatLng;
    coalition: string;
    count: number;
    country: string;
    skill: string;
    loadout: LoadoutBlueprint | undefined;
    airbase: Airbase | undefined;
    liveryID: string | undefined;
    altitude: number | undefined;
}

export interface AirbaseOptions {
    name: string,
    position: L.LatLng
}

export interface AirbaseChartData {
    elevation: string,
    ICAO: string,
    TACAN: string,
    runways: AirbaseChartRunwayData[]
}

export interface AirbaseChartRunwayHeadingData {
    [index: string]: {
        magHeading: string,
        ILS: string
    }
}

export interface AirbaseChartRunwayData {
    headings: AirbaseChartRunwayHeadingData[],
    length: string
}

export interface Listener {
    callback: CallableFunction;
    name?: string
}

export interface ShortcutOptions {
    altKey?: boolean;
    callback: CallableFunction;
    context?: string;
    ctrlKey?: boolean;
    name?: string;
    shiftKey?: boolean;
}

export interface ShortcutKeyboardOptions extends ShortcutOptions {
    code: string;
    event?: "keydown" | "keyup";
}

export interface ShortcutMouseOptions extends ShortcutOptions {
    button: number;
    event: "mousedown" | "mouseup";
}

export interface Manager {
    add: CallableFunction;
}