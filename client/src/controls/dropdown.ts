export class Dropdown {
    #element: HTMLElement;
    #options: HTMLElement;
    #value: HTMLElement;
    #callback: CallableFunction;
    #defaultValue: string;
    #optionsList: string[] = [];
    #index: number = 0;

    constructor(ID: string, callback: CallableFunction, options: string[] | null = null) {
        this.#element = <HTMLElement>document.getElementById(ID);
        this.#options = <HTMLElement>this.#element.querySelector(".ol-select-options");
        this.#value = <HTMLElement>this.#element.querySelector(".ol-select-value");
        this.#defaultValue = this.#value.innerText;
        this.#callback = callback;

        if (options != null) {
            this.setOptions(options);
        }

        this.#value.addEventListener("click", (ev) => {
            this.#toggle();
        });

        document.addEventListener("click", (ev) => {
            if (!(this.#value.contains(ev.target as Node) || this.#options.contains(ev.target as Node) || this.#element.contains(ev.target as Node))) {
                this.#close();
            }
        });

        this.#options.classList.add("ol-scrollable");
    }

    setOptions(optionsList: string[], sortAlphabetically: boolean = true) {
        this.#optionsList = optionsList.sort();
        this.#options.replaceChildren(...optionsList.map((option: string, idx: number) => {
            var div = document.createElement("div");
            var button = document.createElement("button");
            button.textContent = option;
            div.appendChild(button);

            if (option === this.#defaultValue)
                this.#index = idx;

            button.addEventListener("click", (e: MouseEvent) => {
                e.stopPropagation();
                this.selectValue(idx);
            });
            return div;
        }));
    }

    setOptionsElements(optionsElements: HTMLElement[]) {
        this.#optionsList = [];
        this.#options.replaceChildren(...optionsElements);
    }

    selectText(text: string) {
        const index = [].slice.call(this.#options.children).findIndex((opt: Element) => opt.querySelector("button")?.innerText === text);
        if (index > -1) {
            this.selectValue(index);
        }
    }

    selectValue(idx: number) {
        if (idx < this.#optionsList.length) {
            var option = this.#optionsList[idx];
            var el = document.createElement("div");
            el.classList.add("ol-ellipsed");
            el.innerText = option;
            this.#value.replaceChildren();
            this.#value.appendChild(el);
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
        var index = this.#optionsList.findIndex((option) => { return option === value });
        if (index > -1)
            this.selectValue(index);
    }

    getIndex() {
        return this.#index;
    }

    #clip() {
        const options = this.#options;
        const bounds = options.getBoundingClientRect();
        this.#element.dataset.position = (bounds.bottom > window.innerHeight) ? "top" : "";
    }

    #close() {
        this.#element.classList.remove("is-open");
        this.#element.dataset.position = "";
    }

    #open() {
        this.#element.classList.add("is-open");
        this.#options.classList.toggle("scrollbar-visible", this.#options.scrollHeight > this.#options.clientHeight);
        this.#clip();
    }

    #toggle() {
        if (this.#element.classList.contains("is-open")) {
            this.#close();
        } else {
            this.#open();
        }
    }
}