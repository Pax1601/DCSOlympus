const { random } = require('@turf/turf');
var basicAuth = require('express-basic-auth')
var enc = new TextEncoder();

const aircraftDatabase = require('./public/databases/units/aircraftDatabase.json');
const helicopterDatabase = require('./public/databases/units/helicopterDatabase.json');
const groundUnitDatabase = require('./public/databases/units/groundUnitDatabase.json');
const navyUnitDatabase = require('./public/databases/units/navyUnitDatabase.json');

const DEMO_UNIT_DATA = {}

const DEMO_WEAPONS_DATA = {
    /*["1001"]:{ category: "Missile", alive: true, coalition: 2, name: "", position: { lat: 37.1, lng: -116, alt: 1000 }, speed: 200, heading: 45 * Math.PI / 180 }, */
}

class DemoDataGenerator {
    constructor(app)
    { 
        app.get('/demo/units', (req, res) => this.units(req, res));
        app.get('/demo/weapons', (req, res) => this.weapons(req, res));
        app.get('/demo/logs', (req, res) => this.logs(req, res));
        app.get('/demo/bullseyes', (req, res) => this.bullseyes(req, res));
        app.get('/demo/airbases', (req, res) => this.airbases(req, res));
        app.get('/demo/mission', (req, res) => this.mission(req, res));
        app.get('/demo/commands', (req, res) => this.command(req, res));
        app.put('/demo', (req, res) => this.put(req, res));

        app.use('/demo', basicAuth({
            users: { 
                'admin': 'password',
                'blue': 'bluepassword',
                'red': 'redpassword'
            },
        }))

        
        let baseData = { alive: true, human: false, controlled: true, coalition: 2, country: 0, unitName: "Cool guy", groupName: "Cool group 1", state: 1, task: "Being cool!",
            hasTask: true, position: { lat: 37, lng: -116, alt: 1000 }, speed: 200, horizontalVelocity: 200, verticalVelicity: 0, heading: 45, isActiveTanker: false, isActiveAWACS: false, onOff: true, followRoads: false, fuel: 50, 
            desiredSpeed: 300, desiredSpeedType: 1, desiredAltitude: 1000, desiredAltitudeType: 1, leaderID: 0,
            formationOffset: { x: 0, y: 0, z: 0 },
            targetID: 0,
            targetPosition: { lat: 0, lng: 0, alt: 0 },
            ROE: 1,
            reactionToThreat: 1,
            emissionsCountermeasures: 1,
            TACAN: { isOn: false, XY: 'Y', callsign: 'TKR', channel: 40 },
            radio: { frequency: 124000000, callsign: 1, callsignNumber: 1 },
            generalSettings: { prohibitAA: false, prohibitAfterburner: false, prohibitAG: false, prohibitAirWpn: false, prohibitJettison: false },
            ammo:  [],
            contacts: [],
            activePath: [],
            isLeader: true
        }

        /*

        ***************** UNCOMMENT TO TEST ALL UNITS ****************

        var databases = Object.assign({}, aircraftDatabase, helicopterDatabase, groundUnitDatabase, navyUnitDatabase);
        var t = Object.keys(databases).length;
        var l = Math.floor(Math.sqrt(t));
        let latIdx = 0;
        let lngIdx = 0;
        let idx = 1;
        console.log(l)
        for (let name in databases) {
            if (databases[name].enabled) {
                DEMO_UNIT_DATA[idx] = JSON.parse(JSON.stringify(baseData));
                DEMO_UNIT_DATA[idx].name = name;
                DEMO_UNIT_DATA[idx].groupName = `Group-${idx}`;
                DEMO_UNIT_DATA[idx].position.lat += latIdx / 5;
                DEMO_UNIT_DATA[idx].position.lng += lngIdx / 5;
                
                latIdx += 1;
                if (latIdx === l) {
                    latIdx = 0;
                    lngIdx += 1;
                }

                if (name in aircraftDatabase)
                    DEMO_UNIT_DATA[idx].category = "Aircraft";
                else if (name in helicopterDatabase)
                    DEMO_UNIT_DATA[idx].category = "Helicopter";
                else if (name in groundUnitDatabase)
                    DEMO_UNIT_DATA[idx].category = "GroundUnit";
                else if (name in navyUnitDatabase)
                    DEMO_UNIT_DATA[idx].category = "NavyUnit";

                idx += 1;
            }
        }
        */

        let idx = 1;
        DEMO_UNIT_DATA[idx] = JSON.parse(JSON.stringify(baseData));
        DEMO_UNIT_DATA[idx].name = "S_75M_Volhov";
        DEMO_UNIT_DATA[idx].groupName = `Group`;
        DEMO_UNIT_DATA[idx].position.lat += idx / 100;
        DEMO_UNIT_DATA[idx].category = "GroundUnit";
        DEMO_UNIT_DATA[idx].isLeader = true;

        idx += 1;
        DEMO_UNIT_DATA[idx] = JSON.parse(JSON.stringify(baseData));
        DEMO_UNIT_DATA[idx].name = "SNR_75V";
        DEMO_UNIT_DATA[idx].groupName = `Group`;
        DEMO_UNIT_DATA[idx].position.lat += idx / 100;
        DEMO_UNIT_DATA[idx].category = "GroundUnit";
        DEMO_UNIT_DATA[idx].isLeader = false;

        idx += 1;
        DEMO_UNIT_DATA[idx] = JSON.parse(JSON.stringify(baseData));
        DEMO_UNIT_DATA[idx].name = "Ural-4320 APA-5D";
        DEMO_UNIT_DATA[idx].groupName = `Group`;
        DEMO_UNIT_DATA[idx].position.lat += idx / 100;
        DEMO_UNIT_DATA[idx].category = "GroundUnit";
        DEMO_UNIT_DATA[idx].isLeader = false;
        
        idx += 1;
        DEMO_UNIT_DATA[idx] = JSON.parse(JSON.stringify(baseData));
        DEMO_UNIT_DATA[idx].name = "F-14B";
        DEMO_UNIT_DATA[idx].groupName = `Group-1`;
        DEMO_UNIT_DATA[idx].position.lat += idx / 100;
        DEMO_UNIT_DATA[idx].category = "Aircraft";
        DEMO_UNIT_DATA[idx].isLeader = false;

        idx += 1;
        DEMO_UNIT_DATA[idx] = JSON.parse(JSON.stringify(baseData));
        DEMO_UNIT_DATA[idx].name = "Infantry AK";
        DEMO_UNIT_DATA[idx].groupName = `Group-2`;
        DEMO_UNIT_DATA[idx].position.lat += idx / 100;
        DEMO_UNIT_DATA[idx].category = "GroundUnit";
        DEMO_UNIT_DATA[idx].isLeader = true;

        idx += 1;
        DEMO_UNIT_DATA[idx] = JSON.parse(JSON.stringify(baseData));
        DEMO_UNIT_DATA[idx].name = "Infantry AK";
        DEMO_UNIT_DATA[idx].groupName = `Group-3`;
        DEMO_UNIT_DATA[idx].position.lat += idx / 100;
        DEMO_UNIT_DATA[idx].category = "GroundUnit";
        DEMO_UNIT_DATA[idx].isLeader = true;
        DEMO_UNIT_DATA[idx].coalition = 0;

        idx += 1;
        DEMO_UNIT_DATA[idx] = JSON.parse(JSON.stringify(baseData));
        DEMO_UNIT_DATA[idx].name = "KC-135";
        DEMO_UNIT_DATA[idx].groupName = `Group-4`;
        DEMO_UNIT_DATA[idx].position.lat += idx / 100;
        DEMO_UNIT_DATA[idx].category = "Aircraft";
        DEMO_UNIT_DATA[idx].isLeader = true;
        

        this.startTime = Date.now();
    }
    
