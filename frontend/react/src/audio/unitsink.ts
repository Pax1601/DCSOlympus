import { AudioSink } from "./audiosink";
import { AudioPacket } from "./audiopacket";
import { getApp } from "../olympusapp";
import { Unit } from "../unit/unit";

export class UnitSink extends AudioSink {
  #unit: Unit;

  constructor(unit: Unit) {
    super();

    this.#unit = unit;
    this.setName(`${unit.getUnitName()} - ${unit.getName()}`);
  }

  getUnit() {
    return this.#unit;
  }

  handleEncodedData(encodedAudioChunk: EncodedAudioChunk) {
    let arrayBuffer = new ArrayBuffer(encodedAudioChunk.byteLength);
    encodedAudioChunk.copyTo(arrayBuffer);

    let packet = new AudioPacket(
      new Uint8Array(arrayBuffer),
      {
        frequency: 243000000,
        modulation: 255, // HOPEFULLY this will never be used by SRS, indicates "loudspeaker" mode
      },
      getApp().getAudioManager().getGuid(),
      this.#unit.getPosition().lat,
      this.#unit.getPosition().lng,
      this.#unit.getPosition().alt
    );
    getApp().getAudioManager().send(packet.getArray());
  }
}
