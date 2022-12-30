function spawnSmoke(color, latlng)
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

function spawnGroundUnit(type, latlng, coalition)
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

function spawnAirUnit(type, latlng, coalition, payloadName)
{        
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", RESTaddress);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            console.log("Added " + coalition + " " + type + " at " + ConvertDDToDMS(latlng.lat, false) + " " + ConvertDDToDMS(latlng.lng, true));
        }
    };

    var command = {"type": type, "location": latlng, "coalition": coalition, "payloadName": payloadName};
    var data = {"spawnAir": command}

    xhr.send(JSON.stringify(data));
}

function attackUnit(unitID, targetID)
{        
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", RESTaddress);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            console.log("Unit " + unitsManager.getUnit(unitID).unitName + " attack " + unitsManager.getUnit(targetID).unitName );
        }
    };

    var command = {"unitID": unitID, "targetID": targetID};
    var data = {"attackUnit": command}

    xhr.send(JSON.stringify(data));
}