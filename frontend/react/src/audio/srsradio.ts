import { AudioSink } from "./audiosink";
import { AudioPacket } from "./audiopacket";
import { getApp } from "../olympusapp";

export class SRSRadio extends AudioSink {
  #encoder: AudioEncoder;
  #node: MediaStreamAudioDestinationNode;
  #audioTrackProcessor: any; // TODO can we have typings?
  #gainNode: GainNode;

  #setting = {
    frequency: 251000000,
    modulation: 0,
    ptt: false,
    tuned: false,
    volume: 0.5,
  };

  constructor() {
    super();

    /* A gain node is used because it allows to connect multiple inputs */
    this.#gainNode = getApp().getAudioManager().getAudioContext().createGain();
    this.#node = getApp().getAudioManager().getAudioContext().createMediaStreamDestination();
    this.#node.channelCount = 1;
    
    this.#encoder = new AudioEncoder({
      output: (data) => this.#handleEncodedData(data),
      error: (e) => {console.log(e);},
    });

    this.#encoder.configure({
      codec: 'opus',
      numberOfChannels: 1,
      sampleRate: 16000,
      //@ts-ignore // TODO why is it giving error?
      opus: {
        frameDuration: 40000,
      },
      bitrateMode: "constant"
    });

    //@ts-ignore
    this.#audioTrackProcessor = new MediaStreamTrackProcessor({
      track: this.#node.stream.getAudioTracks()[0],
    });
    this.#audioTrackProcessor.readable.pipeTo(
      new WritableStream({
        write: (arrayBuffer) => this.#handleRawData(arrayBuffer),
      })
    );

    this.#gainNode.connect(this.#node);
  }

  getSetting() {
    return this.#setting;
  }

  setSetting(setting) {
    this.#setting = setting;
    document.dispatchEvent(new CustomEvent("radiosUpdated"));
  }

  getNode() {
    return this.#gainNode;
  }

  #handleEncodedData(audioBuffer) {
    let arrayBuffer = new ArrayBuffer(audioBuffer.byteLength);
    audioBuffer.copyTo(arrayBuffer);

    if (this.#setting.ptt) {
      let packet = new AudioPacket(new Uint8Array(arrayBuffer), this.#setting, getApp().getAudioManager().getGuid());
      getApp().getAudioManager().send(packet.getArray());
    }
  }

  #handleRawData(audioData) {
    this.#encoder.encode(audioData);
    audioData.close();
  }
}
