export class Control {
    #container: HTMLElement | null;
    
    constructor(ID: string) {
        this.#container = document.getElementById(ID);
    }

    show() {
        if (this.#container != null)
            this.#container.classList.remove("hide");
    }

    hide() {
        if (this.#container != null)
            this.#container.classList.add("hide");
    }

    getContainer() {
        return this.#container;
    }
}