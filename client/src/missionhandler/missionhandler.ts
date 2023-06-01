import { LatLng } from "leaflet";
import { getInfoPopup, getMap } from "..";
import { Airbase } from "./airbase";
import { Bullseye } from "./bullseye";

export class MissionHandler
{
    #bullseyes      : {[name: string]: Bullseye} = {};        
    #airbases       : {[name: string]: Airbase} = {};
    #theatre        : string = "";

    constructor()
    {

    }

    update(data: BullseyesData | AirbasesData | any)
    {
        if ("bullseyes" in data)
        {
            for (let idx in data.bullseyes)
            {
                const bullseye = data.bullseyes[idx];
                if (!(idx in this.#bullseyes))
                    this.#bullseyes[idx] = new Bullseye([0, 0]).addTo(getMap());
                    
                if (bullseye.latitude && bullseye.longitude && bullseye.coalition)
                {
                    this.#bullseyes[idx].setLatLng(new LatLng(bullseye.latitude, bullseye.longitude)); 
                    this.#bullseyes[idx].setCoalition(bullseye.coalition);
                }
            }
        }

        if ("airbases" in data)
        {
            for (let idx in data.airbases)
            {
                var airbase = data.airbases[idx]
                if (this.#airbases[idx] === undefined && airbase.callsign != '')
                {
                    this.#airbases[idx] = new Airbase({
                        position: new LatLng(airbase.latitude, airbase.longitude), 
                        name: airbase.callsign
                    }).addTo(getMap());
                    this.#airbases[idx].on('contextmenu', (e) => this.#onAirbaseClick(e));
                }

                if (this.#airbases[idx] != undefined && airbase.latitude && airbase.longitude && airbase.coalition)
                {
                    this.#airbases[idx].setLatLng(new LatLng(airbase.latitude, airbase.longitude));
                    this.#airbases[idx].setCoalition(airbase.coalition);
                }
                //this.#airbases[idx].setProperties(["Runway 1: 31L / 13R", "Runway 2: 31R / 13L", "TCN: 17X", "ILS: ---" ]);
                //this.#airbases[idx].setParkings(["2x big", "5x small"]);
            }
        }

        if ("mission" in data)
        {
            if (data.mission != null && data.mission.theatre != this.#theatre) 
            {
                this.#theatre = data.mission.theatre;
                getMap().setTheatre(this.#theatre);

                getInfoPopup().setText("Map set to " + this.#theatre);
            }
        }
    }

    getBullseyes()
    {
        return this.#bullseyes;
    }

    #onAirbaseClick(e: any)
    {
        getMap().showAirbaseContextMenu(e, e.sourceTarget);
    }
}