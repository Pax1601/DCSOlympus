import { LoadoutBlueprint, UnitBlueprint } from "interfaces";
import { UnitEditor } from "./uniteditor";
import { LoadoutEditor } from "./loadouteditor";
import { addDropdownInput, addLoadoutsScroll, addNewElementInput, addStringInput } from "./utils";

export class AirUnitEditor extends UnitEditor {
    #blueprint: UnitBlueprint | null = null;
    #loadoutEditor: LoadoutEditor | null = null;

    constructor(contentDiv1: HTMLElement, contentDiv2: HTMLElement, contentDiv3: HTMLElement) {
        super(contentDiv1, contentDiv2, contentDiv3);
        this.#loadoutEditor = new LoadoutEditor(this.contentDiv3);
        this.contentDiv2.addEventListener("refresh", () => { 
            if (this.#blueprint !== null)
                this.setBlueprint(this.#blueprint);
        });
        
        this.contentDiv3.addEventListener("refresh", () => { 
            if (this.#blueprint !== null)
                this.setBlueprint(this.#blueprint);
            this.#loadoutEditor?.show();
        });
    }

    setBlueprint(blueprint: UnitBlueprint) {
        this.#blueprint = blueprint;

        if (this.#blueprint !== null) {
            this.contentDiv2.replaceChildren();
            
            addStringInput(this.contentDiv2, "Name", blueprint.name, "text", (value: string) => {blueprint.name = value; }, true);
            addStringInput(this.contentDiv2, "Label", blueprint.label, "text", (value: string) => {blueprint.label = value; });
            addStringInput(this.contentDiv2, "Short label", blueprint.shortLabel, "text", (value: string) => {blueprint.shortLabel = value; });
            addDropdownInput(this.contentDiv2, "Coalition", blueprint.coalition, ["", "blue", "red"],);
            addDropdownInput(this.contentDiv2, "Era", blueprint.era, ["WW2", "Early Cold War", "Mid Cold War", "Late Cold War", "Modern"]);
            addStringInput(this.contentDiv2, "Filename", blueprint.filename?? "", "text", (value: string) => {blueprint.filename = value; });
            addStringInput(this.contentDiv2, "Cost", String(blueprint.cost)?? "", "number", (value: string) => {blueprint.cost = parseFloat(value); });
            addLoadoutsScroll(this.contentDiv2, blueprint.loadouts?? [], (loadout: LoadoutBlueprint) => {
                this.#loadoutEditor?.setLoadout(loadout);
                this.#loadoutEditor?.show();
            });
            addNewElementInput(this.contentDiv2, (ev: MouseEvent, input: HTMLInputElement) => { this.addLoadout(input.value); });
           
            this.#loadoutEditor?.hide();
        }
    }

    addBlueprint(key: string) {
        if (this.database != null) {
            this.database.blueprints[key] = {
                name: key,
                coalition: "",
                label: "",
                shortLabel: "",
                era: "",
                loadouts: []
            }
            this.show();
            this.setBlueprint(this.database.blueprints[key]);
        }
    }

    addLoadout(loadoutName: string) {
        if (loadoutName && this.#blueprint !== null) {
            this.#blueprint.loadouts?.push({
                name: loadoutName,
                code: "",
                fuel: 1,
                items: [],
                roles: []
            })
            this.setBlueprint(this.#blueprint);
        }    
    }
}
