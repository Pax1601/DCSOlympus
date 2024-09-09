import { MessageType } from "./audiopacket";
import { defaultSRSData } from "./defaultdata";

/* TCP/IP socket */
var net = require("net");
var bufferString = "";

const SRS_VERSION = "2.1.0.10";
var globalIndex = 1;

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

        let unitsBuffer = Buffer.from(
          JSON.stringify({
            unitIDs: this.clients.map((client) => {
              return client.RadioInfo.unitId;
            }),
          }),
          "utf-8"
        );

        this.ws.send(
          ([] as number[]).concat([MessageType.unitIDs], [...unitsBuffer])
        );
      }, 1000);
    });

    this.tcp.on("data", (data) => {
      bufferString += data.toString();
      while (bufferString.includes("\n")) {
        try {
          let message = JSON.parse(bufferString.split("\n")[0]);
          bufferString = bufferString.slice(bufferString.indexOf("\n") + 1);
          if (message.Clients !== undefined) this.clients = message.Clients;
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
      if (this.ws && message.length > 22)
        this.ws.send(
          ([] as number[]).concat([MessageType.audio], [...message])
        );
    });
  }

  decodeData(data) {
    switch (data[0]) {
      case MessageType.audio:
        const encodedData = new Uint8Array(data.slice(1));
        this.udp.send(encodedData, this.SRSPort, "localhost", (error) => {
          if (error) console.log(`Error sending data to SRS server: ${error}`);
        });
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
