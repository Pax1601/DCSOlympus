import { AudioSink } from "./audiosink";
import { AudioPacket } from "./audiopacket";
import { getApp } from "../olympusapp";
import { AudioSinksChangedEvent } from "../events";

// TODO should this be shared or radio specific?
let packetID = 0;

/* Radio sink, basically implements a simple SRS Client in Olympus. Does not support encryption at this moment */
export class RadioSink extends AudioSink {
  #encoder: AudioEncoder;
  #desinationNode: MediaStreamAudioDestinationNode;
  #audioTrackProcessor: any; // TODO can we have typings?
  #frequency = 251000000;
  #modulation = 0;
  #ptt = false;
  #tuned = false;
  #volume = 0.5;

  constructor() {
    super();

    this.#encoder = new AudioEncoder({
      output: (data) => this.handleEncodedData(data),
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

    this.#desinationNode = getApp().getAudioManager().getAudioContext().createMediaStreamDestination();
    this.#desinationNode.channelCount = 1;

    //@ts-ignore
    this.#audioTrackProcessor = new MediaStreamTrackProcessor({
      track: this.#desinationNode.stream.getAudioTracks()[0],
    });
    this.#audioTrackProcessor.readable.pipeTo(
      new WritableStream({
        write: (arrayBuffer) => this.handleRawData(arrayBuffer),
      })
    );

    this.getInputNode().connect(this.#desinationNode);
  }

  setFrequency(frequency) {
    this.#frequency = frequency;
    AudioSinksChangedEvent.dispatch(getApp().getAudioManager().getSinks());
  }

  getFrequency() {
    return this.#frequency;
  }

  setModulation(modulation) {
    this.#modulation = modulation;
    AudioSinksChangedEvent.dispatch(getApp().getAudioManager().getSinks());
  }

  getModulation() {
    return this.#modulation;
  }

  setPtt(ptt) {
    this.#ptt = ptt;
    AudioSinksChangedEvent.dispatch(getApp().getAudioManager().getSinks());
  }

  getPtt() {
    return this.#ptt;
  }

  setTuned(tuned) {
    this.#tuned = tuned;
    AudioSinksChangedEvent.dispatch(getApp().getAudioManager().getSinks());
  }

  getTuned() {
    return this.#tuned;
  }

  setVolume(volume) {
    this.#volume = volume;
    AudioSinksChangedEvent.dispatch(getApp().getAudioManager().getSinks());
  }

  getVolume() {
    return this.#volume;
  }

  handleEncodedData(encodedAudioChunk: EncodedAudioChunk) {
    let arrayBuffer = new ArrayBuffer(encodedAudioChunk.byteLength);
    encodedAudioChunk.copyTo(arrayBuffer);

    if (this.#ptt) {
      let audioPacket = new AudioPacket();
      audioPacket.setAudioData(new Uint8Array(arrayBuffer));
      audioPacket.setPacketID(packetID++);
      audioPacket.setFrequencies([{
          frequency: this.#frequency,
          modulation: this.#modulation,
          encryption: 0
      }])
      audioPacket.setClientGUID(getApp().getAudioManager().getGuid());
      audioPacket.setTransmissionGUID(getApp().getAudioManager().getGuid());
      getApp().getAudioManager().send(audioPacket.toByteArray());
    }
  }

  handleRawData(audioData) {
    this.#encoder.encode(audioData);
    audioData.close();
  }
}
