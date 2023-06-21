
const DEMO_UNIT_DATA = {
    ["1"]:{
        baseData: {
            AI: false,
            name: "KC-135",
            unitName: "Olympus 1-1 aka Mr. Very long name",
            groupName: "Group 2",
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
            flags: {Human: false},
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
            currentTask: "Holding",
            currentState: "Idle",
            activePath: undefined,
            desiredSpeed: 400,
            desiredSpeedType: "CAS",
            desiredAltitude: 3000,
            desiredAltitudeType: "ASL",
            isTanker: false,

        },
        optionsData: {
            ROE: "Designated",
            reactionToThreat: "Abort",
        }
    },
    ["2"]:{
        baseData: {
            AI: true,
            name: "KC-135",
            unitName: "Olympus 1-2",
            groupName: "Group 3",
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
            desiredSpeed: 300,
            desiredAltitude: 3000
        },
        optionsData: {
            ROE: "Designated",
            reactionToThreat: "Abort",
        }
    },
    ["3"]:{
        baseData: {
            AI: true,
            name: "M-60",
            unitName: "Olympus 1-3",
            groupName: "Group 4",
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
            desiredSpeed: 400,
            desiredAltitude: 3000,
            onOff: false
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
            desiredSpeed: 400,
            desiredAltitude: 3000
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
            desiredSpeed: 400,
            desiredAltitude: 3000
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
            desiredSpeed: 400,
            desiredAltitude: 3000
        },
        optionsData: {
            ROE: "None",
            reactionToThreat: "None",
        }
    },
    ["7"]:{
        baseData: {
            AI: true,
            name: "CVN-75 Very long name",
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
            desiredSpeed: 400,
            desiredAltitude: 3000
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
            desiredSpeed: 400,
            desiredAltitude: 3000
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
            alive: true,
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
            desiredSpeed: 400,
            desiredAltitude: 3000
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
            alive: true,
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
            desiredSpeed: 400,
            desiredAltitude: 3000
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
            alive: true,
            category: "Missile",
        },
        flightData:  {
            latitude: 37.075,
            longitude: -115.80,
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
            desiredSpeed: 400,
            desiredAltitude: 3000
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
            alive: true,
            category: "Missile",
        },
        flightData:  {
            latitude: 37.075,
            longitude: -115.75,
            altitude: 2000,
            heading: 0.6,
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
            desiredSpeed: 400,
            desiredAltitude: 3000
        },
        optionsData: {
            ROE: "None",
            reactionToThreat: "None",
        }
    },
    ["13"]:{
        baseData: {
            AI: true,
            name: "CVN-75",
            unitName: "Olympus 1-11",
            groupName: "Group 1",
            alive: true,
            category: "Bomb",
        },
        flightData:  {
            latitude: 37.05,
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
            desiredSpeed: 400,
            desiredAltitude: 3000
        },
        optionsData: {
            ROE: "None",
            reactionToThreat: "None",
        }
    },
    ["14"]:{
        baseData: {
            AI: true,
            name: "CVN-75",
            unitName: "Olympus 1-12",
            groupName: "Group 1",
            alive: true,
            category: "Bomb",
        },
        flightData:  {
            latitude: 37.05,
            longitude: -115.75,
            altitude: 2000,
            heading: 0.6,
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
            desiredSpeed: 400,
            desiredAltitude: 3000
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
        for (let ID in this.demoUnits["units"]){
            this.demoUnits["units"][ID].flightData.latitude += 0.00001;
        }
        ret.time = Date.now();
        res.send(JSON.stringify(ret));
    };
    
    logs(req, res){
        var ret = {logs: {}};
        ret.time = Date.now();
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
        ret.time = Date.now();
        res.send(JSON.stringify(ret));
    };
    
    bullseyes(req, res){
        var ret = {bullseyes: {
            "0": {
                latitude: 37.25,
                longitude: -115.8,
                coalition: "neutral"
            },
            "1": {
                latitude: 37.25,
                longitude: -115.75,
                coalition: "red"
            },
            "2": {
                latitude: 37.25,
                longitude: -115.7,
                coalition: "blue"
            }
        }};
        ret.time = Date.now();
        res.send(JSON.stringify(ret));
    };

    mission(req, res){
        var ret = {mission: {theatre: "Nevada"}};
        ret.time = Date.now();
        res.send(JSON.stringify(ret));
    }
    
    generateRandomUnitsDemoData(unitsNumber) 
    {
        return {"units": DEMO_UNIT_DATA};
    }
}

module.exports = DemoDataGenerator;