    units(req, res){
        var array = new Uint8Array();
        var time = Date.now();
        array = this.concat(array, this.uint64ToByteArray(BigInt(time)));
        if (req.query["time"] == 0){
            for (let idx in DEMO_UNIT_DATA) {
                const unit = DEMO_UNIT_DATA[idx];
                array = this.concat(array, this.uint32ToByteArray(idx));
                array = this.appendString(array, unit.category, 1);
                array = this.appendUint8(array, unit.alive, 2);
                array = this.appendUint8(array, unit.human, 3);
                array = this.appendUint8(array, unit.controlled, 4);
                array = this.appendUint16(array, unit.coalition, 5);
                array = this.appendUint8(array, unit.country, 6);
                array = this.appendString(array, unit.name, 7);
                array = this.appendString(array, unit.unitName, 8);
                array = this.appendString(array, unit.groupName, 9);
                array = this.appendUint8(array, unit.state, 10);
                array = this.appendString(array, unit.task, 11);
                array = this.appendUint8(array, unit.hasTask, 12);
                array = this.appendCoordinates(array, unit.position, 13);
                array = this.appendDouble(array, unit.speed, 14);
                array = this.appendDouble(array, unit.horizontalVelocity, 15);
                array = this.appendDouble(array, unit.verticalVelicity, 16);
                array = this.appendDouble(array, unit.heading, 17);
                array = this.appendUint8(array, unit.isActiveTanker, 18);
                array = this.appendUint8(array, unit.isActiveAWACS, 19);
                array = this.appendUint8(array, unit.onOff, 20);
                array = this.appendUint8(array, unit.followRoads, 21);
                array = this.appendUint16(array, unit.fuel, 22);
                array = this.appendDouble(array, unit.desiredSpeed, 23);
                array = this.appendUint8(array, unit.desiredSpeedType, 24);
                array = this.appendDouble(array, unit.desiredAltitude, 25);
                array = this.appendUint8(array, unit.desiredAltitudeType, 26);
                array = this.appendUint32(array, unit.leaderID, 27);
                array = this.appendOffset(array, unit.formationOffset, 28);
                array = this.appendUint32(array, unit.targetID, 29);
                array = this.appendCoordinates(array, unit.targetPosition, 30);
                array = this.appendUint8(array, unit.ROE, 31);
                array = this.appendUint8(array, unit.reactionToThreat, 32);
                array = this.appendUint8(array, unit.emissionsCountermeasures, 33);
                array = this.appendTACAN(array, unit.TACAN, 34);
                array = this.appendRadio(array, unit.radio, 35);
                array = this.appendRadio(array, unit.generalSettings, 36);
                array = this.appendAmmo(array, unit.ammo, 37);
                array = this.appendContacts(array, unit.contacts, 38);
                array = this.appendActivePath(array, unit.activePath, 39);
                array = this.appendUint8(array, unit.isLeader, 40);
                array = this.appendUint8(array, unit.operateAs, 41);
                array = this.concat(array, this.uint8ToByteArray(255));
            }
        }
        res.end(Buffer.from(array, 'binary'));
    };

