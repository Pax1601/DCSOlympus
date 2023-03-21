
const DEMO_UNIT_DATA = {
    ["1"]:{
        baseData: {
            AI: true,
            name: "F-5E",
            unitName: "Olympus 1-1",
            groupName: "Group 1",
            alive: true,
            category: "Aircraft",
        },
        flightData:  {
            latitude: 37.20,
            longitude: -115.80,
            altitude: 2000,
            heading: 0.5,
            speed: 300
        },
        missionData:  {
            fuel: 50,
            flags: {human: false},
            ammo: [
                {
                    count: 4,
                    desc: {
                        displayName: "AIM-120"
                    }
                },
                {
                    count: 2,
                    desc: {
                        displayName: "AIM-7"
                    }
                }
            ],
            targets: [],
            hasTask: true,
            coalition: "blue"
        },
        formationData:  {
            formation: "Echelon",
            isLeader: false,
            isWingman: false,
            leaderID: null,
            wingmen: [],
            wingmenIDs: []
        },
        taskData: {
            currentTask: "Example task",
            activePath: undefined,
            targetSpeed: 400,
            targetAltitude: 3000
        },
        optionsData: {
            ROE: "Designated",
            reactionToThreat: "Abort",
        }
    },
    ["2"]:{
        baseData: {
            AI: true,
            name: "F-5E",
            unitName: "Olympus 1-2",
            groupName: "Group 1",
            alive: true,
            category: "Aircraft",
        },
        flightData:  {
            latitude: 37.2,
            longitude: -115.75,
            altitude: 2000,
            heading: 0.5,
            speed: 300
        },
        missionData:  {
            fuel: 0.5,
            flags: {human: false},
            ammo: [],
            targets: [],
            hasTask: true,
            coalition: "red"
        },
        formationData:  {
            formation: "Echelon",
            isLeader: false,
            isWingman: false,
            leaderID: null,
            wingmen: [],
            wingmenIDs: []
        },
        taskData: {
            currentTask: "Example task",
            activePath: undefined,
            targetSpeed: 300,
            targetAltitude: 3000
        },
        optionsData: {
            ROE: "Designated",
            reactionToThreat: "Abort",
        }
    },
    ["3"]:{
        baseData: {
            AI: true,
            name: "2S6 Tunguska",
            unitName: "Olympus 1-3",
            groupName: "Group 1",
            alive: true,
            category: "GroundUnit",
        },
        flightData:  {
            latitude: 37.175,
            longitude: -115.8,
            altitude: 2000,
            heading: 0.5,
            speed: 300
        },
        missionData:  {
            fuel: 0.5,
            flags: {human: false},
            ammo: [],
            targets: [],
            hasTask: true,
            coalition: "blue"
        },
        formationData:  {
            formation: "Echelon",
            isLeader: false,
            isWingman: false,
            leaderID: null,
            wingmen: [],
            wingmenIDs: []
        },
        taskData: {
            currentTask: "Example task",
            activePath: undefined,
            targetSpeed: 400,
            targetAltitude: 3000
        },
        optionsData: {
            ROE: "None",
            reactionToThreat: "None",
        }
    },
    ["4"]:{
        baseData: {
            AI: true,
            name: "2S6 Tunguska",
            unitName: "Olympus 1-4",
            groupName: "Group 1",
            alive: true,
            category: "GroundUnit",
        },
        flightData:  {
            latitude: 37.175,
            longitude: -115.75,
            altitude: 2000,
            heading: 0.5,
            speed: 300
        },
        missionData:  {
            fuel: 0.5,
            flags: {human: false},
            ammo: [],
            targets: [],
            hasTask: true,
            coalition: "red"
        },
        formationData:  {
            formation: "Echelon",
            isLeader: false,
            isWingman: false,
            leaderID: null,
            wingmen: [],
            wingmenIDs: []
        },
        taskData: {
            currentTask: "Example task",
            activePath: undefined,
            targetSpeed: 400,
            targetAltitude: 3000
        },
        optionsData: {
            ROE: "None",
            reactionToThreat: "None",
        }
    },
    ["5"]:{
        baseData: {
            AI: true,
            name: "M-60",
            unitName: "Olympus 1-3",
            groupName: "Group 1",
            alive: true,
            category: "GroundUnit",
        },
        flightData:  {
            latitude: 37.15,
            longitude: -115.8,
            altitude: 2000,
            heading: 0.5,
            speed: 300
        },
        missionData:  {
            fuel: 0.5,
            flags: {human: false},
            ammo: [],
            targets: [],
            hasTask: true,
            coalition: "blue"
        },
        formationData:  {
            formation: "Echelon",
            isLeader: false,
            isWingman: false,
            leaderID: null,
            wingmen: [],
            wingmenIDs: []
        },
        taskData: {
            currentTask: "Example task",
            activePath: undefined,
            targetSpeed: 400,
            targetAltitude: 3000
        },
        optionsData: {
            ROE: "None",
            reactionToThreat: "None",
        }
    },
    ["6"]:{
        baseData: {
            AI: true,
            name: "M-60",
            unitName: "Olympus 1-4",
            groupName: "Group 1",
            alive: true,
            category: "GroundUnit",
        },
        flightData:  {
            latitude: 37.15,
            longitude: -115.75,
            altitude: 2000,
            heading: 0.5,
            speed: 300
        },
        missionData:  {
            fuel: 0.5,
            flags: {human: false},
            ammo: [],
            targets: [],
            hasTask: true,
            coalition: "red"
        },
        formationData:  {
            formation: "Echelon",
            isLeader: false,
            isWingman: false,
            leaderID: null,
            wingmen: [],
            wingmenIDs: []
        },
        taskData: {
            currentTask: "Example task",
            activePath: undefined,
            targetSpeed: 400,
            targetAltitude: 3000
        },
        optionsData: {
            ROE: "None",
            reactionToThreat: "None",
        }
    },
    ["7"]:{
        baseData: {
            AI: true,
            name: "CVN-75",
            unitName: "Olympus 1-7",
            groupName: "Group 1",
            alive: true,
            category: "NavyUnit",
        },
        flightData:  {
            latitude: 37.125,
            longitude: -115.8,
            altitude: 2000,
            heading: 0.5,
            speed: 300
        },
        missionData:  {
            fuel: 0.5,
            flags: {human: false},
            ammo: [],
            targets: [],
            hasTask: true,
            coalition: "blue"
        },
        formationData:  {
            formation: "Echelon",
            isLeader: false,
            isWingman: false,
            leaderID: null,
            wingmen: [],
            wingmenIDs: []
        },
        taskData: {
            currentTask: "Example task",
            activePath: undefined,
            targetSpeed: 400,
            targetAltitude: 3000
        },
        optionsData: {
            ROE: "None",
            reactionToThreat: "None",
        }
    },
    ["8"]:{
        baseData: {
            AI: true,
            name: "CVN-75",
            unitName: "Olympus 1-8",
            groupName: "Group 1",
            alive: true,
            category: "NavyUnit",
        },
        flightData:  {
            latitude: 37.125,
            longitude: -115.75,
            altitude: 2000,
            heading: 0.5,
            speed: 300
        },
        missionData:  {
            fuel: 0.5,
            flags: {human: false},
            ammo: [],
            targets: [],
            hasTask: true,
            coalition: "red"
        },
        formationData:  {
            formation: "Echelon",
            isLeader: false,
            isWingman: false,
            leaderID: null,
            wingmen: [],
            wingmenIDs: []
        },
        taskData: {
            currentTask: "Example task",
            activePath: undefined,
            targetSpeed: 400,
            targetAltitude: 3000
        },
        optionsData: {
            ROE: "None",
            reactionToThreat: "None",
        }
    },
    ["9"]:{
        baseData: {
            AI: true,
            name: "CVN-75",
            unitName: "Olympus 1-9",
            groupName: "Group 1",
            alive: false,
            category: "Aircraft",
        },
        flightData:  {
            latitude: 37.10,
            longitude: -115.75,
            altitude: 2000,
            heading: 0.5,
            speed: 300
        },
        missionData:  {
            fuel: 0.5,
            flags: {human: false},
            ammo: [],
            targets: [],
            hasTask: true,
            coalition: "red"
        },
        formationData:  {
            formation: "Echelon",
            isLeader: false,
            isWingman: false,
            leaderID: null,
            wingmen: [],
            wingmenIDs: []
        },
        taskData: {
            currentTask: "Example task",
            activePath: undefined,
            targetSpeed: 400,
            targetAltitude: 3000
        },
        optionsData: {
            ROE: "None",
            reactionToThreat: "None",
        }
    },
    ["10"]:{
        baseData: {
            AI: true,
            name: "CVN-75",
            unitName: "Olympus 1-10",
            groupName: "Group 1",
            alive: false,
            category: "Aircraft",
        },
        flightData:  {
            latitude: 37.10,
            longitude: -115.8,
            altitude: 2000,
            heading: 0.5,
            speed: 300
        },
        missionData:  {
            fuel: 0.5,
            flags: {human: false},
            ammo: [],
            targets: [],
            hasTask: true,
            coalition: "blue"
        },
        formationData:  {
            formation: "Echelon",
            isLeader: false,
            isWingman: false,
            leaderID: null,
            wingmen: [],
            wingmenIDs: []
        },
        taskData: {
            currentTask: "Example task",
            activePath: undefined,
            targetSpeed: 400,
            targetAltitude: 3000
        },
        optionsData: {
            ROE: "None",
            reactionToThreat: "None",
        }
    },
    ["11"]:{
        baseData: {
            AI: true,
            name: "CVN-75",
            unitName: "Olympus 1-11",
            groupName: "Group 1",
            alive: false,
            category: "Missile",
        },
        flightData:  {
            latitude: 37.075,
            longitude: -115.8,
            altitude: 2000,
            heading: 0.5,
            speed: 300
        },
        missionData:  {
            fuel: 0.5,
            flags: {human: false},
            ammo: [],
            targets: [],
            hasTask: true,
            coalition: "blue"
        },
        formationData:  {
            formation: "Echelon",
            isLeader: false,
            isWingman: false,
            leaderID: null,
            wingmen: [],
            wingmenIDs: []
        },
        taskData: {
            currentTask: "Example task",
            activePath: undefined,
            targetSpeed: 400,
            targetAltitude: 3000
        },
        optionsData: {
            ROE: "None",
            reactionToThreat: "None",
        }
    },
    ["12"]:{
        baseData: {
            AI: true,
            name: "CVN-75",
            unitName: "Olympus 1-12",
            groupName: "Group 1",
            alive: false,
            category: "Missile",
        },
        flightData:  {
            latitude: 37.075,
            longitude: -115.75,
            altitude: 2000,
            heading: 0.5,
            speed: 300
        },
        missionData:  {
            fuel: 0.5,
            flags: {human: false},
            ammo: [],
            targets: [],
            hasTask: true,
            coalition: "red"
        },
        formationData:  {
            formation: "Echelon",
            isLeader: false,
            isWingman: false,
            leaderID: null,
            wingmen: [],
            wingmenIDs: []
        },
        taskData: {
            currentTask: "Example task",
            activePath: undefined,
            targetSpeed: 400,
            targetAltitude: 3000
        },
        optionsData: {
            ROE: "None",
            reactionToThreat: "None",
        }
    }
}

