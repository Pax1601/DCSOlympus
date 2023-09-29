import { UnitBlueprint } from "interfaces";
import { UnitEditor } from "./uniteditor";
import { addDropdownInput, addStringInput } from "./utils";

/** Database editor for ground units
 * 
 */
export class GroundUnitEditor extends UnitEditor {
    #blueprint: UnitBlueprint | null = null;

    constructor(contentDiv1: HTMLElement, contentDiv2: HTMLElement, contentDiv3: HTMLElement) {
        super(contentDiv1, contentDiv2, contentDiv3);
    }

    /** Sets a unit blueprint as the currently active one
     * 
     * @param blueprint The blueprint to edit
     */
    setBlueprint(blueprint: UnitBlueprint) {
        this.#blueprint = blueprint;

        if (this.#blueprint !== null) {
            this.contentDiv2.replaceChildren();

            var title = document.createElement("label");
            title.innerText = "Unit properties";
            this.contentDiv2.appendChild(title);
            
            addStringInput(this.contentDiv2, "Name", blueprint.name, "text", (value: string) => {blueprint.name = value; }, true);
            addStringInput(this.contentDiv2, "Label", blueprint.label, "text", (value: string) => {blueprint.label = value; });
            addStringInput(this.contentDiv2, "Short label", blueprint.shortLabel, "text", (value: string) => {blueprint.shortLabel = value; });
            addStringInput(this.contentDiv2, "Type", blueprint.type?? "", "text", (value: string) => {blueprint.type = value; });
            addDropdownInput(this.contentDiv2, "Coalition", blueprint.coalition, ["", "blue", "red"],);
            addDropdownInput(this.contentDiv2, "Era", blueprint.era, ["WW2", "Early Cold War", "Mid Cold War", "Late Cold War", "Modern"]);
            //addStringInput(this.contentDiv2, "Filename", blueprint.filename?? "", "text", (value: string) => {blueprint.filename = value; });
            addStringInput(this.contentDiv2, "Cost", String(blueprint.cost)?? "", "number", (value: string) => {blueprint.cost = parseFloat(value); });
            addStringInput(this.contentDiv2, "Barrel height [m]", String(blueprint.barrelHeight)?? "", "number", (value: string) => {blueprint.barrelHeight = parseFloat(value); });
            addStringInput(this.contentDiv2, "Muzzle velocity [m/s]", String(blueprint.muzzleVelocity)?? "", "number", (value: string) => {blueprint.muzzleVelocity = parseFloat(value); });
        }
    }

    /** Add a new empty blueprint
     * 
     * @param key Blueprint key
     */
    addBlueprint(key: string) {
        if (this.database != null) {
            this.database.blueprints[key] = {
                name: key,
                coalition: "",
                label: "",
                shortLabel: "",
                era: ""
            }
            this.show();
            this.setBlueprint(this.database.blueprints[key]);
        }
    }
}
