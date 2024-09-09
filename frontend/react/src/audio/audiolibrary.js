// TODO Convert to typescript
// SAFARI Polyfills
if (!window.AudioBuffer.prototype.copyToChannel) {
  window.AudioBuffer.prototype.copyToChannel = function copyToChannel(buffer, channel) {
    this.getChannelData(channel).set(buffer);
  };
}
if (!window.AudioBuffer.prototype.copyFromChannel) {
  window.AudioBuffer.prototype.copyFromChannel = function copyFromChannel(buffer, channel) {
    buffer.set(this.getChannelData(channel));
  };
}

export class Effect {
  constructor(context) {
    this.name = "effect";
    this.context = context;
    this.input = this.context.createGain();
    this.effect = null;
    this.bypassed = false;
    this.output = this.context.createGain();
    this.setup();
    this.wireUp();
  }

  setup() {
    this.effect = this.context.createGain();
  }

  wireUp() {
    this.input.connect(this.effect);
    this.effect.connect(this.output);
  }

  connect(destination) {
    this.output.connect(destination);
  }
}

export class Sample {
  constructor(context) {
    this.context = context;
    this.buffer = this.context.createBufferSource();
    this.buffer.start();
    this.sampleBuffer = null;
    this.rawBuffer = null;
    this.loaded = false;
    this.output = this.context.createGain();
    this.output.gain.value = 0.1;
  }

  play() {
    if (this.loaded) {
      this.buffer = this.context.createBufferSource();
      this.buffer.buffer = this.sampleBuffer;
      this.buffer.connect(this.output);
      this.buffer.start(this.context.currentTime);
    }
  }

  connect(input) {
    this.output.connect(input);
  }

  load(path) {
    this.loaded = false;
    return fetch(path)
      .then((response) => response.arrayBuffer())
      .then((myBlob) => {
        return new Promise((resolve, reject) => {
          this.context.decodeAudioData(myBlob, resolve, reject);
        });
      })
      .then((buffer) => {
        this.sampleBuffer = buffer;
        this.loaded = true;
        return this;
      });
  }
}

export class AmpEnvelope {
  constructor(context, gain = 1) {
    this.context = context;
    this.output = this.context.createGain();
    this.output.gain.value = gain;
    this.partials = [];
    this.velocity = 0;
    this.gain = gain;
    this._attack = 0;
    this._decay = 0.001;
    this._sustain = this.output.gain.value;
    this._release = 0.001;
  }

  on(velocity) {
    this.velocity = velocity / 127;
    this.start(this.context.currentTime);
  }

  off(MidiEvent) {
    return this.stop(this.context.currentTime);
  }

  start(time) {
    this.output.gain.value = 0;
    this.output.gain.setValueAtTime(0, time);
    this.output.gain.setTargetAtTime(1, time, this.attack + 0.00001);
    this.output.gain.setTargetAtTime(this.sustain * this.velocity, time + this.attack, this.decay);
  }

  stop(time) {
    this.sustain = this.output.gain.value;
    this.output.gain.cancelScheduledValues(time);
    this.output.gain.setValueAtTime(this.sustain, time);
    this.output.gain.setTargetAtTime(0, time, this.release + 0.00001);
  }

  set attack(value) {
    this._attack = value;
  }

  get attack() {
    return this._attack;
  }

  set decay(value) {
    this._decay = value;
  }

  get decay() {
    return this._decay;
  }

  set sustain(value) {
    this.gain = value;
    this._sustain;
  }

  get sustain() {
    return this.gain;
  }

  set release(value) {
    this._release = value;
  }

  get release() {
    return this._release;
  }

  connect(destination) {
    this.output.connect(destination);
  }
}

export class Voice {
  constructor(context, type = "sawtooth", gain = 0.1) {
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

  init() {
    let osc = this.context.createOscillator();
    osc.type = this.type;
    osc.connect(this.ampEnvelope.output);
    osc.start(this.context.currentTime);
    this.partials.push(osc);
  }

  on(MidiEvent) {
    this.value = MidiEvent.value;
    this.partials.forEach((osc) => {
      osc.frequency.value = MidiEvent.frequency;
    });
    this.ampEnvelope.on(MidiEvent.velocity || MidiEvent);
  }

  off(MidiEvent) {
    this.ampEnvelope.off(MidiEvent);
    this.partials.forEach((osc) => {
      osc.stop(this.context.currentTime + this.ampEnvelope.release * 4);
    });
  }

  connect(destination) {
    this.output.connect(destination);
  }

  set detune(value) {
    this.partials.forEach((p) => (p.detune.value = value));
  }

  set attack(value) {
    this.ampEnvelope.attack = value;
  }

  get attack() {
    return this.ampEnvelope.attack;
  }

  set decay(value) {
    this.ampEnvelope.decay = value;
  }

  get decay() {
    return this.ampEnvelope.decay;
  }

  set sustain(value) {
    this.ampEnvelope.sustain = value;
  }

  get sustain() {
    return this.ampEnvelope.sustain;
  }

  set release(value) {
    this.ampEnvelope.release = value;
  }

  get release() {
    return this.ampEnvelope.release;
  }
}
export class Noise extends Voice {
  constructor(context, gain) {
    super(context, gain);
    this._length = 2;
  }

  get length() {
    return this._length || 2;
  }
  set length(value) {
    this._length = value;
  }

  init() {
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

  on(MidiEvent) {
    this.value = MidiEvent.value;
    this.ampEnvelope.on(MidiEvent.velocity || MidiEvent);
  }
}

export class Filter extends Effect {
  constructor(context, type = "lowpass", cutoff = 1000, resonance = 0.9) {
    super(context);
    this.name = "filter";
    this.effect.frequency.value = cutoff;
    this.effect.Q.value = resonance;
    this.effect.type = type;
  }

  setup() {
    this.effect = this.context.createBiquadFilter();
    this.effect.connect(this.output);
    this.wireUp();
  }
}
