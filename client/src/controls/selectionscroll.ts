import { LatLng } from "leaflet";

export class SelectionScroll {
    #container: HTMLElement | null;
    #display: string;

    constructor(id: string,) {
        this.#container = document.getElementById(id);
        this.#display = '';
        if (this.#container != null) {
            this.#display = this.#container.style.display;
            this.hide();
        }
    }

    show(x: number, y: number, options: any, callback: CallableFunction) {
        /* Hide to remove buttons, if present */
        this.hide();

        if (this.#container != null && options.length > 1) {
            this.#container.style.display = this.#display;
            this.#container.style.left = x - 110 + "px";
            this.#container.style.top = y - 110 + "px";

            for (let optionID in options) {
                var node = document.createElement("div");
                node.classList.add("olympus-selection-scroll-element");
                node.appendChild(document.createTextNode(options[optionID]));
                this.#container.appendChild(node);
                node.addEventListener('click', () => callback(options[optionID]))
            }
        }
    }

    hide() {
        if (this.#container != null) {
            this.#container.style.display = "none";
            var buttons = this.#container.querySelectorAll(".olympus-selection-scroll-element");
            for (let child of buttons) {
                this.#container.removeChild(child);
            }
        }
    }
}