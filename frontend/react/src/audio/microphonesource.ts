import { AudioSourcesChangedEvent } from "../events";
import { getApp } from "../olympusapp";
import { AudioSource } from "./audiosource";

export class MicrophoneSource extends AudioSource {
  #sourceNode: MediaStreamAudioSourceNode;

  constructor() {
    super();

    this.setName("Microphone");
  }

  /* Asynchronously initialize the microphone and connect it to the output node */
  async initialize() {
    const microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (getApp().getAudioManager().getAudioContext()) {
      this.#sourceNode = getApp().getAudioManager().getAudioContext().createMediaStreamSource(microphone);
      this.#sourceNode.connect(this.getOutputNode());
    }
  }

  play() {
    AudioSourcesChangedEvent.dispatch(getApp().getAudioManager().getSources());
  }
}
