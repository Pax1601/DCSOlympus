interface AirbasesData {
    airbases: {[key: string]: any},
}

interface BullseyesData {
    bullseyes: {[key: string]: {latitude: number, longitude: number, coalition: string}},
}

interface LogData {
    logs: {[key: string]: string},
}