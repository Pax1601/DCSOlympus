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
      console.log("New WebSocket connection established, creating SRS handler.");
      this.handlers.push(new SRSHandler(ws, this.SRSPort));

      ws.on("close", () => {
        console.log("WebSocket connection closed, removing SRS handler.");
        this.handlers = this.handlers.filter((handler) => handler.ws !== ws);
      });

      ws.on("error", (error) => {
        console.error("WebSocket error: ", error);
      });
    });
  }
}
