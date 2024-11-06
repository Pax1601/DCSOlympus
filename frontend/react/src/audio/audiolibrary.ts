if (!window.AudioBuffer.prototype.copyToChannel) {
  window.AudioBuffer.prototype.copyToChannel = function copyToChannel(buffer: Float32Array, channel: number): void {
    this.getChannelData(channel).set(buffer);
  };
}
if (!window.AudioBuffer.prototype.copyFromChannel) {
  window.AudioBuffer.prototype.copyFromChannel = function copyFromChannel(buffer: Float32Array, channel: number): void {
    buffer.set(this.getChannelData(channel));
  };
}

export class Effect {
  name: string;
  context: AudioContext;
  input: GainNode;
  effect: GainNode | BiquadFilterNode | null;
  bypassed: boolean;
  output: GainNode;

  constructor(context: AudioContext) {
    this.name = "effect";
    this.context = context;
    this.input = this.context.createGain();
    this.effect = null;
    this.bypassed = false;
    this.output = this.context.createGain();
    this.setup();
    this.wireUp();
  }

  setup(): void {
    this.effect = this.context.createGain();
  }

  wireUp(): void {
    if (this.effect) {
      this.input.connect(this.effect);
      this.effect.connect(this.output);
    }
  }

  connect(destination: AudioNode): void {
    this.output.connect(destination);
  }
}

export class Sample {
  context: AudioContext;
  buffer: AudioBufferSourceNode;
  sampleBuffer: AudioBuffer | null;
  rawBuffer: ArrayBuffer | null;
  loaded: boolean;
  output: GainNode;

  constructor(context: AudioContext) {
    this.context = context;
    this.buffer = this.context.createBufferSource();
    this.buffer.start();
    this.sampleBuffer = null;
    this.rawBuffer = null;
    this.loaded = false;
    this.output = this.context.createGain();
    this.output.gain.value = 0.1;
  }

  play(): void {
    if (this.loaded) {
      this.buffer = this.context.createBufferSource();
      this.buffer.buffer = this.sampleBuffer;
      this.buffer.connect(this.output);
      this.buffer.start(this.context.currentTime);
    }
  }

  connect(input: AudioNode): void {
    this.output.connect(input);
  }

  load(path: string): Promise<Sample> {
    this.loaded = false;
    return fetch(path)
      .then((response) => response.arrayBuffer())
      .then((myBlob) => {
        return new Promise<AudioBuffer>((resolve, reject) => {
          this.context.decodeAudioData(myBlob, resolve, reject);
        });
      })
      .then((buffer: AudioBuffer) => {
        this.sampleBuffer = buffer;
        this.loaded = true;
        return this;
      });
  }
}

export class AmpEnvelope {
  context: AudioContext;
  output: GainNode;
  partials: any[];
  velocity: number;
  gain: number;
  #attack: number;
  #decay: number;
  #sustain: number;
  #release: number;

  constructor(context: AudioContext, gain: number = 1) {
    this.context = context;
    this.output = this.context.createGain();
    this.output.gain.value = gain;
    this.partials = [];
    this.velocity = 0;
    this.gain = gain;
    this.#attack = 0;
    this.#decay = 0.001;
    this.#sustain = this.output.gain.value;
    this.#release = 0.001;
  }

  on(velocity: number): void {
    this.velocity = velocity / 127;
    this.start(this.context.currentTime);
  }

  off(MidiEvent: any): void {
    return this.stop(this.context.currentTime);
  }

  start(time: number): void {
    this.output.gain.value = 0;
    this.output.gain.setValueAtTime(0, time);
    this.output.gain.setTargetAtTime(1, time, this.attack + 0.00001);
    this.output.gain.setTargetAtTime(this.sustain * this.velocity, time + this.attack, this.decay);
  }

  stop(time: number): void {
    this.sustain = this.output.gain.value;
    this.output.gain.cancelScheduledValues(time);
    this.output.gain.setValueAtTime(this.sustain, time);
    this.output.gain.setTargetAtTime(0, time, this.release + 0.00001);
  }

  set attack(value: number) {
    this.#attack = value;
  }

  get attack(): number {
    return this.#attack;
  }

  set decay(value: number) {
    this.#decay = value;
  }

  get decay(): number {
    return this.#decay;
  }

