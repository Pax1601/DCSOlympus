
const DEMO_UNIT_DATA = {
    AI: true,
    name: "F-5E",
    unitName: "Olympus 1-1",
    groupName: "Group 1",
    alive: true,
    category: "Aircraft",
    flightData:  {
        latitude: 37.2,
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
}

class DemoDataGenerator {
    constructor(unitsNumber)
    { 
        this.demoUnits = this.generateRandomUnitsDemoData(unitsNumber);
    }

    unitsRefresh(req, res) {
        var ret = this.demoUnits;
        res.send(JSON.stringify(ret));
    }
    
    unitsUpdate(req, res){
        Object.keys(this.demoUnits.units).forEach((ID) => {
            this.demoUnits.units[ID].flightData.heading += 0.05;
            this.demoUnits.units[ID].flightData.latitude += 0.001 * Math.cos(this.demoUnits.units[ID].flightData.heading);
            this.demoUnits.units[ID].flightData.longitude += 0.001 * Math.sin(this.demoUnits.units[ID].flightData.heading);
        });
        var ret = this.demoUnits;
        res.send(JSON.stringify(ret));
    };
    
    logs(req, res){
        var ret = {logs: {}};
        res.send(JSON.stringify(ret));
    };
    
    airbases(req, res){
        var ret = {airbases: {}};
        res.send(JSON.stringify(ret));
    };
    
    bullseyes(req, res){
        var ret = {bullseyes: {}};
        res.send(JSON.stringify(ret));
    };
    
    generateRandomUnitsDemoData(unitsNumber) 
    {
        var units = {};
        for (let i = 0; i < unitsNumber; i++)
        {
            units[String(i)] = JSON.parse(JSON.stringify(DEMO_UNIT_DATA));
            units[String(i)].flightData.latitude += (Math.random() - 0.5) * 0.3;
            units[String(i)].flightData.longitude += (Math.random() - 0.5) * 0.3;
        }
        return {"units": units};
    }
}

module.exports = DemoDataGenerator;