    weapons(req, res){
        var array = new Uint8Array();
        var time = Date.now();
        array = this.concat(array, this.uint64ToByteArray(BigInt(time)));
        for (let idx in DEMO_WEAPONS_DATA) {
            const weapon = DEMO_WEAPONS_DATA[idx];
            array = this.concat(array, this.uint32ToByteArray(idx));
            array = this.appendString(array, weapon.category, 1);
            array = this.appendUint8(array, weapon.alive, 2);
            array = this.appendUint16(array, weapon.coalition, 5);
            array = this.appendString(array, weapon.name, 7);
            array = this.appendCoordinates(array, weapon.position, 13);
            array = this.appendDouble(array, weapon.speed, 14);
            array = this.appendDouble(array, weapon.heading, 15);
            array = this.concat(array, this.uint8ToByteArray(255));
        }
        res.end(Buffer.from(array, 'binary'));
    };

    concat(array1, array2) {
        var mergedArray = new Uint8Array(array1.length + array2.length);
        mergedArray.set(array1);
        mergedArray.set(array2, array1.length);
        return mergedArray;
    }
    
    uint8ToByteArray(number) {
        var buffer = new ArrayBuffer(1);         
        var longNum = new Uint8Array(buffer);  
        longNum[0] = number;
        return Array.from(new Uint8Array(buffer));
    }
    
