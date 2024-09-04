import { defaultSRSData } from "./defaultdata";
const { OpusEncoder } = require("@discordjs/opus");
const encoder = new OpusEncoder(16000, 1);

var net = require("net");
var bufferString = "";

const SRS_VERSION = "2.1.0.10";

var globalIndex = 1;

enum MessageType {
  audio,
  settings,
}

function fromBytes(array) {
  let res = 0;
  for (let i = 0; i < array.length; i++) {
    res = res << 8;
    res += array[array.length - i - 1];
  }
  return res;
}

function getBytes(value, length) {
  let res: number[] = [];
  for (let i = 0; i < length; i++) {
    res.push(value & 255);
    value = value >> 8;
  }
  return res;
}

export class SRSHandler {
  ws: any;
  tcp = new net.Socket();
  udp = require("dgram").createSocket("udp4");
  data = JSON.parse(JSON.stringify(defaultSRSData));
  syncInterval: any;
  clients = [];
  SRSPort = 0;

  constructor(ws, SRSPort) {
    this.data.Name = `Olympus${globalIndex}`;
    this.SRSPort = SRSPort;
    globalIndex += 1;

    /* Websocket */
    this.ws = ws;
    this.ws.on("error", console.error);
    this.ws.on("message", (data) => {
      this.decodeData(data);
    });
    this.ws.on("close", () => {
      this.tcp.end();
    });

    /* TCP */
    this.tcp.on("error", (ex) => {
      console.log("Could not connect to SRS Server");
    });

    this.tcp.connect(SRSPort, "localhost", () => {
      console.log(`Connected to SRS Server on TCP Port ${SRSPort}`);

      this.syncInterval = setInterval(() => {
        let SYNC = {
          Client: this.data,
          MsgType: 2,
          Version: SRS_VERSION,
        };

        this.data.ClientGuid !== "" &&
          this.udp.send(this.data.ClientGuid, SRSPort, "localhost", (error) => {
            if (error) console.log(`Error pinging SRS server on UDP: ${error}`);
          });

        if (this.tcp.readyState == "open")
          this.tcp.write(`${JSON.stringify(SYNC)}\n`);
        else clearInterval(this.syncInterval);
      }, 1000);
    });

    this.tcp.on("data", (data) => {
      bufferString += data.toString();
      while (bufferString.includes("\n")) {
        try {
          let message = JSON.parse(bufferString.split("\n")[0]);
          bufferString = bufferString.slice(bufferString.indexOf("\n") + 1);
          if (message.Clients !== undefined)
            this.clients = message.Clients;
        } catch (e) {
          console.log(e);
        }
      }
    });

    /* UDP */
    this.udp.on("listening", () => {
      console.log(`Listening to SRS Server on UDP port ${SRSPort}`);
    });

    this.udp.on("message", (message, remote) => {
      if (this.ws && message.length > 22) this.ws.send(message);
    });
  }

  decodeData(data){
    switch (data[0]) {
      case MessageType.audio:
        let packetUint8Array = new Uint8Array(data.slice(1));

        let audioLength = fromBytes(packetUint8Array.slice(2, 4));
        let frequenciesLength = fromBytes(packetUint8Array.slice(4, 6));
        let modulation = fromBytes(packetUint8Array.slice(6 + audioLength + 8, 6 + audioLength + 8 + 1));
        let offset = 6 + audioLength + frequenciesLength;
        
        if (modulation == 255) {
          packetUint8Array[6 + audioLength + 8] = 2;
          this.clients.forEach((client) => {
            getBytes(client.RadioInfo.unitId, 4).forEach((value, idx) => {
              packetUint8Array[offset + idx] = value;
            });

            var dst = new ArrayBuffer(packetUint8Array.byteLength);
            let newBuffer = new Uint8Array(dst);
            newBuffer.set(new Uint8Array(packetUint8Array));
            this.udp.send(newBuffer, this.SRSPort, "localhost", (error) => {
              if (error)
                console.log(`Error sending data to SRS server: ${error}`);
            })
          })
        } else {
          this.udp.send(packetUint8Array, this.SRSPort, "localhost", (error) => {
            if (error)
              console.log(`Error sending data to SRS server: ${error}`);
          });
        }

        
        break;
      case MessageType.settings:
        let message = JSON.parse(data.slice(1));
        this.data.ClientGuid = message.guid;
        this.data.Coalition = message.coalition;
        message.settings.forEach((setting, idx) => {
          this.data.RadioInfo.radios[idx].freq = setting.frequency;
          this.data.RadioInfo.radios[idx].modulation = setting.modulation;
        });
        break;
      default:
        break;
    }
  }
}
