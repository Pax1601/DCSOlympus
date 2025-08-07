import { MessageType } from "./audiopacket";
import { defaultSRSData } from "./defaultdata";
import { AudioPacket } from "./audiopacket";

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
      let CLIENT_DISCONNECT = {
        Client: this.data,
        MsgType: 5,
        Version: SRS_VERSION,
      };
      this.tcp.write(`${JSON.stringify(CLIENT_DISCONNECT)}\n`);
      this.tcp.end();
    });

    /* TCP */
    this.tcp.on("error", (ex) => {
      console.log("Could not connect to SRS Server");
    });

    this.tcp.connect(SRSPort, "127.0.0.1", () => {
      console.log(`Connected to SRS Server on TCP Port ${SRSPort}`);

      this.syncInterval = setInterval(() => {
        let SYNC = {
          Client: this.data,
          MsgType: 2,
          Version: SRS_VERSION,
        };

        this.data.ClientGuid !== "" &&
          this.udp.send(this.data.ClientGuid, SRSPort, "127.0.0.1", (error) => {
            if (error) console.log(`Error pinging SRS server on UDP: ${error}`);
          });

        if (this.tcp.readyState == "open") this.tcp.write(`${JSON.stringify(SYNC)}\n`);
        else clearInterval(this.syncInterval);

        let unitsBuffer = Buffer.from(
          JSON.stringify({
            clientsData: this.clients.map((client) => {
              return {
                name: client.Name,
                unitID: client.RadioInfo.unitId,
                iff: client.RadioInfo.iff,
                coalition: client.Coalition,
                radios: client.RadioInfo.radios.map((radio) => {
                  return {
                    frequency: radio.freq,
                    modulation: radio.modulation,
                    
                  };
                }),
              };
            }),
          }),
          "utf-8"
        );

        this.ws.send(([] as number[]).concat([MessageType.clientsData], [...unitsBuffer]));
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
      if (this.ws && message.length > 22) this.ws.send(([] as number[]).concat([MessageType.audio], [...message]));
    });
  }

  decodeData(data) {
    switch (data[0]) {
      case MessageType.audio:
        const encodedData = new Uint8Array(data.slice(1));

        // Decoded the data for sanity check
        if (encodedData.length < 22) {
          console.log("Received audio data is too short, ignoring.");
          return;
        }

        let packet = new AudioPacket();
        packet.fromByteArray(encodedData);

        this.udp.send(encodedData, this.SRSPort, "127.0.0.1", (error) => {
          if (error) console.log(`Error sending data to SRS server: ${error}`);
        });
        break;
      case MessageType.settings:
        let message = JSON.parse(data.slice(1));
        this.data.ClientGuid = message.guid;
        this.data.Coalition = message.coalition;

        /* First reset all the radios to default values */
        this.data.RadioInfo.radios.forEach((radio) => {
          radio.freq = defaultSRSData.RadioInfo.radios[0].freq;
          radio.modulation = defaultSRSData.RadioInfo.radios[0].modulation;
        });

        /* Then update the radios with the new settings */
        message.settings.forEach((setting, idx) => {
          this.data.RadioInfo.radios[idx].freq = setting.frequency;
          this.data.RadioInfo.radios[idx].modulation = setting.modulation;
        });

        let RADIO_UPDATE = {
          Client: this.data,
          MsgType: 3,
          Version: SRS_VERSION,
        };
        this.tcp.write(`${JSON.stringify(RADIO_UPDATE)}\n`);
        break;
      default:
        break;
    }
  }
}