    uint16ToByteArray(number) {
        var buffer = new ArrayBuffer(2);         
        var longNum = new Uint16Array(buffer);  
        longNum[0] = number;
        return Array.from(new Uint8Array(buffer));
    }
    
    uint32ToByteArray(number) {
        var buffer = new ArrayBuffer(4);         
        var longNum = new Uint32Array(buffer);  
        longNum[0] = number;
        return Array.from(new Uint8Array(buffer));
    }
    
    uint64ToByteArray(number) {
        var buffer = new ArrayBuffer(8);         
        var longNum = new BigUint64Array(buffer);  
        longNum[0] = number;
        return Array.from(new Uint8Array(buffer));
    }
    
    doubleToByteArray(number) {
        var buffer = new ArrayBuffer(8);         
        var longNum = new Float64Array(buffer);  
        longNum[0] = number;
        return Array.from(new Uint8Array(buffer));
    }
    
    appendUint8(array, number, datumIndex) {
        array = this.concat(array, this.uint8ToByteArray(datumIndex));
        array = this.concat(array, this.uint8ToByteArray(number));
        return array;
    }
    
    appendUint16(array, number, datumIndex) {
        array = this.concat(array, this.uint8ToByteArray(datumIndex));
        array = this.concat(array, this.uint16ToByteArray(number));
        return array;
    }
    
    appendUint32(array, number, datumIndex) {
        array = this.concat(array, this.uint8ToByteArray(datumIndex));
        array = this.concat(array, this.uint32ToByteArray(number));
        return array;
    }
    
    appendDouble(array, number, datumIndex) {
        array = this.concat(array, this.uint8ToByteArray(datumIndex));
        array = this.concat(array, this.doubleToByteArray(number));
        return array;
    }
    
    appendCoordinates(array, coordinates, datumIndex) {
        array = this.concat(array, this.uint8ToByteArray(datumIndex));
        array = this.concat(array, this.doubleToByteArray(coordinates.lat));
        array = this.concat(array, this.doubleToByteArray(coordinates.lng));
        array = this.concat(array, this.doubleToByteArray(coordinates.alt));
        return array;
    }
    
    appendOffset(array, offset, datumIndex) {
        array = this.concat(array, this.uint8ToByteArray(datumIndex));
        array = this.concat(array, this.doubleToByteArray(offset.x));
        array = this.concat(array, this.doubleToByteArray(offset.y));
        array = this.concat(array, this.doubleToByteArray(offset.z));
        return array;
    }
    
    appendString(array, string, datumIndex) {
        array = this.concat(array, this.uint8ToByteArray(datumIndex));
        array = this.concat(array, this.uint16ToByteArray(string.length));
        array = this.concat(array, enc.encode(string));
        return array;
    }

    padString(string, length) {
        while (string.length < length)
            string += " ";
        return string.substring(0, length);
    }
    
    appendTACAN(array, TACAN, datumIndex) {
        array = this.concat(array, this.uint8ToByteArray(datumIndex));
        array = this.concat(array, this.uint8ToByteArray(TACAN.isOn));
        array = this.concat(array, this.uint8ToByteArray(TACAN.channel));
        array = this.concat(array, enc.encode(TACAN.XY));
        array = this.concat(array, enc.encode(this.padString(TACAN.callsign, 4)));
        return array;
    }
    
    appendRadio(array, radio, datumIndex) {
        array = this.concat(array, this.uint8ToByteArray(datumIndex));
        array = this.concat(array, this.uint32ToByteArray(radio.frequency));
        array = this.concat(array, this.uint8ToByteArray(radio.callsign));
        array = this.concat(array, this.uint8ToByteArray(radio.callsignNumber));
        return array;
    }
    
