export class UnitDataTable {

    #element;
    #tableId = "unit-data-table";
    #hasUpdated = false;


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


    refresh( units:object ) {

        if ( this.#hasUpdated ) {
            return;
        }

        const unitsArray = Object.values( units );


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


        this.#hasUpdated = true;

    }
}