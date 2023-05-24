export class Slider {
    #container: HTMLElement | null;
    #callback: CallableFunction;
    #slider: HTMLInputElement | null = null;
    #valueText: HTMLElement | null = null;
    #minValue: number;
    #maxValue: number;
    #increment: number;
    #minValueDiv: HTMLElement | null = null;
    #maxValueDiv: HTMLElement | null = null;
    #unit: string;
    #display: string = "";
    #dragged: boolean = false;
    #value: number = 0;

    constructor(ID: string, minValue: number, maxValue: number, unit: string, callback: CallableFunction) {
        this.#container = document.getElementById(ID);
        this.#callback = callback;
        this.#minValue = minValue;
        this.#maxValue = maxValue;
        this.#increment = 1;
        this.#unit = unit;
        if (this.#container != null) {
            this.#display = this.#container.style.display;
            this.#slider = <HTMLInputElement>this.#container.querySelector("input");
            if (this.#slider != null) {
                this.#slider.addEventListener("input", (e: any) => this.#onInput());
                this.#slider.addEventListener("mousedown", (e: any) => this.#onStart());
                this.#slider.addEventListener("mouseup", (e: any) => this.#onFinalize());
            }
            this.#valueText = <HTMLElement>this.#container.querySelector("#value");
        }
    }

    show() {
        if (this.#container != null)
            this.#container.style.display = this.#display;
    }

    hide() {
        if (this.#container != null)
            this.#container.style.display = 'none';
    }

    setActive(newActive: boolean) {
        if (this.#container && !this.#dragged) {
            this.#container.classList.toggle("active", newActive);
            if (!newActive && this.#valueText != null)
                this.#valueText.innerText = "Mixed values";
        }
    }

    setMinMax(newMinValue: number, newMaxValue: number) {
        this.#minValue = newMinValue;
        this.#maxValue = newMaxValue;
        this.#updateMax();
    }

    setIncrement(newIncrement: number) {
        this.#increment = newIncrement;
        this.#updateMax();
    }

    setValue(newValue: number) {
        // Disable value setting if the user is dragging the element
        if (!this.#dragged) {
            this.#value = newValue;
            if (this.#slider != null)
                this.#slider.value = String((newValue - this.#minValue) / (this.#maxValue - this.#minValue) * parseFloat(this.#slider.max));
            this.#onValue()
        }
    }

    getValue() {
        return this.#value;
    }

    getDragged() {
        return this.#dragged;
    }

    #updateMax() {
        var oldValue = this.getValue();
        if (this.#slider != null)
            this.#slider.max = String((this.#maxValue - this.#minValue) / this.#increment);
        this.setValue(oldValue);
    }

    #onValue() {
        if (this.#valueText != null && this.#slider != null)
            this.#valueText.innerHTML = this.#minValue + Math.round(parseFloat(this.#slider.value) / parseFloat(this.#slider.max) * (this.#maxValue - this.#minValue)) + this.#unit
        this.setActive(true);
    }

    #onInput() {
        this.#onValue();
    }

    #onStart() {
        this.#dragged = true;
    }

    #onFinalize() {
        this.#dragged = false;
        if (this.#slider != null) {
            this.#value = this.#minValue + parseFloat(this.#slider.value) / parseFloat(this.#slider.max) * (this.#maxValue - this.#minValue);
            this.#callback(this.getValue());
        }
    }
}