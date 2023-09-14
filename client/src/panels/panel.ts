import { OlympusApp } from "../olympusapp";
import { PanelEventsManager } from "./paneleventsmanager";

export abstract class Panel {

    #element: HTMLElement
    #eventsManager!: PanelEventsManager;
    #olympusApp!: OlympusApp;

    constructor(ID: string, olympusApp?:OlympusApp ) {
        this.#element = <HTMLElement>document.getElementById(ID);
        
        if ( olympusApp ) {
            this.setOlympusApp( olympusApp );
        }
    }

    show() {
        this.#element.classList.toggle("hide", false);
        this.getEventsManager()?.trigger( "show", {} );
    }

    hide() {
        this.#element.classList.toggle("hide", true);
        this.getEventsManager()?.trigger( "hide", {} );
    }

    toggle() {
        // Simple way to track if currently visible
        if (this.getVisible())
            this.hide();
        else 
            this.show();
    }

    getElement() {
        return this.#element;
    }

    getVisible(){
        return (!this.getElement().classList.contains( "hide" ) );
    }

    getEventsManager() {
        return this.#eventsManager;
    }

    getOlympusApp() {
        return this.#olympusApp;
    }

    setOlympusApp( olympusApp:OlympusApp ) {
        this.#olympusApp    = olympusApp;
        this.#eventsManager = new PanelEventsManager( this.getOlympusApp() );
    }

}