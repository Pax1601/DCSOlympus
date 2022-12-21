class Unit 
{
    constructor(ID) {
        this.ID = ID;
        this.marker = new L.Marker.UnitMarker([0, 0], {riseOnHover: true});
        this.marker.addTo(map.getMap()).on('click', (e) => this.onClick(e));
        this.marker.addTo(map.getMap()).on('contextmenu', (e) => this.onRightClick(e));

        this._selected = false;

        this._pathMarkers = [];

        this._pathPolyline = new L.Polyline([], {color: '#2d3e50', weight: 3, opacity: 0.5, smoothFactor: 1});
        this._pathPolyline.addTo(map.getMap());
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
        this.coalitionID = response["coalitionID"];
        this.alive = response["alive"];
        this.type = response["type"];
        this.flags = response["flags"];

        /* Only present if an active path is available */
        if ("activePath" in response)
        {
            this.activePath = response["activePath"]
        }

        this.drawMarker();

        if (!this.alive)
        {
            this.setSelected(false);
        }

        if (this._selected && this.activePath != undefined)
        {
            this.drawPath();
        }
        else
        { 
            this.clearPath();
        }
    }

    getCategory()
    {
        if (this.type.level1 == 1)
        {
            return 'air';
        }
        else if (this.type.level1 == 2)
        {
            return 'ground';
        }
        else if (this.type.level1 == 3)
        {
            return 'navy';
        }
        else
        {
            return undefined;
        }
    }
    
    setSelected(selected)
    {
        /* Only alive units can be selected */
        if (this.alive || !selected)
        {
            this._selected = selected;
            this.marker.setSelected(selected);
            unitsManager.onUnitSelection();
        }
    }

    getSelected()
    {
        return this._selected;
    }

    addDestination(latlng)
    {
        var xhr = new XMLHttpRequest();
        xhr.open("PUT", RESTaddress);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                console.log(this.unitName + " add destination to " + ConvertDDToDMS(latlng.lat, false) + " " + ConvertDDToDMS(latlng.lng, true))
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
        if (!e.originalEvent.ctrlKey)
        {
            unitsManager.deselectAllUnits();
        }
        this.setSelected(true);
    }

    onRightClick(e) 
    {
        unitsManager.onUnitRightClick(this.ID);
    }

    drawMarker()
    {
        var zIndex = this.marker.getZIndex();
        var newLatLng = new L.LatLng(this.latitude, this.longitude);
        this.marker.setLatLng(newLatLng); 
        this.marker.setAngle(this.heading);
        this.marker.setZIndex(zIndex);
        this.marker.setAlive(this.alive);
        this.marker.setAltitude(this.altitude);
        this.marker.setHuman(this.flags.Human);
        this.marker.setCoalitionID(this.coalitionID);
        this.marker.setUnitName(this.unitName);
        this.marker.setName(this.name);

        if (this.getCategory() == "air")
        {
            this.marker.setImage("img/units/air.png");
        }
        else if (this.getCategory() == "ground")
        {
            this.marker.setImage("img/units/ground.png")
        }
    }

    drawPath()
    {
        var _points = [];
        _points.push(new L.LatLng(this.latitude, this.longitude));

        /* Add markers if missing */
        while (this._pathMarkers.length < Object.keys(this.activePath).length)
        {
            var marker = L.marker([0, 0]).addTo(map.getMap());
            this._pathMarkers.push(marker);
        }

        /* Remove markers if too many */
        while (this._pathMarkers.length > Object.keys(this.activePath).length)
        {
            map.getMap().removeLayer(this._pathMarkers[this._pathMarkers.length - 1]);
            this._pathMarkers.splice(this._pathMarkers.length - 1, 1)
        }

        /* Update the position of the existing markers (to avoid creating markers uselessly) */
        for (let WP in this.activePath)
        {
            var destination = this.activePath[WP];
            this._pathMarkers[parseInt(WP) - 1].setLatLng([destination.lat, destination.lng]);
            _points.push(new L.LatLng(destination.lat, destination.lng));
            this._pathPolyline.setLatLngs(_points);
        }
    }

    clearPath()
    {
        for (let WP in this._pathMarkers)
        {
            map.getMap().removeLayer(this._pathMarkers[WP]);
        }
        this._pathMarkers = [];
        this._pathPolyline.setLatLngs([]);
    }

    attackUnit(targetID)
    {
        attackUnit(this.ID, targetID);
    }
}
