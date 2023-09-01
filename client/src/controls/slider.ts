import { zeroPad } from "../other/utils";
import { Control } from "./control";

export class Slider extends Control {
    #callback: CallableFunction | null = null;
    #slider: HTMLInputElement | null = null;
    #valueText: HTMLElement | null = null;
    #minValue: number = 0;
    #maxValue: number = 0;
    #increment: number = 0;
    #minMaxValueDiv: HTMLElement | null = null;
    #unitOfMeasure: string;
    #dragged: boolean = false;
    #value: number = 0;

    constructor(ID: string | null, minValue: number, maxValue: number, unitOfMeasure: string, callback: CallableFunction, options?: any) {
        super(ID, options);

        this.#callback = callback;     
        this.#unitOfMeasure = unitOfMeasure;
        this.#slider = this.getContainer()?.querySelector("input") as HTMLInputElement;

        if (this.#slider != null) {
            this.#slider.addEventListener("input", (e: any) => this.#update());
            this.#slider.addEventListener("mousedown", (e: any) => this.#onStart());
            this.#slider.addEventListener("mouseup", (e: any) => this.#onFinalize());
        }

        this.#valueText = this.getContainer()?.querySelector(".ol-slider-value") as HTMLElement;
        this.#minMaxValueDiv = this.getContainer()?.querySelector(".ol-slider-min-max") as HTMLElement;

        this.setIncrement(1);
        this.setMinMax(minValue, maxValue);
    }

    setActive(newActive: boolean) {
        if (!this.getDragged()) {
            this.getContainer()?.classList.toggle("active", newActive);
            if (!newActive && this.#valueText != null)
                this.#valueText.innerText = "Mixed values";
        }
    }

    setMinMax(newMinValue: number, newMaxValue: number) {
        if (this.#minValue != newMinValue || this.#maxValue != newMaxValue) {
            this.#minValue = newMinValue;
            this.#maxValue = newMaxValue;
            this.#updateMaxValue();

            if (this.#minMaxValueDiv != null) {
                this.#minMaxValueDiv.setAttribute('data-min-value', `${this.#minValue}${this.#unitOfMeasure}`);
                this.#minMaxValueDiv.setAttribute('data-max-value', `${this.#maxValue}${this.#unitOfMeasure}`);
            }
        }
    }

    setIncrement(newIncrement: number) {
        if (this.#increment != newIncrement) {
            this.#increment = newIncrement;
            this.#updateMaxValue();
        }
    }

    setValue(newValue: number, ignoreExpectedValue: boolean = true) {
        if (!this.getDragged() && (ignoreExpectedValue || this.checkExpectedValue(newValue))) {
            this.#value = newValue;
            if (this.#slider != null)
                this.#slider.value = String((newValue - this.#minValue) / (this.#maxValue - this.#minValue) * parseFloat(this.#slider.max));
            this.#update();
        }
    }

    getValue() {
        return this.#value;
    }

    setDragged(newDragged: boolean) {
        this.#dragged = newDragged;
    } 

    getDragged() {
        return this.#dragged;
    }

    #updateMaxValue() {
        var oldValue = this.getValue();
        if (this.#slider != null)
            this.#slider.max = String((this.#maxValue - this.#minValue) / this.#increment);
        this.setValue(oldValue);
    }

    #update() {
        if (this.#valueText != null && this.#slider != null)
        {
            /* Update the text value */
            var value = this.#minValue + Math.round(parseFloat(this.#slider.value) / parseFloat(this.#slider.max) * (this.#maxValue - this.#minValue));
            var strValue = String(value);
            if (value > 1000)
                strValue = String(Math.floor(value / 1000)) + "," + zeroPad(value - Math.floor(value / 1000) * 1000, 3);
            this.#valueText.innerText = `${strValue} ${this.#unitOfMeasure.toUpperCase()}`;

            /* Update the position of the slider */
            var percentValue = parseFloat(this.#slider.value) / parseFloat(this.#slider.max) * 90 + 5;
            this.#slider.style.background = `linear-gradient(to right, var(--accent-light-blue) 5%, var(--accent-light-blue) ${percentValue}%, var(--background-grey) ${percentValue}%, var(--background-grey) 100%)`
        }
        this.setActive(true);
    }

    #onStart() {
        this.setDragged(true);
    }

    #onFinalize() {
        this.setDragged(false);
        if (this.#slider != null) {
            this.resetExpectedValue();
            this.setValue(this.#minValue + parseFloat(this.#slider.value) / parseFloat(this.#slider.max) * (this.#maxValue - this.#minValue));
            if (this.#callback) {
                this.#callback(this.getValue());
                this.setExpectedValue(this.getValue());
            }
        }
    }

    createElement(options?: any): HTMLElement | null {
        var containerEl = document.createElement("div");
        containerEl.classList.add("ol-slider-container", "flight-control-ol-slider");

        var dl = document.createElement("dl");
        dl.classList.add("ol-data-grid");

        var dt = document.createElement("dt");
        dt.innerText = (options !== undefined && options.title !== undefined)? options.title: "";

        var dd = document.createElement("dd");
        var sliderEl = document.createElement("div");
        sliderEl.classList.add("ol-slider-value");
        dd.append(sliderEl);
        dl.append(dt, dd);

        var input = document.createElement("input") as HTMLInputElement;
        input.type = "range";
        input.min = "0";
        input.max = "100";
        input.value = "0"
        input.classList.add("ol-slider");
        containerEl.append(dl, input);

        return containerEl;
    }
}