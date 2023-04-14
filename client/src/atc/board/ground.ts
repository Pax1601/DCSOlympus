import { Dropdown } from "../../controls/dropdown";
import { ATC } from "../atc";
import { ATCBoard } from "../atcboard";


export class ATCBoardGround extends ATCBoard {

    constructor( atc:ATC, element:HTMLElement ) {

        super( atc, element );

        document.addEventListener( "deleteFlightStrip", ( ev:CustomEventInit ) => {

            if ( ev.detail.id ) {
                
                fetch( '/api/atc/flight/' + ev.detail.id, {
                    method: 'DELETE',      
                    headers: { 
                        'Accept': '*/*',
                        'Content-Type': 'application/json' 
                    }
                });
                
            }

        });


        this.getBoardElement().querySelectorAll( "form.ol-strip-board-add-flight" ).forEach( form => {

            if ( form instanceof HTMLFormElement ) {

                form.addEventListener( "submit", ev => {
                    
                    ev.preventDefault();
    
                    
                    if ( ev.target instanceof HTMLFormElement ) {
    
                        const elements   = ev.target.elements;
                        const flightName = <HTMLInputElement>elements[0];
    
                        if ( flightName.value === "" ) {
                            return;
                        }
                        
                        this.addFlight( flightName.value );
    
                        form.reset();
    
                    }
    
                });

            }

        });

    }


    update() {
        
        const flights    = Object.values( this.getATC().getDataHandler().getFlights( this.getBoardId() ) );
        const stripBoard = this.getStripBoardElement();

        const missionTime = this.getATC().getMissionDateTime().getTime();

        for( const strip of stripBoard.children ) {
            strip.toggleAttribute( "data-updating", true );
        }


        flights.forEach( flight => {

            let strip = this.getStrip( flight.id );

            if ( !strip ) {

                const template = `<div class="ol-strip-board-strip" data-flight-id="${flight.id}" data-flight-status="${flight.status}">
                    <div data-point="name">${flight.name}</div>
                    
                    <div id="flight-status-${flight.id}" class="ol-select narrow" data-point="status">
                        <div class="ol-select-value">${flight.status}</div>
                        <div class="ol-select-options"></div>
                    </div>

                    <div data-point="takeoffTime"><input type="text" name="takeoffTime" value="${this.timestampToLocaleTime( flight.takeoffTime )}" /></div>

                    <div data-point="timeToGo">${this.timeToGo( flight.takeoffTime )}</div>
                    
                    <button data-on-click="deleteFlightStrip" data-on-click-params='{"id":"${flight.id}"}'>Delete</button>
                </div>`;

                stripBoard.insertAdjacentHTML( "beforeend", template );


                strip = {
                    "id": flight.id,
                    "element": <HTMLElement>stripBoard.lastElementChild,
                    "dropdowns": {}
                };

                strip.element.querySelectorAll( ".ol-select" ).forEach( select => {
                    
                    switch( select.getAttribute( "data-point" ) ) {

                        case "status":

                                strip.dropdowns.status = new Dropdown( select.id, ( value:string, ev:MouseEvent ) => {
                                    
                                    fetch( '/api/atc/flight/' + flight.id, {
                                        method: 'PATCH',      
                                        headers: { 
                                            'Accept': '*/*',
                                            'Content-Type': 'application/json' 
                                        },
                                        "body": JSON.stringify({
                                            "status": value
                                        })
                                    });

                                }, [
                                    "unknown", "checkedin", "readytotaxi", "clearedtotaxi", "halted", "terminated"
                                ]);

                            break;

                    }

                });

                strip.element.querySelectorAll( `input[type="text"]` ).forEach( input => {

                    if ( input instanceof HTMLInputElement ) {

                        input.addEventListener( "blur", ( ev ) => {

                            const target = ev.target;

                            if ( target instanceof HTMLInputElement ) {

                                if ( /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test( target.value ) ) {
                                    target.value += ":00";
                                }

                                const value = target.value;

                                if ( value === target.dataset.previousValue ) {
                                    return;

                                } else if ( value === "" ) {

                                    this.#updateTakeoffTime( flight.id, -1 );

                                } else if ( /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test( value ) ) {

                                    let [ hours, minutes, seconds ] = value.split( ":" ).map( str => parseInt( str ) );

                                    const missionStart = this.getATC().getMissionStartDateTime();

                                    this.#updateTakeoffTime( flight.id, new Date(
                                        missionStart.getFullYear(),
                                        missionStart.getMonth(),
                                        missionStart.getDate(),
                                        hours,
                                        minutes,
                                        seconds
                                    ).getTime() );

                                } else {

                                    target.value === target.dataset.previousValue

                                }

                            }

                        });

                    }

                });

                this.addStrip( strip );

            } else {

                if ( flight.status !== strip.element.getAttribute( "data-flight-status" ) ) {
                    strip.element.setAttribute( "data-flight-status", flight.status );
                    strip.dropdowns.status.selectText( flight.status );
                }

                strip.element.querySelectorAll( `input[name="takeoffTime"]:not(:focus)` ).forEach( el => {
                    if ( el instanceof HTMLInputElement ) {
                        el.value = this.timestampToLocaleTime( flight.takeoffTime );
                        el.dataset.previousValue = el.value;
                    }
                });

                strip.element.querySelectorAll( `[data-point="timeToGo"]` ).forEach( el => {

                    if ( flight.takeoffTime > 0 && this.calculateTimeToGo( missionTime, flight.takeoffTime ).totalSeconds <= 120 ) {
                        strip.element.setAttribute( "data-time-warning", "level-1" );
                    }
                    
                    if ( el instanceof HTMLElement ) {
                        el.innerText = this.timeToGo( flight.takeoffTime );
                    }

                });


            }

            strip.element.toggleAttribute( "data-updating", false );

        });
        
        stripBoard.querySelectorAll( `[data-updating]` ).forEach( strip => {
            this.deleteStrip( strip.getAttribute( "data-flight-id" ) || "" );
        });

    }




    #updateTakeoffTime = function( flightId:string, time:number ) {

        fetch( '/api/atc/flight/' + flightId, {
            method: 'PATCH',      
            headers: { 
                'Accept': '*/*',
                'Content-Type': 'application/json' 
            },
            "body": JSON.stringify({
                "takeoffTime": time
            })
        });

    }

}