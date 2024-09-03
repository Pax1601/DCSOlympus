import { AudioSourceSetting } from "../interfaces";
import { AudioSink } from "./audiosink";

export abstract class AudioSource {
  #setting: AudioSourceSetting = {
    connectedTo: "",
    filename: "",
    playing: true,
  };

  getSetting() {
    return this.#setting;
  }

  setSetting(setting: AudioSourceSetting) {
    this.#setting = setting;
  }

  abstract play(): void;
  abstract getNode(): AudioNode;
  abstract getName(): string;
}
