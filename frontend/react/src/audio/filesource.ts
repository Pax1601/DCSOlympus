import { AudioSource } from "./audiosource";
import { getApp } from "../olympusapp";
import { AudioSourcesChangedEvent } from "../events";

export class FileSource extends AudioSource {
  #file: File;
  #filename: string;
  #source: AudioBufferSourceNode;
  #duration: number = 0;
  #currentPosition: number = 0;
  #updateInterval: number | null = null;
  #lastUpdateTime: number = 0;
  #playing = false;
  #audioBuffer: AudioBuffer;
  #restartTimeout: any;
  #looping = false;

  setFile(file: File) {
    this.#file = file;
    this.#filename = this.#file?.name;

    this.setName(this.#file?.name ?? "N/A");

    /* Create the file reader and read the file from disk */
    var reader = new FileReader();
    reader.onload = (e) => {
      var contents = e.target?.result;
      if (contents) {
        getApp()
          .getAudioManager()
          .getAudioContext()
          /* Decode the audio file. This method takes care of codecs */
          .decodeAudioData(contents as ArrayBuffer, (audioBuffer) => {
            this.#audioBuffer = audioBuffer;
            this.#duration = audioBuffer.duration;
          });
      }
    };
    reader.readAsArrayBuffer(this.#file);

    AudioSourcesChangedEvent.dispatch(getApp().getAudioManager().getSources());
  }

  play() {
    /* A new buffer source must be created every time the file is played */
    this.#source = getApp().getAudioManager().getAudioContext().createBufferSource();
    this.#source.buffer = this.#audioBuffer;
    this.#source.connect(this.getOutputNode());
    this.#source.loop = this.#looping;

    /* Start playing the file at the selected position */
    this.#source.start(0, this.#currentPosition);
    this.#playing = true;
    const now = Date.now() / 1000;
    this.#lastUpdateTime = now;

    AudioSourcesChangedEvent.dispatch(getApp().getAudioManager().getSources());

    if (this.#updateInterval === null) {
      this.#updateInterval = window.setInterval(() => {
        /* Update the current position value every second */
        const now = Date.now() / 1000;
        this.#currentPosition += now - this.#lastUpdateTime;
        this.#lastUpdateTime = now;

        if (this.#currentPosition > this.#duration) {
          this.#currentPosition = 0;
          if (!this.#looping) this.pause();
        }

        AudioSourcesChangedEvent.dispatch(getApp().getAudioManager().getSources());
      }, 1000);
    }
  }

  pause() {
    /* Disconnect the source and update the position to the current time (precisely)*/
    this.#source.stop();
    this.#source.disconnect();
    this.#playing = false;

    const now = Date.now() / 1000;
    this.#currentPosition += now - this.#lastUpdateTime;
    if (this.#updateInterval) window.clearInterval(this.#updateInterval);
    this.#updateInterval = null;

    AudioSourcesChangedEvent.dispatch(getApp().getAudioManager().getSources());
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
    /* To change the current play position we must:
    1) pause the current playback;
    2) update the current position value;
    3) after some time, restart playing. The delay is needed to avoid immediately restarting many times if the user drags the position slider;
    */
    if (this.#playing) {
      clearTimeout(this.#restartTimeout);
      this.#restartTimeout = setTimeout(() => this.play(), 1000);
    }

    this.pause();
    this.#currentPosition = (percentPosition / 100) * this.#duration;
  }

  setLooping(looping) {
    this.#looping = looping;
    if (this.#source) this.#source.loop = looping;
    AudioSourcesChangedEvent.dispatch(getApp().getAudioManager().getSources());
  }

  getLooping() {
    return this.#looping;
  }

  getFilename() {
    return this.#filename;
  }
}
