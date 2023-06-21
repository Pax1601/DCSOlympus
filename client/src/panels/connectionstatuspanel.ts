import { Panel } from "./panel";

export class ConnectionStatusPanel extends Panel {
    constructor(ID: string) {
        super(ID);
    }

    update(connected: boolean) {
        this.getElement().toggleAttribute( "data-is-connected", connected );
    }
}