import { Panel } from "../panels/panel";

export class PopupMessage {
    #element: HTMLDivElement;
    #fadeTime: number = 2000; // Milliseconds

    constructor(text: string, fateTime: number) {
        this.#element = document.createElement("div");

        this.#fadeTime = fateTime;
        this.#element.innerText = text;
        this.#element.classList.remove("invisible");
        this.#element.classList.add("visible");

        window.setTimeout(() => {
            this.#element.classList.remove("visible");
            this.#element.classList.add("invisible");
            window.setTimeout(() => {
                this.#element.dispatchEvent(new Event("removed"));
                this.#element.remove();
            }, 2000);
        }, this.#fadeTime);
    }

    getElement() {
        return this.#element;
    }
}

export class Popup extends Panel {
    #fadeTime: number = 2000; // Milliseconds
    #messages: PopupMessage[] = [];
    #stackAfter: number;

    constructor(ID: string, stackAfter: number = 3) {
        super(ID);
        this.show();
        this.#stackAfter = stackAfter;
    }

    setFadeTime(fadeTime: number) {
        this.#fadeTime = fadeTime;
    }

    setText(text: string) {
        var message = new PopupMessage(text, this.#fadeTime);
        message.getElement().addEventListener("removed", () => {
            var index = this.#messages.indexOf(message);
            if (index !== -1)
                this.#messages.splice(index, 1);
        })
        this.getElement().appendChild(message.getElement());
        this.#messages.push(message);
        if (this.#messages.length > this.#stackAfter) {
            this.#messages[this.#messages.length - this.#stackAfter - 1].getElement().classList.add("ol-popup-stack");
        }
    }
}