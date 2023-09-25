import { OlympusPlugin } from "interfaces";
import { AirUnitEditor } from "./airuniteditor";
import { OlympusApp } from "olympusapp";

export class DatabaseManagerPlugin implements OlympusPlugin {
    #app: OlympusApp | null = null;

    #element: HTMLElement;
    #container: HTMLElement;
    #contentDiv1: HTMLElement;
    #contentDiv2: HTMLElement;
    #contentDiv3: HTMLElement;

    #aircraftEditor: AirUnitEditor;
    #helicopterEditor: AirUnitEditor;
        
    constructor() {
        this.#element = document.createElement("div");
        this.#element.id = "database-control-panel";
        this.#element.oncontextmenu = () => { return false; }
        this.#element.classList.add("ol-dialog");
        document.body.appendChild(this.#element);

        let buttonContainer = document.createElement("div");

        let button1 = document.createElement("button");
        button1.textContent = "Aircraft";
        button1.onclick = () => this.#aircraftEditor.show();
        buttonContainer.appendChild(button1);

        let button2 = document.createElement("button");
        button2.textContent = "Helicopter";
        button2.onclick = () => this.#helicopterEditor.show();
        buttonContainer.appendChild(button2);

        let button3 = document.createElement("button");
        button3.textContent = "Ground Unit";
        buttonContainer.appendChild(button3);

        let button4 = document.createElement("button");
        button4.textContent = "Navy Unit";
        buttonContainer.appendChild(button4);

        this.#element.appendChild(buttonContainer);

        this.#container = document.createElement("div");
        this.#container.classList.add("dc-container");
        this.#element.appendChild(this.#container)

        this.#contentDiv1 = document.createElement("div");
        this.#contentDiv1.classList.add("dc-content-container");
        this.#container.appendChild(this.#contentDiv1);

        this.#contentDiv2 = document.createElement("div");
        this.#contentDiv2.classList.add("dc-content-container");
        this.#container.appendChild(this.#contentDiv2);

        this.#contentDiv3 = document.createElement("div");
        this.#contentDiv3.classList.add("dc-content-container");
        this.#container.appendChild(this.#contentDiv3);

        this.#aircraftEditor = new AirUnitEditor(this.#contentDiv1, this.#contentDiv2, this.#contentDiv3);
        this.#helicopterEditor = new AirUnitEditor(this.#contentDiv1, this.#contentDiv2, this.#contentDiv3);
    }

    getName() {
        return "Database Control Plugin"
    }

    initialize(app: any) {
        this.#app = app;
        
        var aircraftDatabase = this.#app?.getAircraftDatabase();
        if (aircraftDatabase != null) {
            this.#aircraftEditor.setDatabase(aircraftDatabase);
        }

        var helicopterDatabase = this.#app?.getHelicopterDatabase();
        if (helicopterDatabase != null) {
            this.#helicopterEditor.setDatabase(helicopterDatabase);
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