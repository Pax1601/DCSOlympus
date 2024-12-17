import { getApp } from "../olympusapp";
import { Filter, Noise } from "./audiolibrary";

export class PlaybackPipeline {
  #decoder = new AudioDecoder({
    output: (chunk) => this.#handleDecodedData(chunk),
    error: (e) => console.log(e),
  });
  #trackGenerator: any; // TODO can we have typings?
  #writer: any;
  #gainNode: GainNode;
  #pannerNode: StereoPannerNode;
  #enabled: boolean = false;

  constructor() {
    this.#decoder.configure({
      codec: "opus",
      numberOfChannels: 1,
      sampleRate: 16000,
      //@ts-ignore // TODO why is this giving an error?
      opus: {
        frameDuration: 40000,
      },
      bitrateMode: "constant",
    });

    //@ts-ignore
    this.#trackGenerator = new MediaStreamTrackGenerator({ kind: "audio" });
    this.#writer = this.#trackGenerator.writable.getWriter();

    const stream = new MediaStream([this.#trackGenerator]);
    const mediaStreamSource = getApp().getAudioManager().getAudioContext().createMediaStreamSource(stream);

    /* Connect to the device audio output */
    this.#gainNode = getApp().getAudioManager().getAudioContext().createGain();
    this.#pannerNode = getApp().getAudioManager().getAudioContext().createStereoPanner();
    let splitter = getApp().getAudioManager().getAudioContext().createChannelSplitter();
    let bandpass = new Filter(getApp().getAudioManager().getAudioContext(), "banpass", 600, 10);
    bandpass.setup();

    mediaStreamSource.connect(this.#gainNode);
    this.#gainNode.connect(bandpass.input);
    bandpass.output.connect(splitter);
    splitter.connect(this.#pannerNode);

    this.#pannerNode.pan.setValueAtTime(0, getApp().getAudioManager().getAudioContext().currentTime);

    let noise = new Noise(getApp().getAudioManager().getAudioContext(), 0.01);
    noise.init();
    noise.connect(this.#gainNode);
  }

  playBuffer(arrayBuffer) {
    const init = {
      type: "key",
      data: arrayBuffer,
      timestamp: 0,
      duration: 2000000,
      transfer: [arrayBuffer],
    };
    //@ts-ignore //TODO Typings?
    let encodedAudioChunk = new EncodedAudioChunk(init);

    this.#decoder.decode(encodedAudioChunk);
  }

  setEnabled(enabled) {
    if (enabled && !this.#enabled) {
      this.#enabled = true;
      this.#pannerNode.connect(getApp().getAudioManager().getAudioContext().destination);
    } else if (!enabled && this.#enabled) {
      this.#enabled = false;
      this.#pannerNode.disconnect(getApp().getAudioManager().getAudioContext().destination);
    }
  }

  setPan(pan) {
    this.#pannerNode.pan.setValueAtTime(pan, getApp().getAudioManager().getAudioContext().currentTime);
  }

  #handleDecodedData(audioData) {
    this.#writer.ready.then(() => {
      this.#writer.write(audioData);
    });
  }
}
