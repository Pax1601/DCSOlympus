class MissionData
{
    constructor()
    {
        this._bullseye = undefined;
        this._bullseyeMarker = undefined;
    }

    update(data)
    {
        this._bullseye = data.missionData.bullseye;
        this._unitsData = data.missionData.unitsData;
        this._drawBullseye();
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
            this._bullseyeMarker = L.marker([this._bullseye.lat, this._bullseye.lng]).addTo(map.getMap());
        }
        else
        {
            this._bullseyeMarker .setLatLng(new L.LatLng(this._bullseye.lat, this._bullseye.lng)); 
        }
    }
}