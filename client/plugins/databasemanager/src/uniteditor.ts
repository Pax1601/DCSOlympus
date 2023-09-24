import { LoadoutBlueprint, UnitBlueprint } from "interfaces";
import { UnitDatabase } from "unit/databases/unitdatabase";

export abstract class UnitEditor {
    database: UnitDatabase | null = null;
    scrollDiv: HTMLElement;
    contentDiv1: HTMLElement;
    contentDiv2: HTMLElement;

    constructor(scrollDiv: HTMLElement, contentDiv1: HTMLElement, contentDiv2: HTMLElement) {
        this.scrollDiv = scrollDiv;
        this.contentDiv1 = contentDiv1;
        this.contentDiv2 = contentDiv2;
    }

    setDatabase(database: any) {
        this.database = database;
    }

    show() {
        if (this.database !== null) {
            var blueprints: {[key: string]: UnitBlueprint} = this.database.getBlueprints();

            for (let key in blueprints) {
                var div = document.createElement("div");
                this.scrollDiv.appendChild(div);
                div.textContent = key;
                div.onclick = () => this.setContent(blueprints[key]);
            }      
        }
    }

    addStringInput(key: string, value: string, type?: string) {
        var dt = document.createElement("dt");
        var dd = document.createElement("dd");
        dt.innerText = key;
        var input = document.createElement("input");
        input.value = value;
        input.textContent = value;
        input.type = type?? "text";
        dd.appendChild(input);
        this.contentDiv1.appendChild(dt);
        this.contentDiv1.appendChild(dd);
    }

    addDropdownInput(key: string, value: string, options: string[]) {
        var dt = document.createElement("dt");
        var dd = document.createElement("dd");
        dt.innerText = key;
        var select = document.createElement("select");
        options.forEach((option: string) => {
            var el = document.createElement("option");
            el.value = option;
            el.innerText = option;
            select.appendChild(el);
        });
        select.value = value;
        dd.appendChild(select);
        this.contentDiv1.appendChild(dt);
        this.contentDiv1.appendChild(dd);
    }

    abstract setContent(blueprint: UnitBlueprint): void;
    
}