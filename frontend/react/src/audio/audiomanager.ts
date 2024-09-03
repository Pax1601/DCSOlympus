import { AudioMessageType } from "../constants/constants";
import { MicrophoneSource } from "./microphonesource";
import { SRSRadio } from "./srsradio";
import { getApp } from "../olympusapp";
import { fromBytes, makeID } from "../other/utils";
import { AudioFileSource } from "./audiofilesource";
import { AudioSource } from "./audiosource";
import { Buffer } from "buffer";
import { PlaybackPipeline } from "./playbackpipeline";

export class AudioManager {
  #audioContext: AudioContext;

  /* The playback pipeline enables audio playback on the speakers/headphones */
  #playbackPipeline: PlaybackPipeline;

  /* The SRS radio audio sinks used to transmit the audio stream to the SRS backend */
  #radios: SRSRadio[] = [];

  /* List of all possible audio sources (microphone, file stream etc...) */
  #sources: AudioSource[] = [];

  #address: string = "localhost";
  #port: number = 4000;
  #socket: WebSocket | null = null;
  #guid: string = makeID(22);

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
      this.#radios.forEach(async (radio) => {
        /* Extract the audio data as array */
        let packetUint8Array = new Uint8Array(await event.data.arrayBuffer());

        /* Extract the encoded audio data */
        let audioLength = fromBytes(packetUint8Array.slice(2, 4));
        let audioUint8Array = packetUint8Array.slice(6, 6 + audioLength);

        /* Extract the frequency value and play it on the speakers if we are listening to it*/
        let frequency = new DataView(packetUint8Array.slice(6 + audioLength, 6 + audioLength + 8).reverse().buffer).getFloat64(0);
        if (radio.getSetting().frequency === frequency) {
          this.#playbackPipeline.play(audioUint8Array.buffer);
        }
      });
    });

    /* Add two default radios */
    this.#radios = [new SRSRadio(), new SRSRadio()];
    document.dispatchEvent(new CustomEvent("radiosUpdated"));

    /* Add the microphone source and connect it directly to the radio */
    const microphoneSource = new MicrophoneSource();
    microphoneSource.initialize().then(() => {
      this.#radios.forEach((radio) => {
        microphoneSource.getNode().connect(radio.getNode());
      });
      this.#sources.push(microphoneSource);
      document.dispatchEvent(new CustomEvent("audioSourcesUpdated"));
    });
  }

  stop() {
    this.#sources.forEach((source) => {
      source.getNode().disconnect();
    });
    this.#sources = [];

    this.#radios = [];
  }

  setAddress(address) {
    this.#address = address;
  }

  setPort(port) {
    this.#port = port;
  }

  addFileSource(file) {
    const newSource = new AudioFileSource(file);
    this.#sources.push(newSource);
    newSource.getNode().connect(this.#radios[0].getNode());
    document.dispatchEvent(new CustomEvent("audioSourcesUpdated"));
  }

  getRadios() {
    return this.#radios;
  }

  addRadio() {
    const newRadio = new SRSRadio();
    this.#sources[0].getNode().connect(newRadio.getNode());
    this.#radios.push(newRadio);
    document.dispatchEvent(new CustomEvent("radiosUpdated"));
  }

  removeRadio(idx) {
    this.#radios[idx].getNode().disconnect();
    this.#radios.splice(idx, 1);
    document.dispatchEvent(new CustomEvent("radiosUpdated"));
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

  #syncRadioSettings() {
    let message = {
      type: "Settings update",
      guid: this.#guid,
      coalition: 2,
      settings: this.#radios.map((radio) => {
        return radio.getSetting();
      }),
    };

    if (this.#socket?.readyState == 1) this.#socket?.send(new Uint8Array([AudioMessageType.settings, ...Buffer.from(JSON.stringify(message), "utf-8")]));
  }
}
