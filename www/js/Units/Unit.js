class Unit 
{
    constructor(ID, marker) 
    {
        this.ID = ID;
        this.selectable = true;

        // The marker is set by the inherited class
        this.marker = marker;
        this.marker.on('click', (e) => this.onClick(e));

        this._selected = false;

        this._pathMarkers = [];

        this._pathPolyline = new L.Polyline([], {color: '#2d3e50', weight: 3, opacity: 0.5, smoothFactor: 1});
        this._pathPolyline.addTo(map.getMap());

        this._targetsPolylines = [];

        this.leader = true;
        this.wingmen = [];
        this.formation = undefined;
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
        this.activePath = response["activePath"]
        this.speed = response["speed"];
        this.currentTask = response["currentTask"];

        this.leader = response["leader"];
        this.wingman = response["wingman"];

        this.wingmen = [];
        if (response["wingmenIDs"] != undefined)
        {
            for (let ID of response["wingmenIDs"])
            {
                this.wingmen.push(unitsManager.getUnitByID(ID));
            }
        }
        this.formation = response["formation"];

        this.missionData = missionData.getUnitData(this.ID)

        this.setSelected(this.getSelected() & this.alive)
        this.drawMarker();
        if (this.getSelected() && this.activePath != undefined)
        {
            this.drawPath();
        }
        else
        { 
            this.clearPath();
        }

        this.clearTargets();
        this.missionData = missionData.getUnitData(this.ID);
        if (this.missionData != undefined)
        {
            if (this.getSelected())
            {
                this.drawTargets();
            }
        }
    }
    
    setSelected(selected)
    {
        // Only alive units can be selected. Some units are not selectable (weapons)
        if ((this.alive || !selected) && this.selectable && this._selected != selected)
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
        // TODO move in dedicated file
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
            command = {"ID": this.ID, "path": newPath}
        }
        else
        {
            command = {"ID": this.ID, "path": {"1": latlng}}
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
        if (map.getState() === 'IDLE' || map.getState() === 'MOVE_UNIT' || e.originalEvent.ctrlKey)
        {
            if (!e.originalEvent.ctrlKey)
            {
                unitsManager.deselectAllUnits();
            }
            this.setSelected(true);
        }
        else if (map.getState() === 'ATTACK')
        {
            unitsManager.attackUnit(this.ID);
        }
        else if (map.getState() === 'FORMATION')
        {
            unitsManager.createFormation(this.ID);
        }
    }

    drawMarker(settings)
    {
        // Hide the marker if disabled
        if ((settings === 'none' || (settingsPanel.getSettings().deadAlive === "alive" && !this.alive)))
        {
            // Remove the marker if present
            if (map.getMap().hasLayer(this.marker))
            {
                map.getMap().removeLayer(this.marker);
            }
        }
        else {
            // Add the marker if not present
            if (!map.getMap().hasLayer(this.marker))
            {
                this.marker.addTo(map.getMap());
            }

            // Set the marker vibility
            this.marker.setLabelsVisibility((settings === 'labels' || this.getSelected()) && this.alive);

            // Draw the marker
            var zIndex = this.marker.getZIndex();
            var newLatLng = new L.LatLng(this.latitude, this.longitude);
            this.marker.setLatLng(newLatLng); 
            this.marker.setAngle(this.heading);
            this.marker.setZIndex(zIndex);
            this.marker.setAlive(this.alive);
            this.marker.setAltitude(this.altitude);
            this.marker.setSpeed(this.speed);
        }
    }

    drawPath()
    {
        var _points = [];
        _points.push(new L.LatLng(this.latitude, this.longitude));

        // Add markers if missing
        while (this._pathMarkers.length < Object.keys(this.activePath).length)
        {
            var marker = L.marker([0, 0]).addTo(map.getMap());
            this._pathMarkers.push(marker);
        }

        // Remove markers if too many 
        while (this._pathMarkers.length > Object.keys(this.activePath).length)
        {
            map.getMap().removeLayer(this._pathMarkers[this._pathMarkers.length - 1]);
            this._pathMarkers.splice(this._pathMarkers.length - 1, 1)
        }

        // Update the position of the existing markers (to avoid creating markers uselessly) 
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

    drawTargets()
    {
        for (let typeIndex in this.missionData.targets)
        {
            for (let index in this.missionData.targets[typeIndex])
            {
                var targetData = this.missionData.targets[typeIndex][index];
                var target = unitsManager.getUnitByID(targetData.object["id_"])
                if (target != undefined){
                    var startLatLng = new L.LatLng(this.latitude, this.longitude)
                    var endLatLng = new L.LatLng(target.latitude, target.longitude)
                    
                    var color;
                    if (typeIndex === "radar")
                    {
                        color = "#FFFF00";
                    }
                    else if (typeIndex === "visual")
                    {
                        color = "#FF00FF";
                    }
                    else if (typeIndex === "rwr")
                    {
                        color = "#00FF00";
                    }
                    else
                    {
                        color = "#FFFFFF";
                    }
                    var targetPolyline = new L.Polyline([startLatLng, endLatLng], {color: color, weight: 3, opacity: 1, smoothFactor: 1});
                    targetPolyline.addTo(map.getMap());
                    this._targetsPolylines.push(targetPolyline)
                }
            }
        }
    }

    clearTargets()
    {
        for (let index in this._targetsPolylines)
        {
            map.getMap().removeLayer(this._targetsPolylines[index])
        }
    }

    attackUnit(targetID)
    {
        // Call DCS attackUnit function
        if (this.ID != targetID)
        {        
            attackUnit(this.ID, targetID);
        }
        else
        {
            // TODO: show a message
        }
    }

    changeSpeed(speedChange)
    {
        // TODO move in dedicated file
        var xhr = new XMLHttpRequest();
        xhr.open("PUT", RESTaddress);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                console.log(this.unitName + " speed change request: " + speedChange);
            }
        };

        var command = {"ID": this.ID, "change": speedChange}
        var data = {"changeSpeed": command}

        xhr.send(JSON.stringify(data));
    }

    changeAltitude(altitudeChange)
    {
        // TODO move in dedicated file
        var xhr = new XMLHttpRequest();
        xhr.open("PUT", RESTaddress);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                console.log(this.unitName + " altitude change request: " + speedChange);
            }
        };

        var command = {"ID": this.ID, "change": altitudeChange}
        var data = {"changeAltitude": command}

        xhr.send(JSON.stringify(data));
    }

    setformation(formation)
    {
        // TODO move in dedicated file
        var xhr = new XMLHttpRequest();
        xhr.open("PUT", RESTaddress);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                console.log(this.unitName + " formation change: " + formation);
            }
        };

        var command = {"ID": this.ID, "formation": formation}
        var data = {"setFormation": command}

        xhr.send(JSON.stringify(data));
    }

    setLeader(wingmenIDs)
    {
        // TODO move in dedicated file
        var xhr = new XMLHttpRequest();
        xhr.open("PUT", RESTaddress);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                console.log(this.unitName + " created formation with: " + wingmenIDs);
            }
        };

        var command = {"ID": this.ID, "wingmenIDs": wingmenIDs}
        var data = {"setLeader": command}

        xhr.send(JSON.stringify(data));
    }
}

