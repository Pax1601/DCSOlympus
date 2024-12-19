import { LatLng } from "leaflet";
import { AudioSink } from "./audio/audiosink";
import { FileSource } from "./audio/filesource";
import { RadioSink } from "./audio/radiosink";
import { UnitSink } from "./audio/unitsink";
import { OlympusState } from "./constants/constants";
import {
  AudioSinksChangedEvent,
  AudioSourcesChangedEvent,
  CoalitionAreasChangedEvent,
  HotgroupsChangedEvent,
  SessionDataChangedEvent,
  SessionDataLoadedEvent,
  SessionDataSavedEvent,
} from "./events";
import { SessionData } from "./interfaces";
import { CoalitionCircle } from "./map/coalitionarea/coalitioncircle";
import { CoalitionPolygon } from "./map/coalitionarea/coalitionpolygon";
import { getApp } from "./olympusapp";

export class SessionDataManager {
  #sessionData: SessionData = {};
  #sessionHash: string = "";
  #saveSessionDataTimeout: number | null = null;

  constructor() {
    SessionDataLoadedEvent.on(() => {
      /* Wait for all the loading to be completed before enabling session data saving */
      window.setTimeout(() => {
        AudioSinksChangedEvent.on((audioSinks) => {
          if (getApp().getAudioManager().isRunning()) {
            this.#sessionData.radios = audioSinks
              .filter((sink) => sink instanceof RadioSink)
              .map((radioSink) => {
                return {
                  frequency: radioSink.getFrequency(),
                  modulation: radioSink.getModulation(),
                  pan: radioSink.getPan(),
                };
              });

            this.#sessionData.unitSinks = audioSinks
              .filter((sink) => sink instanceof UnitSink)
              .map((unitSink) => {
                return {
                  ID: unitSink.getUnit().ID,
                };
              });

            this.#sessionData.connections = [];
            let counter = 0;
            let sources = getApp().getAudioManager().getSources();
            let sinks = getApp().getAudioManager().getSinks();
            sources.forEach((source, idx) => {
              counter++;
              source.getConnectedTo().forEach((sink) => {
                if (sinks.indexOf(sink as AudioSink) !== undefined) {
                  this.#sessionData.connections?.push([idx, sinks.indexOf(sink as AudioSink)]);
                }
              });
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

            this.#sessionData.connections = [];
            let counter = 0;
            let sources = getApp().getAudioManager().getSources();
            let sinks = getApp().getAudioManager().getSinks();
            sources.forEach((source, idx) => {
              counter++;
              source.getConnectedTo().forEach((sink) => {
                if (sinks.indexOf(sink as AudioSink) !== undefined) {
                  this.#sessionData.connections?.push([idx, sinks.indexOf(sink as AudioSink)]);
                }
              });
            });

            this.#saveSessionData();
          }
        });

        CoalitionAreasChangedEvent.on(() => {
          this.#sessionData.coalitionAreas = [];
          getApp()
            .getCoalitionAreasManager()
            .getAreas()
            .forEach((area) => {
              if (area instanceof CoalitionCircle) {
                this.#sessionData.coalitionAreas?.push({
                  type: "circle",
                  latlng: { lat: area.getLatLng().lat, lng: area.getLatLng().lng },
                  coalition: area.getCoalition(),
                  label: area.getLabelText(),
                  radius: area.getRadius(),
                });
              } else if (area instanceof CoalitionPolygon) {
                this.#sessionData.coalitionAreas?.push({
                  type: "polygon",
                  latlngs: (area.getLatLngs()[0] as LatLng[]).map((latlng) => {
                    return { lat: latlng.lat, lng: latlng.lng };
                  }),
                  coalition: area.getCoalition(),
                  label: area.getLabelText(),
                });
              }
            });

          this.#saveSessionData();
        });

        HotgroupsChangedEvent.on((hotgroups) => {
          this.#sessionData.hotgroups = {};
          Object.keys(hotgroups).forEach((hotgroup) => {
            (this.#sessionData.hotgroups as { [key: string]: number[] })[hotgroup] = hotgroups[hotgroup].map((unit) => unit.ID);
          });
          this.#saveSessionData();
        });
      }, 200);
    });
  }

  loadSessionData(sessionHash?: string) {
    if (getApp().getState() === OlympusState.SERVER) return;

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

    fetch(`./resources/sessiondata/load/${getApp().getServerManager().getUsername()}`, requestOptions)
      .then((response) => {
        if (response.status === 200) {
          console.log(`Session data for profile ${getApp().getServerManager().getUsername()} and session hash ${sessionHash} loaded correctly`);
          return response.json();
        } else {
          getApp().addInfoMessage("No session data found for this profile");
          throw new Error("No session data found for this profile");
        }
      }) // Parse the response as JSON
      .then((sessionData) => {
        this.#sessionData = sessionData;
        console.log(this.#sessionData);
        SessionDataLoadedEvent.dispatch(this.#sessionData);
      })
      .catch((error) => console.error(error)); // Handle errors
  }

  getSessionData() {
    return this.#sessionData;
  }

  #saveSessionData() {
    if (getApp().getState() === OlympusState.SERVER) return;

    SessionDataChangedEvent.dispatch(this.#sessionData);

    if (this.#saveSessionDataTimeout) window.clearTimeout(this.#saveSessionDataTimeout);
    this.#saveSessionDataTimeout = window.setTimeout(() => {
      const requestOptions = {
        method: "PUT", // Specify the request method
        headers: { "Content-Type": "application/json" }, // Specify the content type
        body: JSON.stringify({ sessionHash: this.#sessionHash, sessionData: this.#sessionData }), // Send the data in JSON format
      };

      fetch(`./resources/sessiondata/save/${getApp().getServerManager().getUsername()}`, requestOptions)
        .then((response) => {
          if (response.status === 200) {
            console.log(`Session data for profile ${getApp().getServerManager().getUsername()} and session hash ${this.#sessionHash} saved correctly`);
            console.log(this.#sessionData);
            SessionDataSavedEvent.dispatch(this.#sessionData);
          } else {
            getApp().addInfoMessage("Error loading session data");
            throw new Error("Error loading session data");
          }
        }) // Parse the response as JSON
        .catch((error) => console.error(error)); // Handle errors
      this.#saveSessionDataTimeout = null;
    }, 1000);
  }
}
