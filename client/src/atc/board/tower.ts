import { getUnitsManager } from "../..";
import { Dropdown } from "../../controls/dropdown";
import { mToFt, msToKnots } from "../../other/utils";
import { ATC } from "../atc";
import { ATCBoard } from "../atcboard";


export class ATCBoardTower extends ATCBoard {

    constructor( atc:ATC, element:HTMLElement ) {

        super( atc, element );

    }


    update() {
        
        const flights         = this.sortFlights( Object.values( this.getATC().getDataHandler().getFlights( this.getBoardId() ) ) );
        const missionTime     = this.getATC().getMissionDateTime().getTime();
        const selectableUnits = getUnitsManager().getSelectableAircraft();
        const stripBoard      = this.getStripBoardElement();

        for( const strip of stripBoard.children ) {
            strip.toggleAttribute( "data-updating", true );
        }


        flights.forEach( flight => {

            let strip = this.getStrip( flight.id );

            if ( strip.isDeleted === true ) {
                return;
            }

            const flightData = {
                latitude: -1,
                longitude: -1,
                altitude: -1,
                heading: -1,
                speed: -1,
                ...( selectableUnits.hasOwnProperty( flight.unitId ) ? selectableUnits[flight.unitId].getData() : {} )
            };

            if ( !strip ) {

                const template = `<div class="ol-strip-board-strip" data-flight-id="${flight.id}" data-flight-status="${flight.status}">
                    <div class="handle"></div>
                    <div data-point="name"><a href="#" class="select-unit">${flight.name}</a></div>

                    <div data-point="assignedAltitude"><input type="text" name="assignedAltitude" value="${flight.assignedAltitude}" size="2" /> 000</div>
                    <div data-point="altitude">-</div>

                    <div data-point="assignedSpeed"><input type="text" name="assignedSpeed" value="${flight.assignedSpeed}" size="3" /></div>
                    <div data-point="speed">-</div>
                    
                    <button class="deleteFlight">&times;</button>
                </div>`;

                stripBoard.insertAdjacentHTML( "beforeend", template );


                strip = {
                    "id": flight.id,
                    "element": <HTMLElement>stripBoard.lastElementChild,
                    "dropdowns": {},
                    "unitId": flight.unitId
                };


                strip.element.querySelectorAll( `input[type="text"]` ).forEach( input => {

                    if ( input instanceof HTMLInputElement ) {

                        switch ( input.name ) {

                            case "assignedAltitude":

                                input.addEventListener( "change", ( ev ) => {

                                    let val = parseInt( input.value.replace( /[^\d]/g, "" ) );

                                    if ( isNaN( val ) || val < 0 || val > 40 ) {
                                        val = 0;
                                    }
                                    
                                    this.updateFlight( flight.id, {
                                        "assignedAltitude": val
                                    });

                                });

                            break;

                            case "assignedSpeed":

                                input.addEventListener( "change", ( ev ) => {

                                    let val =   parseInt( input.value.replace( /[^\d]/g, "" ) );

                                    if ( isNaN( val ) || val < 0 || val > 750 ) {
                                        val = 0;
                                    }
                                    
                                    this.updateFlight( flight.id, {
                                        "assignedSpeed": val
                                    });

                                });

                            break;
                                
                        }

                    }

                });

                strip.element.querySelectorAll( ".select-unit" ).forEach( el => {

                    el.addEventListener( "click", ev => {
                        ev.preventDefault();
                        getUnitsManager().selectUnit( flight.unitId );
                    });

                });

                this.addStrip( strip );

            } else {

                //
                //  Altitude
                //

                let assignedAltitude = <HTMLInputElement>strip.element.querySelector( `input[name="assignedAltitude"]`);

                if ( !assignedAltitude.matches( ":focus" ) && assignedAltitude.value !== flight.assignedAltitude ) {
                    assignedAltitude.value = flight.assignedAltitude;
                }

                flightData.altitude = Math.floor( mToFt(flightData.altitude) );

                strip.element.querySelectorAll( `[data-point="altitude"]` ).forEach( el => {
                    if ( el instanceof HTMLElement ) {
                        el.innerText = "" + flightData.altitude;
                    }
                });

                const altitudeDelta = ( flight.assignedAltitude === 0 ) ? 0 : ( flight.assignedAltitude * 1000 ) - flightData.altitude;
                
                strip.element.toggleAttribute( "data-altitude-assigned", ( flight.assignedAltitude > 0 ) );
                strip.element.toggleAttribute( "data-warning-altitude", ( altitudeDelta >= 300 || altitudeDelta <= -300  ) );

                
                //
                //  Speed
                //

                let assignedSpeed = <HTMLInputElement>strip.element.querySelector( `input[name="assignedSpeed"]`);

                if ( !assignedSpeed.matches( ":focus" ) && assignedSpeed.value !== flight.assignedSpeed ) {
                    assignedSpeed.value = flight.assignedSpeed;
                }

                flightData.speed = Math.floor( msToKnots(flightData.speed) );

                strip.element.querySelectorAll( `[data-point="speed"]` ).forEach( el => {
                    if ( el instanceof HTMLElement ) {
                        el.innerText = "" + flightData.speed;
                    }
                });

                const speedDelta = ( flight.assignedSpeed === 0 ) ? 0 : flight.assignedSpeed - flightData.speed;
                
                strip.element.toggleAttribute( "data-speed-assigned", ( flight.assignedSpeed > 0 ) );
                strip.element.toggleAttribute( "data-warning-speed", ( speedDelta >= 25 || speedDelta <= -25  ) );



            }

            strip.element.toggleAttribute( "data-updating", false );

        });
        
        stripBoard.querySelectorAll( `[data-updating]` ).forEach( strip => {
            this.deleteStrip( strip.getAttribute( "data-flight-id" ) || "" );
        });

    }

}