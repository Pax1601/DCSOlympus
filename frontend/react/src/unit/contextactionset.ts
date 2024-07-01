import {
  ContextAction,
  ContextActionCallback,
  ContextActionOptions,
} from "./contextaction";
import { Unit } from "./unit";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export class ContextActionSet {
  #contextActions: { [key: string]: ContextAction } = {};

  addContextAction(
    unit: Unit,
    id: string,
    label: string,
    description: string,
    icon: IconDefinition,
    callback: ContextActionCallback,
    options?: ContextActionOptions
  ) {
    options = options || {};

    if (!(id in this.#contextActions)) {
      this.#contextActions[id] = new ContextAction(
        id,
        label,
        description,
        icon,
        callback,
        options
      );
    }
    this.#contextActions[id].addUnit(unit);
  }

  getContextActions() {
    return this.#contextActions;
  }
}
