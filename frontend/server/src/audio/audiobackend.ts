import { WebSocketServer } from "ws";
import { SRSHandler } from "./srshandler";

export class AudioBackend {
  SRSPort: number = 5002;
  WSPort: number = 4000;
  handlers: SRSHandler[] = [];

  constructor(SRSPort, WSPort) {
    this.SRSPort = SRSPort ?? this.SRSPort;
    this.WSPort = WSPort ?? this.WSPort;
  }

  start() {
    const wss = new WebSocketServer({ port: this.WSPort });

    wss.on("connection", (ws) => {
      this.handlers.push(new SRSHandler(ws, this.SRSPort));
    });
  }
}
