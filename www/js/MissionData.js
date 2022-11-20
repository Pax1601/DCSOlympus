class MissionData
{
    constructor()
    {
        this.bullseye = undefined;
        this._bullseyeMarker = undefined;
    }

    update(data)
    {
        this.bullseye = data.missionData.bullseye;
        this._drawBullseye();
    }

    _drawBullseye()
    {
        if (this._bullseyeMarker === undefined)
        {
            this._bullseyeMarker = L.marker([this.bullseye.lat, this.bullseye.lng]).addTo(map.getMap());
        }
        else
        {
            this._bullseyeMarker .setLatLng(new L.LatLng(this.bullseye.lat, this.bullseye.lng)); 
        }
    }
}