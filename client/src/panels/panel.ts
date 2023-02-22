export class Panel {
    #element: HTMLElement
    #display: string;

    constructor(ID: string) {
        this.#element = <HTMLElement>document.getElementById(ID);
        this.#display = '';
        this.#display = this.#element.style.display;
    }

    show() {
        this.#element.style.display = this.#display;
    }

    hide() {
        this.#element.style.display = "none";
    }

    getElement() {
        return this.#element;
    }
}