import { AudioSource } from "./audiosource";
import { bufferToF32Planar } from "../other/utils";
import { getApp } from "../olympusapp";

export class FileSource extends AudioSource {
  #gainNode: GainNode;
  #file: File | null = null;
  #source: AudioBufferSourceNode;

  constructor(file) {
    super();
    this.#file = file;

    this.setName(this.#file?.name ?? "N/A");

    this.#gainNode = getApp().getAudioManager().getAudioContext().createGain();
  }

  getNode() {
    return this.#gainNode;
  }

  play() {
    if (!this.#file) {
      return;
    }
    var reader = new FileReader();
    reader.onload = (e) => {
      var contents = e.target?.result;
      if (contents) {
        getApp().getAudioManager().getAudioContext().decodeAudioData(contents as ArrayBuffer, (arrayBuffer) => {
          this.#source = getApp().getAudioManager().getAudioContext().createBufferSource();
          this.#source.buffer = arrayBuffer;
          this.#source.connect(this.#gainNode);
          this.#source.loop = true;
          this.#source.start();
        });
      }
    };
    reader.readAsArrayBuffer(this.#file);
  }

  stop() {
    this.#source.stop();
  }

  setGain(gain) {
    this.#gainNode.gain.setValueAtTime(gain, getApp().getAudioManager().getAudioContext().currentTime);
  }
}
