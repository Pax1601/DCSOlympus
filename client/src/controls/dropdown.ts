export class Dropdown {
    #element: HTMLElement;
    #options: HTMLElement;
    #value: HTMLElement;
    #callback: CallableFunction;
    #defaultValue: string;
    #optionsList: string[] = [];
    #index: number = 0;

    constructor(ID: string, callback: CallableFunction, options: string[] | null = null)
    {
        this.#element      = <HTMLElement>document.getElementById(ID);
        this.#options      = <HTMLElement>this.#element.querySelector(".ol-select-options");
        this.#value        = <HTMLElement>this.#element.querySelector(".ol-select-value");
        this.#defaultValue = this.#value.innerText;
        this.#callback     = callback;

        if (options != null) {
            this.setOptions(options);
        }          

        this.#value.addEventListener( "click", ev => {
            this.#element.classList.toggle( "is-open" );
            this.#clip();
        });

        // Commented out since it is a bit frustrating, particularly when the dropdown opens towards the top and not to the bottom
        //this.#element.addEventListener("mouseleave", ev => {
        //    this.#close();
        //});
    }

    setOptions(optionsList: string[])
    {
        this.#optionsList = optionsList;
        this.#options.replaceChildren(...optionsList.map((option: string, idx: number) => {
            var div = document.createElement("div");
            var button = document.createElement("button");
            button.textContent = option;
            div.appendChild(button);

            if (option === this.#defaultValue)
                this.#index = idx;

            button.addEventListener("click", (e: MouseEvent) => {
                e.stopPropagation();
                this.#value.innerText = option;
                this.#close();
                this.#callback(option, e);
                this.#index = idx;
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
            this.#index = idx;
            this.#close();
            this.#callback(option);
            return true;
        }
        else
            return false;
    }

    reset() {
        this.#options.replaceChildren();
        this.#value.innerText = this.#defaultValue;
    }

    getValue() {
        return this.#value.innerText;
    }

    setValue(value: string) {
        var index = this.#optionsList.findIndex((option) => {return option === value});
        if (index > -1) 
            this.selectValue(index);
    }

    getIndex() {
        return this.#index;
    }

    #clip() {
        const options = this.#options;
        const bounds  = options.getBoundingClientRect();
        this.#element.dataset.position = ( bounds.bottom > window.innerHeight ) ? "top" : "";
    }

    #close() {
        this.#element.classList.remove( "is-open" );
        this.#element.dataset.position = "";
    }

    #open() {
        this.#element.classList.add( "is-open" );
    }

    #toggle() {
        if ( this.#element.classList.contains( "is-open" ) ) {
            this.#close();
        } else {
            this.#open();
        }
    }
}