import { ContextAction } from "./contextaction";
import { Unit } from "./unit";

export class ContextActionSet {
    #contextActions: {[key: string]: ContextAction} = {};

    constructor() {
        
    }

    addContextAction(unit: Unit, id: string, label: string, description: string, callback: CallableFunction, hideContextAfterExecution: boolean = true) {
        if (!(id in this.#contextActions)) {
            this.#contextActions[id] = new ContextAction(id, label, description, callback, hideContextAfterExecution);
        }
        this.#contextActions[id].addUnit(unit);
    }

    getContextActions() {
        return this.#contextActions;
    }

    
}