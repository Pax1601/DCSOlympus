import { LatLng } from "leaflet"

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