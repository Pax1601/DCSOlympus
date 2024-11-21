/***************** APP *******************/
var app: OlympusApp;

export function setupApp() {
  if (app === undefined) {
    app = new OlympusApp();
    app.start();
  }
}

export function getApp() {
  return app;
}

import { Map } from "./map/map";
import { MissionManager } from "./mission/missionmanager";
import { ShortcutManager } from "./shortcut/shortcutmanager";
import { UnitsManager } from "./unit/unitsmanager";
import { WeaponsManager } from "./weapon/weaponsmanager";
import { ServerManager } from "./server/servermanager";
import { AudioManager } from "./audio/audiomanager";

import { NO_SUBSTATE, OlympusState, OlympusSubState } from "./constants/constants";
import { AppStateChangedEvent, ConfigLoadedEvent, InfoPopupEvent, MapOptionsChangedEvent, SelectedUnitsChangedEvent, ShortcutsChangedEvent } from "./events";
import { OlympusConfig, ProfileOptions } from "./interfaces";

export var VERSION = "{{OLYMPUS_VERSION_NUMBER}}";
export var IP = window.location.toString();

export class OlympusApp {
  /* Global data */
  #latestVersion: string | undefined = undefined;
  #config: OlympusConfig | null = null;
  #state: OlympusState = OlympusState.NOT_INITIALIZED;
  #subState: OlympusSubState = NO_SUBSTATE;
  #infoMessages: string[] = [];
  #profileName: string | null = null;

  /* Main leaflet map, extended by custom methods */
  #map: Map | null = null;

  /* Managers */
  #missionManager: MissionManager | null = null;
  #serverManager: ServerManager | null = null;
  #shortcutManager: ShortcutManager | null = null;
  #unitsManager: UnitsManager | null = null;
  #weaponsManager: WeaponsManager | null = null;
  #audioManager: AudioManager | null = null;
  //#pluginsManager: // TODO

  constructor() {
    SelectedUnitsChangedEvent.on((selectedUnits) => {
      if (selectedUnits.length > 0) this.setState(OlympusState.UNIT_CONTROL);
      else this.getState() === OlympusState.UNIT_CONTROL && this.setState(OlympusState.IDLE);
    });

    MapOptionsChangedEvent.on((options) => getApp().saveProfile());
    ShortcutsChangedEvent.on((options) => getApp().saveProfile());
  }

  getMap() {
    return this.#map as Map;
  }

  getServerManager() {
    return this.#serverManager as ServerManager;
  }

  getShortcutManager() {
    return this.#shortcutManager as ShortcutManager;
  }

  getUnitsManager() {
    return this.#unitsManager as UnitsManager;
  }

  getWeaponsManager() {
    return this.#weaponsManager as WeaponsManager;
  }

  getMissionManager() {
    return this.#missionManager as MissionManager;
  }

  getAudioManager() {
    return this.#audioManager as AudioManager;
  }

  /* TODO
    getPluginsManager() {
        return null //  this.#pluginsManager as PluginsManager;
    }
    */

  getExpressAddress() {
    return `${window.location.href.split("?")[0].replace("vite/", "").replace("vite", "")}express`;
  }

  getBackendAddress() {
    return `${window.location.href.split("?")[0].replace("vite/", "").replace("vite", "")}olympus`;
  }

  start() {
    /* Initialize base functionalitites */
    this.#shortcutManager = new ShortcutManager(); /* Keep first */

    this.#map = new Map("map-container");

    this.#missionManager = new MissionManager();
    this.#serverManager = new ServerManager();
    this.#unitsManager = new UnitsManager();
    this.#weaponsManager = new WeaponsManager();
    this.#audioManager = new AudioManager();

    /* Set the address of the server */
    this.getServerManager().setAddress(this.getBackendAddress());
    this.getAudioManager().setAddress(this.getExpressAddress());

    /* Check if we are running the latest version */
    const request = new Request("https://raw.githubusercontent.com/Pax1601/DCSOlympus/main/version.json");
    fetch(request)
      .then((response) => {
        if (response.status === 200) {
          return response.json();
        } else {
          throw new Error("Error connecting to Github to retrieve latest version");
        }
      })
      .then((res) => {
        this.#latestVersion = res["version"];
        const latestVersionSpan = document.getElementById("latest-version") as HTMLElement;
        if (latestVersionSpan) {
          latestVersionSpan.innerHTML = this.#latestVersion ?? "Unknown";
          latestVersionSpan.classList.toggle("new-version", this.#latestVersion !== VERSION);
        }
      });

    /* Load the config file from the server */
    const configRequest = new Request(this.getExpressAddress() + "/resources/config");
    fetch(configRequest)
      .then((response) => {
        if (response.status === 200) {
          return response.json();
        } else {
          throw new Error("Error retrieving config file");
        }
      })
      .then((res) => {
        this.#config = res;
        ConfigLoadedEvent.dispatch(this.#config as OlympusConfig);
        this.setState(OlympusState.LOGIN);
      });

    this.#shortcutManager?.addShortcut("idle", {
      label: "Deselect all",
      keyUpCallback: (ev: KeyboardEvent) => {
        this.setState(OlympusState.IDLE);
      },
      code: "Escape",
    });

    this.#shortcutManager.checkShortcuts();
  }

