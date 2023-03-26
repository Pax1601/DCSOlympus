import { getMissionData } from "../..";
import { ATC } from "../atc";
import { ATCBoard } from "../atcboard";

export class ATCBoardFlight extends ATCBoard {

    constructor( atc:ATC, element:HTMLElement ) {

        super( atc, element );

        console.log( getMissionData() );

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

    }


    update() {
        
        const flights    = Object.values( this.getATC().getDataHandler().getFlights() );
        const stripBoard = this.getStripBoardElement();


        for( const strip of stripBoard.children ) {
            strip.toggleAttribute( "data-updating", true );
        }


        flights.forEach( flight => {

            let strip = stripBoard.querySelector( `[data-flight-id="${flight.id}"]`);

            if ( !strip ) {

                const template = `<div data-flight-id="${flight.id}">
                    <div data-point="name">${flight.name}</div>
                    <div data-point="status">${flight.status}</div>
                    <button data-on-click="deleteFlightStrip" data-on-click-params='{"id":"${flight.id}"}'>Delete</button>
                </div>`;

                stripBoard.insertAdjacentHTML( "beforeend", template );

                strip = <HTMLElement>stripBoard.lastElementChild;

            }

            strip.toggleAttribute( "data-updating", false );

        });
        
        stripBoard.querySelectorAll( `[data-updating]` ).forEach( strip => {
            strip.remove();
        });

    }

}