    appendGeneralSettings(array, generalSettings, datumIndex) {
        array = this.concat(array, this.uint8ToByteArray(datumIndex));
        array = this.concat(array, this.uint8ToByteArray(generalSettings.prohibitAA));
        array = this.concat(array, this.uint8ToByteArray(generalSettings.prohibitAfterburner));
        array = this.concat(array, this.uint8ToByteArray(generalSettings.prohibitAG));
        array = this.concat(array, this.uint8ToByteArray(generalSettings.prohibitAirWpn));
        array = this.concat(array, this.uint8ToByteArray(generalSettings.prohibitJettison));
        return array;
    }

    appendAmmo(array, ammo, datumIndex) {
        array = this.concat(array, this.uint8ToByteArray(datumIndex));
        array = this.concat(array, this.uint16ToByteArray(ammo.length));
        ammo.forEach((element) => {
            array = this.concat(array, this.uint16ToByteArray(element.quantity));
            array = this.concat(array, enc.encode(this.padString(element.name, 33)));
            array = this.concat(array, this.uint8ToByteArray(element.guidance));
            array = this.concat(array, this.uint8ToByteArray(element.category));
            array = this.concat(array, this.uint8ToByteArray(element.missileCategory));
        })
        return array;
    }

    appendContacts(array, contacts, datumIndex) {
        array = this.concat(array, this.uint8ToByteArray(datumIndex));
        array = this.concat(array, this.uint16ToByteArray(contacts.length));
        contacts.forEach((element) => {
            array = this.concat(array, this.uint32ToByteArray(element.ID));
            array = this.concat(array, this.uint8ToByteArray(element.detectionMethod));
        })
        return array;
    }

    appendActivePath(array, activePath, datumIndex) {
        array = this.concat(array, this.uint8ToByteArray(datumIndex));
        array = this.concat(array, this.uint16ToByteArray(activePath.length));
        activePath.forEach((element) => {
            array = this.concat(array, this.doubleToByteArray(element.lat));
            array = this.concat(array, this.doubleToByteArray(element.lng));
            array = this.concat(array, this.doubleToByteArray(element.alt));
        })
        return array;
    }
    
    logs(req, res){
        var ret = {logs: {"1": "I'm a log!", "2": "I'm a different log!"}};
        ret.time = Date.now();
        ret.frameRate = 60;
        ret.load = 0;
        res.send(JSON.stringify(ret));
    };
    
    airbases(req, res){
        var ret = {airbases: {
            ["0"]: {
                callsign: "Nellis",
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

        ret.mission.dateAndTime = {
            time: { h: 10, m: 15, s: 34 },
            date: "",
            elapsedTime: (Date.now() - this.startTime) / 1000,
            startTime: 0
        }

        ret.mission.coalitions = {
            red: [ 
                'RUSSIA',
                'CHINA'
            ],
            blue: [
                'UK',
                'USA'
            ],
            neutral: [
                'ITALY'
            ]
        }

        ret.mission.commandModeOptions = {
            restrictSpawns: true,
            restrictToCoalition: true,
            setupTime: 0,
            spawnPoints: {
                red: 400,
                blue: 400
            }, 
            eras: ["WW2", "Early Cold War", "Late Cold War", "Modern"]
        }

        var auth = req.get("Authorization");
        if (auth) {
            var username = Buffer.from(auth.replace("Basic ", ""), 'base64').toString('binary').split(":")[0];
            switch (username) {
                case "admin":
                    ret.mission.commandModeOptions.commandMode = "Game master";
                    break
                case "blue": 
                    ret.mission.commandModeOptions.commandMode = "Blue commander";
                    break;
                case "red": 
                    ret.mission.commandModeOptions.commandMode = "Red commander";
                    break;
            }
        }
        res.send(JSON.stringify(ret));
    }

    command(req, res) {
        var ret = {commandExecuted: Math.random() > 0.5};
        res.send(JSON.stringify(ret));
    }
    
    put(req, res) {
        var ret = {commandHash: Math.random().toString(36).slice(2, 19)}
        res.send(JSON.stringify(ret));
    }

}

module.exports = DemoDataGenerator;