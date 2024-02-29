import { deg2rad } from "../other/utils";

export class NumericInput {
    #container: HTMLElement;
    #input: HTMLInputElement;
    #callback: (value: number) => void;
    #defaultText: string;
    #hidden: boolean = false;

    constructor(ID: string | null, callback: (value: number) => void, defaultValue?: number, defaultText: string = "SpawnHeading") {
        this.#container = document.createElement("div");
        this.#container.style.borderRadius = "50%"; // Make it circular
        this.#container.style.display = "flex";
        this.#container.style.justifyContent = "center";
        this.#container.style.alignItems = "center";
        this.#container.style.width = "100px"; // Adjust size as needed
        this.#container.style.height = "100px"; // Adjust size as needed
        this.#container.style.border = "1px solid black"; // Style as needed

        this.#input = document.createElement("input");
        this.#input.type = "number";
        this.#input.min = "0";
        this.#input.max = "360";
        this.#input.style.width = "60px"; // Adjust size as needed
        this.#input.value = defaultValue?.toString() ?? "";
        this.#input.style.textAlign = "center";
        this.#defaultText = defaultText; // Might be used for placeholder or label if needed

        this.#callback = callback;

        this.#container.appendChild(this.#input);
        if (ID) {
            this.#container.id = ID;
        }

        this.#input.addEventListener("change", this.#handleChange.bind(this));
        this.#input.addEventListener("wheel", this.#handleWheel.bind(this));
    }

    #handleChange() {
        const value = parseInt(this.#input.value, 10);
        if (!isNaN(value) && value >= 0 && value <= 360) {
            const radians = deg2rad(value);
            this.#callback(radians);
        }
    }

    #handleWheel(event: WheelEvent) {
        event.preventDefault();
        let currentValue = parseInt(this.#input.value, 10);
        if (!isNaN(currentValue)) {
            currentValue += event.deltaY < 0 ? 1 : -1;
            if (currentValue >= 0 && currentValue <= 360) {
                this.#input.value = currentValue.toString();
                this.#handleChange(); // Update after wheel change
            }
        }
    }

    getContainer(): HTMLElement {
        return this.#container;
    }

    getValue(): number {
        const value = parseInt(this.#input.value, 10);
        return !isNaN(value) ? value : 0;
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
