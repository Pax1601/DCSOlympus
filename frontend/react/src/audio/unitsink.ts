import { AudioSink } from "./audiosink";
import { getApp } from "../olympusapp";
import { Unit } from "../unit/unit";
import { AudioUnitPipeline } from "./audiounitpipeline";
import { AudioSinksChangedEvent, SRSClientsChangedEvent } from "../events";
import { SRSClientData } from "../types/types";

/* Unit sink to implement a "loudspeaker" external sound. Useful for stuff like 5MC calls, air sirens,
scramble calls and so on. Ideally, one may want to move this code to the backend*/
export class UnitSink extends AudioSink {
  #unit: Unit;
  #unitPipelines: { [key: string]: AudioUnitPipeline } = {};
  #ptt: boolean = false;
  #maxDistance: number = 1852;

  constructor(unit: Unit) {
    super();

    this.#unit = unit;
    this.setName(`${unit.getUnitName()} - ${unit.getName()}`);

    SRSClientsChangedEvent.on(() => {
      this.#updatePipelines();
    });

    this.#updatePipelines();
  }

  getUnit() {
    return this.#unit;
  }

  #updatePipelines() {
    getApp()
      .getAudioManager()
      .getSRSClientsData()
      .forEach((clientData: SRSClientData) => {
        const unitID = clientData.unitID;
        if (unitID !== 0 && !(unitID in this.#unitPipelines)) {
          this.#unitPipelines[unitID] = new AudioUnitPipeline(this.#unit, unitID, this.getInputNode());
          this.#unitPipelines[unitID].setPtt(false);
          this.#unitPipelines[unitID].setMaxDistance(this.#maxDistance);
          console.log(`Added unit pipeline for unitID ${unitID} `);
        }
      });

    Object.keys(this.#unitPipelines).forEach((unitID) => {
      const unitIDs = getApp()
        .getAudioManager()
        .getSRSClientsData()
        .map((clientData) => clientData.unitID);
      if (!unitIDs.includes(parseInt(unitID))) delete this.#unitPipelines[unitID];
    });
  }

  setPtt(ptt) {
    this.#ptt = ptt;
    Object.values(this.#unitPipelines).forEach((pipeline) => {
      pipeline.setPtt(ptt);
    });
    AudioSinksChangedEvent.dispatch(getApp().getAudioManager().getSinks());
  }

  getPtt() {
    return this.#ptt;
  }

  setMaxDistance(maxDistance) {
    this.#maxDistance = maxDistance;
    Object.values(this.#unitPipelines).forEach((pipeline) => {
      pipeline.setMaxDistance(maxDistance);
    });
    AudioSinksChangedEvent.dispatch(getApp().getAudioManager().getSinks());
  }

  getMaxDistance() {
    return this.#maxDistance;
  }
}
