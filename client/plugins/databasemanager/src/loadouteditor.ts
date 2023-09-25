import { LoadoutBlueprint, LoadoutItemBlueprint } from "interfaces";
import { addLoadoutItemsEditor, addStringInput } from "./utils";

export class LoadoutEditor {
    #contentDiv: HTMLElement;
    #loadout: LoadoutBlueprint | null = null;

    constructor(contentDiv: HTMLElement) {
        this.#contentDiv = contentDiv;
        this.#contentDiv.addEventListener("refresh", () => { this.show(); })
    }

    setLoadout(loadout: LoadoutBlueprint) {
        this.#loadout = loadout;
    }

    show() {
        this.#contentDiv.replaceChildren();

        if (this.#loadout) {
            var laodout = this.#loadout;
            addStringInput(this.#contentDiv, "Name", laodout.name, "text", (value: string) => {laodout.name = value; this.#contentDiv.dispatchEvent(new Event("refresh"));});
            addStringInput(this.#contentDiv, "Code", laodout.code, "text", (value: string) => {laodout.code = value; });
            addLoadoutItemsEditor(this.#contentDiv, this.#loadout);
        }
    }

    hide() {
        this.#contentDiv.replaceChildren();
    }
}