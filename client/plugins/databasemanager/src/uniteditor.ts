import { UnitBlueprint } from "interfaces";
import { UnitDatabase } from "unit/databases/unitdatabase";
import { addBlueprintsScroll, addNewElementInput } from "./utils";

/** Base abstract class of Unit database editors
 * 
 */
export abstract class UnitEditor {
    blueprint: UnitBlueprint | null = null;
    database: {blueprints: {[key: string]: UnitBlueprint}} | null = null;
    visible: boolean = false;
    contentDiv1: HTMLElement;
    contentDiv2: HTMLElement;
    contentDiv3: HTMLElement;

    constructor(contentDiv1: HTMLElement, contentDiv2: HTMLElement, contentDiv3: HTMLElement) {
        this.contentDiv1 = contentDiv1;
        this.contentDiv2 = contentDiv2;
        this.contentDiv3 = contentDiv3;

        /* Refresh the list of units if it changes */
        this.contentDiv1.addEventListener("refresh", () => { 
            if (this.visible)
                this.show(); 
        })

        /* If the unit properties or loadout are edited, reload the editor */
        this.contentDiv2.addEventListener("refresh", () => { 
            if (this.visible) {
                if (this.blueprint !== null)
                    this.setBlueprint(this.blueprint);
            }
        });
        
        this.contentDiv3.addEventListener("refresh", () => { 
            if (this.visible) {
                if (this.blueprint !== null)
                    this.setBlueprint(this.blueprint);
            }
        });
    }

    /**
     * 
     * @param database The database that the editor will operate on
     */
    setDatabase(database: UnitDatabase) {
        this.database = JSON.parse(JSON.stringify({blueprints: database.getBlueprints(true)}));
    }

    /** Show the editor
     * 
     */
    show() {
        this.visible = true;
        this.contentDiv1.replaceChildren();
        this.contentDiv2.replaceChildren();
        this.contentDiv3.replaceChildren();

        /* Create the list of units. Each unit is clickable to activate the editor on it */
        if (this.database != null) {
            var title = document.createElement("label");
            title.innerText = "Units list";
            this.contentDiv1.appendChild(title);
            
            addBlueprintsScroll(this.contentDiv1, this.database, (key: string) => {
                if (this.database != null) 
                    this.setBlueprint(this.database.blueprints[key])
            })

            addNewElementInput(this.contentDiv1, (ev: MouseEvent, input: HTMLInputElement) => {
                if (input.value != "")
                    this.addBlueprint((input).value);
            });
        }
    }

    /** Hid the editor
     * 
     */
    hide() {
        this.visible = false;
        this.contentDiv1.replaceChildren();
        this.contentDiv2.replaceChildren();
        this.contentDiv3.replaceChildren();
    }

    /** 
     * 
     * @returns The edited database
     */
    getDatabase() {
        return this.database;
    }

    /* Abstract methods which will depend on the specific type of units */
    abstract setBlueprint(blueprint: UnitBlueprint): void;
    abstract addBlueprint(key: string): void;
}