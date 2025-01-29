import { LatLng } from "leaflet";
import { getApp } from "../olympusapp";

export class Spot {
  private ID: number;
  private type: string;
  private targetPosition: LatLng;
  private sourceUnitID: number;
  private code?: number;

  constructor(ID: number, type: string, targetPosition: LatLng, sourceUnitID: number, code?: number) {
    this.ID = ID;
    this.type = type;
    this.targetPosition = targetPosition;
    this.sourceUnitID = sourceUnitID;
    this.code = code;
  }

  // Getter methods
  getID() {
    return this.ID;
  }

  getType() {
    return this.type;
  }

  getTargetPosition() {
    return this.targetPosition;
  }

  getSourceUnitID() {
    return this.sourceUnitID;
  }

  getCode() {
    return this.code;
  }

  // Setter methods
  setTargetPosition(position: LatLng) {
    this.targetPosition = position;
  }

  setCode(code: number) {
    this.code = code;
  }
}