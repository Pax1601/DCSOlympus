import { getApp } from "../olympusapp";
import { blobToBase64 } from "../other/utils";

export class SpeechController {
  constructor() {}

  analyzeData(blob: Blob) {
    blobToBase64(blob)
      .then((base64) => {
        const requestOptions = {
          method: "PUT", // Specify the request method
          headers: { "Content-Type": "application/json" }, // Specify the content type
          body: JSON.stringify({data: base64}), // Send the data in blob format
        };

        fetch(getApp().getExpressAddress() + `/api/speech/recognize`, requestOptions)
          .then((response) => {
            if (response.status === 200) {
              console.log(`Speech recognized correctly`);
              return response.text();
            } else {
              getApp().addInfoMessage("Error recognizing speech");
              throw new Error("Error saving profile");
            }
          })
          .then((text) => this.#executeCommand(text))
          .catch((error) => console.error(error)); // Handle errors
      })
      .catch((error) => console.error(error));
  }

  #executeCommand(text) {
    console.log(`Received speech command: ${text}`);

    if (text.indexOf("olympus") === 0 ) {
      this.#olympusCommand(text);
    } else if (text.indexOf(getApp().getAWACSController()?.getCallsign().toLowerCase()) === 0) {
      getApp().getAWACSController()?.executeCommand(text);
    }
  }

  #olympusCommand(text) {

  }
}
