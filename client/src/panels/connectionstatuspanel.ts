import { Panel } from "./panel";

export class ConnectionStatusPanel extends Panel {
    constructor(ID: string) {
        super(ID);
    }

    update(connected: boolean) {
        var div = this.getElement().querySelector("#status-string");
        if (div != null) {
            if (connected) {
                div.innerHTML = "Connected";
                div.classList.add("ol-status-connected");
                div.classList.remove("ol-status-disconnected");
            }
            else {
                div.innerHTML = "Disconnected";
                div.classList.add("ol-status-disconnected");
                div.classList.remove("ol-status-connected");
            }
        }
    }
}