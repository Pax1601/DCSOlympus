import { Dropdown } from "../controls/dropdown";
import { zeroAppend } from "../other/utils";
import { ATC } from "./atc";
import { Unit } from "../units/unit";
import { getMissionData, getUnitsManager } from "..";
import Sortable from "sortablejs";
import { FlightInterface } from "./atc";
import { getConnected } from "../server/server";

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

        
        new MutationObserver( () => {
            if ( this.boardIsVisible() ) {
                this.startUpdates();
            } else {
                this.stopUpdates();
            }
        }).observe( this.getBoardElement(), {
            "attributes": true,
            "childList": false,
            "subtree": false
        });


        new Sortable( this.getStripBoardElement(), {
            "handle": ".handle",
            "onUpdate": ev => {

                const order = [].slice.call( this.getStripBoardElement().children ).map( ( strip:HTMLElement ) => {
                    return strip.dataset.flightId
                });

                fetch( '/api/atc/flight/order', {
                    method: 'POST',      
                    headers: { 
                        'Accept': '*/*',
                        'Content-Type': 'application/json' 
                    },
                    "body": JSON.stringify({
                        "boardId" : this.getBoardId(),
                        "order"   : order
                    })
                });

            }
        });


        window.setInterval( () => {

            if ( !getConnected() ) {
                return;
            }
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

        //  this.#_setupDemoData();

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


    boardIsVisible() {
        return ( !this.getBoardElement().classList.contains( "hide" ) );
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

            window.setTimeout( () => {
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
            },
            "body": JSON.stringify({
                "boardId": this.getBoardId()
            })
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


    getUnitIdsBeingMonitored() {

        return this.#unitIdsBeingMonitored;

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
        

        const form        = <HTMLElement>this.getBoardElement().querySelector( "form.ol-strip-board-add-flight" );
        const suggestions = <HTMLElement>form.querySelector( ".ol-auto-suggest" );
        const unitName    = <HTMLInputElement>form.querySelector( "input[name='unitName']" );

        const toggleSuggestions = ( bool:boolean ) => {
            suggestions.toggleAttribute( "data-has-suggestions", bool );
        }

        let searchTimeout:number|null;

        unitName.addEventListener( "keyup", ev => {

            if ( searchTimeout ) {
                clearTimeout( searchTimeout );
            }

            const resetSuggestions = () => {
                suggestions.innerHTML = "";
                toggleSuggestions( false );
            }

            resetSuggestions();

            searchTimeout = window.setTimeout( () => {
            
                const searchString = unitName.value.toLowerCase();
    
                if ( searchString === "" ) {
                    return;
                }

                const units                 = getUnitsManager().getSelectableAircraft();
                const unitIdsBeingMonitored = this.getUnitIdsBeingMonitored();

                const results = Object.keys( units ).reduce( ( acc:Unit[], unitId:any ) => {
                    
                    const unit     = units[ unitId ];
                    const baseData = unit.getBaseData();

                    if ( !unitIdsBeingMonitored.includes( parseInt( unitId ) ) && baseData.unitName.toLowerCase().indexOf( searchString ) > -1 ) {
                        acc.push( unit );
                    }

                    return acc;

                }, [] );

                toggleSuggestions( results.length > 0 );
                
                results.forEach( unit => {

                    const baseData = unit.getBaseData();

                    const a     = document.createElement( "a" );
                    a.innerText = baseData.unitName;

                    a.addEventListener( "click", ev => {
                        this.addFlight( unit );
                        resetSuggestions();
                        unitName.value = "";
                    });

                    suggestions.appendChild( a );

                });



            }, 1000 );


        });

        form.querySelectorAll( ".add-flight-by-click" ).forEach( el => {
            el.addEventListener( "click", ev => {
                ev.preventDefault();
                toggleIsAddFlightByClickEnabled();
            });
        });

    }


    sortFlights( flights:FlightInterface[] ) {

        flights.sort( ( a, b ) => {
            
            const aVal = a.order;
            const bVal = b.order;

            return ( aVal > bVal ) ? 1 : -1;

        });

        return flights;

    }


    startUpdates() {

        if ( !this.boardIsVisible() ) {
            return;
        }

        this.#updateInterval = window.setInterval( () => {

            if ( !getConnected() ) {
                return;
            }

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

        const missionTime   = this.#atc.getMissionDateTime().getTime();
        const timeDiff      = new Date().getTime() - getMissionData().getUpdateTime();

        const nowDate = new Date( missionTime + timeDiff );
        
        this.#clockElement.innerText = nowDate.toLocaleTimeString();

    }


    updateFlight( flightId:string, reqBody:object ) {
        
        return fetch( '/api/atc/flight/' + flightId, {
            method: 'PATCH',      
            headers: { 
                'Accept': '*/*',
                'Content-Type': 'application/json' 
            },
            "body": JSON.stringify( reqBody )
        });

    }


    #_setupDemoData() {

        fetch( '/api/atc/flight/', {
            method: 'POST',      
            headers: { 
                'Accept': '*/*',
                'Content-Type': 'application/json' 
            },
            "body": JSON.stringify({
                "boardId" : this.getBoardId(),
                "name"    : this.getBoardId() + " 1",
                "unitId"  : 1
            })
        });

        
        // fetch( '/api/atc/flight/', {
        //     method: 'POST',      
        //     headers: { 
        //         'Accept': '*/*',
        //         'Content-Type': 'application/json' 
        //     },
        //     "body": JSON.stringify({
        //         "boardId" : this.getBoardId(),
        //         "name"    : this.getBoardId() + " 2",
        //         "unitId"  : 2
        //     })
        // });

        // fetch( '/api/atc/flight/', {
        //     method: 'POST',      
        //     headers: { 
        //         'Accept': '*/*',
        //         'Content-Type': 'application/json' 
        //     },
        //     "body": JSON.stringify({
        //         "boardId" : this.getBoardId(),
        //         "name"    : this.getBoardId() + " 3",
        //         "unitId"  : 9
        //     })
        // });

    }

    
}