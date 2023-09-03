import { Panel } from "./panel";

export class ConnectionStatusPanel extends Panel {
    /**
     * 
     * @param ID - the ID of the HTML element which will contain the context menu
     */
    constructor(ID: string){
        super(ID);
    }

    update(connected: boolean) {
        this.getElement().toggleAttribute( "data-is-connected", connected );
    }
}