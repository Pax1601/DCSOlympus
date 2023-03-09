import * as L from 'leaflet'
import { setConnected } from '..';
import { SpawnOptions } from '../controls/contextmenu';

/* Edit here to change server address */
const REST_ADDRESS = "http://localhost:30000/olympus";
const UNITS_URI = "units";
const REFRESH_URI = "refresh";
const UPDATE_URI = "update";
const LOGS_URI = "logs";
const AIRBASES_URI = "airbases";
const BULLSEYE_URI = "bullseyes";

export function GET(callback: CallableFunction, uri: string){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", `${REST_ADDRESS}/${uri}`, true);
    xmlHttp.onload = function (e) {
        var data = JSON.parse(xmlHttp.responseText);
        callback(data);
        setConnected(true);
    };
    xmlHttp.onerror = function () {
        console.error("An error occurred during the XMLHttpRequest");
        setConnected(false);
    };
    xmlHttp.send(null);
}

export function POST(request: object, callback: CallableFunction){
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", REST_ADDRESS);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = () => { 
        callback(); 
    };
    xhr.send(JSON.stringify(request));
}

export function getAirbases(callback: CallableFunction) {
    GET(callback, AIRBASES_URI);
}

export function getBulllseye(callback: CallableFunction) {
    GET(callback, BULLSEYE_URI);
}

export function getLogs(callback: CallableFunction) {
    GET(callback, LOGS_URI);
}

export function getUnits(callback: CallableFunction, refresh: boolean = false) {
    GET(callback, `${UNITS_URI}/${refresh? REFRESH_URI: UPDATE_URI}`);
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

export function spawnGroundUnit(type: string, latlng: L.LatLng, coalition: string) {
    var command = { "type": type, "location": latlng, "coalition": coalition };
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
