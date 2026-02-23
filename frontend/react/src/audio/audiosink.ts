import { AudioSinksChangedEvent } from "../events";
import { getApp } from "../olympusapp";

/* Base audio sink class */
export abstract class AudioSink {
  #name: string = "Unnamed sink";
  #gainNode: GainNode | null = null;

  constructor() {
    this.#gainNode = getApp().getAudioManager().getAudioContext()?.createGain() ?? null;
  }

  setName(name: string) {
    this.#name = name;
  }

  getName() {
    return this.#name;
  }

  disconnect() {
    this.getInputNode()?.disconnect();
    AudioSinksChangedEvent.dispatch(getApp().getAudioManager().getSinks());
  }

  getInputNode() {
    return this.#gainNode;
  }

  abstract setPtt(ptt: boolean): void;
  abstract getPtt(): boolean;
}
