import { LoadoutBlueprint, UnitBlueprint } from "interfaces";
import { UnitDatabase } from "unit/databases/unitdatabase";
import { addBlueprintsScroll, addNewElementInput } from "./utils";

export abstract class UnitEditor {
    database: {blueprints: {[key: string]: UnitBlueprint}} | null = null;
    visible: boolean = false;
    contentDiv1: HTMLElement;
    contentDiv2: HTMLElement;
    contentDiv3: HTMLElement;

    constructor(contentDiv1: HTMLElement, contentDiv2: HTMLElement, contentDiv3: HTMLElement) {
        this.contentDiv1 = contentDiv1;
        this.contentDiv2 = contentDiv2;
        this.contentDiv3 = contentDiv3;
        this.contentDiv1.addEventListener("refresh", () => { 
            if (this.visible)
                this.show(); 
        })
    }

    setDatabase(database: UnitDatabase) {
        this.database = JSON.parse(JSON.stringify(database));
    }

    show() {
        this.visible = true;
        this.contentDiv1.replaceChildren();
        this.contentDiv2.replaceChildren();
        this.contentDiv3.replaceChildren();

        if (this.database != null) {
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

    hide() {
        this.visible = false;
        this.contentDiv1.replaceChildren();
        this.contentDiv2.replaceChildren();
        this.contentDiv3.replaceChildren();
    }

    abstract setBlueprint(blueprint: UnitBlueprint): void;
    abstract addBlueprint(key: string): void;
}