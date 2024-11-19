import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Unit } from "./unit";
import { LatLng } from "leaflet";
import { ContextActionTarget, ContextActionType } from "../constants/constants";

export interface ContextActionOptions {
  executeImmediately?: boolean;
  type: ContextActionType;
  code: string | null;
  shiftKey?: boolean;
  altKey?: boolean;
  ctrlKey?: boolean;
}

export type ContextActionCallback = (units: Unit[], targetUnit: Unit | null, targetPosition: LatLng | null, originalEvent?: MouseEvent) => void;

export class ContextAction {
  #id: string = "";
  #label: string = "";
  #description: string = "";
  #callback: ContextActionCallback | null = null;
  #units: Unit[] = [];
  #icon: IconDefinition;
  #options: ContextActionOptions;
  #target: ContextActionTarget;

  constructor(id: string, label: string, description: string, icon: IconDefinition, target: ContextActionTarget, callback: ContextActionCallback, options: ContextActionOptions) {
    this.#id = id;
    this.#label = label;
    this.#description = description;
    this.#target = target;
    this.#callback = callback;
    this.#icon = icon;
    this.#options = {
      executeImmediately: false,
      ...options,
    };
  }

  setUnits(units: Unit[]) {
    this.#units = units;
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

  getTarget() {
    return this.#target;
  }

  executeCallback(targetUnit: Unit | null, targetPosition: LatLng | null, originalEvent?: MouseEvent) {
    if (this.#callback) this.#callback(this.#units, targetUnit, targetPosition, originalEvent);
  }
}