class DemoDataGenerator {
    constructor(unitsNumber)
    { 
        this.demoUnits = this.generateRandomUnitsDemoData(unitsNumber);
    }
    
    units(req, res){
        var ret = this.demoUnits;
        res.send(JSON.stringify(ret));
    };
    
    logs(req, res){
        var ret = {logs: {}};
        res.send(JSON.stringify(ret));
    };
    
    airbases(req, res){
        var ret = {airbases: {
            ["0"]: {
                callsign: "Neutral",
                latitude: 37.3,
                longitude: -115.8,
                coalition: "neutral"
            },
            ["1"]: {
                callsign: "Red",
                latitude: 37.3,
                longitude: -115.75,
                coalition: "red"
            },
            ["2"]: {
                callsign: "Blue",
                latitude: 37.3,
                longitude: -115.7,
                coalition: "blue"
            }
        }};
        res.send(JSON.stringify(ret));
    };
    
    bullseyes(req, res){
        var ret = {bullseyes: {
            "0": {
                latitude: 37.25,
                longitude: -115.8
            },
            "1": {
                latitude: 37.25,
                longitude: -115.75
            },
            "2": {
                latitude: 37.25,
                longitude: -115.7
            }
        }};
        res.send(JSON.stringify(ret));
    };

    mission(req, res){
        var ret = {mission: {theatre: "Nevada"}};
        res.send(JSON.stringify(ret));
    }
    
    generateRandomUnitsDemoData(unitsNumber) 
    {
        return {"units": DEMO_UNIT_DATA};
    }
}

module.exports = DemoDataGenerator;