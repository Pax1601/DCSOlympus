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
import {
  AudioManagerDevicesChangedEvent,
  AudioManagerInputChangedEvent,
  AudioManagerOutputChangedEvent,
  AudioManagerStateChangedEvent,
  AudioSinksChangedEvent,
  AudioSourcesChangedEvent,
  ConfigLoadedEvent,
  SRSClientsChangedEvent,
} from "../events";
import { OlympusConfig } from "../interfaces";
import { TextToSpeechSource } from "./texttospeechsource";

export class AudioManager {
  #audioContext: AudioContext;
  #synth = window.speechSynthesis;
  #devices: MediaDeviceInfo[] = [];
  #input: MediaDeviceInfo;
  #output: MediaDeviceInfo;

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
  #port: number;
  #endpoint: string;
  #socket: WebSocket | null = null;
  #guid: string = makeID(22);
  #SRSClientUnitIDs: number[] = [];
  #syncInterval: number;

  constructor() {
    ConfigLoadedEvent.on((config: OlympusConfig) => {
      config.audio.WSPort ? this.setPort(config.audio.WSPort) : this.setEndpoint(config.audio.WSEndpoint);
    });

    let PTTKeys = ["KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM", "KeyComma", "KeyDot"];
    PTTKeys.forEach((key, idx) => {
      getApp()
        .getShortcutManager()
        .addShortcut(`PTT${idx}Active`, {
          label: `PTT ${idx} active`,
          keyDownCallback: () => this.getSinks()[idx]?.setPtt(true),
          keyUpCallback: () => this.getSinks()[idx]?.setPtt(false),
          code: key,
          shiftKey: true,
          ctrlKey: false,
          altKey: false,
        });
    });
  }

  start() {
    this.#syncInterval = window.setInterval(() => {
      this.#syncRadioSettings();
    }, 1000);

    this.#running = true;
    this.#audioContext = new AudioContext({ sampleRate: 16000 });

    //@ts-ignore
    if (this.#output) this.#audioContext.setSinkId(this.#output.deviceId);

    this.#playbackPipeline = new PlaybackPipeline();

    /* Connect the audio websocket */
    let res = this.#address.match(/(?:http|https):\/\/(.+):/);
    if (res === null) res = this.#address.match(/(?:http|https):\/\/(.+)/);

    let wsAddress = res ? res[1] : this.#address;
    if (this.#endpoint) this.#socket = new WebSocket(`wss://${wsAddress}/${this.#endpoint}`);
    else if (this.#port) this.#socket = new WebSocket(`ws://${wsAddress}:${this.#port}`);
    else console.error("The audio backend was enabled but no port/endpoint was provided in the configuration");

    if (!this.#socket) return;

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
              if (sink.getFrequency() === frequencyInfo.frequency && sink.getModulation() === frequencyInfo.modulation && sink.getTuned()) {
                sink.setReceiving(true);
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
    const microphoneSource = new MicrophoneSource(this.#input);
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

    const textToSpeechSource = new TextToSpeechSource();
    this.#sources.push(textToSpeechSource);

    AudioManagerStateChangedEvent.dispatch(this.#running);

    navigator.mediaDevices.enumerateDevices().then((devices) => {
      this.#devices = devices;
      AudioManagerDevicesChangedEvent.dispatch(devices);
    });
  }

  stop() {
    /* Stop everything and send update event */
    this.#running = false;
    this.#sources.forEach((source) => source.disconnect());
    this.#sinks.forEach((sink) => sink.disconnect());
    this.#sources = [];
    this.#sinks = [];
    this.#socket?.close();

    window.clearInterval(this.#syncInterval);

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
    if (!this.#running || this.#sources[0] === undefined) {
      console.log("Audio manager not started, aborting...");
      return;
    }
    const newRadio = new RadioSink();
    this.#sinks.push(newRadio);
    /* Set radio name by default to be incremental number */
    newRadio.setName(`Radio ${this.#sinks.length}`);
    this.#sources.find((source) => source instanceof MicrophoneSource)?.connect(newRadio);
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
    /* If a radio was removed, rename all the remainin radios to align the names */
    this.#sinks.forEach((sink) => {
      if (sink instanceof RadioSink) sink.setName(`Radio ${idx++}`);
    });
    AudioSinksChangedEvent.dispatch(getApp().getAudioManager().getSinks());

    /* Disconnect all the sources that where connected to this sink */
    this.#sources.forEach((source) => {
      if (source.getConnectedTo().includes(sink)) source.disconnect(sink);
    });
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

  setInput(input: MediaDeviceInfo) {
    if (this.#devices.includes(input)) {
      this.#input = input;
      AudioManagerInputChangedEvent.dispatch(input);
      this.stop();
      this.start();
    } else {
      console.error("Requested input device is not in devices list");
    }
  }

  setOutput(output: MediaDeviceInfo) {
    if (this.#devices.includes(output)) {
      this.#input = output;
      AudioManagerOutputChangedEvent.dispatch(output);
      this.stop();
      this.start();
    } else {
      console.error("Requested output device is not in devices list");
    }
  }

  playText(text) {
    this.#sources.find((source) => source instanceof TextToSpeechSource)?.playText(text);
  }

  #syncRadioSettings() {
    /* Send the radio settings of each radio to the SRS backend */
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
