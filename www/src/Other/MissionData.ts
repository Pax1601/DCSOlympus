import { Marker, LatLng } from "leaflet";

export class MissionData
{
    #bullseye       : any; //TODO declare interface
    #bullseyeMarker : Marker;
    #airbasesMarkers: {[name: string]: Marker};
    #unitsData      : any; //TODO declare interface
    #airbases       : any; //TODO declare interface

    constructor()
    {
        this.#bullseye = undefined;
        this.#bullseyeMarker = undefined;
        this.#airbasesMarkers = {};
    }

    update(data)
    {
        this.#bullseye = data.missionData.bullseye;
        this.#unitsData = data.missionData.unitsData;
        this.#airbases = data.missionData.airbases;
        this.#drawBullseye();
        this.#drawAirbases();
    }

    getUnitData(ID)
    {
        if (ID in this.#unitsData)
        {
            return this.#unitsData[ID];
        }
        else 
        {
            return undefined;
        }
    }

    #drawBullseye()
    {
        if (this.#bullseyeMarker === undefined)
        {
            this.#bullseyeMarker = new Marker([this.#bullseye.lat, this.#bullseye.lng]).addTo(map.getMap());
        }
        else
        {
            this.#bullseyeMarker.setLatLng(new LatLng(this.#bullseye.lat, this.#bullseye.lng)); 
        }
    }

    #drawAirbases()
    {
        for (let idx in this.#airbases)
        {
            var airbase = this.#airbases[idx]
            if (this.#airbasesMarkers[idx] === undefined)
            {
                // @ts-ignore TODO: find a good way to extend markers in typescript
                this.#airbasesMarkers[idx] = new L.Marker.AirbaseMarker(new L.LatLng(airbase.lat, airbase.lng), {name: airbase.callsign}).addTo(map.getMap());
                this.#airbasesMarkers[idx].on('click', (e) => this.#onAirbaseClick(e));
            }
            else
            {
                // @ts-ignore TODO: find a good way to extend markers in typescript
                this.#airbasesMarkers[idx].setCoalitionID(airbase.coalition);
                this.#airbasesMarkers[idx].setLatLng(new LatLng(airbase.lat, airbase.lng)); 
            }
        }
    }

    #onAirbaseClick(e)
    {
        e.airbaseName = e.sourceTarget.options.name;
        e.coalitionID = e.sourceTarget.coalitionID;
        map.spawnFromAirbase(e);
    }
}