import { Draggable } from "leaflet";
import { Dropdown } from "../controls/dropdown";
import { zeroAppend } from "../other/utils";
import { ATC } from "./atc";

export interface StripBoardStripInterface {
    "id": string,
    "element": HTMLElement,
    "dropdowns": {[key:string]: Dropdown}
}

export abstract class ATCBoard {

    #atc:ATC;
    #templates: {[key:string]: string} = {};

    //  Elements
    #boardElement:HTMLElement;
    #clockElement:HTMLElement;
    #stripBoardElement:HTMLElement;

    //  Content
    #strips:{[key:string]: StripBoardStripInterface} = {};
    
    //  Update timing
    #updateInterval:number|undefined = undefined;
    #updateIntervalDelay:number      = 1000;


    constructor( atc:ATC, boardElement:HTMLElement ) {

        this.#atc          = atc;
        this.#boardElement = boardElement;
        this.#stripBoardElement = <HTMLElement>this.getBoardElement().querySelector( ".ol-strip-board-strips" );
        this.#clockElement      = <HTMLElement>this.getBoardElement().querySelector( ".ol-strip-board-clock" );

        if ( this.#boardElement.classList.contains( "ol-draggable" ) ) {

            let options:any = {};

            let handle = this.#boardElement.querySelector( ".handle" );

            if ( handle instanceof HTMLElement ) {
                options.handle = handle;
            }

        }


        setInterval( () => {
            this.updateClock();
        }, 1000 );

    }


    addStrip( strip:StripBoardStripInterface ) {
        this.#strips[ strip.id ] = strip;
    }


    calculateTimeToGo( fromTimestamp:number, toTimestamp:number ) {

        let timestamp = ( toTimestamp - fromTimestamp ) / 1000;

        const hasElapsed = ( timestamp < 0 ) ? true : false;

        if ( hasElapsed ) {
            timestamp = -( timestamp );
        }

        const hours    = ( timestamp < 3600 ) ? "00" : zeroAppend( Math.floor( timestamp / 3600 ), 2 );
        const rMinutes = timestamp % 3600;

        const minutes  = ( timestamp < 60 ) ? "00" : zeroAppend( Math.floor( rMinutes / 60 ), 2 );
        const seconds = zeroAppend( Math.floor( rMinutes % 60 ), 2 ); 

        return {
            "elapsedMarker": ( hasElapsed ) ? "+" : "-",
            "hasElapsed": hasElapsed,
            "hours": hours,
            "minutes": minutes,
            "seconds": seconds,
            "time": `${hours}:${minutes}:${seconds}`,
            "totalSeconds": timestamp
        };

    }


    deleteStrip( id:string ) {

        if ( this.#strips.hasOwnProperty( id ) ) {
            this.#strips[ id ].element.remove();
            delete this.#strips[ id ];
        }

    }


    getATC() {
        return this.#atc;
    }


    getBoardElement() {
        return this.#boardElement;
    }


    getStripBoardElement() {
        return this.#stripBoardElement;
    }


    getStrips() {
        return this.#strips;
    }


    getStrip( id:string ) {
        return this.#strips[ id ] || false;
    }


    getTemplate( key:string ) {

        return this.#templates[ key ] || false;

    }


    protected update() {
        console.warn( "No custom update method defined." );
    }


    setTemplates( templates:{[key:string]: string} ) {
        this.#templates = templates;
    }


    startUpdates() {

        this.#updateInterval = setInterval( () => {

            this.update();

        }, this.#updateIntervalDelay );

    }


    stopUpdates() {

        clearInterval( this.#updateInterval );

    }


    timestampToLocaleTime( timestamp:number ) {

        return ( timestamp === -1 ) ? "-" : new Date( timestamp ).toLocaleTimeString();

    }


    timeToGo( timestamp:number ) {

        const timeData = this.calculateTimeToGo( this.getATC().getMissionDateTime().getTime(), timestamp );

        return ( timestamp === -1 ) ? "-" : timeData.elapsedMarker + timeData.time;

    }


    updateClock() {

        const now = this.#atc.getMissionDateTime();
        this.#clockElement.innerText = now.toLocaleTimeString();

    }

    
}