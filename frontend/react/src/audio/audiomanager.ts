import { AudioRadioSetting } from "../interfaces";
import { getApp } from "../olympusapp";
import { Buffer } from "buffer";
import { MicrophoneHandler } from "./microphonehandler";

enum MessageType {
  audio,
  settings,
}

export class AudioManager {
  #radioSettings: AudioRadioSetting[] = [
    {
      frequency: 124000000,
      modulation: 0,
      ptt: false,
      tuned: false,
      volume: 0.5,
    },
  ];

  #microphoneHandlers: (MicrophoneHandler | null)[] =[];

  #address: string = "localhost";
  #port: number = 4000;
  #socket: WebSocket | null = null;

  constructor() {
    document.addEventListener("configLoaded", () => {
      let config = getApp().getConfig();
      if (config["WSPort"]) {
        this.setPort(config["WSPort"]);
        this.start();
      }
    });

    this.#microphoneHandlers = this.#radioSettings.map(() => null);
  }

  start() {
    let res = this.#address.match(/(?:http|https):\/\/(.+):/);
    let wsAddress = res ? res[1] : this.#address;

    this.#socket = new WebSocket(`ws://${wsAddress}:${this.#port}`);

    this.#socket.addEventListener("open", (event) => {
      console.log("Connection to audio websocket successfull");
    });

    this.#socket.addEventListener("error", (event) => {
      console.log(event);
    });

    this.#socket.addEventListener("message", (event) => {
      console.log("Message from server ", event.data);
    });
  }

  setAddress(address) {
    this.#address = address;
  }

  setPort(port) {
    this.#port = port;
  }

  getRadioSettings() {
    return JSON.parse(JSON.stringify(this.#radioSettings));
  }

  setRadioSettings(radioSettings: AudioRadioSetting[]) {
    this.#radioSettings = radioSettings;

    let message = {
      type: "Settings update",
      settings: this.#radioSettings,
    };

    this.#radioSettings.forEach((setting, idx) => {
      if (setting.ptt && !this.#microphoneHandlers[idx]) {
        this.#microphoneHandlers[idx] = new MicrophoneHandler(this.#socket, setting);
      }
    })

    if (this.#socket?.readyState == 1)
      this.#socket?.send(new Uint8Array([MessageType.settings, ...Buffer.from(JSON.stringify(message), "utf-8")]));
  }
}
