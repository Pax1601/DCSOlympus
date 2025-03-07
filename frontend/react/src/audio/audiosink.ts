import { AudioSinksChangedEvent } from "../events";
import { getApp } from "../olympusapp";

/* Base audio sink class */
export abstract class AudioSink {
  #name: string;
  #gainNode: GainNode;

  constructor() {
    this.#gainNode = getApp().getAudioManager().getAudioContext().createGain();
  }

  setName(name) {
    this.#name = name;
  }

  getName() {
    return this.#name;
  }

  disconnect() {
    this.getInputNode().disconnect();
    AudioSinksChangedEvent.dispatch(getApp().getAudioManager().getSinks());
  }

  getInputNode() {
    return this.#gainNode;
  }

  abstract setPtt(ptt: boolean): void;
  abstract getPtt(): boolean;
}
