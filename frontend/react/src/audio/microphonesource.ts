import { getApp } from "../olympusapp";
import { AudioSource } from "./audiosource";

export class MicrophoneSource extends AudioSource {
  #node: AudioNode;

  constructor() {
    super();

    this.setName("Microphone");
  }

  async initialize() {
    const microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (getApp().getAudioManager().getAudioContext()) {
      this.#node = getApp().getAudioManager().getAudioContext().createMediaStreamSource(microphone);
    }
  }

  getNode() {
    return this.#node;
  }

  play() {
    // TODO, now is always on
  }
}
