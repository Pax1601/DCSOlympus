import { ConvertDDToDMS } from 'Other/Utils.js'

export function spawnSmoke(color, latlng)
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

export function spawnGroundUnit(type, latlng, coalition)
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

export function spawnAircraft(type, latlng, coalition, payloadName = "", airbaseName = "")
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

export function attackUnit(ID, targetID)
{        
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", RESTaddress);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            console.log("Unit " + unitsManager.getUnitByID(ID).unitName + " attack " + unitsManager.getUnitByID(targetID).unitName );
        }
    };

    var command = {"ID": ID, "targetID": targetID};
    var data = {"attackUnit": command}

    xhr.send(JSON.stringify(data));
}

export function cloneUnit(ID)
{        
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", RESTaddress);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            console.log("Unit " + unitsManager.getUnitByID(ID).unitName + " cloned");
        }
    };

    var command = {"ID": ID};
    var data = {"cloneUnit": command}

    xhr.send(JSON.stringify(data));
}