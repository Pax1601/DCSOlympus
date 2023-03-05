import { Marker, LatLng, Icon } from "leaflet";
import { getMap, getUnitsManager } from "..";
import { SpawnEvent } from "../map/map";
import { Airbase } from "./airbase";

var bullseyeIcons = [
    new Icon({ iconUrl: 'images/bullseye0.png', iconAnchor: [30, 30]}),
    new Icon({ iconUrl: 'images/bullseye1.png', iconAnchor: [30, 30]}),
    new Icon({ iconUrl: 'images/bullseye2.png', iconAnchor: [30, 30]})
]

export class MissionData
{
    #bullseyes      : any; //TODO declare interface
    #bullseyeMarkers: any;
    #airbases       : any; //TODO declare interface
    #airbasesMarkers: {[name: string]: Airbase};

    constructor()
    {
        this.#bullseyes = undefined;
        this.#bullseyeMarkers = [
            new Marker([0, 0], {icon: bullseyeIcons[0]}).addTo(getMap()),
            new Marker([0, 0], {icon: bullseyeIcons[1]}).addTo(getMap()),
            new Marker([0, 0], {icon: bullseyeIcons[2]}).addTo(getMap())
        ]
        this.#airbasesMarkers = {};
    }

    update(data: ServerData)
    {
        this.#bullseyes = data.bullseye;
        this.#airbases = data.airbases;
        if (this.#bullseyes != null && this.#airbases != null)
        {
            this.#drawBullseye();
            this.#drawAirbases();
        }
    }

    getBullseyes()
    {
        return this.#bullseyes;
    }

    #drawBullseye()
    {
        for (let idx in this.#bullseyes)
        {
            var bullseye = this.#bullseyes[idx];
            this.#bullseyeMarkers[idx].setLatLng(new LatLng(bullseye.lat, bullseye.lng)); 
        }
    }

    #drawAirbases()
    {
        for (let idx in this.#airbases)
        {
            var airbase = this.#airbases[idx]
            if (this.#airbasesMarkers[idx] === undefined)
            {
                this.#airbasesMarkers[idx] = new Airbase({
                    position: new LatLng(airbase.lat, airbase.lng), 
                    name: airbase.callsign,
                    src: "images/airbase.png"}).addTo(getMap());
                this.#airbasesMarkers[idx].on('contextmenu', (e) => this.#onAirbaseClick(e));
            }
            else
            {
                this.#airbasesMarkers[idx].setCoalitionID(airbase.coalition);
            }
        }
    }

    #onAirbaseClick(e: any)
    {
        var options = [];
        if (getUnitsManager().getSelectedUnits().length > 0)
            options = ["Spawn unit", "Land here"];
        else 
            options = ["Spawn unit"];

        getMap().showContextMenu(e.originalEvent, e.sourceTarget.getName(),
            options.map((option) => {return {tooltip: option, src: "", callback: (label: string) => {this.#onAirbaseOptionSelection(e, label)}}}, false)
        )
    }

    #onAirbaseOptionSelection(e: any, option: string) {
        if (option === "Spawn unit") {
            var spawnEvent: SpawnEvent = {x: e.originalEvent.x, y: e.originalEvent.y, latlng: e.latlng, airbaseName: e.sourceTarget.getName(), coalitionID: e.sourceTarget.getCoalitionID()};
            getMap().spawnFromAirbase(spawnEvent);
        }
        else if (option === "Land here")
        {
            getMap().hideContextMenu();
            getUnitsManager().selectedUnitsLandAt(e.latlng);
        }
    }
}