  set sustain(value: number) {
    this.gain = value;
    this.#sustain;
  }

  get sustain(): number {
    return this.gain;
  }

  set release(value: number) {
    this.#release = value;
  }

  get release(): number {
    return this.#release;
  }

  connect(destination: AudioNode): void {
    this.output.connect(destination);
  }
}

export class Voice {
  context: AudioContext;
  type: string;
  value: number;
  gain: number;
  output: GainNode;
  partials: any[];
  ampEnvelope: AmpEnvelope;

  constructor(context: AudioContext, gain: number = 0.1, type: string = "sawtooth") {
    this.context = context;
    this.type = type;
    this.value = -1;
    this.gain = gain;
    this.output = this.context.createGain();
    this.partials = [];
    this.output.gain.value = this.gain;
    this.ampEnvelope = new AmpEnvelope(this.context);
    this.ampEnvelope.connect(this.output);
  }

  init(): void {
    let osc = this.context.createOscillator();
    osc.type = this.type as OscillatorType;
    osc.connect(this.ampEnvelope.output);
    osc.start(this.context.currentTime);
    this.partials.push(osc);
  }

  on(MidiEvent: any): void {
    this.value = MidiEvent.value;
    this.partials.forEach((osc: OscillatorNode) => {
      osc.frequency.value = MidiEvent.frequency;
    });
    this.ampEnvelope.on(MidiEvent.velocity || MidiEvent);
  }

  off(MidiEvent: any): void {
    this.ampEnvelope.off(MidiEvent);
    this.partials.forEach((osc: OscillatorNode) => {
      osc.stop(this.context.currentTime + this.ampEnvelope.release * 4);
    });
  }

  connect(destination: AudioNode): void {
    this.output.connect(destination);
  }

  set detune(value: number) {
    this.partials.forEach((p: OscillatorNode) => (p.detune.value = value));
  }

  set attack(value: number) {
    this.ampEnvelope.attack = value;
  }

  get attack(): number {
    return this.ampEnvelope.attack;
  }

  set decay(value: number) {
    this.ampEnvelope.decay = value;
  }

  get decay(): number {
    return this.ampEnvelope.decay;
  }

  set sustain(value: number) {
    this.ampEnvelope.sustain = value;
  }

  get sustain(): number {
    return this.ampEnvelope.sustain;
  }

  set release(value: number) {
    this.ampEnvelope.release = value;
  }

  get release(): number {
    return this.ampEnvelope.release;
  }
}

export class Noise extends Voice {
  #length: number;

  constructor(context: AudioContext, gain: number) {
    super(context, gain);
    this.#length = 2;
  }

  get length(): number {
    return this.#length || 2;
  }

  set length(value: number) {
    this.#length = value;
  }

  init(): void {
    var lBuffer = new Float32Array(this.length * this.context.sampleRate);
    var rBuffer = new Float32Array(this.length * this.context.sampleRate);
    for (let i = 0; i < this.length * this.context.sampleRate; i++) {
      lBuffer[i] = 1 - 2 * Math.random();
      rBuffer[i] = 1 - 2 * Math.random();
    }
    let buffer = this.context.createBuffer(2, this.length * this.context.sampleRate, this.context.sampleRate);
    buffer.copyToChannel(lBuffer, 0);
    buffer.copyToChannel(rBuffer, 1);

    let osc = this.context.createBufferSource();
    osc.buffer = buffer;
    osc.loop = true;
    osc.loopStart = 0;
    osc.loopEnd = 2;
    osc.start(this.context.currentTime);
    osc.connect(this.ampEnvelope.output);
    this.partials.push(osc);
  }

  on(MidiEvent: any): void {
    this.value = MidiEvent.value;
    this.ampEnvelope.on(MidiEvent.velocity || MidiEvent);
  }
}

export class Filter extends Effect {
  constructor(context: AudioContext, type: string = "lowpass", cutoff: number = 1000, resonance: number = 0.9) {
    super(context);
    this.name = "filter";
    if (this.effect instanceof BiquadFilterNode) {
      this.effect.frequency.value = cutoff;
      this.effect.Q.value = resonance;
      this.effect.type = type as BiquadFilterType;
    }
  }

  setup(): void {
    this.effect = this.context.createBiquadFilter();
    this.effect.connect(this.output);
    this.wireUp();
  }
}
