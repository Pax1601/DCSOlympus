import { AudioSourcesChangedEvent } from "../events";
import { getApp } from "../olympusapp";
import { AudioSource } from "./audiosource";

export class MicrophoneSource extends AudioSource {
    #sourceNode: MediaStreamAudioSourceNode | null = null;
    #device: MediaDeviceInfo | null = null;

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
        const audioContext = getApp().getAudioManager().getAudioContext();
        const outputNode = this.getOutputNode();

        if (!audioContext) {
            console.error("Audio context not available");
            return;
        }

        if (!outputNode) {
            console.error("Output node not available");
            return;
        }

        this.#sourceNode = audioContext.createMediaStreamSource(microphone);
        this.#sourceNode.connect(outputNode);
    }

    play() {
        AudioSourcesChangedEvent.dispatch(getApp().getAudioManager().getSources());
    }
}
