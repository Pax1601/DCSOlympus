import { getApp } from "../olympusapp";

export class PlaybackPipeline {
  #decoder = new AudioDecoder({
    output: (chunk) => this.#handleDecodedData(chunk),
    error: (e) => console.log(e),
  });
  #trackGenerator: any; // TODO can we have typings?
  #writer: any;
  #gainNode: GainNode;

  constructor() {
    this.#decoder.configure({
      codec: 'opus',
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
    mediaStreamSource.connect(this.#gainNode);
    this.#gainNode.connect(getApp().getAudioManager().getAudioContext().destination);
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

  #handleDecodedData(audioData) {
    this.#writer.ready.then(() => {
        this.#writer.write(audioData);
    })
  }
}
