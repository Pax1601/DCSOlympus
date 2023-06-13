interface UpdateData {
    [key: string]: any
}

interface BaseData {
    controlled: boolean;
    name: string;
    unitName: string;
    groupName: string;
    alive: boolean;
    category: string;
}

interface FlightData {
    latitude: number;
    longitude: number;
    altitude: number;
    heading: number;
    speed: number;
}

interface MissionData {
    fuel: number;
    flags: any;
    ammo: any;
    contacts: any;
    hasTask: boolean;
    coalition: string;
}

interface FormationData {
    leaderID: number;
}

interface TaskData {
    currentState: string;
    currentTask: string;
    activePath: any;
    desiredSpeed: number;
    desiredSpeedType: string;
    desiredAltitude: number;
    desiredAltitudeType: string;
    targetLocation: any;
    isTanker: boolean;
    isAWACS: boolean;
    onOff: boolean;
    followRoads: boolean;
    targetID: number;
}

interface OptionsData {
    ROE: string;
    reactionToThreat: string;
    emissionsCountermeasures: string;
    TACAN: TACAN;
    radio: Radio;
    generalSettings: GeneralSettings;
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

interface GeneralSettings {
    prohibitJettison: boolean;
    prohibitAA: boolean;
    prohibitAG: boolean;
    prohibitAfterburner: boolean;
    prohibitAirWpn: boolean;
}

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

interface UnitData {
    baseData: BaseData;
    flightData: FlightData;
    missionData: MissionData;
    formationData: FormationData;
    taskData: TaskData;
    optionsData: OptionsData;
}