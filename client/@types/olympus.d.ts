interface OlympusPlugin {
    getName: () => string;
    initialize: (any) => boolean;
}

declare global {
    function getOlympusPlugin(): OlympusPlugin;
}

interface ConfigurationOptions {
    port: number;
    address: string;
}

interface ContextMenuOption {
    tooltip: string;
    src: string;
    callback: CallableFunction;
}

interface AirbasesData {
    airbases: { [key: string]: any },
    sessionHash: string;
    time: number;
}

interface BullseyesData {
    bullseyes: { [key: string]: { latitude: number, longitude: number, coalition: string } },
    sessionHash: string;
    time: number;
}

interface MissionData {
    mission: {
        theatre: string,
        dateAndTime: DateAndTime;
        commandModeOptions: CommandModeOptions;
        coalitions: { red: string[], blue: string[] } = { };
    }
    time: number;
    sessionHash: string;
}

interface CommandModeOptions {
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

interface DateAndTime {
    date: { Year: number, Month: number, Day: number };
    time: { h: number, m: number, s: number };
    elapsedTime: number;
    startTime: number;
}

interface LogData {
    logs: { [key: string]: string },
    sessionHash: string;
    time: number;
}

interface ServerRequestOptions {
    time?: number;
    commandHash?: string;
}

interface UnitSpawnTable {
    unitType: string,
    location: latlng,
    altitude?: number,
    loadout?: string,
    liveryID: string
}

interface ObjectIconOptions {
    showState: boolean,
    showVvi: boolean,
    showHotgroup: boolean,
    showUnitIcon: boolean,
    showShortLabel: boolean,
    showFuel: boolean,
    showAmmo: boolean,
    showSummary: boolean,
    showCallsign: boolean,
    rotateToHeading: boolean
}

interface GeneralSettings {
    prohibitJettison: boolean;
    prohibitAA: boolean;
    prohibitAG: boolean;
    prohibitAfterburner: boolean;
    prohibitAirWpn: boolean;
}

interface TACAN {
    isOn: boolean;
    channel: number;
    XY: string;
    callsign: string;
}

interface Radio {
    frequency: number;
    callsign: number;
    callsignNumber: number;
}

interface Ammo {
    quantity: number,
    name: string,
    guidance: number,
    category: number,
    missileCategory: number
}

interface Contact {
    ID: number,
    detectionMethod: number
}

interface Offset {
    x: number,
    y: number,
    z: number
}

interface UnitData {
    category: string,
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
    heading: number;
    isTanker: boolean;
    isAWACS: boolean;
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
}

interface LoadoutItemBlueprint {
    name: string;
    quantity: number;
    effectiveAgainst?: string;
}

interface LoadoutBlueprint {
    fuel: number;
    items: LoadoutItemBlueprint[];
    roles: string[];
    code: string;
    name: string;
}

interface UnitBlueprint {
    name: string;
    coalition: string;
    era: string;
    label: string;
    shortLabel: string;
    type?: string;
    range?: string;
    loadouts?: LoadoutBlueprint[];
    filename?: string;
    liveries?: { [key: string]: { name: string, countries: string[] } };
    cost?: number;
}

interface UnitSpawnOptions {
    roleType: string;
    name: string;
    latlng: LatLng;
    coalition: string;
    count: number;
    country: string;
    loadout: LoadoutBlueprint | undefined;
    airbase: Airbase | undefined;
    liveryID: string | undefined;
    altitude: number | undefined;
}

interface AirbaseOptions {
    name: string,
    position: L.LatLng
}

interface AirbaseChartData {
    elevation: string,
    ICAO: string,
    TACAN: string,
    runways: AirbaseChartRunwayData[]
}

interface AirbaseChartRunwayData {
    headings: AirbaseChartRunwayHeadingData[],
    length: string
}

interface AirbaseChartRunwayHeadingData {
    [index: string]: {
        magHeading: string,
        ILS: string
    }
}

interface Listener {
    callback: CallableFunction;
    name?: string
}

interface ShortcutOptions {
    altKey?: boolean;
    callback: CallableFunction;
    ctrlKey?: boolean;
    name?: string;
    shiftKey?: boolean;
}

interface KeyboardShortcutOptions extends ShortcutOptions {
    code: string;
    event?: "keydown" | "keyup";
}

interface MouseShortcutOptions extends ShortcutOptions {
    button: number;
    event: "mousedown" | "mouseup";
}

interface Manager {
    add: CallableFunction;
}