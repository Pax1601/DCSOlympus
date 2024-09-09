import { AudioSink } from "./audiosink";
import { getApp } from "../olympusapp";
import { Unit } from "../unit/unit";
import { AudioUnitPipeline } from "./audiounitpipeline";

/* Unit sink to implement a "loudspeaker" external sound. Useful for stuff like 5MC calls, air sirens,
scramble calls and so on. Ideally, one may want to move this code to the backend*/
export class UnitSink extends AudioSink {
  #unit: Unit;
  #unitPipelines: {[key: string]: AudioUnitPipeline} = {};

  constructor(sourceUnit: Unit) {
    super();

    this.#unit = sourceUnit;
    this.setName(`${sourceUnit.getUnitName()} - ${sourceUnit.getName()}`);

    /* TODO as of now, any client connecting after the sink was created will not receive the sound. Add ability to add new pipelines */
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
