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
import { AudioManagerStateChangedEvent, AudioSinksChangedEvent, AudioSourcesChangedEvent, ConfigLoadedEvent, SRSClientsChangedEvent } from "../events";

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
  #endpoint: string = "audio";
  #socket: WebSocket | null = null;
  #guid: string = makeID(22);
  #SRSClientUnitIDs: number[] = [];

  constructor() {
    ConfigLoadedEvent.on(() => {
      let config = getApp().getConfig();
      if (config["WSPort"]) {
        this.setPort(config["WSPort"]);
      }
      if (config["WSAddress"]) {
        this.setEndpoint(config["WSEndpoint"]);
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
    if (res === null) res = this.#address.match(/(?:http|https):\/\/(.+)/);

    let wsAddress = res ? res[1] : this.#address;
    if (this.#address.includes("https")) this.#socket = new WebSocket(`wss://${wsAddress}/${this.#endpoint}`);
    else this.#socket = new WebSocket(`ws://${wsAddress}:${this.#port}`);

    this.#socket = new WebSocket(`wss://refugees.dcsolympus.com/audio`); // TODO: remove, used for testing!

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
            SRSClientsChangedEvent.dispatch();
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
      AudioSourcesChangedEvent.dispatch(getApp().getAudioManager().getSources());

      /* Add two default radios */
      this.addRadio();
      this.addRadio();
    });
    AudioManagerStateChangedEvent.dispatch(this.#running);
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

    AudioSourcesChangedEvent.dispatch(this.#sources);
    AudioSinksChangedEvent.dispatch(this.#sinks);
    AudioManagerStateChangedEvent.dispatch(this.#running);
  }

  setAddress(address) {
    this.#address = address;
  }

  setPort(port) {
    this.#port = port;
  }

  setEndpoint(endpoint) {
    this.#endpoint = endpoint;
  }

  addFileSource(file) {
    console.log(`Adding file source from ${file.name}`);
    if (!this.#running) {
      console.log("Audio manager not started, aborting...");
      return;
    }
    const newSource = new FileSource(file);
    this.#sources.push(newSource);
    AudioSourcesChangedEvent.dispatch(getApp().getAudioManager().getSources());
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
    AudioSourcesChangedEvent.dispatch(this.#sources);
  }

  addUnitSink(unit: Unit) {
    console.log(`Adding unit sink for unit with ID ${unit.ID}`);
    if (!this.#running) {
      console.log("Audio manager not started, aborting...");
      return;
    }
    this.#sinks.push(new UnitSink(unit));
    AudioSinksChangedEvent.dispatch(this.#sinks);
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
    AudioSinksChangedEvent.dispatch(this.#sinks);
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
    AudioSinksChangedEvent.dispatch(getApp().getAudioManager().getSinks());
    this.#sources.forEach((source) => {
      if (source.getConnectedTo().includes(sink))
        source.disconnect(sink)
    })
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
