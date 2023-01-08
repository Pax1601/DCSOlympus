class MissionData
{
    constructor()
    {
        this._bullseye = undefined;
        this._bullseyeMarker = undefined;
        this._airbasesMarkers = {};
    }

    update(data)
    {
        this._bullseye = data.missionData.bullseye;
        this._unitsData = data.missionData.unitsData;
        this._airbases = data.missionData.airbases;
        this._drawBullseye();
        this._drawAirbases();
    }

    getUnitData(ID)
    {
        if (ID in this._unitsData)
        {
            return this._unitsData[ID];
        }
        else 
        {
            return undefined;
        }
    }

    _drawBullseye()
    {
        if (this._bullseyeMarker === undefined)
        {
            this._bullseyeMarker = new L.Marker([this._bullseye.lat, this._bullseye.lng]).addTo(map.getMap());
        }
        else
        {
            this._bullseyeMarker.setLatLng(new L.LatLng(this._bullseye.lat, this._bullseye.lng)); 
        }
    }

    _drawAirbases()
    {
        for (let idx in this._airbases)
        {
            var airbase = this._airbases[idx]
            if (this._airbasesMarkers[idx] === undefined)
            {
                this._airbasesMarkers[idx] = new L.Marker.AirbaseMarker(new L.LatLng(airbase.lat, airbase.lng), {name: airbase.callsign}).addTo(map.getMap());
                this._airbasesMarkers[idx].on('click', (e) => this._onAirbaseClick(e));
            }
            else
            {
                this._airbasesMarkers[idx].setCoalitionID(airbase.coalition);
                this._airbasesMarkers[idx].setLatLng(new L.LatLng(airbase.lat, airbase.lng)); 
            }
        }
    }

    _onAirbaseClick(e)
    {
        e.airbaseName = e.sourceTarget.options.name;
        e.coalitionID = e.sourceTarget.coalitionID;
        map.spawnFromAirbase(e);
    }
}