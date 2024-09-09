import { getApp } from "../olympusapp";

/* Base audio sink class */
export class AudioSink {
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
