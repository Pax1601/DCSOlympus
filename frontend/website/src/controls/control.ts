export class Control {
    #container: HTMLElement | null;
    expectedValue: any = null;
    
    constructor(container: string | null, options?: any) {
        if (typeof container === "string")
            this.#container = document.getElementById(container);
        else
            this.#container = this.createElement(options);
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

    setExpectedValue(expectedValue: any) {
        this.expectedValue = expectedValue;
    }

    resetExpectedValue() {
        this.expectedValue = null;
    }

    checkExpectedValue(value: any) {
        return this.expectedValue === null || value === this.expectedValue;
    }

    createElement(options?: any): HTMLElement | null {
        return null;
    }
}