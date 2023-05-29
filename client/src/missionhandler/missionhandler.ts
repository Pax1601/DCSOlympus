import { LatLng } from "leaflet";
import { getInfoPopup, getMap } from "..";
import { Airbase, AirbaseChartData } from "./airbase";
import { Bullseye } from "./bullseye";


export class MissionHandler
{
    #bullseyes      : {[name: string]: Bullseye} = {};        
    #airbases       : {[name: string]: Airbase} = {};
    #airbaseCharts  : {[name: string]: AirbaseChartData } = {};
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

        if ("mission" in data && data.mission !== null)
        {
            if (data.mission != null && data.mission.theatre != this.#theatre) 
            {
                this.#theatre = data.mission.theatre;
                getMap().setTheatre(this.#theatre);

                getInfoPopup().setText("Map set to " + this.#theatre);

                this.setAirbasesCharts( this.#theatre );
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
                
                if (airbase.latitude && airbase.longitude && airbase.coalition) {
                    this.#airbases[idx].setLatLng(new LatLng(airbase.latitude, airbase.longitude));
                    this.#airbases[idx].setCoalition(airbase.coalition);
                }

                //  Enrich data from ATC API

                const loadedChartKeys = Object.keys( this.#airbaseCharts );

                if ( loadedChartKeys.length > 0 ) {
                  
                  if ( this.#airbaseCharts.hasOwnProperty( airbase.callsign ) ) {

                    const chartData:AirbaseChartData = this.#airbaseCharts[ airbase.callsign ];
                    this.#airbases[ idx ].setChartData( chartData );

                  } else {

                      console.warn( `Airbase "${airbase.callsign}" not in chart data.  Options:` + loadedChartKeys.join( ", " ) );

                  }

                }
                
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

    
    setAirbasesCharts( theatre:string ) {

      fetch( '/api/airbases/' + theatre.toLowerCase() , {
          method: 'GET',      
          headers: { 
              'Accept': '*/*',
              'Content-Type': 'application/json' 
          }
      })
      .then( response => response.json() )
      .then( data => {
          this.#airbaseCharts = data;
      });

    }

}