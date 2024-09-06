import { AudioSource } from "./audiosource";
import { getApp } from "../olympusapp";
import {WebAudioPeakMeter} from 'web-audio-peak-meter';

export class FileSource extends AudioSource {
  #file: File | null = null;
  #source: AudioBufferSourceNode;
  #duration: number = 0;
  #currentPosition: number = 0;
  #updateInterval: any;
  #lastUpdateTime: number = 0;
  #playing = false;
  #audioBuffer: AudioBuffer;
  #restartTimeout: any;
  #looping = false;

  constructor(file) {
    super();
    this.#file = file;

    this.setName(this.#file?.name ?? "N/A");

    if (!this.#file) {
      return;
    }
    
    var reader = new FileReader();
    reader.onload = (e) => {
      var contents = e.target?.result;
      if (contents) {
        getApp()
          .getAudioManager()
          .getAudioContext()
          .decodeAudioData(contents as ArrayBuffer, (audioBuffer) => {
            this.#audioBuffer = audioBuffer;
            this.#duration = audioBuffer.duration;
          });
      }
    };
    reader.readAsArrayBuffer(this.#file);
  }

  play() {
    this.#source = getApp().getAudioManager().getAudioContext().createBufferSource();
    this.#source.buffer = this.#audioBuffer;
    this.#source.connect(this.getNode());
    this.#source.loop = this.#looping;

    this.#source.start(0, this.#currentPosition);
    this.#playing = true;
    const now = Date.now() / 1000;
    this.#lastUpdateTime = now;

    document.dispatchEvent(new CustomEvent("audioSourcesUpdated"));

    this.#updateInterval = setInterval(() => {
      const now = Date.now() / 1000;
      this.#currentPosition += now - this.#lastUpdateTime;
      this.#lastUpdateTime = now;

      if (this.#currentPosition > this.#duration) {
        this.#currentPosition = 0;
        if (!this.#looping) this.stop();
      }

      document.dispatchEvent(new CustomEvent("audioSourcesUpdated"));
    }, 1000);
  }

  stop() {
    this.#source.stop();
    this.#source.disconnect();
    this.#playing = false;

    const now = Date.now() / 1000;
    this.#currentPosition += now - this.#lastUpdateTime;
    clearInterval(this.#updateInterval);

    document.dispatchEvent(new CustomEvent("audioSourcesUpdated"));
  }

  getPlaying() {
    return this.#playing;
  }

  getCurrentPosition() {
    return this.#currentPosition;
  }

  getDuration() {
    return this.#duration;
  }

  setCurrentPosition(percentPosition) {
    if (this.#playing) {
      clearTimeout(this.#restartTimeout);
      this.#restartTimeout = setTimeout(() => this.play(), 1000);
    }

    this.stop();
    this.#currentPosition = (percentPosition / 100) * this.#duration;
  }

  setLooping(looping) {
    this.#looping = looping;
    if (this.#source) this.#source.loop = looping;
    document.dispatchEvent(new CustomEvent("audioSourcesUpdated"));
  }

  getLooping() {
    return this.#looping;
  }
}
