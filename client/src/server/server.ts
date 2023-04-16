import * as L from 'leaflet'
import { setConnected } from '..';
import { SpawnOptions } from '../controls/mapcontextmenu';

var REST_ADDRESS = "http://localhost:30000/olympus";
var DEMO_ADDRESS = window.location.href + "demo";
const UNITS_URI = "units";
const LOGS_URI = "logs";
const AIRBASES_URI = "airbases";
const BULLSEYE_URI = "bullseyes";
const MISSION_URI = "mission";

var lastUpdateTime = 0;
var demoEnabled = false;

export function toggleDemoEnabled()
{
    demoEnabled = !demoEnabled;
}

export function GET(callback: CallableFunction, uri: string){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", `${demoEnabled? DEMO_ADDRESS: REST_ADDRESS}/${uri}`, true);
    xmlHttp.onload = function (e) {
        var data = JSON.parse(xmlHttp.responseText);
        if (parseInt(data.time) > lastUpdateTime)
        {
            callback(data);
            lastUpdateTime = parseInt(data.time);
            if (isNaN(lastUpdateTime))
                lastUpdateTime = 0;
            setConnected(true);
        }
    };
    xmlHttp.onerror = function () {
        console.error("An error occurred during the XMLHttpRequest");
        setConnected(false);
    };
    xmlHttp.send(null);
}

export function POST(request: object, callback: CallableFunction){
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", demoEnabled? DEMO_ADDRESS: REST_ADDRESS);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = () => { 
        callback(); 
    };
    xhr.send(JSON.stringify(request));
}

export function getConfig(callback: CallableFunction) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", window.location.href + "config", true);
    xmlHttp.onload = function (e) {
        var data = JSON.parse(xmlHttp.responseText);
        callback(data);
    };
    xmlHttp.onerror = function () {
        console.error("An error occurred during the XMLHttpRequest, could not retrieve configuration file");
    };
    xmlHttp.send(null);
}

export function setAddress(address: string, port: number) {
    REST_ADDRESS = `http://${address}:${port}/olympus`
    console.log(`Setting REST address to ${REST_ADDRESS}`)
}

export function getAirbases(callback: CallableFunction) {
    GET(callback, AIRBASES_URI);
}

export function getBullseye(callback: CallableFunction) {
    GET(callback, BULLSEYE_URI);
}

export function getLogs(callback: CallableFunction) {
    GET(callback, LOGS_URI);
}

export function getMission(callback: CallableFunction) {
    GET(callback, MISSION_URI);
}

export function getUnits(callback: CallableFunction, refresh: boolean = false) {
    GET(callback, `${UNITS_URI}?time=${refresh? 0: lastUpdateTime}`);
}

export function addDestination(ID: number, path: any) {
    var command = { "ID": ID, "path": path }
    var data = { "setPath": command }
    POST(data, () => { });
}

export function spawnSmoke(color: string, latlng: L.LatLng) {
    var command = { "color": color, "location": latlng };
    var data = { "smoke": command }
    POST(data, () => { });
}

export function spawnGroundUnit(spawnOptions: SpawnOptions) {
    var command = { "type": spawnOptions.type, "location": spawnOptions.latlng, "coalition": spawnOptions.coalition };
    var data = { "spawnGround": command }
    POST(data, () => { });
}

export function spawnAircraft(spawnOptions: SpawnOptions) {
    var command = { "type": spawnOptions.type, "location": spawnOptions.latlng, "coalition": spawnOptions.coalition, "payloadName": spawnOptions.loadout != null? spawnOptions.loadout: "", "airbaseName": spawnOptions.airbaseName != null? spawnOptions.airbaseName: ""};
    var data = { "spawnAir": command }
    POST(data, () => { });
}

export function attackUnit(ID: number, targetID: number) {
    var command = { "ID": ID, "targetID": targetID };
    var data = { "attackUnit": command }
    POST(data, () => { });
}

export function followUnit(ID: number, targetID: number) {
    // X: front-rear, positive front
    // Y: top-bottom, positive bottom
    // Z: left-right, positive right
    
    var command = { "ID": ID, "targetID": targetID, "offsetX": -50, "offsetY": -10, "offsetZ": 50};
    var data = { "followUnit": command }
    POST(data, () => { });
}

export function cloneUnit(ID: number, latlng: L.LatLng) {
    var command = { "ID": ID, "location": latlng };
    var data = { "cloneUnit": command }
    POST(data, () => { });
}

export function deleteUnit(ID: number) {
    var command = { "ID": ID};
    var data = { "deleteUnit": command }
    POST(data, () => { });
}

export function landAt(ID: number, latlng: L.LatLng) {
    var command = { "ID": ID, "location": latlng };
    var data = { "landAt": command }
    POST(data, () => { });
}

export function changeSpeed(ID: number, speedChange: string) {
    var command = {"ID": ID, "change": speedChange}
    var data = {"changeSpeed": command}
    POST(data, () => { });
}

export function setSpeed(ID: number, speed: number) {
    var command = {"ID": ID, "speed": speed}
    var data = {"setSpeed": command}
    POST(data, () => { });
}

export function changeAltitude(ID: number, altitudeChange: string) {
    var command = {"ID": ID, "change": altitudeChange}
    var data = {"changeAltitude": command}
    POST(data, () => { });
}

export function setAltitude(ID: number, altitude: number) {
    var command = {"ID": ID, "altitude": altitude}
    var data = {"setAltitude": command}
    POST(data, () => { });
}

export function createFormation(ID: number, isLeader: boolean, wingmenIDs: number[]) {
    var command = {"ID": ID, "wingmenIDs": wingmenIDs, "isLeader": isLeader}
    var data = {"setLeader": command}
    POST(data, () => { });
}

export function setROE(ID: number, ROE: string) {
    var command = {"ID": ID, "ROE": ROE}
    var data = {"setROE": command}
    POST(data, () => { });
}

export function setReactionToThreat(ID: number, reactionToThreat: string) {
    var command = {"ID": ID, "reactionToThreat": reactionToThreat}
    var data = {"setReactionToThreat": command}
    POST(data, () => { });
}

export function refuel(ID: number) {
    var command = { "ID": ID };
    var data = { "refuel": command }
    POST(data, () => { });
}

export function setAdvacedOptions(ID: number, isTanker: boolean, isAWACS: boolean, TACANChannel: number, TACANXY: string, TACANCallsign: string, radioFrequency: number, radioCallsign: number, radioCallsignNumber: number)
{
    var command = { "ID": ID,
                    "isTanker": isTanker,
                    "isAWACS": isAWACS,
                    "TACANChannel": TACANChannel,
                    "TACANXY":  TACANXY,
                    "TACANCallsign": TACANCallsign,
                    "radioFrequency": radioFrequency,
                    "radioCallsign": radioCallsign,
                    "radioCallsignNumber": radioCallsignNumber
    };

    var data = { "setAdvancedOptions": command };
    POST(data, () => { });
}