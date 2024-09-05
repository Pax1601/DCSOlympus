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

  abstract play(): void;
  abstract getNode(): AudioNode;
}
