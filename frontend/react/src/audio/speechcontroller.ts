import { getApp } from "../olympusapp";
import { blobToBase64 } from "../other/utils";
import { RadioSink } from "./radiosink";

export class SpeechController {
  #playingText: boolean = false;
  constructor() {}

  analyzeData(blob: Blob, radio: RadioSink) {
    blobToBase64(blob)
      .then((base64) => {
        const requestOptions = {
          method: "PUT", // Specify the request method
          headers: { "Content-Type": "application/json" }, // Specify the content type
          body: JSON.stringify({ data: base64 }), // Send the data in blob format
        };

        fetch(`./api/speech/recognize`, requestOptions)
          .then((response) => {
            if (response.status === 200) {
              console.log(`Speech recognized correctly`);
              return response.text();
            } else {
              getApp().addInfoMessage("Error recognizing speech");
              throw new Error("Error saving profile");
            }
          })
          .then((text) => this.#executeCommand(text.toLowerCase(), radio))
          .catch((error) => console.error(error)); // Handle errors
      })
      .catch((error) => console.error(error));
  }

  playText(text, radio: RadioSink) {
    if (this.#playingText) return;
    this.#playingText = true;
    const textToSpeechSource = getApp().getAudioManager().getInternalTextToSpeechSource();
    textToSpeechSource.connect(radio);
    textToSpeechSource.playText(text);
    radio.setPtt(true);
    textToSpeechSource.onMessageCompleted = () => {
      this.#playingText = false;
      radio.setPtt(false);
      textToSpeechSource.disconnect(radio);
    };
    window.setTimeout(() => {
      this.#playingText = false;
    }, 30000); // Reset to false as failsafe
  }

  #executeCommand(text, radio) {
    console.log(`Received speech command: ${text}`);

    if (text.indexOf("olympus") === 0) {
      this.#olympusCommand(text, radio);
    } else if (text.indexOf(getApp().getAWACSController()?.getCallsign().toLowerCase()) === 0) {
      getApp().getAWACSController()?.executeCommand(text, radio);
    }
  }

  #olympusCommand(text, radio) {
    if (text.indexOf("request straight") > 0 || text.indexOf("request straightin") > 0) {
      this.playText("Confirm you are on step 13, being a pussy?", radio);
    } else if (text.indexOf("bolter") > 0) {
      this.playText("What an idiot, I never boltered, 100% boarding rate", radio);
    } else if (text.indexOf("read back") > 0) {
      this.playText(text.replace("olympus", ""), radio);
    }
  }
}
