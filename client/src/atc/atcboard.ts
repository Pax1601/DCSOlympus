import { zeroAppend } from "../other/utils";
import { ATC } from "./atc";

export interface ATCTemplateInterface {
    "template": string
}

export abstract class ATCBoard {

    #atc:ATC;
    #templates: {[key:string]: string} = {};

    //  Elements
    #boardElement:HTMLElement;
    #clockElement:HTMLElement;
    #stripBoardElement:HTMLElement;
    
    //  Update timing
    #updateInterval:number|undefined = undefined;
    #updateIntervalDelay:number      = 1000;


    constructor( atc:ATC, boardElement:HTMLElement ) {

        this.#atc          = atc;
        this.#boardElement = boardElement;
        this.#stripBoardElement = <HTMLElement>this.getBoardElement().querySelector( ".ol-strip-board-strips" );
        this.#clockElement      = <HTMLElement>this.getBoardElement().querySelector( ".ol-strip-board-clock" );


        setInterval( () => {
            this.updateClock();
        }, 1000 );

    }


    calculateTimeToGo( fromTimestamp:number, toTimestamp:number ) {

        let timestamp = ( toTimestamp - fromTimestamp ) / 1000;

        const hours    = zeroAppend( Math.floor( timestamp / 3600 ), 2 );
        const rMinutes = timestamp % 3600;

        const minutes  = zeroAppend( Math.floor( rMinutes / 60 ), 2 );
        const seconds = zeroAppend( Math.floor( rMinutes % 60 ), 2 ); 

        return {
            "hours": hours,
            "minutes": minutes,
            "seconds": seconds,
            "time": `${hours}:${minutes}:${seconds}`,
            "totalSeconds": timestamp
        };

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

        return ( timestamp === -1 ) ? "-" : this.calculateTimeToGo( this.getATC().getMissionDateTime().getTime(), timestamp ).time;

    }


    updateClock() {

        const now = this.#atc.getMissionDateTime();
        this.#clockElement.innerText = now.toLocaleTimeString();

    }

    
}