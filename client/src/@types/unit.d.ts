import { LatLng } from "leaflet"

interface UnitIconOptions {
    showState: boolean,
    showVvi: boolean,
    showHotgroup: boolean,
    showUnitIcon: boolean,
    showShortLabel: boolean,
    showFuel: boolean,
    showAmmo: boolean,
    showSummary: boolean, 
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

interface UnitData {
    ID: number,
    alive: boolean,
    human: boolean,
    controlled: boolean,
    hasTask: boolean,
    desiredAltitudeType: string,
    desiredSpeedType: string,
    isTanker: boolean,
    isAWACS: boolean,
    onOff: boolean,
    followRoads: boolean,
    EPLRS: boolean,
    generalSettings: GeneralSettings
    position: LatLng,
    speed: number,
    heading: number,
    fuel: number,
    desiredSpeed: number,
    desiredAltitude: number,
    targetID: number,
    leaderID: number,
    targetPosition: LatLng,
    state: string,
    ROE: string,
    reactionToThreat: string,
    emissionsCountermeasures: string,
    TACAN: TACAN,
    radio: Radio,
    activePath: LatLng[],
    ammo: Ammo[],
    contacts: Contact[],
    name: string,
    unitName: string,
    groupName: string,
    category: string,
    coalition: string,
    task: string
}