import { SRSRadioSetting } from "../interfaces";
import { AudioPacket } from "./audiopacket";
import { CapturePipeline } from "./capturepipeline";

export class MicrophoneHandler {
  #socket: WebSocket;
  #setting: SRSRadioSetting;

  constructor(socket, setting) {
    this.#socket = socket;
    this.#setting = setting;

    console.log("Starting microphone handler");

    const pipeline = new CapturePipeline();

    navigator.mediaDevices.enumerateDevices()
    .then(function(devices) {
      devices.forEach(function(device) {
        console.log(device.kind + ": " + device.label +
                " id = " + device.deviceId);
      });
    })

    pipeline.connect().then(() => {
      pipeline.onencoded = (data) => {
        let buffer = new ArrayBuffer(data.byteLength);
        data.copyTo(buffer);
        let packet = new AudioPacket(new Uint8Array(buffer), this.#setting);
        this.#socket.send(packet.getArray());
      }
    })
  }
}
