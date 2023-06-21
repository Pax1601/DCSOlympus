interface UnitsData {
    units: {[key: string]: UnitData},  
    sessionHash: string    
}

interface AirbasesData {
    airbases: {[key: string]: any},
}

interface BullseyesData {
    bullseyes: {[key: string]: {latitude: number, longitude: number, coalition: string}},
}

interface LogData {
    logs: {[key: string]: string},
}