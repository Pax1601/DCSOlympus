export class CapturePipeline {
  sampleRate: any;
  codec: any;
  sourceId: any;
  onrawdata: any;
  onencoded: any;
  deviceId: any;
  audioContext: any;
  mic: any;
  source: any;
  destination: any;
  encoder: any;
  audioTrackProcessor: any;
  duration: any;

  constructor(codec = "opus", sampleRate = 16000, duration = 40000) {
    this.sampleRate = sampleRate;
    this.codec = codec;
    this.duration = duration;
    this.onrawdata = null;
    this.onencoded = null;
  }
  async connect() {
    const mic = navigator.mediaDevices.getUserMedia({ audio: true });

    this.audioContext = new AudioContext({
      sampleRate: this.sampleRate,
      latencyHint: "interactive",
    });
    this.mic = await mic;
    this.source = this.audioContext.createMediaStreamSource(this.mic);
    this.destination = this.audioContext.createMediaStreamDestination();
    this.destination.channelCount = 1;
    this.source.connect(this.destination);

    this.encoder = new AudioEncoder({
      output: this.handleEncodedData.bind(this),
      error: this.handleEncodingError.bind(this),
    });

    this.encoder.configure({
      codec: this.codec,
      numberOfChannels: 1,
      sampleRate: this.sampleRate,
      opus: {
        frameDuration: this.duration,
      },
      bitrateMode: "constant"
    });

    //@ts-ignore
    this.audioTrackProcessor = new MediaStreamTrackProcessor({
      track: this.destination.stream.getAudioTracks()[0],
    });
    this.audioTrackProcessor.readable.pipeTo(
      new WritableStream({
        write: this.handleRawData.bind(this),
      })
    );
  }
  disconnect() {
    this.source.disconnect();
    delete this.audioTrackProcessor;
    delete this.encoder;
    delete this.destination;
    delete this.mic;
    delete this.source;
  }

  handleEncodedData(chunk, metadata) {
    if (this.onencoded) {
      this.onencoded(chunk, metadata);
    }
    const data = new ArrayBuffer(chunk.byteLength);
    chunk.copyTo(data);
  }
  handleEncodingError(e) {
    console.log(e);
  }

  handleRawData(audioData) {
    if (this.onrawdata) {
      this.onrawdata(audioData);
    }
    this.encoder.encode(audioData);
    audioData.close();
  }
}
