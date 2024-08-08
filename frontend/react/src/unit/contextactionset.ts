import { ContextAction, ContextActionCallback, ContextActionOptions } from "./contextaction";
import { Unit } from "./unit";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export class ContextActionSet {
  #contextActions: { [key: string]: ContextAction } = {};
  #defaultContextAction: ContextAction | null = null;

  addContextAction(
    unit: Unit,
    id: string,
    label: string,
    description: string,
    icon: IconDefinition,
    target: "unit" | "position" | null,
    callback: ContextActionCallback,
    options?: ContextActionOptions
  ) {
    options = options || {};

    if (!(id in this.#contextActions)) {
      this.#contextActions[id] = new ContextAction(id, label, description, icon, target, callback, options);
    }
    this.#contextActions[id].addUnit(unit);
  }

  getContextActions(targetFilter?: string) {
    if (targetFilter) {
      var filteredContextActionSet = new ContextActionSet();
      Object.keys(this.#contextActions).forEach((key) => {
        if (this.#contextActions[key].getTarget() === targetFilter) filteredContextActionSet[key] = this.#contextActions[key];
      });
      return filteredContextActionSet;
    } else return this.#contextActions;
  }

  addDefaultContextAction(
    unit: Unit,
    id: string,
    label: string,
    description: string,
    icon: IconDefinition,
    target: "unit" | "position" | null,
    callback: ContextActionCallback,
    options?: ContextActionOptions
  ) {
    options = options || {};
    if (this.#defaultContextAction === null) this.#defaultContextAction = new ContextAction(id, label, description, icon, target, callback, options);
    this.#defaultContextAction.addUnit(unit);
  }

  getDefaultContextAction() {
    return this.#defaultContextAction;
  }
}
