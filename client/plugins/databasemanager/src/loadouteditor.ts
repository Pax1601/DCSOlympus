import { LoadoutBlueprint, LoadoutItemBlueprint } from "interfaces";

export class LoadoutEditor {
    #contentDiv: HTMLElement;
    #loadout: LoadoutBlueprint | null = null;

    constructor(contentDiv: HTMLElement) {
        this.#contentDiv = contentDiv;
    }

    setLoadout(loadout: LoadoutBlueprint) {
        this.#loadout = loadout;
    }

    show() {
        this.#contentDiv.replaceChildren();

        if (this.#loadout) {
            this.addStringInput("Name", this.#loadout.name);
            this.addStringInput("Code", this.#loadout.code);

            var itemsEl = document.createElement("div");
            itemsEl.classList.add("dc-scroll-container", "dc-items-container");
            this.#loadout.items.forEach((item: LoadoutItemBlueprint) => {
                var div = document.createElement("div");
                itemsEl.appendChild(div);
                div.textContent = item.name;
            })
            this.#contentDiv.appendChild(itemsEl);
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
        this.#contentDiv.appendChild(dt);
        this.#contentDiv.appendChild(dd);
    }
}