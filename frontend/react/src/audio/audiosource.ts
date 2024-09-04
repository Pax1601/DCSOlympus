import { AudioSink } from "./audiosink";

export abstract class AudioSource {
  #connectedTo: AudioSink[] = [];
  #name = "";
  #playing = false;

  connect(sink: AudioSink) {
    this.getNode().connect(sink.getNode());
    this.#connectedTo.push(sink);
    document.dispatchEvent(new CustomEvent("audioSourcesUpdated"));
  }

  disconnect() {
    this.getNode().disconnect();
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

  abstract play(): void;
  abstract getNode(): AudioNode;
}
