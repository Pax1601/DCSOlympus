import { UnitBlueprint } from "interfaces";
import { UnitEditor } from "./uniteditor";
import { addCheckboxInput, addDropdownInput, addStringInput } from "./utils";

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
            addDropdownInput(this.contentDiv2, "Coalition", blueprint.coalition, ["", "blue", "red"], (value: string) => {blueprint.coalition = value; });
            addDropdownInput(this.contentDiv2, "Era", blueprint.era, ["WW2", "Early Cold War", "Mid Cold War", "Late Cold War", "Modern"], (value: string) => {blueprint.era = value; });
            //addStringInput(this.contentDiv2, "Filename", blueprint.filename?? "", "text", (value: string) => {blueprint.filename = value; });
            addStringInput(this.contentDiv2, "Cost", String(blueprint.cost)?? "", "number", (value: string) => {blueprint.cost = parseFloat(value); });
            addStringInput(this.contentDiv2, "Acquisition range [m]", String(blueprint.acquisitionRange)?? "", "number", (value: string) => {blueprint.acquisitionRange = parseFloat(value); });
            addStringInput(this.contentDiv2, "Engagement range [m]", String(blueprint.engagementRange)?? "", "number", (value: string) => {blueprint.engagementRange = parseFloat(value); });
            addStringInput(this.contentDiv2, "Barrel height [m]", String(blueprint.barrelHeight)?? "", "number", (value: string) => {blueprint.barrelHeight = parseFloat(value); });
            addStringInput(this.contentDiv2, "Muzzle velocity [m/s]", String(blueprint.muzzleVelocity)?? "", "number", (value: string) => {blueprint.muzzleVelocity = parseFloat(value); });
            addStringInput(this.contentDiv2, "Aim time [s]", String(blueprint.aimTime)?? "", "number", (value: string) => {blueprint.aimTime = parseFloat(value); });
            addStringInput(this.contentDiv2, "Burst quantity", String(blueprint.shotsToFire)?? "", "number", (value: string) => {blueprint.shotsToFire = Math.round(parseFloat(value)); });
            addCheckboxInput(this.contentDiv2, "Can target point", blueprint.canTargetPoint ?? false, (value: boolean) => {blueprint.canTargetPoint = value;})
            addCheckboxInput(this.contentDiv2, "Can rearm", blueprint.canRearm ?? false, (value: boolean) => {blueprint.canRearm = value;})
            addStringInput(this.contentDiv2, "Description", blueprint.description ?? "", "text", (value: string) => {blueprint.description = value; });
            addStringInput(this.contentDiv2, "Abilities", blueprint.abilities ?? "", "text", (value: string) => {blueprint.abilities = value; });
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
                era: "",
                enabled: true
            }
            this.show();
            this.setBlueprint(this.database.blueprints[key]);
        }
    }
}
