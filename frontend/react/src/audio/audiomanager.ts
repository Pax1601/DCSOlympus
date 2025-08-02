import { AudioManagerState, AudioMessageType, BLUE_COMMANDER, GAME_MASTER, OlympusState, RED_COMMANDER } from "../constants/constants";
import { MicrophoneSource } from "./microphonesource";
import { RadioSink } from "./radiosink";
import { getApp } from "../olympusapp";
import { coalitionToEnum, deepCopyTable, makeID } from "../other/utils";
import { FileSource } from "./filesource";
import { AudioSource } from "./audiosource";
import { Buffer } from "buffer";
import { AudioSink } from "./audiosink";
import { Unit } from "../unit/unit";
import { UnitSink } from "./unitsink";
import { AudioPacket, MessageType } from "./audiopacket";
import {
  AudioManagerCoalitionChangedEvent,
  AudioManagerDevicesChangedEvent,
  AudioManagerInputChangedEvent,
  AudioManagerOutputChangedEvent,
  AudioManagerStateChangedEvent,
  AudioOptionsChangedEvent,
  AudioSinksChangedEvent,
  AudioSourcesChangedEvent,
  CommandModeOptionsChangedEvent,
  ConfigLoadedEvent,
  SRSClientsChangedEvent,
} from "../events";
import { CommandModeOptions, OlympusConfig } from "../interfaces";
import { TextToSpeechSource } from "./texttospeechsource";
import { AudioOptions, Coalition, SRSClientData } from "../types/types";

export class AudioManager {
  #audioContext: AudioContext;
  #devices: MediaDeviceInfo[] = [];
  #input: MediaDeviceInfo;
  #output: MediaDeviceInfo;
  #options: AudioOptions = { input: "", output: "" };

  /* The audio sinks used to transmit the audio stream to the SRS backend */
  #sinks: AudioSink[] = [];

  /* List of all possible audio sources (microphone, file stream etc...) */
  #sources: AudioSource[] = [];

  /* The audio backend must be manually started so that the browser can detect the user is enabling audio.
  Otherwise, no playback will be performed. */
  #state: string = AudioManagerState.STOPPED;
  #port: number;
  #endpoint: string;
  #socket: WebSocket | null = null;
  #guid: string = makeID(22);
  #SRSClientsData: SRSClientData[] = [];
  #syncInterval: number;
  #speechRecognition: boolean = true;
  #internalTextToSpeechSource: TextToSpeechSource;
  #coalition: Coalition = "blue";
  #commandMode: string = BLUE_COMMANDER;
  #connectionCheckTimeout: number;
  #receivedPackets: number = 0;

