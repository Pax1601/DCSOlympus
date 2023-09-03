import { OlympusApp } from "../olympusapp";
import { EventsManager } from "../other/eventsmanager";

interface IListener {
    callback: CallableFunction;
    name?: string
}

export class PanelEventsManager extends EventsManager {

    constructor( olympusApp:OlympusApp ) {
        
        super( olympusApp );

        this.add( "hide", [] );
        this.add( "show", [] );

    }

    on( eventName:string, listener:IListener ) {

        const event = this.get( eventName );

        if ( !event ) {
            throw new Error( `Event name "${eventName}" is not valid.` );
        }

        this.get( eventName ).push({
            "callback": listener.callback
        });

    }

    trigger( eventName:string, contextData:object ) {

        const listeners = this.get( eventName );

        if ( listeners ) {

            listeners.forEach( ( listener:IListener ) => {

                listener.callback( contextData );

            });

        }

    }

}