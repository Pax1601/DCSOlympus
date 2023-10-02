import { Panel } from "./panel";

export class ConnectionStatusPanel extends Panel {

    constructor(ID: string) {
        super( ID );
    }


    showDisconnected() {
        this.getElement().toggleAttribute( "data-is-connected", false );
        this.getElement().toggleAttribute( "data-is-paused", false );
    }


    showConnected() {
        this.getElement().toggleAttribute( "data-is-connected", true );
        this.getElement().toggleAttribute( "data-is-paused", false );
    }


    showServerPaused() {
        this.getElement().toggleAttribute( "data-is-connected", false );
        this.getElement().toggleAttribute( "data-is-paused", true );
    }
    
}