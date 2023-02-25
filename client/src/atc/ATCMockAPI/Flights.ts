import { ATCMockAPI } from "../ATCMockAPI";

export class ATCMockAPI_Flights extends ATCMockAPI {


    generateMockData() {

        let data       = [];
        const statuses = [ "unknown", "checkedIn", "readyToTaxi" ]

        for ( const [ i, flightName ] of [ "Shark", "Whale", "Dolphin" ].entries() ) {

            data.push({
                "name": flightName,
                "status": statuses[ i ],
                "takeOffTime": "18:0" + i
            });

        }

        localStorage.setItem( "flightList", JSON.stringify( data ) );

    }


    get( generateMockDataIfEmpty?:boolean ) : object {

        generateMockDataIfEmpty = generateMockDataIfEmpty || false;

        let data = localStorage.getItem( "flightList" ) || "[]";

        if ( data === "[]" && generateMockDataIfEmpty ) {
            this.generateMockData();
        }

        return JSON.parse( data );

    }

}