export class Dropdown {
    #container: HTMLElement;
    #options: HTMLElement;
    #value: HTMLElement;
    #callback: CallableFunction;
    #defaultValue: string;
    #optionsList: string[] = [];
    #index: number = 0;
    #hidden: boolean = false;

    constructor(ID: string | null, callback: CallableFunction, options: string[] | null = null, defaultText?: string) {
        if (ID === null)
            this.#container = this.#createElement(defaultText);
        else
            this.#container = document.getElementById(ID) as HTMLElement;

        this.#options = this.#container.querySelector(".ol-select-options") as HTMLElement;
        this.#value = this.#container.querySelector(".ol-select-value") as HTMLElement;
        this.#defaultValue = this.#value.innerText;
        this.#callback = callback;

        if (options != null) this.setOptions(options);

        this.#value.addEventListener("click", (ev) => { this.#toggle(); });

        document.addEventListener("click", (ev) => {
            if (!(this.#value.contains(ev.target as Node) || this.#options.contains(ev.target as Node) || this.#container.contains(ev.target as Node))) {
                this.close();
            }
        });

        this.#options.classList.add("ol-scrollable");
    }

    getContainer() {
        return this.#container;
    }

    setOptions(optionsList: string[], sort: "" | "string" | "number" | "string+number" = "string") {
        if (sort === "number") {
            this.#optionsList = optionsList.sort((optionA: string, optionB: string) => {
                const a = parseInt(optionA);
                const b = parseInt(optionB);
                if (a > b)
                    return 1;
                else
                    return (b > a) ? -1 : 0;
            });
        } else if (sort === "string+number") {
            this.#optionsList = optionsList.sort((optionA: string, optionB: string) => {
                var regex = /\d+/g;
                var matchesA = optionA.match(regex);
                var matchesB = optionB.match(regex);
                if ((matchesA != null && matchesA?.length > 0) && (matchesB != null && matchesB?.length > 0) && optionA[0] == optionB[0]) {
                    const a = parseInt(matchesA[0] ?? 0);
                    const b = parseInt(matchesB[0] ?? 0);
                    if (a > b)
                        return 1;
                    else
                        return (b > a) ? -1 : 0;
                } else {
                    if (optionA > optionB)
                        return 1;
                    else
                        return (optionB > optionA) ? -1 : 0;
                }

            });
        } else if (sort === "string") {
            this.#optionsList = optionsList.sort();
        }

        if (this.#optionsList.length == 0) {
            optionsList = ["No options available"]
            this.#value.innerText = "No options available";
        }
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

    getOptionElements() {
        return this.#options.children;
    }

    addOptionElement(optionElement: HTMLElement) {
        this.#options.appendChild(optionElement);
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
            this.close();
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

    forceValue(value: string) {
        var el = document.createElement("div");
        el.classList.add("ol-ellipsed");
        el.innerText = value;
        this.#value.replaceChildren();
        this.#value.appendChild(el);
        this.close();
    }

    getIndex() {
        return this.#index;
    }

    clip() {
        const options = this.#options;
        const bounds = options.getBoundingClientRect();
        this.#container.dataset.position = (bounds.bottom > window.innerHeight) ? "top" : "";
    }

    close() {
        this.#container.classList.remove("is-open");
        this.#container.dataset.position = "";
    }

    open() {
        this.#container.classList.add("is-open");
        this.#options.classList.toggle("scrollbar-visible", this.#options.scrollHeight > this.#options.clientHeight);
        this.clip();
    }

    show() {
        this.#container.classList.remove("hide");
        this.#hidden = false;
    }

    hide() {
        this.#container.classList.add("hide");
        this.#hidden = true;
    }

    isHidden() {
        return this.#hidden;
    }

    #toggle() {
        this.#container.classList.contains("is-open") ? this.close() : this.open();
    }

    #createElement(defaultText: string | undefined) {
        var div = document.createElement("div");
        div.classList.add("ol-select");

        var value = document.createElement("div");
        value.classList.add("ol-select-value");
        value.innerText = defaultText ? defaultText : "";

        var options = document.createElement("div");
        options.classList.add("ol-select-options");

        div.append(value, options);
        return div;
    }
}