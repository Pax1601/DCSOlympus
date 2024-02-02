import { Dropdown, dropdownConfig } from "../controls/dropdown";
import { PanelEventsManager } from "./paneleventsmanager";

export class Panel {

    #element: HTMLElement
    #eventsManager!: PanelEventsManager;
    protected showByDefault = true;

    constructor(ID: string) {
        this.#element = <HTMLElement>document.getElementById(ID);

        this.#eventsManager = new PanelEventsManager();
    }

    createDropdown(config: dropdownConfig) {
        return new Dropdown(config);
    }

    getShowByDefault() {
        return this.showByDefault;
    }

    show() {
        this.#element.classList.toggle("hide", false);
        this.getEventsManager()?.trigger("show", {});
    }

    hide() {
        this.#element.classList.toggle("hide", true);
        this.getEventsManager()?.trigger("hide", {});
    }

    toggle(bool?: boolean) {
        bool = (typeof bool === typeof true) ? bool : !this.getVisible();
        // Simple way to track if currently visible
        if (bool)
            this.show();
        else
            this.hide();
    }

    getElement() {
        return this.#element;
    }

    getVisible() {
        return (!this.getElement().classList.contains("hide"));
    }

    getEventsManager() {
        return this.#eventsManager;
    }
}