import { Unit } from "./unit";

export interface ContextActionOptionsInterface {
    isScenic?:boolean
}

export class ContextAction {
    #id: string = "";
    #label: string = "";
    #description: string = "";
    #callback: CallableFunction | null = null;
    #units: Unit[] = [];
    #hideContextAfterExecution: boolean = true
    #options: ContextActionOptionsInterface;

    constructor(id: string, label: string, description: string, callback: CallableFunction, hideContextAfterExecution: boolean = true, options:ContextActionOptionsInterface) {
        this.#id = id; 
        this.#label = label;
        this.#description = description;
        this.#callback = callback;
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

    executeCallback() {
        if (this.#callback)
            this.#callback(this.#units);
    }

    getHideContextAfterExecution() {
        return this.#hideContextAfterExecution;
    }
}
