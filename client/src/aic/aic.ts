interface AICFormation {
    "descriptor" : string,
    "icon"       : string,
    "label"      : string,
    "name"       : string
}


export class AIC {

    #status:boolean = true;

    #formations:AICFormation[] = [{
        "descriptor" : "group, single, Bullseye, <bearing>, <range>, <altitude>, tracks <N|NE|E|SE|S|SW|W|NW>, <bogey|hostile>",
        "icon"       : "single.png",
        "label"      : "Single",
        "name"       : "single"
    }, {
        "descriptor" : "",
        "icon"       : "azimuth.png",
        "label"      : "Azimuth",
        "name"       : "azimuth"
    }, {
        "descriptor" : "",
        "icon"       : "range.png",
        "label"      : "Range",
        "name"       : "range"
    }];


    constructor() {
        
        this.#onStatusUpdate();

    }


    getFormations() {
        return this.#formations;
    }


    getStatus() {
        return this.#status;
    }


    #onStatusUpdate() {

        const status:boolean = this.getStatus();

        //  Update the DOM
        document.body.classList.toggle( "aic-enabled", status );

    }


    toggleStatus(force?:boolean) {

        if ( force ) {
            this.#status = force;
        } else {
            this.#status = !this.#status;
        }

        this.#onStatusUpdate();

    }

}