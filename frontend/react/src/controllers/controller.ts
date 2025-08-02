import { RadioSink } from "../audio/radiosink";
import { getApp } from "../olympusapp";
import { blobToBase64 } from "../other/utils";

export abstract class Controller {
  #radio: RadioSink;
  #playingText: boolean = false;

  constructor(radioOptions: { frequency: number; modulation: number }) {
    this.#radio = getApp().getAudioManager().addRadio();
    this.#radio.setFrequency(radioOptions.frequency);
    this.#radio.setModulation(radioOptions.modulation);

    this.#radio.speechDataAvailable = (blob) => this.analyzeData(blob)
  }

  analyzeData(blob: Blob) {
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
          .then((text) => this.parseText(text.toLowerCase()))
          .catch((error) => console.error(error)); // Handle errors
      })
      .catch((error) => console.error(error));
  }

  playText(text) {
    if (this.#playingText) return;
    this.#playingText = true;
    const textToSpeechSource = getApp().getAudioManager().getInternalTextToSpeechSource();
    textToSpeechSource.connect(this.#radio);
    textToSpeechSource.playText(text);
    this.#radio.setPtt(true);
    textToSpeechSource.onMessageCompleted = () => {
      this.#playingText = false;
      this.#radio.setPtt(false);
      textToSpeechSource.disconnect(this.#radio);
    };
    window.setTimeout(() => {
      this.#playingText = false;
    }, 30000); // Reset to false as failsafe
  }

  abstract parseText(text: string): void;
}
