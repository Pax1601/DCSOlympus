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
	this.#gainNode.gain.value = 40;// apply gain to get clipping
	
	const volumeNode = getApp().getAudioManager().getAudioContext().createGain();
	volumeNode.gain.value = 0.1; // Lower output volume to prevent feedback
	
    this.#pannerNode = getApp().getAudioManager().getAudioContext().createStereoPanner();
    let splitter = getApp().getAudioManager().getAudioContext().createChannelSplitter();

    // Bandpass filter for low frequency cutoff at 520 Hz same as SRS
    let bandpassLow = new Filter(getApp().getAudioManager().getAudioContext(), "bandpass", 520, 0.25);
    bandpassLow.setup();

    // Bandpass filter for high frequency cutoff at 4130 Hz same as SRS
    let bandpassHigh = new Filter(getApp().getAudioManager().getAudioContext(), "bandpass", 5000, 0.3);
    bandpassHigh.setup();

    // Distortion effect
    let distortion = getApp().getAudioManager().getAudioContext().createWaveShaper();
    distortion.curve = this.#createDistortionCurve(2); // Customize curve for harshness
    distortion.oversample = '4x';
	

/*     // Connect the media stream source to the filters and distortion
	mediaStreamSource.connect(this.#gainNode);
	this.#gainNode.connect(this.#pannerNode);
	this.#pannerNode.pan.setValueAtTime(0, getApp().getAudioManager().getAudioContext().currentTime); */
	
	mediaStreamSource.connect(this.#gainNode);
	this.#gainNode.connect(bandpassHigh.input);
	//bandpassLow.output.connect(bandpassHigh.input);
	bandpassHigh.output.connect(volumeNode); // Control volume to prevent feedback
	volumeNode.connect(this.#pannerNode); // Route to panner
    this.#pannerNode.pan.setValueAtTime(0, getApp().getAudioManager().getAudioContext().currentTime);

    let noise = new Noise(getApp().getAudioManager().getAudioContext(), 0.02); // Slightly louder static
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

  #createDistortionCurve(amount) {
    let n_samples = 44100;
    let curve = new Float32Array(n_samples);
    let deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      let x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }
}
