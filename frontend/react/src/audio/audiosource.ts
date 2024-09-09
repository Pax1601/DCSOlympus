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
    this.getOutputNode().connect(sink.getInputNode());
    this.#connectedTo.push(sink);
    document.dispatchEvent(new CustomEvent("audioSourcesUpdated"));
  }

  disconnect(sinkToDisconnect?: AudioSink) {
    if (sinkToDisconnect !== undefined) {
      this.getOutputNode().disconnect(sinkToDisconnect.getInputNode());
      this.#connectedTo = this.#connectedTo.filter((sink) => sink != sinkToDisconnect);
    } else {
      this.getOutputNode().disconnect();
    }

    document.dispatchEvent(new CustomEvent("audioSourcesUpdated"));
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
    document.dispatchEvent(new CustomEvent("audioSourcesUpdated"));
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
