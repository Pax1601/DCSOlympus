import { getApp } from "..";
import { Panel } from "./panel";

export class ConnectionStatusPanel extends Panel {

    #previousMissionElapsedTime:number = 0;

    constructor(ID: string) {
        super( ID );
    }

    
    update(connected: boolean) {

        if ( connected ) {

            const missionElapsedTime = getApp().getMissionManager().getDateAndTime().elapsedTime;
    
            if ( missionElapsedTime === this.#previousMissionElapsedTime ) {
                this.getElement().toggleAttribute( "data-is-connected", false );
                this.getElement().toggleAttribute( "data-is-paused", true );
            } else {
                this.getElement().toggleAttribute( "data-is-connected", true );
                this.getElement().toggleAttribute( "data-is-paused", false );
            }

            this.#previousMissionElapsedTime = missionElapsedTime;

        } else {

            this.getElement().toggleAttribute( "data-is-connected", false );

        }

    }
}