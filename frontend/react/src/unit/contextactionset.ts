import { LatLng } from "leaflet";
import { ContextAction, ContextActionOptions } from "./contextaction";
import { Unit } from "./unit";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export class ContextActionSet {
    #contextActions: {[key: string]: ContextAction} = {};

    addContextAction(unit: Unit, id: string, label: string, description: string, icon: IconDefinition, callback: (units: Unit[], targetUnit: Unit, targetPosition: LatLng) => void, hideContextAfterExecution: boolean = true, options?:ContextActionOptions) {
        options = options || {};

        if (!(id in this.#contextActions)) {
            this.#contextActions[id] = new ContextAction(id, label, description, icon, callback, hideContextAfterExecution, options);
        }
        this.#contextActions[id].addUnit(unit);
    }

    getContextActions() {
        return this.#contextActions;
    }
}