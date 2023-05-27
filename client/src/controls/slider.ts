import { zeroPad } from "../other/utils";
import { Control } from "./control";

export class Slider extends Control {
    #callback: CallableFunction;
    #slider: HTMLInputElement | null = null;
    #valueText: HTMLElement | null = null;
    #minValue: number;
    #maxValue: number;
    #increment: number;
    #minMaxValueDiv: HTMLElement | null = null;
    #unit: string;
    #dragged: boolean = false;
    #value: number = 0;

    constructor(ID: string, minValue: number, maxValue: number, unit: string, callback: CallableFunction) {
        super(ID);
        this.#callback = callback;
        this.#minValue = minValue;
        this.#maxValue = maxValue;
        this.#increment = 1;
        this.#unit = unit;
        this.#slider = this.getContainer()?.querySelector("input") as HTMLInputElement;

        if (this.#slider != null) {
            this.#slider.addEventListener("input", (e: any) => this.#onInput());
            this.#slider.addEventListener("mousedown", (e: any) => this.#onStart());
            this.#slider.addEventListener("mouseup", (e: any) => this.#onFinalize());
        }

        this.#valueText = this.getContainer()?.querySelector(".ol-slider-value") as HTMLElement;
        this.#minMaxValueDiv = this.getContainer()?.querySelector(".ol-slider-min-max") as HTMLElement;
    }

    setActive(newActive: boolean) {
        if (!this.#dragged) {
            this.getContainer()?.classList.toggle("active", newActive);
            if (!newActive && this.#valueText != null)
                this.#valueText.innerText = "Mixed values";
        }
    }

    setMinMax(newMinValue: number, newMaxValue: number) {
        this.#minValue = newMinValue;
        this.#maxValue = newMaxValue;
        this.#updateMax();
        if (this.#minMaxValueDiv != null) {
            this.#minMaxValueDiv.setAttribute('data-min-value', `${this.#minValue}${this.#unit}`);
            this.#minMaxValueDiv.setAttribute('data-max-value', `${this.#maxValue}${this.#unit}`);
        }
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
        {
            var value = this.#minValue + Math.round(parseFloat(this.#slider.value) / parseFloat(this.#slider.max) * (this.#maxValue - this.#minValue));
            var strValue = String(value);
            if (value > 1000)
                strValue = String(Math.floor(value / 1000)) + "," + zeroPad(value - Math.floor(value / 1000) * 1000, 3);
            this.#valueText.innerText = strValue + " " + this.#unit.toUpperCase();

            var percentValue = parseFloat(this.#slider.value) / parseFloat(this.#slider.max) * 90 + 5;
            this.#slider.style.background = 'linear-gradient(to right, var(--accent-light-blue) 5%, var(--accent-light-blue) ' + percentValue + '%, var(--background-grey) ' + percentValue + '%, var(--background-grey) 100%)'
        }
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