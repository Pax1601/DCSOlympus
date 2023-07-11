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