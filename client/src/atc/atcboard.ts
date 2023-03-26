import { ATC } from "./atc";

export interface ATCTemplateInterface {
    "template": string
}

export abstract class ATCBoard {

    #atc:ATC;
    #templates: {[key:string]: string} = {};

    //  Elements
    #boardElement:HTMLElement;
    #stripBoardElement:HTMLElement;
    
    //  Update timing
    #updateInterval:number|undefined = undefined;
    #updateIntervalDelay:number      = 1000;


    constructor( atc:ATC, boardElement:HTMLElement ) {

        this.#atc          = atc;
        this.#boardElement = boardElement;
        this.#stripBoardElement = <HTMLElement>this.getBoardElement().querySelector( ".atc-strip-board" );

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

    
}