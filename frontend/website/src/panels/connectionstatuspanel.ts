import { Panel } from "./panel";

export class ConnectionStatusPanel extends Panel {

    #elapsedTimeElement:HTMLElement;
    #missionTimeElement:HTMLElement;

    constructor(ID: string) {
        super( ID );
        this.#elapsedTimeElement = <HTMLElement>this.getElement().querySelector( ".mission-elapsed-time" );
        this.#missionTimeElement = <HTMLElement>this.getElement().querySelector( ".mission-time" );

        this.#elapsedTimeElement.addEventListener( "click", () => {
            this.#toggleTime();
        });

        this.#missionTimeElement.addEventListener( "click", () => {
            this.#toggleTime();
        });
        
    }

    setElapsedTime( time:string ) {
        this.#elapsedTimeElement.innerText = `ET: ${time}`;
    }

    setMissionTime( time:string ) {
        this.#missionTimeElement.innerText = `MT: ${time} L`;
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
    
    #toggleTime() {
        this.getElement().toggleAttribute( "data-mission-time" );
    }
}