  constructor() {
    ConfigLoadedEvent.on((config: OlympusConfig) => {
      if (config.audio) {
        this.setPort(config.audio.WSPort);
        this.setEndpoint(config.audio.WSEndpoint);
      } else console.error("No audio configuration found in the Olympus configuration file");
    });

    CommandModeOptionsChangedEvent.on((options: CommandModeOptions) => {
      if (options.commandMode === BLUE_COMMANDER) {
        this.setCoalition("blue");
      } else if (options.commandMode === RED_COMMANDER) {
        this.setCoalition("red");
      }
      this.#commandMode = options.commandMode;
    });

    let PTTKeys = ["KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM", "Comma", "Dot"];
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
    if (this.#state === AudioManagerState.ERROR) {
      console.error("The audio backend is in error state, cannot start");
      getApp().addInfoMessage("The audio backend is in error state, cannot start");
      return;
    }

    if (this.#state === AudioManagerState.RUNNING) {
      console.error("The audio backend is already running, cannot start again");
    }

    getApp().addInfoMessage("Starting audio backend, please wait");

    this.#syncInterval = window.setInterval(() => {
      this.#syncRadioSettings();
    }, 1000);

    this.#audioContext = new AudioContext({ sampleRate: 16000 });

    /* Connect the audio websocket */
    let res = location.toString().match(/(?:http|https):\/\/(.+):/);
    if (res === null) res = location.toString().match(/(?:http|https):\/\/(.+)/);

    let wsAddress = res ? res[1] : location.toString();
    if (wsAddress.at(wsAddress.length - 1) === "/") wsAddress = wsAddress.substring(0, wsAddress.length - 1);

    if (this.#port === undefined && this.#endpoint === undefined) {
      console.error("The audio backend was enabled but no port/endpoint was provided in the configuration");
      return;
    }

    this.#socket = new WebSocket(`wss://${wsAddress}/${this.#endpoint}`);
    if (!this.#socket) this.#socket = new WebSocket(`ws://${wsAddress}:${this.#port}`);

    if (!this.#socket) {
      console.error("Failed to connect to audio websocket");
      return;
    }

    /* Log the opening of the connection */
    this.#socket.addEventListener("open", (event) => {
      console.log("Connection to audio websocket successfull");
    });

    /* Log any websocket errors */
    this.#socket.addEventListener("error", (event) => {
      console.log("An error occurred while connecting to the audio backend WebSocket");
      getApp().addInfoMessage("An error occurred while connecting to the audio backend WebSocket");
      this.error();
    });

    /* Handle the reception of a new message */
    this.#socket.addEventListener("message", (event) => {
      this.#receivedPackets++;

      /* Extract the clients data */
      event.data.arrayBuffer().then((packetArray) => {
        const packetUint8Array = new Uint8Array(packetArray);
        if (packetUint8Array[0] === MessageType.clientsData) {
          const newSRSClientsData = JSON.parse(new TextDecoder().decode(packetUint8Array.slice(1))).clientsData;

          /* Check if anything has changed with the SRSClients */
          let clientsDataChanged = false;
          /* Check if the length of the clients data has changed */
          if (newSRSClientsData.length !== this.#SRSClientsData.length) {
            clientsDataChanged = true;
          } else {
            newSRSClientsData.forEach((newClientData) => {
              /* Check if the length is the same, but the clients names have changed */
              let clientData = this.#SRSClientsData.find((clientData) => newClientData.name === clientData.name);
              if (clientData === undefined) clientsDataChanged = true;
              else {
                /* Check if any of the data has changed */
                if (
                  clientData.coalition !== newClientData.coalition ||
                  clientData.unitID !== newClientData.unitID ||
                  Object.keys(clientData.iff).find((key) => clientData.iff[key] !== newClientData.iff[key]) !== undefined ||
                  clientData.radios.find(
                    (radio, idx) => radio.frequency !== newClientData.radios[idx].frequency || radio.modulation !== newClientData.radios[idx].modulation
                  ) !== undefined
                )
                  clientsDataChanged = true;
              }
            });
          }

          /* If the clients data has changed, dispatch the event */
          if (clientsDataChanged) {
            this.#SRSClientsData = newSRSClientsData;
            SRSClientsChangedEvent.dispatch(this.#SRSClientsData);
          }

          /* Update the number of connected clients for each radio */
          this.#sinks
            .filter((sink) => sink instanceof RadioSink)
            .forEach((radio) => {
              let connectedClients = 0;
              /* Check if any of the radios of this client is tuned to the same frequency, has the same modulation, and is of the same coalition */
              this.#SRSClientsData.forEach((clientData: SRSClientData) => {
                let clientConnected = false;
                clientData.radios.forEach((radioData) => {
                  if (
                    clientData.coalition === coalitionToEnum(this.#coalition) &&
                    radioData.frequency === radio.getFrequency() &&
                    radioData.modulation === radio.getModulation()
                  )
                    clientConnected = true;
                });
                if (clientConnected) connectedClients++;
              });

              radio.setConnectedClients(connectedClients);
            });
        }
      });

      /* Iterate over the radios. We iterate over the radios first so that a new copy of the audio packet is created for each pipeline */
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

                sink.setTransmittingUnit(getApp().getUnitsManager().getUnitByID(audioPacket.getUnitID()) ?? undefined);

                /* Make a copy of the array buffer for the playback pipeline to use */
                var dst = new ArrayBuffer(audioPacket.getAudioData().buffer.byteLength);
                new Uint8Array(dst).set(new Uint8Array(audioPacket.getAudioData().buffer));
                sink.recordArrayBuffer(audioPacket.getAudioData().buffer);
                sink.playBuffer(dst);
              }
            });
          }
        }
      });
    });

    navigator.mediaDevices.enumerateDevices().then((devices) => {
      this.#devices = devices;
      AudioManagerDevicesChangedEvent.dispatch(devices);

      if (this.#options.input) {
        let newInput = this.#devices.find((device) => device.deviceId === this.#options.input);
        if (newInput) {
          this.#input = newInput;
          AudioManagerInputChangedEvent.dispatch(newInput);
        }
      }

      if (this.#options.output) {
        let newOutput = this.#devices.find((device) => device.deviceId === this.#options.output);
        if (newOutput) {
          this.#output = newOutput;
          AudioManagerOutputChangedEvent.dispatch(newOutput);
        }
      }

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
            newRadio?.setPan(options.pan);
          });
        } else {
          /* Add two default radios and connect to the microphone*/
          let newRadio = this.addRadio();
          newRadio.setPan(-1);

          newRadio = this.addRadio();
          newRadio.setPan(1);
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
            if (connection[0] < this.#sources.length && connection[1] < this.#sinks.length) this.#sources[connection[0]]?.connect(this.#sinks[connection[1]]);
          });
        }

        if (this.#state !== AudioManagerState.ERROR) {
          this.#state = AudioManagerState.RUNNING;
          AudioManagerStateChangedEvent.dispatch(this.#state);
        }
      });

      //@ts-ignore
      if (this.#output) this.#audioContext.setSinkId(this.#output.deviceId);
    });

    const textToSpeechSource = new TextToSpeechSource();
    this.#sources.push(textToSpeechSource);

    this.#internalTextToSpeechSource = new TextToSpeechSource();

    /* Check if the audio backend is receiving updates from the backend every 10 seconds */
    this.#connectionCheckTimeout = window.setTimeout(() => {
      if (this.#receivedPackets === 0) {
        console.error("The audio backend is not receiving any data from the backend, stopping the audio backend");
        getApp().addInfoMessage("The audio backend is not receiving any data from the backend, stopping the audio backend");
        this.error();
      }
    }, 10000);
  }

  stop() {
    /* Stop everything and send update event */
    this.#sources.forEach((source) => source.disconnect());
    this.#sinks.forEach((sink) => sink.disconnect());
    this.#sources = [];
    this.#sinks = [];
    this.#socket?.close();

    window.clearInterval(this.#connectionCheckTimeout);

    window.clearInterval(this.#syncInterval);

    AudioSourcesChangedEvent.dispatch(this.#sources);
    AudioSinksChangedEvent.dispatch(this.#sinks);

    if (this.#state !== AudioManagerState.ERROR) {
      this.#state = AudioManagerState.STOPPED;
      AudioManagerStateChangedEvent.dispatch(this.#state);
    }
  }

  error() {
    this.stop();

    this.#state = AudioManagerState.ERROR;
    AudioManagerStateChangedEvent.dispatch(this.#state);
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
    this.#sinks.push(newRadio);
    /* Set radio name by default to be incremental number */
    newRadio.setName(`Radio ${this.#sinks.length}`);

    this.#sources.find((source) => source instanceof MicrophoneSource)?.connect(newRadio);
    this.#sources.find((source) => source instanceof TextToSpeechSource)?.connect(newRadio);

    AudioSinksChangedEvent.dispatch(this.#sinks);
    return newRadio;
  }

  tuneNewRadio(frequency, modulation) {
    /* Check if a radio with the same frequency and modulation already exists */
    let radio = this.#sinks.find((sink) => sink instanceof RadioSink && sink.getFrequency() === frequency && sink.getModulation() === modulation);
    if (radio === undefined) {
      let newRadio = this.addRadio();
      newRadio.setFrequency(frequency);
      newRadio.setModulation(modulation);
    }
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

  getSRSClientsData() {
    return this.#SRSClientsData;
  }

  isRunning() {
    return this.#state;
  }

  setInput(input: MediaDeviceInfo) {
    if (this.#devices.includes(input)) {
      this.#input = input;
      AudioManagerInputChangedEvent.dispatch(input);
      let sessionData = deepCopyTable(getApp().getSessionDataManager().getSessionData());
      this.stop();
      getApp().getSessionDataManager().setSessionData(sessionData);
      this.start();
      this.#options.input = input.deviceId;
      AudioOptionsChangedEvent.dispatch(this.#options);
    } else {
      console.error("Requested input device is not in devices list");
    }
  }

  setOutput(output: MediaDeviceInfo) {
    if (this.#devices.includes(output)) {
      this.#input = output;
      AudioManagerOutputChangedEvent.dispatch(output);
      let sessionData = deepCopyTable(getApp().getSessionDataManager().getSessionData());
      this.stop();
      getApp().getSessionDataManager().setSessionData(sessionData);
      this.start();
      
      this.#options.output = output.deviceId;
      AudioOptionsChangedEvent.dispatch(this.#options);
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

  setCoalition(coalition: Coalition) {
    if (this.#commandMode === GAME_MASTER) {
      this.#coalition = coalition;
      AudioManagerCoalitionChangedEvent.dispatch(coalition);
    }
  }

  getCoalition() {
    return this.#coalition;
  }

  setOptions(options: AudioOptions) {
    this.#options = options;
  }

  getOptions() {
    return this.#options;
  }

  #syncRadioSettings() {
    /* Send the radio settings of each radio to the SRS backend */
    let message = {
      type: "Settings update",
      guid: this.#guid,
      coalition: coalitionToEnum(this.#coalition),
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
