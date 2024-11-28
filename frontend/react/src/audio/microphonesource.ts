import { AudioSourcesChangedEvent } from "../events";
import { getApp } from "../olympusapp";
import { AudioSource } from "./audiosource";

export class MicrophoneSource extends AudioSource {
  #sourceNode: MediaStreamAudioSourceNode;
  #device: MediaDeviceInfo;

  constructor(device?: MediaDeviceInfo) {
    super();

    this.setName("Microphone");

    if (device) this.#device = device;
  }

  /* Asynchronously initialize the microphone and connect it to the output node */
  async initialize() {
    const microphone = await navigator.mediaDevices.getUserMedia({
      audio: this.#device
        ? {
            deviceId: this.#device.deviceId,
          }
        : true,
    });
    if (getApp().getAudioManager().getAudioContext()) {
      this.#sourceNode = getApp().getAudioManager().getAudioContext().createMediaStreamSource(microphone);
      this.#sourceNode.connect(this.getOutputNode());
    }
  }

  play() {
    AudioSourcesChangedEvent.dispatch(getApp().getAudioManager().getSources());
  }
}
