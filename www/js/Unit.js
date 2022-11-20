class Unit 
{
    constructor(ID) {
        this.ID = ID;
        this.marker = new L.Marker.UnitMarker([0, 0], {riseOnHover: true});
        this.marker.addTo(map.getMap()).on('click', () => this.onClick());

        this._selected = false;

        this.unitName = undefined;
        this.groupName = undefined;
        this.name = undefined;
        this.latitude = undefined;
        this.longitude = undefined;
        this.altitude = undefined;
        this.heading = undefined;
        this.coalitionID = undefined;
        this.country = undefined;
        this.activePath = undefined;

        this._pathMarkers = [];
    }

    update(response)
    {
        this.name = response["name"];
        this.unitName = response["unitName"];
        this.groupName = response["groupName"];
        this.latitude = response["latitude"];
        this.longitude = response["longitude"];
        this.altitude = response["altitude"];
        this.heading = response["heading"];
        this.coalitionID = response["coalitionID"]
        if ("activePath" in response)
            this.activePath = response["activePath"]

        this.drawMarker();
        this.drawPath();
    }
    
    setSelected(selected)
    {
        this._selected = selected;
        this.marker.setSelected(selected);
        unitsHandler.onUnitSelection();
    }

    getSelected()
    {
        return this._selected;
    }

    addDestination(latlng)
    {
        var xy = latlng2xy(latlng.lat, latlng.lng)
        
        var xhr = new XMLHttpRequest();
        xhr.open("PUT", RESTaddress);

        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                console.log(this.unitName + " add destination to (" + latlng.lat + ", " + latlng.lng + ")")
            }
        };

        var command = undefined;
        if (this.activePath != undefined)
        {
            var newPath = this.activePath;
            newPath[(Object.keys(newPath).length + 1).toString()] = latlng;
            command = {"ID": this.ID, "unitName": this.unitName, "path": newPath}
        }
        else
        {
            command = {"ID": this.ID, "unitName": this.unitName, "path": {"1": latlng}}
        }
        
        var data = {"setPath": command}

        xhr.send(JSON.stringify(data));
    }

    clearDestinations()
    {
        this.activePath = undefined;
    }

    onClick(e) 
    {
        // TODO if ctrl is pressed, don't deselect the other units
        unitsHandler.deselectAllUnits();
        this.setSelected(true);
    }

    drawMarker()
    {
        var zIndex = this.marker.getZIndex();
        var newLatLng = new L.LatLng(this.latitude, this.longitude);
        this.marker.setLatLng(newLatLng); 
        this.marker.setUnitName(this.unitName);
        this.marker.setAngle(this.heading);
        this.marker.setZIndex(zIndex);
    }

    drawPath()
    {
        for (let WP in this.activePath)
        {
            var destination = this.activePath[WP];
            if (parseInt(WP) - 1 >= this._pathMarkers.length)
            {
                var marker = L.marker([destination.lat, destination.lng]).addTo(map.getMap());
                this._pathMarkers.push(marker);
            }
            this._pathMarkers[parseInt(WP) - 1].setLatLng([destination.lat, destination.lng]);
        }
        this._pathMarkers
    }
}
