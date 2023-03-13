import { LatLng } from "leaflet";

export class ContextMenu {
    #container: HTMLElement | null;
    #latlng: LatLng = new LatLng(0, 0);

    constructor(id: string) {
        this.#container = document.getElementById(id);
        this.hide();
    }

    show(x: number, y: number, latlng: LatLng) {
        this.#latlng = latlng;
        this.#container?.classList.toggle("hide", false);
        if (this.#container != null) {
            if (x + this.#container.offsetWidth < window.innerWidth)
                this.#container.style.left = x + "px";
            else
                this.#container.style.left = window.innerWidth - this.#container.offsetWidth + "px";

            if (y + this.#container.offsetHeight < window.innerHeight)
                this.#container.style.top = y + "px";
            else
                this.#container.style.top = window.innerHeight - this.#container.offsetHeight + "px";
        }
    }

    hide() {
        this.#container?.classList.toggle("hide", true);
    }

    getContainer()
    {
        return this.#container;
    }

    getLatLng()
    {
        return this.#latlng;
    }
}