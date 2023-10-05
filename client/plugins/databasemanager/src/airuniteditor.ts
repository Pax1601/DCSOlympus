import { LoadoutBlueprint, UnitBlueprint } from "interfaces";
import { UnitEditor } from "./uniteditor";
import { LoadoutEditor } from "./loadouteditor";
import { addDropdownInput, addLoadoutsScroll, addNewElementInput, addStringInput } from "./utils";

/** Database editor for Air Units, both Aircraft and Helicopter since they are identical in terms of datbase entries.
 * 
 */
export class AirUnitEditor extends UnitEditor {

    #loadoutEditor: LoadoutEditor | null = null;

    constructor(contentDiv1: HTMLElement, contentDiv2: HTMLElement, contentDiv3: HTMLElement) {
        super(contentDiv1, contentDiv2, contentDiv3);

        /* The loadout editor allows to edit the loadout (who could have thought eh?) */
        this.#loadoutEditor = new LoadoutEditor(this.contentDiv3);

        /* Refresh the loadout editor if needed */
        this.contentDiv3.addEventListener("refresh", () => {
            if (this.visible)
                this.#loadoutEditor?.show();
        });
    }

    /** Sets a unit blueprint as the currently active one
     * 
     * @param blueprint The blueprint to edit
     */
    setBlueprint(blueprint: UnitBlueprint) {
        this.blueprint = blueprint;

        if (this.blueprint !== null) {
            this.contentDiv2.replaceChildren();

            var title = document.createElement("label");
            title.innerText = "Unit properties";
            this.contentDiv2.appendChild(title);

            addStringInput(this.contentDiv2, "Name", blueprint.name, "text", (value: string) => { blueprint.name = value; }, true);
            addStringInput(this.contentDiv2, "Label", blueprint.label, "text", (value: string) => { blueprint.label = value; });
            addStringInput(this.contentDiv2, "Short label", blueprint.shortLabel, "text", (value: string) => { blueprint.shortLabel = value; });
            addDropdownInput(this.contentDiv2, "Coalition", blueprint.coalition, ["", "blue", "red"],);
            addDropdownInput(this.contentDiv2, "Era", blueprint.era, ["WW2", "Early Cold War", "Mid Cold War", "Late Cold War", "Modern"]);
            addStringInput(this.contentDiv2, "Filename", blueprint.filename ?? "", "text", (value: string) => { blueprint.filename = value; });
            addStringInput(this.contentDiv2, "Cost", String(blueprint.cost) ?? "", "number", (value: string) => { blueprint.cost = parseFloat(value); });
            addStringInput(this.contentDiv2, "Rufels from", String(blueprint.refuelsFrom) ?? "", "text", (value: string) => { blueprint.refuelsFrom = value; });
            addStringInput(this.contentDiv2, "Refueling type", String(blueprint.refuelingType) ?? "", "text", (value: string) => { blueprint.refuelingType = value; });

            /* Add a scrollable list of loadouts that the user can edit */
            var title = document.createElement("label");
            title.innerText = "Loadouts";
            this.contentDiv2.appendChild(title);
            addLoadoutsScroll(this.contentDiv2, blueprint.loadouts ?? [], (loadout: LoadoutBlueprint) => {
                this.#loadoutEditor?.setLoadout(loadout);
                this.#loadoutEditor?.show();
            });
            addNewElementInput(this.contentDiv2, (ev: MouseEvent, input: HTMLInputElement) => { this.addLoadout(input.value); });

            this.#loadoutEditor?.hide();
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
                loadouts: []
            }
            this.show();
            this.setBlueprint(this.database.blueprints[key]);
        }
    }

    /** Add a new empty loadout to the currently active blueprint
     * 
     * @param loadoutName The name of the new loadout
     */
    addLoadout(loadoutName: string) {
        if (loadoutName && this.blueprint !== null) {
            this.blueprint.loadouts?.push({
                name: loadoutName,
                code: "",
                fuel: 1,
                items: [],
                roles: []
            })
            this.setBlueprint(this.blueprint);
        }
    }

    /** Hide the editor 
     * 
     */
    hide() {
        super.hide();
        this.#loadoutEditor?.hide();
    }
}
