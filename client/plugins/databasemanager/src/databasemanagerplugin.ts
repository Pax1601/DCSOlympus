const SHOW_CONTROL_TIPS = "Show control tips"

export class DatabaseManagerPlugin implements OlympusPlugin {
    #element: HTMLElement;
    #app: any;
    #scrollDiv: HTMLElement;
    #contentDiv: HTMLElement;
        
    constructor() {
        this.#element = document.createElement("div");
        this.#element.id = "database-control-panel";
        this.#element.oncontextmenu = () => { return false; }
        this.#element.classList.add("ol-dialog");
        document.body.appendChild(this.#element);

        this.#scrollDiv = document.createElement("div");
        this.#scrollDiv.classList.add("dc-scroll-container");
        this.#element.appendChild(this.#scrollDiv);

        this.#contentDiv = document.createElement("div");
        this.#contentDiv.classList.add("dc-content-container");
        this.#element.appendChild(this.#contentDiv);
    }

    getName() {
        return "Database Control Plugin"
    }

    initialize(app: any) {
        this.#app = app;
        
        var aircraftDatabase = this.#app.getAircraftDatabase();
        var blueprints: {[key: string]: UnitBlueprint} = aircraftDatabase.getBlueprints();

        for (let key in blueprints) {
            var div = document.createElement("div");
            this.#scrollDiv.appendChild(div);
            div.textContent = key;
            div.onclick = () => this.#setContent(blueprints[key]);
        }      

        return true;
    }

    getElement() {
        return this.#element;
    }

    toggle(bool?: boolean) {
        this.getElement().classList.toggle("hide", bool);
    }

    #setContent(blueprint: UnitBlueprint) {
        this.#contentDiv.replaceChildren();
        
        for (var key in blueprint) {
            if (typeof blueprint[key as keyof UnitBlueprint] === "string")
            {
                var dt = document.createElement("dt");
                var dd = document.createElement("dd");
                dt.innerText = key;
                var input = document.createElement("input");
                input.value = blueprint[key as keyof UnitBlueprint] as string;
                input.textContent = blueprint[key as keyof UnitBlueprint] as string;
                dd.appendChild(input);
                this.#contentDiv.appendChild(dt);
                this.#contentDiv.appendChild(dd);
            }
        }
    }
}