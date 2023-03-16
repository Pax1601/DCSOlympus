export class Panel {
    #element: HTMLElement
    #visible: boolean = true;

    constructor(ID: string) {
        this.#element = <HTMLElement>document.getElementById(ID);
    }

    show() {
        this.#element.classList.toggle("hide", false);
        this.#visible = true;
    }

    hide() {
        this.#element.classList.toggle("hide", true);
        this.#visible = false;
    }

    getElement() {
        return this.#element;
    }

    getVisible(){
        return this.#visible;
    }
}