class AirUnit extends Unit
{
    drawMarker()
    {
        if (this.flags.Human)
        {
            super.drawMarker(settingsPanel.getSettings().human);
        }
        else
        {
            super.drawMarker(settingsPanel.getSettings().AI);
        }
    }
}

class Aircraft extends AirUnit
{
    constructor(ID, data)
    {
        var marker = new L.Marker.UnitMarker.AirUnitMarker.AircraftMarker({
            riseOnHover: true, 
            unitName: data.unitName,
            name: data.name,
            human: data.flags.Human,
            coalitionID: data.coalitionID
        });
        super(ID, marker);
    }
}

class Helicopter extends AirUnit
{
    constructor(ID, data)
    {
        var marker = new L.Marker.UnitMarker.AirUnitMarker.HelicopterMarker({
            riseOnHover: true, 
            unitName: data.unitName,
            name: data.name,
            human: data.flags.Human,
            coalitionID: data.coalitionID
        });
        super(ID, marker);
    }
}

class GroundUnit extends Unit
{
    constructor(ID, data)
    {
        var marker = new L.Marker.UnitMarker.GroundMarker({
            riseOnHover: true, 
            unitName: data.unitName,
            name: data.name,
            human: data.flags.Human,
            coalitionID: data.coalitionID
        });
        super(ID, marker);
    }

    drawMarker()
    {
        super.drawMarker(settingsPanel.getSettings().AI);
    }
}

class NavyUnit extends Unit
{
    constructor(ID, data)
    {
        var marker = new L.Marker.UnitMarker.NavyMarker({
            riseOnHover: true, 
            unitName: data.unitName,
            name: data.name,
            human: data.flags.Human,
            coalitionID: data.coalitionID
        });
        super(ID, marker);
    }

    drawMarker()
    {
        super.drawMarker(settingsPanel.getSettings().AI);
    }
}

class Weapon extends Unit
{
    constructor(ID, data)
    {
        super(ID, data);
        // Weapons can not be selected
        this.selectable = false;
    }

    drawMarker()
    {
        super.drawMarker(settingsPanel.getSettings().weapons);
    }

    onClick(e) 
    {
        // Weapons can not be clicked
    }
}

class Missile extends Weapon
{
    constructor(ID, data)
    {
        var marker = new L.Marker.UnitMarker.WeaponMarker.MissileMarker({
            riseOnHover: true, 
            unitName: "",
            name: data.name,
            human: data.flags.Human,
            coalitionID: data.coalitionID
        });
        super(ID, marker);
    }
}

class Bomb extends Weapon
{
    constructor(ID, data)
    {
        var marker = new L.Marker.UnitMarker.WeaponMarker.BombMarker({
            riseOnHover: true, 
            unitName: "",
            name: data.name,
            human: data.flags.Human,
            coalitionID: data.coalitionID
        });
        super(ID, marker);
    }
}
