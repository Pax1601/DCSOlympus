import { ContextActionTarget } from "../constants/constants";
import { ContextAction, ContextActionCallback, ContextActionOptions } from "./contextaction";
import { Unit } from "./unit";

export class ContextActionSet {
  #contextActions: { [key: string]: ContextAction } = {};
  #defaultContextAction: ContextAction | null = null;
  #units: { [key: string]: Unit[] } = {};

  addContextAction(
    unit: Unit,
    contextAction: ContextAction
  ) {
    this.#contextActions[contextAction.getId()] = contextAction;
    if (!(contextAction.getId() in this.#units)) {
      this.#units[contextAction.getId()] = []
      this.#contextActions[contextAction.getId()].setUnits(this.#units[contextAction.getId()]);
    }

    this.#units[contextAction.getId()].push(unit)
  }

  getContextActions(targetFilter?: ContextActionTarget) {
    if (targetFilter !== undefined) {
      var filteredContextActionSet = new ContextActionSet();
      Object.keys(this.#contextActions).forEach((key) => {
        if (this.#contextActions[key].getTarget() === targetFilter) filteredContextActionSet[key] = this.#contextActions[key];
      });
      return filteredContextActionSet;
    } else return this.#contextActions;
  }

  addDefaultContextAction(
    unit: Unit,
    contextAction: ContextAction
  ) {
    if (this.#defaultContextAction === null) this.#defaultContextAction = contextAction;
    //this.#defaultContextAction.addUnit(unit);
  }

  getDefaultContextAction() {
    return this.#defaultContextAction;
  }
}
