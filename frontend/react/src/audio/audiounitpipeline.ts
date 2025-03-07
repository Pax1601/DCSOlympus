import { getApp } from "../olympusapp";
import { Unit } from "../unit/unit";
import { Filter, Noise } from "./audiolibrary";
import { AudioPacket } from "./audiopacket";

export class AudioUnitPipeline {
  #inputNode: GainNode;
  #sourceUnit: Unit;
  #unitID: number;
  #gainNode: GainNode;
  #destinationNode: MediaStreamAudioDestinationNode;
  #audioTrackProcessor: any;
  #encoder: AudioEncoder;

  #wetGainNode: GainNode;
  #delayNode: DelayNode;
  #convolverNode: ConvolverNode;
  #tailOscillator: Noise;

  #distance: number = 0;
  #packetID = 0;
  #ptt: boolean = false;
  #maxDistance: number = 1852;

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
    this.#setupEffects();

    /* Create the interval task to update the data */
    setInterval(() => {
      /* Get the destination unit and compute the distance to it */
      let destinationUnit = getApp().getUnitsManager().getUnitByID(this.#unitID);
      if (destinationUnit) {
        let distance = destinationUnit?.getPosition().distanceTo(this.#sourceUnit.getPosition());

        /* The units positions are updated at a low frequency. Filter the distance to avoid sudden volume jumps */
        this.#distance = 0.9 * this.#distance + 0.1 * distance;

        /* Don't bother updating parameters if the client is too far away */
        if (this.#distance < this.#maxDistance) {
          /* Compute a new gain decreasing with distance. */
          //let newGain = 1.0 - Math.pow(this.#distance / this.#maxDistance, 1); // Arbitrary
          
          let newGain = Math.min( 1, 20 / this.#distance  )

          /* Set the values of the main gain node and the multitap gain node, used for reverb effect */
          this.#gainNode.gain.setValueAtTime(newGain, getApp().getAudioManager().getAudioContext().currentTime);
        }
      }
    }, 100);
  }

  handleEncodedData(encodedAudioChunk, unitID) {
    /* Encode the data in SRS format and send it to the backend */
    let arrayBuffer = new ArrayBuffer(encodedAudioChunk.byteLength);
    encodedAudioChunk.copyTo(arrayBuffer);

    let audioPacket = new AudioPacket();
    audioPacket.setAudioData(new Uint8Array(arrayBuffer));
    audioPacket.setPacketID(this.#packetID++);
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
    if (this.#distance < this.#maxDistance && this.#ptt) {
      this.#encoder.encode(audioData);
      audioData.close();
    }
  }

  #setupEffects() {
    /* Create the nodes necessary for the pipeline */
    this.#convolverNode = getApp().getAudioManager().getAudioContext().createConvolver();

    this.#wetGainNode = getApp().getAudioManager().getAudioContext().createGain();
    this.#wetGainNode.gain.setValueAtTime(2.0, getApp().getAudioManager().getAudioContext().currentTime)
    this.#delayNode = getApp().getAudioManager().getAudioContext().createDelay(1);
    this.#delayNode.delayTime.setValueAtTime(0.09, getApp().getAudioManager().getAudioContext().currentTime)

    this.#inputNode.connect(this.#gainNode);

    this.#gainNode.connect(this.#destinationNode);

    this.#gainNode.connect(this.#wetGainNode);
    this.#wetGainNode.connect(this.#delayNode);
    this.#delayNode.connect(this.#convolverNode);
    this.#convolverNode.connect(this.#destinationNode);

    /* Render the random noise needed for the convolver node to simulate reverb */
    this.#renderTail(0.2); //Arbitrary
  }

  #renderTail(reverbTime) {
    let attack = 0.15;
    let decay = 0.09;

    /* Generate an offline audio context to render the reverb noise */
    const tailContext = new OfflineAudioContext(
      2,
      getApp().getAudioManager().getAudioContext().sampleRate * reverbTime,
      getApp().getAudioManager().getAudioContext().sampleRate
    );

    /* A noise oscillator and a two filters are added to smooth the reverb */
    this.#tailOscillator = new Noise(tailContext, 1);
    const tailLPFilter = new Filter(tailContext, "lowpass", 5000, 1);
    const tailHPFilter = new Filter(tailContext, "highpass", 500, 1);

    /* Initialize and connect the oscillator with the filters */
    this.#tailOscillator.init();
    this.#tailOscillator.connect(tailHPFilter.input);
    tailHPFilter.connect(tailLPFilter.input);
    tailLPFilter.connect(tailContext.destination);
    this.#tailOscillator.attack = attack;
    this.#tailOscillator.decay = decay;

    setTimeout(() => {
      /* Set the buffer of the convolver node */
      tailContext.startRendering().then((buffer) => {
        this.#convolverNode.buffer = buffer;
      });

      this.#tailOscillator.on({ frequency: 500, velocity: 127 });
      //tailOsc.off(); // TODO In the original example I copied, this was turned off. No idea why but it seems to work correctly if left on. To investigate.
    }, 20);
  }

  setPtt(ptt) {
    this.#ptt = ptt;
  }

  setMaxDistance(maxDistance) {
    this.#maxDistance = maxDistance;
  }
}
