export class Dropdown {
    #element: HTMLElement;
    #options: HTMLElement;
    #value: HTMLElement;
    #callback: CallableFunction;
    #defaultValue: string;
    #optionsList: string[] = [];
    
    constructor(ID: string, callback: CallableFunction, options: string[] | null = null)
    {
        this.#element = <HTMLElement>document.getElementById(ID);
        this.#options = <HTMLElement>this.#element.querySelector(".ol-select-options");
        this.#value = <HTMLElement>this.#element.querySelector(".ol-select-value");
        this.#defaultValue = this.#value.innerText;
        this.#callback = callback;
        if (options != null) {
            this.setOptions(options);
        }

        

        //  Do open/close toggle
        this.#element.addEventListener("click", ev => {

            if ( ev.target instanceof HTMLElement && ev.target.nodeName !== "A" ) {
                ev.preventDefault();
            }
            
            ev.stopPropagation();
            this.#element.classList.toggle("is-open");

        });

        //  Autoclose on mouseleave
        this.#element.addEventListener("mouseleave", ev => {
            this.#element.classList.remove("is-open");
        });

    }

    setOptions(optionsList: string[])
    {
        this.#optionsList = optionsList;
        this.#options.replaceChildren(...optionsList.map((option: string) => {
            var div = document.createElement("div");
            var button = document.createElement("button");
            button.textContent = option;
            div.appendChild(button);
            button.addEventListener("click", (e: MouseEvent) => {
                this.#value.innerText = option;
                this.#callback( option, e );
            });
            return div;
        }));
    }

    selectValue(idx: number)
    {
        if (idx < this.#optionsList.length)
        {
            var option = this.#optionsList[idx];
            this.#value.innerText = option;
            this.#callback(option);
        }
    }

    reset() {
        this.#options.replaceChildren();
        this.#value.innerText = this.#defaultValue;
    }
}