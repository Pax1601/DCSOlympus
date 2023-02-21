import { ToggleableFeature } from "../ToggleableFeature";
import Sortable from 'sortablejs';
import { ATCFLightList } from "./FlightList";

export class ATC extends ToggleableFeature {

    constructor() {
        
        super( true );

        //this.#generateFlightList();

        let $list = document.getElementById( "atc-strip-board-arrivals" );

        if ( $list instanceof HTMLElement ) {
            Sortable.create( $list, {
                "handle": ".handle"
            });
        }

    }


    #generateFlightList() {

        const flightList  = new ATCFLightList();
        const flights:any = flightList.getFlights( true );

        const $tbody = document.getElementById( "atc-flight-list-table-body" );

        if ( $tbody instanceof HTMLElement ) {

            if ( flights.length > 0 ) {

                let flight:any = {};

                let $button, i;
        
                for ( [ i, flight ] of flights.entries() ) {
        
                    const $row          = document.createElement( "tr" );
                    $row.dataset.status = flight.status
    
                    let $td       = document.createElement( "td" );
                    $td.innerText = flight.name;
                    $row.appendChild( $td );
    
                    $td           = document.createElement( "td" );
                    $td.innerText = flight.takeOffTime;
                    $row.appendChild( $td );
    
                    $td           = document.createElement( "td" );
                    $td.innerText = "00:0" + ( 5 + i );
                    $row.appendChild( $td );
    
                    $td           = document.createElement( "td" );
                    $td.innerText = flight.status;
                    $row.appendChild( $td );

                    
                    $td = document.createElement( "td" );
                    $button = document.createElement( "button" );
                    $button.innerText = "...";

                    $td.appendChild( $button );

                    $row.appendChild( $td );

        
                    $tbody.appendChild( $row );
        
                }

            }

        }

    }


    protected onStatusUpdate(): void {
        
        document.body.classList.toggle( "atc-enabled", this.getStatus() );

    }

}