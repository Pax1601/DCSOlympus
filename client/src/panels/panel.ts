export class Panel {
    #element: HTMLElement

    constructor(ID: string) {
        this.#element = <HTMLElement>document.getElementById(ID);
    }

    show() {
        this.#element.classList.toggle("hide", false);
    }

    hide() {
        this.#element.classList.toggle("hide", true);
    }

    getElement() {
        return this.#element;
    }
}