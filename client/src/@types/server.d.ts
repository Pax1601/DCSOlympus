interface AirbasesData {
    airbases: {[key: string]: any},
    sessionHash: string;
    time: number;
}

interface BullseyesData {
    bullseyes: {[key: string]: {latitude: number, longitude: number, coalition: string}},
    sessionHash: string;
    time: number;
}

interface MissionData {
    mission: {
        theatre: string,
        dateAndTime: DateAndTime;
        RTSOptions: RTSOptions;
    }
    time: number;
    sessionHash: string;
}

interface RTSOptions {
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
    date: {Year: number, Month: number, Day: number};
    time: {h: number, m: number, s: number};
    elapsedTime: number;
    startTime: number;
}

interface LogData {
    logs: {[key: string]: string},
    sessionHash: string;
    time: number;
}