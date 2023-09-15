import { EventsManager } from "../other/eventsmanager";

export class PanelEventsManager extends EventsManager {
    constructor() {
        super();
        
        this.add("hide", []);
        this.add("show", []);
    }

    on(eventName: string, listener: Listener) {
        const event = this.get(eventName);
        if (!event) {
            throw new Error(`Event name "${eventName}" is not valid.`);
        }
        this.get(eventName).push({
            "callback": listener.callback
        });
    }

    trigger(eventName: string, contextData: object) {
        const listeners = this.get(eventName);
        if (listeners) {
            listeners.forEach((listener: Listener) => {
                listener.callback(contextData);
            });
        }
    }
}