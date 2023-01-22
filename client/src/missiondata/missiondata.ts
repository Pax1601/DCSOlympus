import { Marker, LatLng } from "leaflet";
import { getMap } from "..";
import { SpawnEvent } from "../map/map";
import { AirbaseMarker } from "./airbasemarker";

export class MissionData
{
    //#bullseye       : any; //TODO declare interface
    //#bullseyeMarker : Marker;
    #airbases       : any; //TODO declare interface
    #airbasesMarkers: {[name: string]: AirbaseMarker};

    constructor()
    {
        //this.#bullseye = undefined;
        //this.#bullseyeMarker = undefined;
        this.#airbasesMarkers = {};
    }

    update(data: any)
    {
        //this.#bullseye = data.missionData.bullseye;
        this.#airbases = data.airbases;
        //this.#drawBullseye();
        this.#drawAirbases();
    }

    //#drawBullseye()
    //{
    //    if (this.#bullseyeMarker === undefined)
    //    {
    //        this.#bullseyeMarker = new Marker([this.#bullseye.lat, this.#bullseye.lng]).addTo(map.getMap());
    //    }
    //    else
    //    {
    //        this.#bullseyeMarker.setLatLng(new LatLng(this.#bullseye.lat, this.#bullseye.lng)); 
    //    }
    //}

    #drawAirbases()
    {
        for (let idx in this.#airbases)
        {
            var airbase = this.#airbases[idx]
            if (this.#airbasesMarkers[idx] === undefined)
            {
                this.#airbasesMarkers[idx] = new AirbaseMarker({
                    position: new LatLng(airbase.lat, airbase.lng), 
                    name: airbase.callsign,
                    src: "images/airbase.png"}).addTo(getMap());
                this.#airbasesMarkers[idx].on('click', (e) => this.#onAirbaseClick(e));
            }
            else
            {
                this.#airbasesMarkers[idx].setCoalitionID(airbase.coalition);
            }
        }
    }

    #onAirbaseClick(e: any)
    {
        var spawnEvent: SpawnEvent = {x: e.originalEvent.x, y: e.originalEvent.y, latlng: e.latlng, airbaseName: e.sourceTarget.getName(), coalitionID: e.sourceTarget.getCoalitionID()};
        getMap().spawnFromAirbase(spawnEvent);
    }
}