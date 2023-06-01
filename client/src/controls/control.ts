export class Control {
    #container: HTMLElement | null;
    expectedValue: any = null;
    
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

    setExpectedValue(expectedValue: any) {
        this.expectedValue = expectedValue;
    }

    resetExpectedValue() {
        this.expectedValue = null;
    }

    checkExpectedValue(value: any) {
        return this.expectedValue === null || value === this.expectedValue;
    }
}