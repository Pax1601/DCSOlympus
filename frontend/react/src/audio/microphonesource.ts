import { getApp } from "../olympusapp";
import { AudioSource } from "./audiosource";

export class MicrophoneSource extends AudioSource {
  #node: MediaStreamAudioSourceNode;

  constructor() {
    super();

    this.setName("Microphone");
  }

  async initialize() {
    const microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (getApp().getAudioManager().getAudioContext()) {
      this.#node = getApp().getAudioManager().getAudioContext().createMediaStreamSource(microphone);

      this.#node.connect(this.getNode());
    }
  }

  play() {
    document.dispatchEvent(new CustomEvent("audioSourcesUpdated"));
  }
}
