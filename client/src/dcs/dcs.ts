import * as L from 'leaflet'
import { ConvertDDToDMS } from '../other/utils';

/* Edit here to change server address */
var RESTaddress = "http://localhost:30000/restdemo";

export function getDataFromDCS(callback: CallableFunction)
{
    /* Request the updated unit data from the server */
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", RESTaddress, true); 

    xmlHttp.onload = function(e) 
    {
        var data = JSON.parse(xmlHttp.responseText);
        callback(data);
    };

    xmlHttp.onerror = function () {
        console.error("An error occurred during the XMLHttpRequest");
    };
    xmlHttp.send( null );
}

export function addDestination(ID: number, path: any)
{
    // TODO move in dedicated file
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", RESTaddress);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = () => {};

    var command = {"ID": ID, "path": path}
    var data = {"setPath": command}

    xhr.send(JSON.stringify(data));
}

export function spawnSmoke(color: string, latlng: L.LatLng)
{
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", RESTaddress);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            console.log("Added " + color + " smoke at " + ConvertDDToDMS(latlng.lat, false) + " " + ConvertDDToDMS(latlng.lng, true));
        }
    };

    var command = {"color": color, "location": latlng};
    var data = {"smoke": command}

    xhr.send(JSON.stringify(data));
}

export function spawnGroundUnit(type: string, latlng: L.LatLng, coalition: string)
{        
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", RESTaddress);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            console.log("Added " + coalition + " " + type + " at " + ConvertDDToDMS(latlng.lat, false) + " " + ConvertDDToDMS(latlng.lng, true));
        }
    };

    var command = {"type": type, "location": latlng, "coalition": coalition};
    var data = {"spawnGround": command}

    xhr.send(JSON.stringify(data));
}

export function spawnAircraft(type: string, latlng: L.LatLng, coalition: string, payloadName = "", airbaseName = "")
{        
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", RESTaddress);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            console.log("Added " + coalition + " " + type + " at " + ConvertDDToDMS(latlng.lat, false) + " " + ConvertDDToDMS(latlng.lng, true));
        }
    };

    var command = {"type": type, "location": latlng, "coalition": coalition, "payloadName": payloadName, "airbaseName": airbaseName};
    var data = {"spawnAir": command}

    xhr.send(JSON.stringify(data));
}

export function attackUnit(ID: number, targetID: number)
{        
    //var xhr = new XMLHttpRequest();
    //xhr.open("PUT", RESTaddress);
    //xhr.setRequestHeader("Content-Type", "application/json");
    //xhr.onreadystatechange = () => {
    //    if (xhr.readyState === 4) {
    //        console.log("Unit " + unitsManager.getUnitByID(ID).unitName + " attack " + unitsManager.getUnitByID(targetID).unitName );
    //    }
    //};
//
    //var command = {"ID": ID, "targetID": targetID};
    //var data = {"attackUnit": command}
//
    //xhr.send(JSON.stringify(data));
}

export function cloneUnit(ID: number)
{        
    //var xhr = new XMLHttpRequest();
    //xhr.open("PUT", RESTaddress);
    //xhr.setRequestHeader("Content-Type", "application/json");
    //xhr.onreadystatechange = () => {
    //    if (xhr.readyState === 4) {
    //        console.log("Unit " + unitsManager.getUnitByID(ID).unitName + " cloned");
    //    }
    //};
//
    //var command = {"ID": ID};
    //var data = {"cloneUnit": command}
//
    //xhr.send(JSON.stringify(data));
}
