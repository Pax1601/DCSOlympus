import { getApp } from "../olympusapp";

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
    document.dispatchEvent(new CustomEvent("audioSinksUpdated"));
  }

  getInputNode() {
    return this.#gainNode;
  }
}
