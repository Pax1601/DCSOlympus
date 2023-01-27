export class Button {
    #container: HTMLElement | null;
    #srcs: string[];
    #callback: CallableFunction;
    #img: any;
    #state: number = 0;

    constructor(ID: string, srcs: string[], callback: CallableFunction) {
        this.#container = document.getElementById(ID);
        this.#srcs = srcs;
        this.#callback = callback;
        if (this.#container != null) {
            this.#img = document.createElement("img");
            this.#img.src = this.#srcs[this.#state];
            this.#container.appendChild(this.#img);
            this.#container.addEventListener("click", () => this.#onClick());
        }
    }

    setState(state: number) {
        if (state < this.#srcs.length) {
            this.#state = state;
            this.#img.src = this.#srcs[this.#state];
        }
    }

    getState() {
        return this.#state;
    }

    #onClick() {
        if (this.#img != null) {
            this.setState(this.#state < this.#srcs.length - 1 ? this.#state + 1 : 0);
            if (this.#callback)
                this.#callback(this.#state);
        }
    }
}