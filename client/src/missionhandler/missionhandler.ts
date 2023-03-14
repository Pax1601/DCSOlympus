import { Marker, LatLng, Icon } from "leaflet";
import { getMap, getUnitsManager } from "..";
import { Airbase } from "./airbase";

var bullseyeIcons = [
    new Icon({ iconUrl: 'images/bullseye0.png', iconAnchor: [30, 30]}),
    new Icon({ iconUrl: 'images/bullseye1.png', iconAnchor: [30, 30]}),
    new Icon({ iconUrl: 'images/bullseye2.png', iconAnchor: [30, 30]})
]

export class MissionHandler
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

    update(data: BullseyesData | AirbasesData)
    {
        if ("bullseyes" in data)
        {
            this.#bullseyes = data.bullseyes;
            this.#drawBullseyes();
        }

        if ("airbases" in data)
        {
            this.#airbases = data.airbases;
            this.#drawAirbases();
        }
    }

    getBullseyes()
    {
        return this.#bullseyes;
    }

    #drawBullseyes()
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
                this.#airbasesMarkers[idx].setLatLng(new LatLng(airbase.lat, airbase.lng));
                this.#airbasesMarkers[idx].setCoalition(airbase.coalition);
            }
        }
    }

    #onAirbaseClick(e: any)
    {
        var enableLandHere = getUnitsManager().getSelectedUnitsType() === "Aircraft" && (getUnitsManager().getSelectedUnitsCoalition() === e.sourceTarget.getCoalition() || e.sourceTarget.getActiveCoalition === "neutral");
        getMap().showAirbaseContextMenu(e, e.sourceTarget.getName(), ["test1", "tes2"], ["2x small", "3x large"], enableLandHere, e.sourceTarget.getActiveCoalition);
    }
}