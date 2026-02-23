import { AudioSourcesChangedEvent } from "../events";
import { getApp } from "../olympusapp";
import { AudioSink } from "./audiosink";
import { WebAudioPeakMeter } from "web-audio-peak-meter";

/* Base abstract audio source class */
export abstract class AudioSource {
  #connectedTo: AudioSink[] = [];
  #name = "";
  #meter: WebAudioPeakMeter | null = null;
  #volume: number = 1.0;
  #gainNode: GainNode | null = null;

  constructor() {
    this.#gainNode = getApp().getAudioManager().getAudioContext()?.createGain() ?? null;

    /* This library requires a div element to initialize the object. Create a fake element, we will read the data and render it ourselves. */
    if (this.#gainNode) {
      this.#meter = new WebAudioPeakMeter(this.#gainNode, document.createElement("div"));
    }
  }

  connect(sink: AudioSink) {
    if (!this.#connectedTo.includes(sink)) {
      const outputNode = this.getOutputNode();
      const inputNode = sink.getInputNode();
      if (!outputNode) {
        console.error("Audio source has no output node, cannot connect to sink");
        return;
      }
      if (!inputNode) {
        console.error("Audio sink has no input node, cannot connect to source");
        return;
      }
      outputNode.connect(inputNode);
      this.#connectedTo.push(sink);
      AudioSourcesChangedEvent.dispatch(getApp().getAudioManager().getSources());
    }
  }

  disconnect(sinkToDisconnect?: AudioSink) {
    const outputNode = this.getOutputNode();
    if (!outputNode) {
      console.error("Audio source has no output node, cannot disconnect from sink");
      return;
    }

    if (sinkToDisconnect !== undefined) {
      const inputNode = sinkToDisconnect.getInputNode();
      if (!inputNode) {
        console.error("Audio sink has no input node, cannot disconnect from source");
        return;
      }
      outputNode.disconnect(inputNode);
      this.#connectedTo = this.#connectedTo.filter((sink) => sink != sinkToDisconnect);
    } else {
      outputNode.disconnect();
    }

    AudioSourcesChangedEvent.dispatch(getApp().getAudioManager().getSources());
  }

  setName(name: string) {
    this.#name = name;
  }

  getName() {
    return this.#name;
  }

  getConnectedTo() {
    return this.#connectedTo;
  }

  setVolume(volume: number) {
    this.#volume = volume;
    const audioContext = getApp().getAudioManager().getAudioContext();
    if (this.#gainNode && audioContext) {
      this.#gainNode.gain.exponentialRampToValueAtTime(volume, audioContext.currentTime + 0.02);
    }
    AudioSourcesChangedEvent.dispatch(getApp().getAudioManager().getSources());
  }

  getVolume() {
    return this.#volume;
  }

  getMeter() {
    return this.#meter;
  }

  getOutputNode() {
    return this.#gainNode;
  }

  /* Play method must be implemented by child classes */
  abstract play(): void;
}
