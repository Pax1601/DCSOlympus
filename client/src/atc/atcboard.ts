import { Dropdown } from "../controls/dropdown";
import { zeroAppend } from "../other/utils";
import { ATC } from "./atc";
import { Unit } from "../units/unit";

export interface StripBoardStripInterface {
    "id": string,
    "element": HTMLElement,
    "dropdowns": {[key:string]: Dropdown},
    "isDeleted"?: boolean,
    "unitId": number
}

export abstract class ATCBoard {

    #atc:ATC;
    #boardId:string = "";
    #templates: {[key:string]: string} = {};


    //  Elements
    #boardElement:HTMLElement;
    #clockElement:HTMLElement;
    #stripBoardElement:HTMLElement;

    //  Content
    #isAddFlightByClickEnabled:boolean = false;
    #strips:{[key:string]: StripBoardStripInterface} = {};
    #unitIdsBeingMonitored:number[] = [];
    
    //  Update timing
    #updateInterval:number|undefined = undefined;
    #updateIntervalDelay:number      = 1000;


    constructor( atc:ATC, boardElement:HTMLElement, options?:{[key:string]: any} ) {

        options = options || {};

        this.#atc          = atc;
        this.#boardElement = boardElement;
        this.#stripBoardElement = <HTMLElement>this.getBoardElement().querySelector( ".ol-strip-board-strips" );
        this.#clockElement      = <HTMLElement>this.getBoardElement().querySelector( ".ol-strip-board-clock" );


        setInterval( () => {
            this.updateClock();
        }, 1000 );


        if ( this.#boardElement.classList.contains( "ol-draggable" ) ) {

            let options:any = {};

            let handle = this.#boardElement.querySelector( ".handle" );

            if ( handle instanceof HTMLElement ) {
                options.handle = handle;
            }

        }


        this.#setupAddFlight();

    }


    addFlight( unit:Unit ) {

        const baseData = unit.getBaseData();

        const unitCanBeAdded = () => {

            if ( baseData.category !== "Aircraft" ) {
                return false;
            }

            if ( baseData.AI === true ) {
                //  return false;
            }

            if ( this.#unitIdsBeingMonitored.includes( unit.ID ) ) {
                return false;
            }

            return true;
        }

        if ( !unitCanBeAdded() ) {
            return;
        }

        this.#unitIdsBeingMonitored.push( unit.ID );

        return fetch( '/api/atc/flight/', {
            method: 'POST',      
            headers: { 
                'Accept': '*/*',
                'Content-Type': 'application/json' 
            },
            "body": JSON.stringify({
                "boardId" : this.getBoardId(),
                "name"    : baseData.unitName,
                "unitId"  : unit.ID
            })
        });

    }


    addStrip( strip:StripBoardStripInterface ) {
        
        this.#strips[ strip.id ] = strip;

        strip.element.querySelectorAll( "button.deleteFlight" ).forEach( btn => {
            btn.addEventListener( "click", ev => {
                ev.preventDefault();
                this.deleteFlight( strip.id );
            });
        });

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


    deleteStrip( flightId:string ) {

        if ( this.#strips.hasOwnProperty( flightId ) ) {
            
            this.#strips[ flightId ].element.remove();
            this.#strips[ flightId ].isDeleted = true;

            setTimeout( () => {
                delete this.#strips[ flightId ];
            }, 10000 );

        }

    }


    deleteFlight( flightId:string ) {
        
        this.deleteStrip( flightId );

        fetch( '/api/atc/flight/' + flightId, {
            method: 'DELETE',      
            headers: { 
                'Accept': '*/*',
                'Content-Type': 'application/json' 
            }
        });

    }


    getATC() {
        return this.#atc;
    }


    getBoardElement() {
        return this.#boardElement;
    }


    getBoardId(): string {
        return this.getBoardElement().id;
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


    setTemplates( templates:{[key:string]: string} ) {
        this.#templates = templates;
    }


    #setupAddFlight() {

        const toggleIsAddFlightByClickEnabled = () => {
            this.#isAddFlightByClickEnabled = ( !this.#isAddFlightByClickEnabled );
            this.getBoardElement().classList.toggle( "add-flight-by-click", this.#isAddFlightByClickEnabled );
        }


        document.addEventListener( "unitSelection", ( ev:CustomEventInit ) => {

            if ( this.#isAddFlightByClickEnabled !== true ) {
                return;
            }

            this.addFlight( ev.detail );

            toggleIsAddFlightByClickEnabled();

        });
        

        this.getBoardElement().querySelectorAll( "form.ol-strip-board-add-flight" ).forEach( form => {

            if ( form instanceof HTMLFormElement ) {

                form.addEventListener( "submit", ev => {
                    
                    ev.preventDefault();
    
                    
                    if ( ev.target instanceof HTMLFormElement ) {
    
                        const elements   = ev.target.elements;
                        const flightName = <HTMLInputElement>elements[1];
    
                        if ( flightName.value === "" ) {
                            return;
                        }
                        
                        //  this.addFlight( -1, flightName.value );
    
                        form.reset();
    
                    }
    
                });

            }

        });


        this.getBoardElement().querySelectorAll( ".add-flight-by-click" ).forEach( el => {
            el.addEventListener( "click", () => {
                toggleIsAddFlightByClickEnabled();
            });
        });

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


    protected update() {
        console.warn( "No custom update method defined." );
    }


    updateClock() {

        const now = this.#atc.getMissionDateTime();
        this.#clockElement.innerText = now.toLocaleTimeString();

    }

    
}