interface UpdateData {
    [key: string]: any
}

interface BaseData {
    AI: boolean;
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
    targets: any;
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
    targetSpeed: number;
    targetAltitude: number;
    isTanker: boolean;
    isAWACS: boolean;
}

interface OptionsData {
    ROE: string;
    reactionToThreat: string;
    emissionsCountermeasures: string;
    TACAN: TACAN;
    radio: Radio;
    generalSettings: GeneralSettings;
}

interface UnitData {
    baseData: BaseData;
    flightData: FlightData;
    missionData: MissionData;
    formationData: FormationData;
    taskData: TaskData;
    optionsData: OptionsData;
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