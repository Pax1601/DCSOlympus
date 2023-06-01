import { Control } from "./control";

export class Switch extends Control {
    #value: boolean | undefined = false;
    #callback: CallableFunction | null = null;

    constructor(ID: string, callback: CallableFunction, initialValue?: boolean) {
        super(ID);
        this.getContainer()?.addEventListener('click', (e) => this.#onToggle());
        this.setValue(initialValue !== undefined? initialValue: true);

        this.#callback = callback;

        /* Add the toggle itself to the document */
        const container = this.getContainer();
        if (container != undefined){
            const width = getComputedStyle(container).width;
            const height = getComputedStyle(container).height;
            var el = document.createElement("div");
            el.classList.add("ol-switch-fill");
            el.style.setProperty("--width", width? width: "0");
            el.style.setProperty("--height", height? height: "0");
            this.getContainer()?.appendChild(el);
        }
    }

    setValue(newValue: boolean | undefined, ignoreExpectedValue: boolean = true) {
        if (ignoreExpectedValue || this.checkExpectedValue(newValue)) {
            this.#value = newValue;
            this.getContainer()?.setAttribute("data-value", String(newValue));
        }
    }

    getValue() {
        return this.#value;
    }

    #onToggle() {
        this.resetExpectedValue();
        this.setValue(!this.getValue());
        if (this.#callback) {
            this.#callback(this.getValue());
            this.setExpectedValue(this.getValue());
        }
    }
}