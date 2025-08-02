export class Recorder {
  #decoder = new AudioDecoder({
    output: (chunk) => this.#handleDecodedData(chunk),
    error: (e) => console.log(e),
  });
  #trackGenerator: any; // TODO can we have typings?
  #writer: any;
  #gainNode: GainNode;
  #mediaRecorder: MediaRecorder;
  #recording = false;
  #chunks: any[] = [];
  onRecordingCompleted: (blob: Blob) => void

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
    this.#mediaRecorder = new MediaRecorder(stream, {
      audioBitsPerSecond: 256000,
      mimeType: `audio/webm;codecs="opus"`,
    });
  }

  recordBuffer(arrayBuffer) {
    if (!this.#recording) return;

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

  start() {
    this.#mediaRecorder.start();
    this.#recording = true;
    this.#chunks = [];

    this.#mediaRecorder.onstop = (e) => {
      if (this.#chunks.length > 0) this.onRecordingCompleted(this.#chunks[0]);
    };

    this.#mediaRecorder.ondataavailable = (e) => {
      this.#chunks.push(e.data);
    };
  }

  stop() {
    this.#mediaRecorder.stop();
    this.#recording = false;
  }

  #handleDecodedData(audioData) {
    this.#writer.ready.then(() => {
      this.#writer.write(audioData);
    });
  }
}
