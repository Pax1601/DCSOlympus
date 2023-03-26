import { ATCBoard } from "./atcboard";
import { ATCBoardFlight } from "./board/flight";

export interface FlightInterface {
    id   : string;
    name : string;
}


class ATCDataHandler {

    #atc:ATC;

    #updateInterval:number|undefined = undefined;
    #updateIntervalDelay:number      = 1000;


    constructor( atc:ATC ) {

        this.#atc = atc;

    }

    startUpdates() {
        
        this.#updateInterval = setInterval( () => {

            fetch( '/api/atc/flight', {
                method: 'GET',      
                headers: { 
                    'Accept': '*/*',
                    'Content-Type': 'application/json' 
                }
            })
            .then( response => response.json() )
            .then( data => {
                this.#atc.setFlights( data );
            });

        }, this.#updateIntervalDelay );

    }

    stopUpdates() {
        
        clearInterval( this.#updateInterval );

    }
    
}




export class ATC {

    #boards<T extends ATCBoard>:<T>[] = [];
    #dataHandler:ATCDataHandler;
    #flights:{[key:string]: FlightInterface} = {};


    constructor() {
        
        this.#dataHandler = new ATCDataHandler( this );

        this.lookForBoards();

    }


    addBoard<T extends ATCBoard>( board:T ) {
        
    }


    lookForBoards() {

        document.querySelectorAll( "ol-atc-board" ).forEach( board => {

            if ( board instanceof HTMLElement ) {
                this.addBoard( new ATCBoardFlight( board ) );
            }

        });

    }


    setFlights( flights:{[key:string]: any} ) {

        this.#flights = flights;

    }


    startUpdates() {

        this.#dataHandler.startUpdates();

    }


    stopUpdates() {

        this.#dataHandler.stopUpdates();

    }

}