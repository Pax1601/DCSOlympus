export class NumericInput {
    #container: HTMLElement;
    #input: HTMLInputElement;
    #callback: (value: number) => void;
    #defaultText: string;
    #hidden: boolean = false;

    constructor(ID: string | null, callback: (value: number) => void, defaultValue?: number, defaultText: string = "SpawnHeading") {
        this.#container = document.createElement("div");
        this.#input = document.createElement("input");
        this.#input.type = "number";
        this.#input.min = "0";
        this.#input.max = "360";
        this.#input.value = defaultValue?.toString() ?? "";
        this.#defaultText = defaultText;

        this.#callback = callback;

        this.#container.appendChild(this.#input);
        if (ID) {
            this.#container.id = ID;
        }

        this.#input.addEventListener("change", () => {
            const value = parseInt(this.#input.value, 10);
            if (!isNaN(value) && value >= 0 && value <= 360) {
                this.#callback(value);
            }
        });
    }

    getContainer(): HTMLElement {
        return this.#container;
    }

    getValue(): number {
        const value = parseInt(this.#input.value, 10);
        return !isNaN(value) ? value : 0; // Returns 0 if the current value is not a number
    }

    setValue(value: number): void {
        if (value >= 0 && value <= 360) {
            this.#input.value = value.toString();
        }
    }

    show() {
        this.#container.classList.remove("hide");
        this.#hidden = false;
    }

    isHidden() {
        return this.#hidden;
    }
}
