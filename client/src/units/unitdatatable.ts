export class UnitDataTable {

    #element;
    #tableId = "unit-data-table";


    constructor() {

        const table = document.getElementById( this.#tableId );

        if ( table instanceof HTMLElement ) {
            
            this.#element = table;

        } else {

            return;

        }


    }


    getElement() {
        return this.#element;
    }


    hide() {
        this.getElement()?.closest( ".ol-dialog" )?.classList.add( "hide" );
    }


    refresh( units:object ) {

        const unitsArray = Object.values( units ).sort( ( a, b ) => {

            const aVal = a.baseData.unitName.toLowerCase();
            const bVal = b.baseData.unitName.toLowerCase();

            if ( aVal > bVal ) {
                return 1;
            } else if ( bVal > aVal ) {
                return -1;
            } else {
                return 0;
            }

        });


        function addRow( parentEl:HTMLElement, columns:string[] ) {

            const rowDiv = document.createElement( "div" );
            
            for ( const item of columns ) {

                const div = document.createElement( "div" );
                div.innerText = item;
                rowDiv.appendChild( div );

            }

            parentEl.appendChild( rowDiv );

        }


        const el = this.getElement();

        if ( el ) {

            el.innerHTML = "";

            addRow( el, [ "Callsign", "Name", "Category", "AI/Human" ] )

            for ( const unit of unitsArray ) {
    
                const dataset = [ unit.baseData.unitName, unit.baseData.name, unit.baseData.category, ( unit.baseData.AI ) ? "AI" : "Human" ];
    
                if ( this.getElement() ) {
    
                }
                addRow( el, dataset );
    
            }

        }

    }


    show() {
        this.getElement()?.closest( ".ol-dialog" )?.classList.remove( "hide" );
    }


    toggle() {
        this.getElement()?.closest( ".ol-dialog" )?.classList.toggle( "hide" );
    }

}