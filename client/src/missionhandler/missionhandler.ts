import { LatLng } from "leaflet";
import { getInfoPopup, getMap } from "..";
import { Airbase } from "./airbase";
import { Bullseye } from "./bullseye";

export class MissionHandler
{
    #bullseyes      : {[name: string]: Bullseye} = {};        
    #airbases       : {[name: string]: Airbase} = {};
    #theatre        : string = "";

    #airbaseData : { [name: string]: object } = {};

    //  Time
    #date        : any;
    #elapsedTime : any;
    #startTime   : any;
    #time        : any;

    #updateTime  : any;

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

        
        if ("mission" in data)
        {
            if (data.mission != null && data.mission.theatre != this.#theatre) 
            {
                this.#theatre = data.mission.theatre;
                getMap().setTheatre(this.#theatre);

                getInfoPopup().setText("Map set to " + this.#theatre);
            }
        }


        if ("airbases" in data)
        {
/*
            console.log( Object.values( data.airbases ).sort( ( a:any, b:any ) => {
                const aVal = a.callsign.toLowerCase();
                const bVal = b.callsign.toLowerCase();
                
                return aVal > bVal ? 1 : -1;
            }) );
//*/
            for (let idx in data.airbases)
            {
                var airbase = data.airbases[idx]
                if (this.#airbases[idx] === undefined)
                {
                    this.#airbases[idx] = new Airbase({
                        position: new LatLng(airbase.latitude, airbase.longitude), 
                        name: airbase.callsign
                    }).addTo(getMap());
                    this.#airbases[idx].on('contextmenu', (e) => this.#onAirbaseClick(e));
                }
                if (airbase.latitude && airbase.longitude && airbase.coalition)
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

            if ( "date" in data.mission ) {
                this.#date = data.mission.date;
            }

            if ( "elapsedTime" in data.mission ) {
                this.#elapsedTime = data.mission.elapsedTime;
            }

            if ( "startTime" in data.mission ) {
                this.#startTime = data.mission.startTime;
            }

            if ( "time" in data.mission ) {
                this.#time = data.mission.time;
            }

        }


        if ( "time" in data ) {
            this.#updateTime = data.time;
        }

    }

    getBullseyes()
    {
        return this.#bullseyes;
    }

    getDate() {
        return this.#date;
    }


    getNowDate() {

        const date = this.getDate();
        const time = this.getTime();

        if ( !date ) {
            return new Date();
        }
        
        let year  = date.Year;
        let month = date.Month - 1;

        if ( month < 0 ) {
            month = 11;
            year--;
        }

        return new Date( year, month, date.Day, time.h, time.m, time.s );
    }


    getTime() {
        return this.#time;
    }


    getUpdateTime() {
        return this.#updateTime;
    }

    #onAirbaseClick(e: any)
    {
        getMap().showAirbaseContextMenu(e, e.sourceTarget);
    }
}