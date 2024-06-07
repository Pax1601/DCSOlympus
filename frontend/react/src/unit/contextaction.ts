import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Unit } from "./unit";

export interface ContextActionOptions {
    isScenic?: boolean
}

export class ContextAction {
    #id: string = "";
    #label: string = "";
    #description: string = "";
    #callback: CallableFunction | null = null;
    #units: Unit[] = [];
    #hideContextAfterExecution: boolean = true
    #icon: IconDefinition;
    #options: ContextActionOptions;

    constructor(id: string, label: string, description: string, icon: IconDefinition, callback: CallableFunction, hideContextAfterExecution: boolean = true, options: ContextActionOptions) {
        this.#id = id;
        this.#label = label;
        this.#description = description;
        this.#callback = callback;
        this.#icon = icon;
        this.#hideContextAfterExecution = hideContextAfterExecution;
        this.#options = {
            "isScenic": false,
            ...options
        }
    }

    addUnit(unit: Unit) {
        this.#units.push(unit);
    }

    getId() {
        return this.#id;
    }

    getLabel() {
        return this.#label;
    }

    getOptions() {
        return this.#options;
    }

    getDescription() {
        return this.#description;
    }

    getCallback() {
        return this.#callback;
    }

    getIcon() {
        return this.#icon;
    }

    executeCallback() {
        if (this.#callback)
            this.#callback(this.#units);
    }

    getHideContextAfterExecution() {
        return this.#hideContextAfterExecution;
    }
}
