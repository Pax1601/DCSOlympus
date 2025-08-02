import { LatLng } from "leaflet";
import { getApp } from "../olympusapp";

export class Spot {
  #ID: number;
  #type: string;
  #targetPosition: LatLng;
  #sourceUnitID: number;
  #active: boolean;
  #code?: number;

  constructor(ID: number, type: string, targetPosition: LatLng, sourceUnitID: number, active: boolean, code?: number) {
    this.#ID = ID;
    this.#type = type;
    this.#targetPosition = targetPosition;
    this.#sourceUnitID = sourceUnitID;
    this.#code = code;
    this.#active = active;
  }

  // Getter methods
  getID() {
    return this.#ID;
  }

  getType() {
    return this.#type;
  }

  getTargetPosition() {
    return this.#targetPosition;
  }

  getSourceUnitID() {
    return this.#sourceUnitID;
  }

  getCode() {
    return this.#code;
  }

  getActive() {
    return this.#active;
  }

  // Setter methods
  setTargetPosition(position: LatLng) {
    this.#targetPosition = position;
  }

  setCode(code: number) {
    this.#code = code;
  }

  setActive(active: boolean) {
    this.#active = active;
  }
}