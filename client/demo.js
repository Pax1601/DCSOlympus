var basicAuth = require('express-basic-auth')
var enc = new TextEncoder();

const DEMO_UNIT_DATA = {
    ["1"]:{ category: "Aircraft", alive: true, human: false, controlled: true, coalition: 2, country: 0, name: "KC-135", unitName: "Cool guy 1-1 who also has a very long name", groupName: "Cool group 1", state: 3, task: "Being cool!",
        hasTask: true, position: { lat: 37, lng: -116, alt: 1000 }, speed: 200, heading: 45, isTanker: true, isAWACS: false, onOff: true, followRoads: false, fuel: 50, 
        desiredSpeed: 300, desiredSpeedType: 1, desiredAltitude: 1000, desiredAltitudeType: 1, leaderID: 0,
        formationOffset: { x: 0, y: 0, z: 0 },
        targetID: 2,
        targetPosition: { lat: 0, lng: 0, alt: 0 },
        ROE: 2,
        reactionToThreat: 1,
        emissionsCountermeasures: 1,
        TACAN: { isOn: false, XY: 'Y', callsign: 'TKR', channel: 40 },
        radio: { frequency: 124000000, callsign: 1, callsignNumber: 1 },
        generalSettings: { prohibitAA: false, prohibitAfterburner: false, prohibitAG: false, prohibitAirWpn: false, prohibitJettison: false },
        ammo: [{ quantity: 2, name: "A cool missile\0Ciao", guidance: 0, category: 0, missileCategory: 0 } ],
        contacts: [{ID: 2, detectionMethod: 1}, {ID: 3, detectionMethod: 4}],
        activePath: [{lat: 38, lng: -115, alt: 0}, {lat: 38, lng: -114, alt: 0}]
    },
    ["2"]:{ category: "Aircraft", alive: true, human: false, controlled: false, coalition: 1, country: 0, name: "FA-18C_hornet", unitName: "Cool guy 1-2", groupName: "Cool group 2", state: 1, task: "Being cool",
        hasTask: false, position: { lat: 36.9, lng: -116, alt: 1000 }, speed: 200, heading: 315 * Math.PI / 180, isTanker: false, isAWACS: false, onOff: true, followRoads: false, fuel: 50, 
        desiredSpeed: 300, desiredSpeedType: 1, desiredAltitude: 1000, desiredAltitudeType: 1, leaderID: 0,
        formationOffset: { x: 0, y: 0, z: 0 },
        targetID: 0,
        targetPosition: { lat: 0, lng: 0, alt: 0 },
        ROE: 2,
        reactionToThreat: 1,
        emissionsCountermeasures: 1,
        TACAN: { isOn: false, XY: 'Y', callsign: 'TKR', channel: 40 },
        radio: { frequency: 124000000, callsign: 1, callsignNumber: 1 },
        generalSettings: { prohibitAA: false, prohibitAfterburner: false, prohibitAG: false, prohibitAirWpn: false, prohibitJettison: false },
        ammo: [{ quantity: 2, name: "A cool missile", guidance: 0, category: 0, missileCategory: 0 } ],
        contacts: [{ID: 1, detectionMethod: 16}],
        activePath: [ ]
    }, ["3"]:{ category: "Missile", alive: true, human: false, controlled: false, coalition: 1, country: 0, name: "", unitName: "Cool guy 1-3", groupName: "Cool group 3", state: 1, task: "Being cool",
        hasTask: false, position: { lat: 37.1, lng: -116, alt: 1000 }, speed: 200, heading: 315 * Math.PI / 180, isTanker: false, isAWACS: false, onOff: true, followRoads: false, fuel: 50, 
        desiredSpeed: 300, desiredSpeedType: 1, desiredAltitude: 1000, desiredAltitudeType: 1, leaderID: 0,
        formationOffset: { x: 0, y: 0, z: 0 },
        targetID: 0,
        targetPosition: { lat: 0, lng: 0, alt: 0 },
        ROE: 2,
        reactionToThreat: 1,
        emissionsCountermeasures: 1,
        TACAN: { isOn: false, XY: 'Y', callsign: 'TKR', channel: 40 },
        radio: { frequency: 124000000, callsign: 1, callsignNumber: 1 },
        generalSettings: { prohibitAA: false, prohibitAfterburner: false, prohibitAG: false, prohibitAirWpn: false, prohibitJettison: false },
        ammo: [{ quantity: 2, name: "A cool missile", guidance: 0, category: 0, missileCategory: 0 } ],
        contacts: [{ID: 1, detectionMethod: 16}],
        activePath: [ ]
    }, ["4"]:{ category: "Helicopter", alive: true, human: false, controlled: false, coalition: 1, country: 0, name: "AH-64D_BLK_II", unitName: "Cool guy 1-4", groupName: "Cool group 3", state: 1, task: "Being cool",
        hasTask: false, position: { lat: 37.1, lng: -116.1, alt: 1000 }, speed: 200, heading: 315 * Math.PI / 180, isTanker: false, isAWACS: false, onOff: true, followRoads: false, fuel: 50, 
        desiredSpeed: 300, desiredSpeedType: 1, desiredAltitude: 1000, desiredAltitudeType: 1, leaderID: 0,
        formationOffset: { x: 0, y: 0, z: 0 },
        targetID: 0,
        targetPosition: { lat: 0, lng: 0, alt: 0 },
        ROE: 2,
        reactionToThreat: 1,
        emissionsCountermeasures: 1,
        TACAN: { isOn: false, XY: 'Y', callsign: 'TKR', channel: 40 },
        radio: { frequency: 124000000, callsign: 1, callsignNumber: 1 },
        generalSettings: { prohibitAA: false, prohibitAfterburner: false, prohibitAG: false, prohibitAirWpn: false, prohibitJettison: false },
        ammo: [{ quantity: 2, name: "A cool missile", guidance: 0, category: 0, missileCategory: 0 } ],
        contacts: [{ID: 1, detectionMethod: 16}],
        activePath: [ ]
    }, ["5"]:{ category: "GroundUnit", alive: true, human: false, controlled: true, coalition: 1, country: 0, name: "Gepard", unitName: "Cool guy 2-1", groupName: "Cool group 4", state: 1, task: "Being cool",
        hasTask: false, position: { lat: 37.2, lng: -116.1, alt: 1000 }, speed: 200, heading: 315 * Math.PI / 180, isTanker: false, isAWACS: false, onOff: true, followRoads: false, fuel: 50, 
        desiredSpeed: 300, desiredSpeedType: 1, desiredAltitude: 1000, desiredAltitudeType: 1, leaderID: 0,
        formationOffset: { x: 0, y: 0, z: 0 },
        targetID: 0,
        targetPosition: { lat: 0, lng: 0, alt: 0 },
        ROE: 2,
        reactionToThreat: 1,
        emissionsCountermeasures: 1,
        TACAN: { isOn: false, XY: 'Y', callsign: 'TKR', channel: 40 },
        radio: { frequency: 124000000, callsign: 1, callsignNumber: 1 },
        generalSettings: { prohibitAA: false, prohibitAfterburner: false, prohibitAG: false, prohibitAirWpn: false, prohibitJettison: false },
        ammo: [{ quantity: 2, name: "A cool missile\0Ciao", guidance: 0, category: 0, missileCategory: 0 } ],
        contacts: [{ID: 1, detectionMethod: 16}],
        activePath: [ ],
        isLeader: true
    }, ["6"]:{ category: "GroundUnit", alive: true, human: false, controlled: true, coalition: 1, country: 0, name: "Gepard", unitName: "Cool guy 2-2", groupName: "Cool group 4", state: 1, task: "Being cool",
        hasTask: false, position: { lat: 37.21, lng: -116.1, alt: 1000 }, speed: 200, heading: 315 * Math.PI / 180, isTanker: false, isAWACS: false, onOff: true, followRoads: false, fuel: 50, 
        desiredSpeed: 300, desiredSpeedType: 1, desiredAltitude: 1000, desiredAltitudeType: 1, leaderID: 0,
        formationOffset: { x: 0, y: 0, z: 0 },
        targetID: 0,
        targetPosition: { lat: 0, lng: 0, alt: 0 },
        ROE: 2,
        reactionToThreat: 1,
        emissionsCountermeasures: 1,
        TACAN: { isOn: false, XY: 'Y', callsign: 'TKR', channel: 40 },
        radio: { frequency: 124000000, callsign: 1, callsignNumber: 1 },
        generalSettings: { prohibitAA: false, prohibitAfterburner: false, prohibitAG: false, prohibitAirWpn: false, prohibitJettison: false },
        ammo: [{ quantity: 2, name: "A cool missile", guidance: 0, category: 0, missileCategory: 0 } ],
        contacts: [{ID: 1, detectionMethod: 16}],
        activePath: [ ],
        isLeader: false
    }
}

