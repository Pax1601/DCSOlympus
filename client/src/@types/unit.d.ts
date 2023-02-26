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
    formation: string;
    isLeader: boolean;
    isWingman: boolean;
    leaderID: number;
    wingmen: Unit[];
    wingmenIDs: number[];
}

interface TaskData {
    currentTask: string;
    activePath: any;
    targetSpeed: number;
    targetAltitude: number;
}

interface OptionsData {
    ROE: string;
    reactionToThreat: string;
}

interface UnitData {
    AI: boolean;
    name: string;
    unitName: string;
    groupName: string;
    alive: boolean;
    category: string;

    flightData: FlightData;
    missionData: MissionData;
    formationData: FormationData;
    taskData: TaskData;
    optionsData: OptionsData;
}
