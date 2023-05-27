import { Control } from "./control";

export class Switch extends Control {
    #value: boolean = false;
    constructor(ID: string, initialValue?: boolean) {
        super(ID);
        this.getContainer()?.addEventListener('click', (e) => this.#onToggle());
        this.setValue(initialValue !== undefined? initialValue: true);

        /* Add the toggle itself to the document */
        const container = this.getContainer();
        if (container != undefined){
            const width = getComputedStyle(container).width;
            const height = getComputedStyle(container).height;
            var el = document.createElement("div");
            el.classList.add("ol-switch-fill");
            el.style.setProperty("--width", width? width: "0px");
            el.style.setProperty("--height", height? height: "0px");
            this.getContainer()?.appendChild(el);
        }
    }
    setValue(value: boolean) {
        this.#value = value;
        this.getContainer()?.setAttribute("data-value", String(value));
    }

    getValue() {
        return this.#value;
    }

    #onToggle() {
        this.setValue(!this.getValue());
    }
}