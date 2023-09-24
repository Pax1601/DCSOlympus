import { OlympusPlugin } from "interfaces";
import { AirUnitEditor } from "./airuniteditor";
import { OlympusApp } from "olympusapp";

export class DatabaseManagerPlugin implements OlympusPlugin {
    #app: OlympusApp | null = null;

    #element: HTMLElement;
    #scrollDiv: HTMLElement;
    #contentDiv1: HTMLElement;
    #contentDiv2: HTMLElement;

    #aircraftEditor: AirUnitEditor;
        
    constructor() {
        this.#element = document.createElement("div");
        this.#element.id = "database-control-panel";
        this.#element.oncontextmenu = () => { return false; }
        this.#element.classList.add("ol-dialog");
        document.body.appendChild(this.#element);

        this.#scrollDiv = document.createElement("div");
        this.#scrollDiv.classList.add("dc-scroll-container");
        this.#element.appendChild(this.#scrollDiv);

        this.#contentDiv1 = document.createElement("div");
        this.#contentDiv1.classList.add("dc-content-container");
        this.#element.appendChild(this.#contentDiv1);

        this.#contentDiv2 = document.createElement("div");
        this.#contentDiv2.classList.add("dc-content-container");
        this.#element.appendChild(this.#contentDiv2);

        this.#aircraftEditor = new AirUnitEditor(this.#scrollDiv, this.#contentDiv1, this.#contentDiv2);
    }

    getName() {
        return "Database Control Plugin"
    }

    initialize(app: any) {
        this.#app = app;
        
        var aircraftDatabase = this.#app?.getAircraftDatabase();
        if (aircraftDatabase != null) {
            this.#aircraftEditor.setDatabase(aircraftDatabase);
            this.#aircraftEditor.show();
        }

        return true;
    }

    getElement() {
        return this.#element;
    }

    toggle(bool?: boolean) {
        this.getElement().classList.toggle("hide", bool);
    }
}