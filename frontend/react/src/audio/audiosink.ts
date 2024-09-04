import { getApp } from "../olympusapp";

export abstract class AudioSink {
  #encoder: AudioEncoder;
  #name: string;
  #node: MediaStreamAudioDestinationNode;
  #audioTrackProcessor: any; // TODO can we have typings?
  #gainNode: GainNode;

  constructor() {
    /* A gain node is used because it allows to connect multiple inputs */
    this.#gainNode = getApp().getAudioManager().getAudioContext().createGain();
    this.#node = getApp().getAudioManager().getAudioContext().createMediaStreamDestination();
    this.#node.channelCount = 1;

    this.#encoder = new AudioEncoder({
      output: (data) => this.handleEncodedData(data),
      error: (e) => {
        console.log(e);
      },
    });

    this.#encoder.configure({
      codec: "opus",
      numberOfChannels: 1,
      sampleRate: 16000,
      //@ts-ignore // TODO why is it giving error?
      opus: {
        frameDuration: 40000,
      },
      bitrateMode: "constant",
    });

    //@ts-ignore
    this.#audioTrackProcessor = new MediaStreamTrackProcessor({
      track: this.#node.stream.getAudioTracks()[0],
    });
    this.#audioTrackProcessor.readable.pipeTo(
      new WritableStream({
        write: (arrayBuffer) => this.#handleRawData(arrayBuffer),
      })
    );

    this.#gainNode.connect(this.#node);
  }

  setName(name) {
    this.#name = name;
  }

  getName() {
    return this.#name;
  }

  disconnect() {
    this.getNode().disconnect();
    document.dispatchEvent(new CustomEvent("audioSinksUpdated"));
  }

  getNode() {
    return this.#gainNode;
  }

  #handleRawData(audioData) {
    this.#encoder.encode(audioData);
    audioData.close();
  }

  abstract handleEncodedData(encodedAudioChunk: EncodedAudioChunk): void;
}
