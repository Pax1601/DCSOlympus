import { getApp } from "..";
import { PanelEventsManager } from "./paneleventsmanager";

export interface PanelInterface {
}

export abstract class Panel {

    #element: HTMLElement
    #eventsManager!: PanelEventsManager;

    constructor(ID: string) {
        this.#element = <HTMLElement>document.getElementById(ID);

        this.#eventsManager = new PanelEventsManager();
    }

    show() {
        this.#element.classList.toggle("hide", false);
        this.getEventsManager()?.trigger("show", {});
    }

    hide() {
        this.#element.classList.toggle("hide", true);
        this.getEventsManager()?.trigger("hide", {});
    }

    toggle() {
        // Simple way to track if currently visible
        if (this.getVisible())
            this.hide();
        else
            this.show();
    }

    toggleByContext() {
        const context = getApp().getCurrentContext();
        (context.getUseMouseInfoPanel()) ? this.show() : this.hide();
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