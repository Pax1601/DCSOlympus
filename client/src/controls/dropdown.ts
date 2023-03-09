export class Dropdown {
    #element: HTMLElement;
    #options: HTMLElement;
    #value: HTMLElement;
    #callback: CallableFunction;
    
    constructor(ID: string, callback: CallableFunction, options: string[] | null = null)
    {
        this.#element = <HTMLElement>document.getElementById(ID);
        var element = this.#element;
        this.#options = <HTMLElement>this.#element.querySelector(".ol-select-options");
        this.#value = <HTMLElement>this.#element.querySelector(".ol-select-value");
        this.#callback = callback;
        if (options != null)
            this.setOptions(options);
    }

    setOptions(options: string[])
    {
        this.#options.replaceChildren(...options.map((option: string) => {
            var div = document.createElement("div");
            var button = document.createElement("button");
            button.textContent = option;
            div.appendChild(button);
            button.addEventListener("click", (e: MouseEvent) => {
                this.#value.innerText = option;
                this.#callback(option);
            });
            return div;
        }));
    }
}