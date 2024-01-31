export type dropdownConfig = {
    "ID": HTMLElement | string | null,
    "callback": CallableFunction,
    "options"?: string[] | null,
    "defaultText"?: string
};

export class Dropdown {
    #container: HTMLElement;
    #options: HTMLElement;
    #value: HTMLElement;
    #callback: CallableFunction;
    #defaultValue: string;
    #optionsList: string[] = [];
    #labelsList: string[] | undefined = [];
    #index: number = 0;
    #hidden: boolean = false;
    #text!: HTMLElement;

    constructor(config:dropdownConfig) {
        const {ID, callback, options, defaultText} = config;

        if (ID === null)
            this.#container = this.#createElement(defaultText);
        else if (ID instanceof HTMLElement)
            this.#container = ID;
        else
            this.#container = document.getElementById(ID) as HTMLElement;

        this.#options = this.#container.querySelector(".ol-select-options") as HTMLElement;

        const text = this.#container.querySelector(".ol-select-value-text");
        this.#value = (text instanceof HTMLElement) ? text : this.#container.querySelector(".ol-select-value") as HTMLElement;

        this.#defaultValue = this.#value.innerText;
        this.#callback = callback;

        if (options != null) this.setOptions(options);

        (this.#container.querySelector(".ol-select-value") as HTMLElement)?.addEventListener("click", (ev) => {
            if (!this.#container.hasAttribute("disabled") && !this.#container.closest("disabled")) this.#toggle();
        });

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

    /** Set the dropdown options strings
     * 
     * @param optionsList List of options. These are the keys that will always be returned on selection
     * @param sort Sort method. null means no sorting. "string" performs js default sort. "number" sorts purely by numeric value. 
     * "string+number" sorts by string, unless two elements are lexicographically identical up to a numeric value (e.g. "SA-2" and "SA-3"), in which case it sorts by number.
     * @param labelsList (Optional) List of labels to be shown instead of the keys directly. If provided, the options will be sorted by label.
     */
    setOptions(optionsList: string[], sort: null | "string" | "number" | "string+number" = "string", labelsList: string[] | undefined = undefined) {
        if (sort != null) {
            /* If labels are provided, sort by labels, else by options */
            if (labelsList && labelsList.length == optionsList.length) 
                this.#sortByLabels(optionsList, sort, labelsList);
            else 
                this.#sortByOptions(optionsList, sort);
        } else {
            this.#optionsList = optionsList;
        }

        /* If no options are provided, return */
        if (this.#optionsList.length == 0) {
            optionsList = ["No options available"]
            this.#value.innerText = "No options available";
            return;
        }

        /* Create the buttons containing the options or the labels */
        this.#options.replaceChildren(...this.#optionsList.map((option: string, idx: number) => {
            var div = document.createElement("div");
            var button = document.createElement("button");

            /* If the labels are provided use them for the options */
            if (this.#labelsList && this.#labelsList.length === optionsList.length)
                button.textContent = this.#labelsList[idx];
            else
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

    getOptionsList() {
        return this.#optionsList;
    }

    getLabelsList() {
        return this.#labelsList;
    }

    /** Manually set the HTMLElements of the dropdown values. Handling of the selection must be performed externally.
     * 
     * @param optionsElements List of elements to be added to the dropdown
     */
    setOptionsElements(optionsElements: HTMLElement[]) {
        this.#optionsList = [];
        this.#labelsList = [];
        this.#options.replaceChildren(...optionsElements);
    }

    getOptionElements() {
        return this.#options.children;
    }

    addOptionElement(optionElement: HTMLElement) {
        this.#options.appendChild(optionElement);
    }

    /** Select the active value of the dropdown
     * 
     * @param idx The index of the element to select
     * @returns True if the index is valid, false otherwise
     */
    selectValue(idx: number) {
        if (idx < this.#optionsList.length) {
            var option = this.#optionsList[idx];
            var el = document.createElement("div");
            el.classList.add("ol-ellipsed");

            if (this.#labelsList && this.#labelsList.length == this.#optionsList.length)
                el.innerText = this.#labelsList[idx];
            else
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

    /** Manually set the selected value of the dropdown
     * 
     * @param value The value to select. Must be one of the valid options
     */
    setValue(value: string) {
        var index = this.#optionsList.findIndex((option) => { return option === value });
        if (index > -1)
            this.selectValue(index);
    }

    getValue() {
        return this.#value.innerText;
    }

    /** Force the selected value of the dropdown.
     * 
     * @param value Any string. Will be shown as selected value even if not one of the options.
     */
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

    /** Sort the elements by their option keys
     * 
     * @param optionsList The unsorted list of options
     * @param sort The sorting method
     */
    #sortByOptions(optionsList: string[], sort: string) {
        if (sort === "number") {
            this.#optionsList = JSON.parse(JSON.stringify(this.#numberSort(optionsList)));
        } else if (sort === "string+number") {
            this.#optionsList = JSON.parse(JSON.stringify(this.#stringNumberSort(optionsList)));
        } else if (sort === "string") {
            this.#optionsList = JSON.parse(JSON.stringify(this.#stringSort(optionsList)));
        }
    }

    /** Sort the elements by their labels
     * 
     * @param optionsList The unsorted list of options
     * @param sort The sorting method
     * @param labelsList The unsorted list of labels. The elements will be sorted according to these values
     */
    #sortByLabels(optionsList: string[], sort: string, labelsList: string[]) {
        /* Create a temporary deepcopied list. This is necessary because unlike options, labels can be repeated. 
        Once matched, labels are removed from the temporary array to avoid repeating the same key multiple times */
        var tempLabelsList: (string | undefined)[] = JSON.parse(JSON.stringify(labelsList));
        
        if (sort === "number") {
            this.#labelsList = JSON.parse(JSON.stringify(this.#numberSort(labelsList)));
        } else if (sort === "string+number") {
            this.#labelsList = JSON.parse(JSON.stringify(this.#stringNumberSort(labelsList)));
        } else if (sort === "string") {
            this.#labelsList = JSON.parse(JSON.stringify(this.#stringSort(labelsList)));
        }

        /* Remap the options list to match their labels */
        this.#optionsList = optionsList?.map((option: string, idx: number) => {
            let originalIdx = tempLabelsList.indexOf(this.#labelsList? this.#labelsList[idx]: "");
            /* After a match has been completed, set the label to undefined so it won't be matched again. This allows to have repeated labels */
            tempLabelsList[originalIdx] = undefined;
            return optionsList[originalIdx];
        })
    }

    /** Sort elements by number. All elements must be parsable as numbers.
     * 
     * @param elements List of strings
     * @returns Sorted list
     */
    #numberSort(elements: string[]) {
        return elements.sort((elementA: string, elementB: string) => {
            const a = parseFloat(elementA);
            const b = parseFloat(elementB);
            if (a > b)
                return 1;
            else
                return (b > a) ? -1 : 0;
        });
    }

    /** Sort elements by string, unless two elements are lexicographically identical up to a numeric value (e.g. "SA-2" and "SA-3"), in which case sort by number 
     * 
     * @param elements List of strings
     * @returns Sorted list
     */
    #stringNumberSort(elements: string[]) {
        return elements.sort((elementA: string, elementB: string) => {
            /* Check if there is a number in both strings */
            var regex = /\d+/g;
            var matchesA = elementA.match(regex);
            var matchesB = elementB.match(regex);

            /* Get the position of the number in the string */
            var indexA = -1;
            var indexB = -1;
            if (matchesA != null && matchesA?.length > 0)
                indexA = elementA.search(matchesA[0]);

            if (matchesB != null && matchesB?.length > 0)
                indexB = elementB.search(matchesB[0]);
            
            /* If the two strings are the same up to the number, sort them using the number value, else sort them according to the string */
            if ((matchesA != null && matchesA?.length > 0) && (matchesB != null && matchesB?.length > 0) && elementA.substring(0, indexA) === elementB.substring(0, indexB)) {
                const a = parseInt(matchesA[0] ?? 0);
                const b = parseInt(matchesB[0] ?? 0);
                if (a > b)
                    return 1;
                else
                    return (b > a) ? -1 : 0;
            } else {
                if (elementA > elementB)
                    return 1;
                else
                    return (elementB > elementA) ? -1 : 0;
            }
        });
    }

    /** Sort by string. Just a wrapper for consistency.
     * 
     * @param elements List of strings 
     * @returns Sorted list
     */
    #stringSort(elements: string[]) {
        return elements.sort();
    }
}