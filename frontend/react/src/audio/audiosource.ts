import { getApp } from "../olympusapp";
import { AudioSink } from "./audiosink";
import { WebAudioPeakMeter } from "web-audio-peak-meter";

export abstract class AudioSource {
  #connectedTo: AudioSink[] = [];
  #name = "";
  #meter: WebAudioPeakMeter;
  #volume: number = 1.0;
  #gainNode: GainNode;

  constructor() {
    this.#gainNode = getApp().getAudioManager().getAudioContext().createGain();
    this.#meter = new WebAudioPeakMeter(this.#gainNode, document.createElement('div'));
  }

  connect(sink: AudioSink) {
    this.getNode().connect(sink.getNode());
    this.#connectedTo.push(sink);
    document.dispatchEvent(new CustomEvent("audioSourcesUpdated"));
  }

  disconnect(sinkToDisconnect?: AudioSink) {
    if (sinkToDisconnect !== undefined) {
      this.getNode().disconnect(sinkToDisconnect.getNode());
      this.#connectedTo = this.#connectedTo.filter((sink) => sink != sinkToDisconnect);
    } else {
      this.getNode().disconnect();
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

  getNode() {
    return this.#gainNode;
  }

  abstract play(): void;
}