  getConfig() {
    return this.#config;
  }

  setProfile(profileName: string) {
    this.#profileName = profileName;
  }

  saveProfile() {
    if (this.#profileName !== null) {
      let profile = {};
      profile["mapOptions"] = this.#map?.getOptions();
      profile["shortcuts"] = this.#shortcutManager?.getShortcutsOptions();

      const requestOptions = {
        method: "PUT", // Specify the request method
        headers: { "Content-Type": "application/json" }, // Specify the content type
        body: JSON.stringify(profile), // Send the data in JSON format
      };

      fetch(this.getExpressAddress() + `/resources/profile/${this.#profileName}`, requestOptions)
        .then((response) => {
          if (response.status === 200) {
            console.log(`Profile ${this.#profileName} saved correctly`);
          } else {
            this.addInfoMessage("Error saving profile");
            throw new Error("Error saving profile");
          }
        }) // Parse the response as JSON
        .catch((error) => console.error(error)); // Handle errors
    }
  }

  resetProfile() {
    if (this.#profileName !== null) {
      const requestOptions = {
        method: "PUT", // Specify the request method
        headers: { "Content-Type": "application/json" }, // Specify the content type
        body: "", // Send the data in JSON format
      };

      fetch(this.getExpressAddress() + `/resources/profile/reset/${this.#profileName}`, requestOptions)
        .then((response) => {
          if (response.status === 200) {
            console.log(`Profile ${this.#profileName} reset correctly`);
            location.reload()
          } else {
            this.addInfoMessage("Error resetting profile");
            throw new Error("Error resetting profile");
          }
        }) // Parse the response as JSON
        .catch((error) => console.error(error)); // Handle errors
    }
  }

  resetAllProfiles() {
    const requestOptions = {
      method: "PUT", // Specify the request method
      headers: { "Content-Type": "application/json" }, // Specify the content type
      body: "", // Send the data in JSON format
    };

    fetch(this.getExpressAddress() + `/resources/profile/resetall`, requestOptions)
      .then((response) => {
        if (response.status === 200) {
          console.log(`All profiles reset correctly`);
          location.reload()
        } else {
          this.addInfoMessage("Error resetting profiles");
          throw new Error("Error resetting profiles");
        }
      }) // Parse the response as JSON
      .catch((error) => console.error(error)); // Handle errors
  }

  getProfile() {
    if (this.#profileName && this.#config?.profiles && this.#config?.profiles[this.#profileName])
      return this.#config?.profiles[this.#profileName] as ProfileOptions;
    else return null;
  }

  loadProfile() {
    const profile = this.getProfile();
    if (profile) {
      this.#map?.setOptions(profile.mapOptions);
      this.#shortcutManager?.setShortcutsOptions(profile.shortcuts);
      this.addInfoMessage("Profile loaded correctly");
      console.log(`Profile ${this.#profileName} loaded correctly`);
    } else {
      this.addInfoMessage("Profile not found, creating new profile");
      console.log(`Error loading profile`);
    }
  }

  setState(state: OlympusState, subState: OlympusSubState = NO_SUBSTATE) {
    this.#state = state;
    this.#subState = subState;

    console.log(`App state set to ${state}, substate ${subState}`);
    AppStateChangedEvent.dispatch(state, subState);
  }

  getState() {
    return this.#state;
  }

  getSubState() {
    return this.#subState;
  }

  addInfoMessage(message: string) {
    this.#infoMessages.push(message);
    InfoPopupEvent.dispatch(this.#infoMessages);
    setTimeout(() => {
      this.#infoMessages.shift();
      InfoPopupEvent.dispatch(this.#infoMessages);
    }, 5000);
  }
}
