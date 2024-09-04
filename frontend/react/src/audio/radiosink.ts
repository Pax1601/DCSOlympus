import { AudioSink } from "./audiosink";
import { AudioPacket } from "./audiopacket";
import { getApp } from "../olympusapp";

export class RadioSink extends AudioSink {
  #frequency = 251000000;
  #modulation = 0;
  #ptt = false;
  #tuned = false;
  #volume = 0.5;

  constructor() {
    super();
  }

  setFrequency(frequency) {
    this.#frequency = frequency;
    document.dispatchEvent(new CustomEvent("audioSinksUpdated"));
  }

  getFrequency() {
    return this.#frequency;
  }

  setModulation(modulation) {
    this.#modulation = modulation;
    document.dispatchEvent(new CustomEvent("audioSinksUpdated"));
  }

  getModulation() {
    return this.#modulation;
  }

  setPtt(ptt) {
    this.#ptt = ptt;
    document.dispatchEvent(new CustomEvent("audioSinksUpdated"));
  }

  getPtt() {
    return this.#ptt;
  }

  setTuned(tuned) {
    this.#tuned = tuned;
    document.dispatchEvent(new CustomEvent("audioSinksUpdated"));
  }

  getTuned() {
    return this.#tuned;
  }

  setVolume(volume) {
    this.#volume = volume;
    document.dispatchEvent(new CustomEvent("audioSinksUpdated"));
  }

  getVolume() {
    return this.#volume;
  }

  handleEncodedData(encodedAudioChunk: EncodedAudioChunk) {
    let arrayBuffer = new ArrayBuffer(encodedAudioChunk.byteLength);
    encodedAudioChunk.copyTo(arrayBuffer);

    if (this.#ptt) {
      let packet = new AudioPacket(
        new Uint8Array(arrayBuffer),
        {
          frequency: this.#frequency,
          modulation: this.#modulation,
        },
        getApp().getAudioManager().getGuid()
      );
      getApp().getAudioManager().send(packet.getArray());
    }
  }
}
