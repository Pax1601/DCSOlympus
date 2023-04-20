import { ATCBoard } from "./atcboard";
import { ATCBoardGround } from "./board/ground";
import { ATCBoardTower } from "./board/tower";

export interface FlightInterface {
    assignedSpeed: any;
    assignedAltitude : any;
    id               : string;
    boardId          : string;
    name             : string;
    order            : number;
    status           : "unknown";
    takeoffTime      : number;
    unitId           : number;
}


class ATCDataHandler {

    #atc:ATC;
    #flights:{[key:string]: FlightInterface} = {};

    #updateInterval:number|undefined = undefined;
    #updateIntervalDelay:number      = 2500;            //  Wait between unit update requests


    constructor( atc:ATC ) {

        this.#atc = atc;

    }


    getFlights( boardId:string ) {

        return Object.values( this.#flights ).reduce( ( acc:{[key:string]: FlightInterface}, flight ) => {
            
            if ( flight.boardId === boardId ) {
                acc[ flight.id ] = flight;
            }

            return acc;
        }, {} );
    }


    startUpdates() {
            
        this.#updateInterval = setInterval( () => {

            const aBoardIsVisible = this.#atc.getBoards().some( board => board.boardIsVisible() );

            if ( aBoardIsVisible ) {

                fetch( '/api/atc/flight', {
                    method: 'GET',      
                    headers: { 
                        'Accept': '*/*',
                        'Content-Type': 'application/json' 
                    }
                })
                .then( response => response.json() )
                .then( data => {
                    this.setFlights( data );
                });

            }

        }, this.#updateIntervalDelay );
        
    }


    setFlights( flights:{[key:string]: any} ) {

        this.#flights = flights;

    }


    stopUpdates() {
        
        clearInterval( this.#updateInterval );

    }
    
}




export class ATC {

    #boards:ATCBoard[] = [];
    #dataHandler:ATCDataHandler;

    #initDate:Date = new Date();

    constructor() {
        
        this.#dataHandler = new ATCDataHandler( this );

        this.lookForBoards();

    }


    addBoard<T extends ATCBoard>( board:T ) {

        board.startUpdates();

        this.#boards.push( board );
        
    }


    getBoards() {
        return this.#boards;
    }


    getDataHandler() {
        return this.#dataHandler;
    }


    getMissionElapsedSeconds() : number {
        return new Date().getTime() - this.#initDate.getTime();
    }


    getMissionStartDateTime() : Date {
        return new Date( 1990, 3, 1, 18, 0, 0 );
    }


    getMissionDateTime() : Date {
        return new Date( this.getMissionStartDateTime().getTime() + this.getMissionElapsedSeconds() );
    }


    lookForBoards() {

        document.querySelectorAll( ".ol-strip-board" ).forEach( board => {

            if ( board instanceof HTMLElement ) {

                switch ( board.dataset.boardType ) {

                    case "ground":
                        this.addBoard( new ATCBoardGround( this, board ) );
                        return;
                    
                    case "tower":
                        this.addBoard( new ATCBoardTower( this, board ) );
                        return;
                    
                    default:
                        console.warn( "Unknown board type for ATC board, got: " + board.dataset.boardType );

                }

            }

        });

    }

    startUpdates() {

        this.#dataHandler.startUpdates();

    }


    stopUpdates() {

        this.#dataHandler.stopUpdates();

    }

}