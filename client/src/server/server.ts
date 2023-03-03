import * as L from 'leaflet'
import { getUnitsManager, setConnected } from '..';
import { ConvertDDToDMS } from '../other/utils';

/* Edit here to change server address */
var RESTaddress = "http://localhost:30000/restdemo";

export function getDataFromDCS(callback: CallableFunction) {
    /* Request the updated unit data from the server */
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", RESTaddress, true);

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

export function addDestination(ID: number, path: any) {
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", RESTaddress);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = () => { };

    var command = { "ID": ID, "path": path }
    var data = { "setPath": command }

    xhr.send(JSON.stringify(data));
}

export function spawnSmoke(color: string, latlng: L.LatLng) {
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", RESTaddress);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            //console.log("Added " + color + " smoke at " + ConvertDDToDMS(latlng.lat, false) + " " + ConvertDDToDMS(latlng.lng, true));
        }
    };

    var command = { "color": color, "location": latlng };
    var data = { "smoke": command }

    xhr.send(JSON.stringify(data));
}

export function spawnGroundUnit(type: string, latlng: L.LatLng, coalition: string) {
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", RESTaddress);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            //console.log("Added " + coalition + " " + type + " at " + ConvertDDToDMS(latlng.lat, false) + " " + ConvertDDToDMS(latlng.lng, true));
        }
    };

    var command = { "type": type, "location": latlng, "coalition": coalition };
    var data = { "spawnGround": command }

    xhr.send(JSON.stringify(data));
}

export function spawnAircraft(type: string, latlng: L.LatLng, coalition: string, payloadName: string | null = null, airbaseName: string | null = null) {
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", RESTaddress);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            //console.log("Added " + coalition + " " + type + " at " + ConvertDDToDMS(latlng.lat, false) + " " + ConvertDDToDMS(latlng.lng, true));
        }
    };

    var command = { "type": type, "location": latlng, "coalition": coalition, "payloadName": payloadName != null? payloadName: "", "airbaseName": airbaseName != null? airbaseName: ""};
    var data = { "spawnAir": command }

    xhr.send(JSON.stringify(data));
}

export function attackUnit(ID: number, targetID: number) {
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", RESTaddress);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            //console.log("Unit " + getUnitsManager().getUnitByID(ID).unitName + " attack " + getUnitsManager().getUnitByID(targetID).unitName);
        }
    };

    var command = { "ID": ID, "targetID": targetID };
    var data = { "attackUnit": command }

    xhr.send(JSON.stringify(data));
}

export function cloneUnit(ID: number, latlng: L.LatLng) {
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", RESTaddress);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            //console.log("Unit " + getUnitsManager().getUnitByID(ID).unitName + " cloned");
        }
    };

    var command = { "ID": ID, "location": latlng };
    var data = { "cloneUnit": command }

    xhr.send(JSON.stringify(data));
}

export function deleteUnit(ID: number) {
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", RESTaddress);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            //console.log("Unit " + getUnitsManager().getUnitByID(ID).unitName + " cloned");
        }
    };

    var command = { "ID": ID};
    var data = { "deleteUnit": command }

    xhr.send(JSON.stringify(data));
}

export function landAt(ID: number, latlng: L.LatLng) {
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", RESTaddress);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            //console.log("Unit " + getUnitsManager().getUnitByID(ID).unitName + " cloned");
        }
    };

    var command = { "ID": ID, "location": latlng };
    var data = { "landAt": command }

    xhr.send(JSON.stringify(data));
}

export function changeSpeed(ID: number, speedChange: string) {
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", RESTaddress);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            //console.log(getUnitsManager().getUnitByID(ID).unitName + " speed change request: " + speedChange);
        }
    };
   
    var command = {"ID": ID, "change": speedChange}
    var data = {"changeSpeed": command}
   
    xhr.send(JSON.stringify(data));
}

export function setSpeed(ID: number, speed: number) {
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", RESTaddress);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            //console.log(getUnitsManager().getUnitByID(ID).unitName + " speed change request: " + speedChange);
        }
    };
   
    var command = {"ID": ID, "speed": speed}
    var data = {"setSpeed": command}
   
    xhr.send(JSON.stringify(data));
}

export function changeAltitude(ID: number, altitudeChange: string) {
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", RESTaddress);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            //console.log(getUnitsManager().getUnitByID(ID).unitName + " altitude change request: " + altitudeChange);
        }
    };

    var command = {"ID": ID, "change": altitudeChange}
    var data = {"changeAltitude": command}

    xhr.send(JSON.stringify(data));
}

export function setAltitude(ID: number, altitude: number) {
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", RESTaddress);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            //console.log(getUnitsManager().getUnitByID(ID).unitName + " speed change request: " + speedChange);
        }
    };
   
    var command = {"ID": ID, "altitude": altitude}
    var data = {"setAltitude": command}
   
    xhr.send(JSON.stringify(data));
}

export function createFormation(ID: number, isLeader: boolean, wingmenIDs: number[]) {
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", RESTaddress);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            //console.log(getUnitsManager().getUnitByID(ID).unitName  + " created formation with: " + wingmenIDs);
        }
    };

    var command = {"ID": ID, "wingmenIDs": wingmenIDs, "isLeader": isLeader}
    var data = {"setLeader": command}

    xhr.send(JSON.stringify(data));
}

export function setROE(ID: number, ROE: string) {
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", RESTaddress);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            //console.log(getUnitsManager().getUnitByID(ID).unitName + " speed change request: " + speedChange);
        }
    };
   
    var command = {"ID": ID, "ROE": ROE}
    var data = {"setROE": command}
   
    xhr.send(JSON.stringify(data));
}

export function setReactionToThreat(ID: number, reactionToThreat: string) {
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", RESTaddress);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            //console.log(getUnitsManager().getUnitByID(ID).unitName + " speed change request: " + speedChange);
        }
    };
   
    var command = {"ID": ID, "reactionToThreat": reactionToThreat}
    var data = {"setReactionToThreat": command}
   
    xhr.send(JSON.stringify(data));
}