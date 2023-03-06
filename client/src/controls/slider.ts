export class Slider {
    #container: HTMLElement | null;
    #callback: CallableFunction;
    #slider: HTMLInputElement | null = null;
    #value: HTMLElement | null = null;
    #minValue: number;
    #maxValue: number;
    #minValueDiv: HTMLElement | null = null;
    #maxValueDiv: HTMLElement | null = null;
    #unit: string;
    #display: string = "";

    constructor(ID: string, minValue: number, maxValue: number, unit: string, callback: CallableFunction) {
        this.#container = document.getElementById(ID);
        this.#callback = callback;
        this.#minValue = minValue;
        this.#maxValue = maxValue;
        this.#unit = unit;
        if (this.#container != null) {
            this.#display = this.#container.style.display;
            this.#slider = <HTMLInputElement>this.#container.querySelector("input");
            if (this.#slider != null)
            {
                this.#slider.addEventListener("input", (e: any) => this.#onInput());
                this.#slider.addEventListener("mouseup", (e: any) => this.#onFinalize());
            }
            this.#value = <HTMLElement>this.#container.querySelector("#value");
        }
    }

    #onValue()
    {
        if (this.#value != null && this.#slider != null)
            this.#value.innerHTML = this.#minValue + Math.round(parseFloat(this.#slider.value) / 100 * (this.#maxValue - this.#minValue)) + this.#unit
        this.setActive(true);
    }

    #onInput()
    {
        this.#onValue();
    }

    #onFinalize()
    {
        if (this.#slider != null)
            this.#callback(this.#minValue + parseFloat(this.#slider.value) / 100 * (this.#maxValue - this.#minValue));
    }

    show()
    {
        if (this.#container != null)
            this.#container.style.display = this.#display;
    }

    hide()
    {
        if (this.#container != null)
            this.#container.style.display = 'none';
    }

    setActive(newActive: boolean)
    {
        if (this.#container)
        {
            this.#container.classList.toggle("active", newActive);
            if (!newActive && this.#value != null)
                this.#value.innerText = "Mixed values";
        }
    }

    setMinMax(newMinValue: number, newMaxValue: number)
    {
        this.#minValue = newMinValue;
        this.#maxValue = newMaxValue;
    }

    setValue(newValue: number)
    {
        if (this.#slider != null)
            this.#slider.value = String((newValue - this.#minValue) / (this.#maxValue - this.#minValue) * 100); 
        this.#onValue()
    }
}