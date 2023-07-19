import { Panel } from "./panel";

export class ConnectionStatusPanel extends Panel {
    constructor(ID: string) {
        super(ID);
    }

    update(connected: boolean) {
        this.getElement().toggleAttribute( "data-is-connected", connected );
    }

    setMetrics(frameRate: number, load: number) {
        const dt = this.getElement().querySelector("dt");
        if (dt) {
            dt.dataset["framerate"] = String(frameRate);
            dt.dataset["load"] = String(load);
        }
    }
}