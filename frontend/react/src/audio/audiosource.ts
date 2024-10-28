import { AudioSourcesChangedEvent } from "../events";
import { getApp } from "../olympusapp";
import { AudioSink } from "./audiosink";
import { WebAudioPeakMeter } from "web-audio-peak-meter";

/* Base abstract audio source class */
export abstract class AudioSource {
  #connectedTo: AudioSink[] = [];
  #name = "";
  #meter: WebAudioPeakMeter;
  #volume: number = 1.0;
  #gainNode: GainNode;

  constructor() {
    this.#gainNode = getApp().getAudioManager().getAudioContext().createGain();

    /* This library requires a div element to initialize the object. Create a fake element, we will read the data and render it ourselves. */
    this.#meter = new WebAudioPeakMeter(this.#gainNode, document.createElement("div"));
  }

  connect(sink: AudioSink) {
    if (!this.#connectedTo.includes(sink)) {
      this.getOutputNode().connect(sink.getInputNode());
      this.#connectedTo.push(sink);
      AudioSourcesChangedEvent.dispatch(getApp().getAudioManager().getSources());
    }
  }

  disconnect(sinkToDisconnect?: AudioSink) {
    if (sinkToDisconnect !== undefined) {
      this.getOutputNode().disconnect(sinkToDisconnect.getInputNode());
      this.#connectedTo = this.#connectedTo.filter((sink) => sink != sinkToDisconnect);
    } else {
      this.getOutputNode().disconnect();
    }

    AudioSourcesChangedEvent.dispatch(getApp().getAudioManager().getSources());
  }

  setName(name) {
    this.#name = name;
  }

  getName() {
    return this.#name;
  }

  getConnectedTo() {
    return this.#connectedTo;
  }

  setVolume(volume) {
    this.#volume = volume;
    this.#gainNode.gain.exponentialRampToValueAtTime(volume, getApp().getAudioManager().getAudioContext().currentTime + 0.02);
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
