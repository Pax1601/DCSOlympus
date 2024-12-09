import { AudioMessageType, OlympusState } from "../constants/constants";
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
import { SpeechController } from "./speechcontroller";

export class AudioManager {
  #audioContext: AudioContext;
  #devices: MediaDeviceInfo[] = [];
  #input: MediaDeviceInfo;
  #output: MediaDeviceInfo;
  #speechController: SpeechController;

  /* The playback pipeline enables audio playback on the speakers/headphones */
  #playbackPipeline: PlaybackPipeline;

  /* The audio sinks used to transmit the audio stream to the SRS backend */
  #sinks: AudioSink[] = [];

  /* List of all possible audio sources (microphone, file stream etc...) */
  #sources: AudioSource[] = [];

  /* The audio backend must be manually started so that the browser can detect the user is enabling audio.
  Otherwise, no playback will be performed. */
  #running: boolean = false;
  #port: number;
  #endpoint: string;
  #socket: WebSocket | null = null;
  #guid: string = makeID(22);
  #SRSClientUnitIDs: number[] = [];
  #syncInterval: number;
  #speechRecognition: boolean = true;
  #internalTextToSpeechSource: TextToSpeechSource;

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

    this.#speechController = new SpeechController();
  }

  start() {
    this.#syncInterval = window.setInterval(() => {
      this.#syncRadioSettings();
    }, 1000);

    this.#audioContext = new AudioContext({ sampleRate: 16000 });

    //@ts-ignore
    if (this.#output) this.#audioContext.setSinkId(this.#output.deviceId);

    this.#playbackPipeline = new PlaybackPipeline();

    /* Connect the audio websocket */
    let res = location.toString().match(/(?:http|https):\/\/(.+):/);
    if (res === null) res = location.toString().match(/(?:http|https):\/\/(.+)/);

    let wsAddress = res ? res[1] : location.toString();
    if (this.#endpoint) this.#socket = new WebSocket(`wss://${wsAddress}/${this.#endpoint}`);
    else if (this.#port) this.#socket = new WebSocket(`ws://${wsAddress}:${this.#port}`);
    else console.error("The audio backend was enabled but no port/endpoint was provided in the configuration");

    if (!this.#socket) return;

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

                /* Make a copy of the array buffer for the playback pipeline to use */
                var dst = new ArrayBuffer(audioPacket.getAudioData().buffer.byteLength);
                new Uint8Array(dst).set(new Uint8Array(audioPacket.getAudioData().buffer));
                sink.recordArrayBuffer(audioPacket.getAudioData().buffer);
                this.#playbackPipeline.playBuffer(dst);
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

      let sessionRadios = getApp().getSessionDataManager().getSessionData().radios;
      if (sessionRadios) {
        /* Load session radios */
        sessionRadios.forEach((options) => {
          let newRadio = this.addRadio();
          newRadio?.setFrequency(options.frequency);
          newRadio?.setModulation(options.modulation);
        });
      } else {
        /* Add two default radios and connect to the microphone*/
        let newRadio = this.addRadio();
        this.#sources.find((source) => source instanceof MicrophoneSource)?.connect(newRadio);
        this.#sources.find((source) => source instanceof TextToSpeechSource)?.connect(newRadio);
        
        newRadio = this.addRadio();
        this.#sources.find((source) => source instanceof MicrophoneSource)?.connect(newRadio);
        this.#sources.find((source) => source instanceof TextToSpeechSource)?.connect(newRadio);
      }

      let sessionFileSources = getApp().getSessionDataManager().getSessionData().fileSources;
      if (sessionFileSources) {
        /* Load file sources */
        sessionFileSources.forEach((options) => {
          this.addFileSource();
        });
      }

      let sessionUnitSinks = getApp().getSessionDataManager().getSessionData().unitSinks;
      if (sessionUnitSinks) {
        /* Load unit sinks */
        sessionUnitSinks.forEach((options) => {
          let unit = getApp().getUnitsManager().getUnitByID(options.ID);
          if (unit) {
            this.addUnitSink(unit);
          }
        });
      }

      let sessionConnections = getApp().getSessionDataManager().getSessionData().connections;
      if (sessionConnections) {
        sessionConnections.forEach((connection) => {
          this.#sources[connection[0]]?.connect(this.#sinks[connection[1]]);
        })
      }

      this.#running = true;
      AudioManagerStateChangedEvent.dispatch(this.#running);
    });

    const textToSpeechSource = new TextToSpeechSource();
    this.#sources.push(textToSpeechSource);

    navigator.mediaDevices.enumerateDevices().then((devices) => {
      this.#devices = devices;
      AudioManagerDevicesChangedEvent.dispatch(devices);
    });

    this.#internalTextToSpeechSource = new TextToSpeechSource(); 
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

  setPort(port) {
    this.#port = port;
  }

  setEndpoint(endpoint) {
    this.#endpoint = endpoint;
  }

  addFileSource() {
    console.log(`Adding file source`);
    const newSource = new FileSource();
    this.#sources.push(newSource);
    AudioSourcesChangedEvent.dispatch(getApp().getAudioManager().getSources());
    return newSource;
  }

  getSources() {
    return this.#sources;
  }

  removeSource(source: AudioSource) {
    console.log(`Removing source ${source.getName()}`);
    source.disconnect();
    this.#sources = this.#sources.filter((v) => v != source);
    AudioSourcesChangedEvent.dispatch(this.#sources);
  }

  addUnitSink(unit: Unit) {
    console.log(`Adding unit sink for unit with ID ${unit.ID}`);
    const newSink = new UnitSink(unit);
    this.#sinks.push(newSink);
    AudioSinksChangedEvent.dispatch(this.#sinks);
    return newSink;
  }

  addRadio() {
    console.log("Adding new radio");
    const newRadio = new RadioSink();
    newRadio.speechDataAvailable = (blob) => this.#speechController.analyzeData(blob, newRadio);
    this.#sinks.push(newRadio);
    /* Set radio name by default to be incremental number */
    newRadio.setName(`Radio ${this.#sinks.length}`);
    AudioSinksChangedEvent.dispatch(this.#sinks);
    return newRadio;
  }

  getSinks() {
    return this.#sinks;
  }

  removeSink(sink) {
    console.log(`Removing sink ${sink.getName()}`);
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

  setSpeechRecognition(speechRecognition: boolean) {
    this.#speechRecognition = speechRecognition;
  }

  getSpeechRecognition() {
    return this.#speechRecognition;
  }

  getInternalTextToSpeechSource() {
    return this.#internalTextToSpeechSource;
  }

  #syncRadioSettings() {
    /* Send the radio settings of each radio to the SRS backend */
    let message = {
      type: "Settings update",
      guid: this.#guid,
      coalition: 2, // TODO
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
