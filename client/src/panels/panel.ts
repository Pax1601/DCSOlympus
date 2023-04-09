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

    protected onHide() {}

    hide() {
        this.#element.classList.toggle("hide", true);
        this.#visible = false;

        this.onHide();
    }

    toggle() {
        // Simple way to track if currently visible
        if (this.#visible)
            this.hide();
        else 
            this.show();
    }

    getElement() {
        return this.#element;
    }

    getVisible(){
        return this.#visible;
    }
}