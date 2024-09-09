import { AudioMessageType } from "../constants/constants";
import { MicrophoneSource } from "./microphonesource";
import { RadioSink } from "./radiosink";
import { getApp } from "../olympusapp";
import { makeID } from "../other/utils";
import { FileSource } from "./filesource";
import { AudioSource } from "./audiosource";
import { Buffer } from "buffer";
import { PlaybackPipeline } from "./playbackpipeline";
import { AudioSink } from "./audiosink";
import { Unit } from "../unit/unit";
import { UnitSink } from "./unitsink";
import { AudioPacket, MessageType } from "./audiopacket";

export class AudioManager {
  #audioContext: AudioContext;

  /* The playback pipeline enables audio playback on the speakers/headphones */
  #playbackPipeline: PlaybackPipeline;

  /* The audio sinks used to transmit the audio stream to the SRS backend */
  #sinks: AudioSink[] = [];

  /* List of all possible audio sources (microphone, file stream etc...) */
  #sources: AudioSource[] = [];

  #address: string = "localhost";
  #port: number = 4000;
  #socket: WebSocket | null = null;
  #guid: string = makeID(22);
  #SRSClientUnitIDs: number[] = [];

  constructor() {
    document.addEventListener("configLoaded", () => {
      let config = getApp().getConfig();
      if (config["WSPort"]) {
        this.setPort(config["WSPort"]);
      }
    });

    setInterval(() => {
      this.#syncRadioSettings();
    }, 1000);
  }

  start() {
    this.#audioContext = new AudioContext({ sampleRate: 16000 });
    this.#playbackPipeline = new PlaybackPipeline();

    /* Connect the audio websocket */
    let res = this.#address.match(/(?:http|https):\/\/(.+):/);
    let wsAddress = res ? res[1] : this.#address;
    this.#socket = new WebSocket(`ws://${wsAddress}:${this.#port}`);

    /* Log the opening of the connection */
    this.#socket.addEventListener("open", (event) => {
      console.log("Connection to audio websocket successfull");
    });

    /* Log any websocket errors */
    this.#socket.addEventListener("error", (event) => {
      console.log(event);
    });

    /* Handle the reception of a new message */
    this.#socket.addEventListener("message", (event) => {
      this.#sinks.forEach(async (sink) => {
        if (sink instanceof RadioSink) {
          /* Extract the audio data as array */
          let packetUint8Array = new Uint8Array(await event.data.arrayBuffer());

          if (packetUint8Array[0] === MessageType.audio) {
            /* Extract the encoded audio data */
            let audioPacket = new AudioPacket();
            audioPacket.fromByteArray(packetUint8Array.slice(1));

            /* Extract the frequency value and play it on the speakers if we are listening to it*/
            audioPacket.getFrequencies().forEach((frequencyInfo) => {
              if (sink.getFrequency() === frequencyInfo.frequency && sink.getModulation() === frequencyInfo.modulation) {
                this.#playbackPipeline.play(audioPacket.getAudioData().buffer);
              }
            });
          } else {
            this.#SRSClientUnitIDs = JSON.parse(new TextDecoder().decode(packetUint8Array.slice(1))).unitIDs;
          }
        }
      });
    });

    /* Add the microphone source and connect it directly to the radio */
    const microphoneSource = new MicrophoneSource();
    microphoneSource.initialize().then(() => {
      this.#sinks.forEach((sink) => {
        if (sink instanceof RadioSink) microphoneSource.connect(sink);
      });
      this.#sources.push(microphoneSource);
      document.dispatchEvent(new CustomEvent("audioSourcesUpdated"));

      /* Add two default radios */
      this.addRadio();
      this.addRadio();
    });
  }

  stop() {
    this.#sources.forEach((source) => {
      source.disconnect();
    });
    this.#sources = [];
    this.#sinks = [];

    document.dispatchEvent(new CustomEvent("audioSourcesUpdated"));
    document.dispatchEvent(new CustomEvent("audioSinksUpdated"));
  }

  setAddress(address) {
    this.#address = address;
  }

  setPort(port) {
    this.#port = port;
  }

  addFileSource(file) {
    const newSource = new FileSource(file);
    this.#sources.push(newSource);
    newSource.connect(this.#sinks[0]);
    document.dispatchEvent(new CustomEvent("audioSourcesUpdated"));
  }

  addUnitSink(unit: Unit) {
    this.#sinks.push(new UnitSink(unit));
    document.dispatchEvent(new CustomEvent("audioSinksUpdated"));
  }

  getSinks() {
    return this.#sinks;
  }

  addRadio() {
    const newRadio = new RadioSink();
    this.#sinks.push(newRadio);
    newRadio.setName(`Radio ${this.#sinks.length}`);
    this.#sources[0].connect(newRadio);
    document.dispatchEvent(new CustomEvent("audioSinksUpdated"));
  }

  removeSink(sink) {
    sink.disconnect();
    this.#sinks = this.#sinks.filter((v) => v != sink);
    let idx = 1;
    this.#sinks.forEach((sink) => {
      if (sink instanceof RadioSink) sink.setName(`Radio ${idx++}`);
    });
    document.dispatchEvent(new CustomEvent("audioSinksUpdated"));
  }

  removeSource(source) {
    source.disconnect();
    this.#sources = this.#sources.filter((v) => v != source);
    document.dispatchEvent(new CustomEvent("audioSourcesUpdated"));
  }

  getSources() {
    return this.#sources;
  }

  getGuid() {
    return this.#guid;
  }

  send(array) {
    this.#socket?.send(array);
  }

  getAudioContext() {
    return this.#audioContext;
  }

  getSRSClientsUnitIDs() {
    return this.#SRSClientUnitIDs;
  }

  #syncRadioSettings() {
    let message = {
      type: "Settings update",
      guid: this.#guid,
      coalition: 2,
      settings: this.#sinks
        .filter((sink) => sink instanceof RadioSink)
        .map((radio) => {
          return {
            frequency: radio.getFrequency(),
            modulation: radio.getModulation(),
            ptt: radio.getPtt(),
          };
        }),
    };

    if (this.#socket?.readyState == 1) this.#socket?.send(new Uint8Array([AudioMessageType.settings, ...Buffer.from(JSON.stringify(message), "utf-8")]));
  }
}