class DemoDataGenerator {
    constructor(app)
    { 
        app.get('/demo/units', (req, res) => this.units(req, res));
        app.get('/demo/logs', (req, res) => this.logs(req, res));
        app.get('/demo/bullseyes', (req, res) => this.bullseyes(req, res));
        app.get('/demo/airbases', (req, res) => this.airbases(req, res));
        app.get('/demo/mission', (req, res) => this.mission(req, res));

        app.use('/demo', basicAuth({
            users: { 
                'admin': 'socks',
                'blue': 'bluesocks',
                'red': 'redsocks'
            },
        }))

        this.startTime = Date.now();
    }
    
    units(req, res){
        var array = new Uint8Array();
        var time = Date.now();
        array = this.concat(array, this.uint64ToByteArray(BigInt(time)));
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
            array = this.appendDouble(array, unit.heading, 15);
            array = this.appendUint8(array, unit.isTanker, 16);
            array = this.appendUint8(array, unit.isAWACS, 17);
            array = this.appendUint8(array, unit.onOff, 18);
            array = this.appendUint8(array, unit.followRoads, 19);
            array = this.appendUint16(array, unit.fuel, 20);
            array = this.appendDouble(array, unit.desiredSpeed, 21);
            array = this.appendUint8(array, unit.desiredSpeedType, 22);
            array = this.appendDouble(array, unit.desiredAltitude, 23);
            array = this.appendUint8(array, unit.desiredAltitudeType, 24);
            array = this.appendUint32(array, unit.leaderID, 25);
            array = this.appendOffset(array, unit.formationOffset, 26);
            array = this.appendUint32(array, unit.targetID, 27);
            array = this.appendCoordinates(array, unit.targetPosition, 28);
            array = this.appendUint8(array, unit.ROE, 29);
            array = this.appendUint8(array, unit.reactionToThreat, 30);
            array = this.appendUint8(array, unit.emissionsCountermeasures, 31);
            array = this.appendTACAN(array, unit.TACAN, 32);
            array = this.appendRadio(array, unit.radio, 33);
            array = this.appendRadio(array, unit.generalSettings, 34);
            array = this.appendAmmo(array, unit.ammo, 35);
            array = this.appendContacts(array, unit.contacts, 36);
            array = this.appendActivePath(array, unit.activePath, 37);
            array = this.appendUint8(array, unit.isLeader, 38);
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

        ret.mission.dateAndTime = {
            time: Date.now(),
            date: "",
            elapsedTime: (Date.now() - this.startTime) / 1000,
            startTime: 0
        }

        ret.mission.RTSOptions = {
            restrictSpawns: true,
            restrictToCoalition: true,
            setupTime: 300,
            spawnPoints: {
                red: 1000,
                blue: 400
            }, 
            eras: ["WW2", "Early Cold War", "Late Cold War", "Modern"]
        }

        var auth = req.get("Authorization");
        if (auth) {
            var username = atob(auth.replace("Basic ", "")).split(":")[0];
            switch (username) {
                case "admin":
                    ret.mission.RTSOptions.commandMode = "Game master";
                    break
                case "blue": 
                    ret.mission.RTSOptions.commandMode = "Blue commander";
                    break;
                case "red": 
                    ret.mission.RTSOptions.commandMode = "Red commander";
                    break;
            }
        }
        res.send(JSON.stringify(ret));
    }
    
}

module.exports = DemoDataGenerator;