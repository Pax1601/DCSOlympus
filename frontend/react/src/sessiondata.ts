import { FileSource } from "./audio/filesource";
import { RadioSink } from "./audio/radiosink";
import { UnitSink } from "./audio/unitsink";
import { AudioSinksChangedEvent, AudioSourcesChangedEvent, SessionDataLoadedEvent as SessionDataChangedEvent } from "./events";
import { SessionData } from "./interfaces";
import { getApp } from "./olympusapp";

export class SessionDataManager {
  #sessionData: SessionData = {};
  #sessionHash: string = "";
  #saveSessionDataTimeout: number | null = null;

  constructor() {
    AudioSinksChangedEvent.on((audioSinks) => {
      if (getApp().getAudioManager().isRunning()) {
        this.#sessionData.radios = audioSinks
          .filter((sink) => sink instanceof RadioSink)
          .map((radioSink) => {
            return {
              frequency: radioSink.getFrequency(),
              modulation: radioSink.getModulation(),
            };
          });

        this.#sessionData.unitSinks = audioSinks
          .filter((sink) => sink instanceof UnitSink)
          .map((unitSink) => {
            return {
              ID: unitSink.getUnit().ID
            };
          });

        this.#saveSessionData();
      }
    });

    AudioSourcesChangedEvent.on((audioSources) => {
      if (getApp().getAudioManager().isRunning()) {
        this.#sessionData.fileSources = audioSources
          .filter((sink) => sink instanceof FileSource)
          .map((fileSource) => {
            return { filename: fileSource.getFilename(), volume: fileSource.getVolume() };
          });
        this.#saveSessionData();
      }
    });
  }

  loadSessionData(sessionHash?: string) {
    if (sessionHash) this.#sessionHash = sessionHash;
    if (this.#sessionHash === undefined) {
      console.error("Trying to load session data but no session hash provided");
      return;
    }

    const requestOptions = {
      method: "PUT", // Specify the request method
      headers: { "Content-Type": "application/json" }, // Specify the content type
      body: JSON.stringify({ sessionHash }), // Send the data in JSON format
    };

    fetch(getApp().getExpressAddress() + `/resources/sessiondata/load/${getApp().getProfileName()}`, requestOptions)
      .then((response) => {
        if (response.status === 200) {
          console.log(`Session data for profile ${getApp().getProfileName()} and session hash ${sessionHash} loaded correctly`);
          return response.json();
        } else {
          getApp().addInfoMessage("No session data found for this profile");
          throw new Error("No session data found for this profile");
        }
      }) // Parse the response as JSON
      .then((sessionData) => {
        this.#sessionData = sessionData;
        this.#applySessionData();
        SessionDataChangedEvent.dispatch(this.#sessionData);
      })
      .catch((error) => console.error(error)); // Handle errors
  }

  getSessionData() {
    return this.#sessionData;
  }

  #saveSessionData() {
    if (this.#saveSessionDataTimeout) window.clearTimeout(this.#saveSessionDataTimeout);
    this.#saveSessionDataTimeout = window.setTimeout(() => {
      const requestOptions = {
        method: "PUT", // Specify the request method
        headers: { "Content-Type": "application/json" }, // Specify the content type
        body: JSON.stringify({ sessionHash: this.#sessionHash, sessionData: this.#sessionData }), // Send the data in JSON format
      };

      fetch(getApp().getExpressAddress() + `/resources/sessiondata/save/${getApp().getProfileName()}`, requestOptions)
        .then((response) => {
          if (response.status === 200) {
            console.log(`Session data for profile ${getApp().getProfileName()} and session hash ${this.#sessionHash} saved correctly`);
            console.log(this.#sessionData);
            SessionDataChangedEvent.dispatch(this.#sessionData);
          } else {
            getApp().addInfoMessage("Error loading session data");
            throw new Error("Error loading session data");
          }
        }) // Parse the response as JSON
        .catch((error) => console.error(error)); // Handle errors
      this.#saveSessionDataTimeout = null;
    }, 1000);
  }

  #applySessionData() {
    let asd = 1;
  }
}
