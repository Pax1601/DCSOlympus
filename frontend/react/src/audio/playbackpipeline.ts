export class PlaybackPipeline {
  sampleRate: any;
  codec: any;
  sourceId: any;
  onrawdata: any;
  ondecoded: any;
  deviceId: any;
  audioContext: any;
  mic: any;
  source: any;
  destination: any;
  decoder: any;
  audioTrackProcessor: any;
  duration: any;
  trackGenerator: any;
  writer: any;

  constructor(codec = "opus", sampleRate = 16000, duration = 40000) {
    this.sampleRate = sampleRate;
    this.codec = codec;
    this.duration = duration;
    this.ondecoded = null;
    this.audioContext = new AudioContext();

    this.decoder = new AudioDecoder({
      output: (chunk) => this.handleDecodedData(chunk),
      error: this.handleDecodingError.bind(this),
    });

    this.decoder.configure({
      codec: this.codec,
      numberOfChannels: 1,
      sampleRate: this.sampleRate,
      opus: {
        frameDuration: this.duration,
      },
      bitrateMode: "constant",
    });

    //@ts-ignore
    this.trackGenerator = new MediaStreamTrackGenerator({ kind: "audio" });
    this.writer = this.trackGenerator.writable.getWriter();

    const stream = new MediaStream([this.trackGenerator]);

    const mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
    mediaStreamSource.connect(this.audioContext.destination)
  }

  play(buffer) {
    const init = {
      type: "key",
      data: buffer,
      timestamp: 23000000,
      duration: 2000000,
      transfer: [buffer],
    };
    //@ts-ignore
    let chunk = new EncodedAudioChunk(init);

    this.decoder.decode(chunk);
  }

  disconnect() {
    this.source.disconnect();
    delete this.audioTrackProcessor;
    delete this.decoder;
    delete this.destination;
    delete this.mic;
    delete this.source;
  }

  handleDecodedData(chunk) {
    this.writer.ready.then(() => {
        this.writer.write(chunk);
    })
  }
  handleDecodingError(e) {
    console.log(e);
  }

}
