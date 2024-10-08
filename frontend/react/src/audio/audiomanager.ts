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

  /* The audio backend must be manually started so that the browser can detect the user is enabling audio.
  Otherwise, no playback will be performed. */
  #running: boolean = false;
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
    this.#running = true;
    this.#audioContext = new AudioContext({ sampleRate: 16000 });
    this.#playbackPipeline = new PlaybackPipeline();

    /* Connect the audio websocket */
    let res = this.#address.match(/(?:http|https):\/\/(.+):/);
    let wsAddress = res ? res[1] : this.#address;
    if (this.#address.includes("https"))
      this.#socket = new WebSocket(`wss://${wsAddress}/${getApp().getConfig()['WSAddress']}`);
    else
      this.#socket = new WebSocket(`ws://${wsAddress}:${getApp().getConfig()['WSPort']}`);

    /* Log the opening of the connection */
    this.#socket.addEventListener("open", (event) => {
      console.log("Connection to audio websocket successfull");
    });

    /* Log any websocket errors */
    this.#socket.addEventListener("error", (event) => {
      console.log("An error occurred while connecting the WebSocket: " + event);
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
                this.#playbackPipeline.playBuffer(audioPacket.getAudioData().buffer);
              }
            });
          } else {
            this.#SRSClientUnitIDs = JSON.parse(new TextDecoder().decode(packetUint8Array.slice(1))).unitIDs;
            document.dispatchEvent(new CustomEvent("SRSClientsUpdated"));
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
    document.dispatchEvent(new CustomEvent("audioManagerStateChanged"));
  }

  stop() {
    this.#running = false;
    this.#sources.forEach((source) => {
      source.disconnect();
    });
    this.#sinks.forEach((sink) => {
      sink.disconnect();
    });
    this.#sources = [];
    this.#sinks = [];

    document.dispatchEvent(new CustomEvent("audioSourcesUpdated"));
    document.dispatchEvent(new CustomEvent("audioSinksUpdated"));
    document.dispatchEvent(new CustomEvent("audioManagerStateChanged"));
  }

  setAddress(address) {
    this.#address = address;
  }

  setPort(port) {
    this.#port = port;
  }

  addFileSource(file) {
    console.log(`Adding file source from ${file.name}`);
    if (!this.#running) {
      console.log("Audio manager not started, aborting...");
      return;
    }
    const newSource = new FileSource(file);
    this.#sources.push(newSource);
    document.dispatchEvent(new CustomEvent("audioSourcesUpdated"));
  }

  getSources() {
    return this.#sources;
  }

  removeSource(source: AudioSource) {
    console.log(`Removing source ${source.getName()}`);
    if (!this.#running) {
      console.log("Audio manager not started, aborting...");
      return;
    }
    source.disconnect();
    this.#sources = this.#sources.filter((v) => v != source);
    document.dispatchEvent(new CustomEvent("audioSourcesUpdated"));
  }

  addUnitSink(unit: Unit) {
    console.log(`Adding unit sink for unit with ID ${unit.ID}`);
    if (!this.#running) {
      console.log("Audio manager not started, aborting...");
      return;
    }
    this.#sinks.push(new UnitSink(unit));
    document.dispatchEvent(new CustomEvent("audioSinksUpdated"));
  }

  addRadio() {
    console.log("Adding new radio");
    if (!this.#running) {
      console.log("Audio manager not started, aborting...");
      return;
    }
    const newRadio = new RadioSink();
    this.#sinks.push(newRadio);
    newRadio.setName(`Radio ${this.#sinks.length}`);
    this.#sources[0].connect(newRadio);
    document.dispatchEvent(new CustomEvent("audioSinksUpdated"));
  }

  getSinks() {
    return this.#sinks;
  }

  removeSink(sink) {
    console.log(`Removing sink ${sink.getName()}`);
    if (!this.#running) {
      console.log("Audio manager not started, aborting...");
      return;
    }
    sink.disconnect();
    this.#sinks = this.#sinks.filter((v) => v != sink);
    let idx = 1;
    this.#sinks.forEach((sink) => {
      if (sink instanceof RadioSink) sink.setName(`Radio ${idx++}`);
    });
    document.dispatchEvent(new CustomEvent("audioSinksUpdated"));
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

  isRunning() {
    return this.#running;
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
