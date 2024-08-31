import { AudioRadioSetting } from "../interfaces";
import { AudioPacket } from "./audiopacket";

export class MicrophoneHandler {
  #socket: WebSocket;
  #setting: AudioRadioSetting;

  constructor(socket, setting) {
    this.#socket = socket;
    this.#setting = setting;

    console.log("Starting microphone handler");

    //@ts-ignore
    let getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

    if (getUserMedia) {
      //@ts-ignore
      navigator.getUserMedia(
        { audio: {
          sampleRate: 16000,
          channelCount: 1,
          volume: 1.0
        } },
        (stream) => {
          this.start_microphone(stream);
        },
         (e) => {
          alert("Error capturing audio.");
        }
      );
    } else {
      alert("getUserMedia not supported in this browser.");
    }
  }

  start_microphone(stream) {
    const recorder = new MediaRecorder(stream);

    // fires every one second and passes an BlobEvent
    recorder.ondataavailable = async (event) => {
      // get the Blob from the event
      const blob = event.data;

      let rawData = await blob.arrayBuffer();
      let packet = new AudioPacket(new Uint8Array(rawData), this.#setting);
      this.#socket.send(packet.getArray());
    };

    recorder.start(200);
  }
}
