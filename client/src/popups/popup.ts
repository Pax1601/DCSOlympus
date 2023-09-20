import { Panel } from "../panels/panel";

export class Popup extends Panel {

    constructor( elementId:string ) {
        super( elementId );
    }

    #fadeTime: number = 2000; // Milliseconds
    #hideTimer: number | undefined = undefined;
    #visibilityTimer: number | undefined = undefined;

    setFadeTime(fadeTime: number) {
        this.#fadeTime = fadeTime;
    }
    
    setText(text: string) {
        (<HTMLElement> this.getElement().querySelector("div")).innerText = text;
        this.show();
        this.getElement().classList.remove("invisible");
        this.getElement().classList.add("visible");

        clearTimeout(this.#visibilityTimer);
        clearTimeout(this.#hideTimer);
        this.#visibilityTimer = window.setTimeout(() => {
            this.getElement().classList.remove("visible");
            this.getElement().classList.add("invisible");
            this.#hideTimer = window.setTimeout(() => this.hide(), 2000);
        }, this.#fadeTime);
    }
}