import { Marker, LatLng, Icon } from "leaflet";
import { getInfoPopup, getMap } from "..";
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
    #theatre        : string = "";

    //  Time
    #date        : any;
    #elapsedTime : any;
    #startTime   : any;
    #time        : any;

    #updateTime  : any;

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

    update(data: BullseyesData | AirbasesData | any)
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

    #drawBullseyes()
    {
        for (let idx in this.#bullseyes)
        {
            var bullseye = this.#bullseyes[idx];
            this.#bullseyeMarkers[idx].setLatLng(new LatLng(bullseye.latitude, bullseye.longitude)); 
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
                    position: new LatLng(airbase.latitude, airbase.longitude), 
                    name: airbase.callsign,
                    src: "images/airbase.png"}).addTo(getMap());
                this.#airbasesMarkers[idx].on('contextmenu', (e) => this.#onAirbaseClick(e));
            }
            else
            {
                this.#airbasesMarkers[idx].setLatLng(new LatLng(airbase.latitude, airbase.longitude));
                this.#airbasesMarkers[idx].setCoalition(airbase.coalition);
                //this.#airbasesMarkers[idx].setProperties(["Runway 1: 31L / 13R", "Runway 2: 31R / 13L", "TCN: 17X", "ILS: ---" ]);
                //this.#airbasesMarkers[idx].setParkings(["2x big", "5x small"]);
            }
        }
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