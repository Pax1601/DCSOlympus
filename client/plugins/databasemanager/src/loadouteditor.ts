import { LoadoutBlueprint } from "interfaces";
import { addLoadoutItemsEditor, addStringInput, arrayToString, stringToArray } from "./utils";

/** The LoadoutEditor allows the user to edit a loadout
 * 
 */
export class LoadoutEditor {
    #contentDiv: HTMLElement;
    #loadout: LoadoutBlueprint | null = null;
    #visible: boolean = false;

    constructor(contentDiv: HTMLElement) {
        this.#contentDiv = contentDiv;
        this.#contentDiv.addEventListener("refresh", () => { 
            if (this.#visible)
                this.show(); 
        })
    }

    /** Set the loadout to edit
     * 
     * @param loadout The loadout to edit
     */
    setLoadout(loadout: LoadoutBlueprint) {
        this.#loadout = loadout;
    }

    /** Show the editor
     * 
     */
    show() {
        this.#visible = true;
        this.#contentDiv.replaceChildren();

        var title = document.createElement("label");
        title.innerText = "Loadout properties";
        this.#contentDiv.appendChild(title);

        if (this.#loadout) {
            var laodout = this.#loadout;
            addStringInput(this.#contentDiv, "Name", laodout.name, "text", (value: string) => {laodout.name = value; this.#contentDiv.dispatchEvent(new Event("refresh"));});
            addStringInput(this.#contentDiv, "Code", laodout.code, "text", (value: string) => {laodout.code = value; });
            addStringInput(this.#contentDiv, "Roles", arrayToString(laodout.roles), "text", (value: string) => {laodout.roles = stringToArray(value);});
            addLoadoutItemsEditor(this.#contentDiv, this.#loadout);
        }
    }

    /** Hide the editor
     * 
     */
    hide() {
        this.#visible = false;
        this.#contentDiv.replaceChildren();
    }
}