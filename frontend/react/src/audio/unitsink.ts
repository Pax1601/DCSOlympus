import { AudioSink } from "./audiosink";
import { getApp } from "../olympusapp";
import { Unit } from "../unit/unit";
import { AudioUnitPipeline } from "./audiounitpipeline";

export class UnitSink extends AudioSink {
  #unit: Unit;
  #unitPipelines: {[key: string]: AudioUnitPipeline} = {};

  constructor(sourceUnit: Unit) {
    super();

    this.#unit = sourceUnit;
    this.setName(`${sourceUnit.getUnitName()} - ${sourceUnit.getName()}`);

    getApp()
      .getAudioManager()
      .getSRSClientsUnitIDs()
      .forEach((unitID) => {
        if (unitID !== 0) {
          this.#unitPipelines[unitID] = new AudioUnitPipeline(sourceUnit, unitID, this.getInputNode());
        }
      });
  }

  getUnit() {
    return this.#unit;
  }
}
