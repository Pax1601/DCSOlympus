class UnitsFactory
{
    constructor()
    {
        this._units = {};
    }

    createUnit(ID)
    {
        this._units[ID] = new Unit(ID)
    }

    removeUnit(ID)
    {

    }

    deselectAllUnits()
    {
        for (let ID in this._units)
        {
            this._units[ID].setSelected(false);
        }
    }

    update(data)
    {
        for (let ID in data["units"])
        {
            // Create the unit if missing from the local array, then update the data. Drawing is handled by leaflet.
            if (!(ID in this._units)) this.createUnit(parseInt(ID));
            this._units[ID].update(data["units"][ID]);
        }
    }

    onUnitSelection()
    {
        if (this.getSelectedUnits().length > 0) map.setState("UNIT_SELECTED");
        else map.setState("IDLE");
    }

    getSelectedUnits()
    {
        var selectedUnits = [];
        for (let ID in this._units)
        {
            if (this._units[ID].getSelected()) 
            {
                selectedUnits.push(this._units[ID]);
            }
        }
        return selectedUnits;
    }

    addDestination(latlng)
    {
        for (let ID in this._units)
        {
            if (this._units[ID].getSelected()) 
            {
                this._units[ID].addDestination(latlng);
            }
        }
    }

    clearDestinations()
    {
        for (let ID in this._units)
        {
            if (this._units[ID].getSelected()) 
            {
                this._units[ID].clearDestinations();
            }
        }
    }

    selectFromBounds(bounds)
    {
        this.deselectAllUnits();
        for (let ID in this._units)
        {
            var latlng = new L.LatLng(this._units[ID].latitude, this._units[ID].longitude);
            if (bounds.contains(latlng))
            {
                this._units[ID].setSelected(true);
            }
        }
    }

    spawnSmoke(color, latlng)
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

    spawnGroundUnit(type, coalition, latlng)
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

    spawnAirUnit(type, latlng, coalition)
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
        var data = {"spawnAir": command}

        xhr.send(JSON.stringify(data));
    }
}