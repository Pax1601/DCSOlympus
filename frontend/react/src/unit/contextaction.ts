import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Unit } from "./unit";
import { LatLng } from "leaflet";

export interface ContextActionOptions {
  executeImmediately?: boolean;
}

export type ContextActionCallback = (units: Unit[], targetUnit: Unit | null, targetPosition: LatLng | null) => void;

export class ContextAction {
  #id: string = "";
  #label: string = "";
  #description: string = "";
  #callback: ContextActionCallback | null = null;
  #units: Unit[] = [];
  #icon: IconDefinition;
  #options: ContextActionOptions;
  #target: "unit" | "position" | null = null;

  constructor(id: string, label: string, description: string, icon: IconDefinition, target: "unit" | "position" | null, callback: ContextActionCallback, options: ContextActionOptions) {
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

  getTarget() {
    return this.#target;
  }

  executeCallback(targetUnit: Unit | null, targetPosition: LatLng | null) {
    if (this.#callback) this.#callback(this.#units, targetUnit, targetPosition);
  }
}
