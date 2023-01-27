import { LatLng } from "leaflet";
import { setActiveCoalition } from "..";

export class SelectionScroll {
    #container: HTMLElement | null;
    #display: string;

    constructor(id: string,) {
        this.#container = document.getElementById(id);
        this.#display = '';
        if (this.#container != null) {
            this.#container.querySelector("#coalition-switch")?.addEventListener('change', (e) => this.#onSwitch(e))
            this.#display = this.#container.style.display;
            this.hide();
        }
    }

    show(x: number, y: number, options: any, callback: CallableFunction, showCoalition: boolean) {
        /* Hide to remove buttons, if present */
        this.hide();

        if (this.#container != null && options.length >= 1) {
            this.#container.style.display = this.#display;
            this.#container.style.left = x - 110 + "px";
            this.#container.style.top = y - 110 + "px";
            var scroll = this.#container.querySelector(".olympus-selection-scroll");
            if (scroll != null)
            {
                for (let optionID in options) {
                    var node = document.createElement("div");
                    node.classList.add("olympus-selection-scroll-element");
                    if (typeof options[optionID] === 'string' || options[optionID] instanceof String){
                        node.appendChild(document.createTextNode(options[optionID]));
                        node.addEventListener('click', () => callback(options[optionID]));
                    }
                    else {
                        node.appendChild(document.createTextNode(options[optionID].tooltip));
                        node.addEventListener('click', () => options[optionID].callback());
                    }
                    scroll.appendChild(node);
                }
            }
        }
    }

    hide() {
        if (this.#container != null) {
            this.#container.style.display = "none";
            var buttons = this.#container.querySelectorAll(".olympus-selection-scroll-element");
            var scroll = this.#container.querySelector(".olympus-selection-scroll");
            if (scroll != null)
            {
                for (let child of buttons) {
                    scroll.removeChild(child);
                }
            }
        }
    }

    #onSwitch(e: any) {
        if (this.#container != null) {
            if (e.currentTarget.checked) {
                document.documentElement.style.setProperty('--active-coalition-color', getComputedStyle(this.#container).getPropertyValue("--red-coalition-color"));
                setActiveCoalition("red");
            }
            else {
                document.documentElement.style.setProperty('--active-coalition-color', getComputedStyle(this.#container).getPropertyValue("--blue-coalition-color"));
                setActiveCoalition("blue");
            }
        }
    }
}