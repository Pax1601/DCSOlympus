import { getApp } from "../olympusapp";
import { Unit } from "../unit/unit";
import { Filter, Noise } from "./audiolibrary";
import { AudioPacket } from "./audiopacket";

let packetID = 0;

export class AudioUnitPipeline {
  #inputNode: GainNode;
  #sourceUnit: Unit;
  #unitID: number;
  #gainNode: GainNode;
  #destinationNode: MediaStreamAudioDestinationNode;
  #audioTrackProcessor: any;
  #encoder: AudioEncoder;
  #distance: number = 0;

  #convolver: ConvolverNode;
  #delay: DelayNode;
  #multitap: DelayNode[];
  #multitapGain: GainNode;
  #wet: GainNode;
  #tailOsc: Noise;

  #dataBuffer: number[] = [];

  constructor(sourceUnit: Unit, unitID: number, inputNode: GainNode) {
    this.#sourceUnit = sourceUnit;
    this.#unitID = unitID;

    /* Initialize the Opus Encoder */
    this.#encoder = new AudioEncoder({
      output: (data) => this.handleEncodedData(data, unitID),
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

    /* Create the destination node where the stream will be written to be encoded and sent to SRS */
    this.#destinationNode = getApp().getAudioManager().getAudioContext().createMediaStreamDestination();
    this.#destinationNode.channelCount = 1;

    /* Gain node to modulate the strength of the audio */
    this.#gainNode = getApp().getAudioManager().getAudioContext().createGain();

    /* Create the track processor to encode and write the data to SRS */
    //@ts-ignore
    this.#audioTrackProcessor = new MediaStreamTrackProcessor({
      track: this.#destinationNode.stream.getAudioTracks()[0],
    });
    this.#audioTrackProcessor.readable.pipeTo(
      new WritableStream({
        write: (audioData) => this.handleRawData(audioData),
      })
    );

    /* Create the pipeline */
    this.#inputNode = inputNode;
    this.#inputNode.connect(this.#gainNode);
    this.#setupEffects();

    /* Create the interval task to update the data */
    setInterval(() => {
      let destinationUnit = getApp().getUnitsManager().getUnitByID(this.#unitID);
      if (destinationUnit) {
        let distance = destinationUnit?.getPosition().distanceTo(this.#sourceUnit.getPosition());
        this.#distance = 0.9 * this.#distance + 0.1 * distance;

        let newGain = 1.0 - Math.pow(this.#distance / 1000, 0.5); // Arbitrary

        this.#gainNode.gain.setValueAtTime(newGain, getApp().getAudioManager().getAudioContext().currentTime);
        this.#multitapGain.gain.setValueAtTime(newGain / 10, getApp().getAudioManager().getAudioContext().currentTime);

        let reverbTime = this.#distance / 1000 / 2; //Arbitrary
        let preDelay = this.#distance / 1000; // Arbitrary
        this.#delay.delayTime.setValueAtTime(preDelay, getApp().getAudioManager().getAudioContext().currentTime);
        this.#multitap.forEach((t, i) => {
          t.delayTime.setValueAtTime(0.001 + i * (preDelay / 2), getApp().getAudioManager().getAudioContext().currentTime);
        });
        this.#tailOsc.release = reverbTime / 3;
      }
    }, 100);
  }

  handleEncodedData(encodedAudioChunk, unitID) {
    let arrayBuffer = new ArrayBuffer(encodedAudioChunk.byteLength);
    encodedAudioChunk.copyTo(arrayBuffer);

    let audioPacket = new AudioPacket();
    audioPacket.setAudioData(new Uint8Array(arrayBuffer));
    audioPacket.setPacketID(packetID++);
    audioPacket.setFrequencies([
      {
        frequency: 100,
        modulation: 2,
        encryption: 0,
      },
    ]);
    audioPacket.setClientGUID(getApp().getAudioManager().getGuid());
    audioPacket.setTransmissionGUID(getApp().getAudioManager().getGuid());

    if (unitID !== 0) {
      audioPacket.setUnitID(unitID);
      getApp().getAudioManager().send(audioPacket.toByteArray());
    }
  }

  handleRawData(audioData) {
    /* Ignore players that are too far away */
    if (this.#distance < 1000) {
      this.#encoder.encode(audioData);

      audioData.close();
    }
  }

  #setupEffects() {
    let reverbTime = 0.1; //Arbitrary

    this.#convolver = getApp().getAudioManager().getAudioContext().createConvolver();
    this.#delay = getApp().getAudioManager().getAudioContext().createDelay(1);
    
    this.#multitap = [];
    for (let i = 2; i > 0; i--) {
      this.#multitap.push(getApp().getAudioManager().getAudioContext().createDelay(1));
    }
    this.#multitap.map((t, i) => {
      if (this.#multitap[i + 1]) {
        t.connect(this.#multitap[i + 1]);
      }
    });

    this.#multitapGain = getApp().getAudioManager().getAudioContext().createGain();
    this.#multitap[this.#multitap.length - 1].connect(this.#multitapGain);
    
    this.#multitapGain.connect(this.#destinationNode);
    this.#wet = getApp().getAudioManager().getAudioContext().createGain();

    this.#gainNode.connect(this.#wet);
    this.#wet.connect(this.#delay);
    this.#wet.connect(this.#multitap[0]);
    this.#delay.connect(this.#convolver);
    
    getApp().getAudioManager().getAudioContext().audioWorklet.addModule("audiodopplerprocessor.js").then(() => {
      const randomNoiseNode = new AudioWorkletNode(
        getApp().getAudioManager().getAudioContext(),
        "audio-doppler-processor",
      );
      this.#convolver.connect(randomNoiseNode);
      randomNoiseNode.connect(this.#destinationNode);
    });
    

    this.#renderTail(reverbTime);
  }

  #renderTail(reverbTime) {
    let attack = 0;
    let decay = 0.0;

    const tailContext = new OfflineAudioContext(
      2,
      getApp().getAudioManager().getAudioContext().sampleRate * reverbTime,
      getApp().getAudioManager().getAudioContext().sampleRate
    );

    this.#tailOsc = new Noise(tailContext, 1);
    const tailLPFilter = new Filter(tailContext, "lowpass", 5000, 1);
    const tailHPFilter = new Filter(tailContext, "highpass", 500, 1);

    this.#tailOsc.init();
    this.#tailOsc.connect(tailHPFilter.input);
    tailHPFilter.connect(tailLPFilter.input);
    tailLPFilter.connect(tailContext.destination);
    this.#tailOsc.attack = attack;
    this.#tailOsc.decay = decay;

    setTimeout(() => {
      tailContext.startRendering().then((buffer) => {
        this.#convolver.buffer = buffer;
      });

      this.#tailOsc.on({ frequency: 500, velocity: 127 });
      //tailOsc.off();
    }, 20);
  }
}
