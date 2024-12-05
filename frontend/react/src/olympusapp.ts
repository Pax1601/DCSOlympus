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

import { LoginSubState, NO_SUBSTATE, OlympusState, OlympusSubState } from "./constants/constants";
import { AppStateChangedEvent, ConfigLoadedEvent, InfoPopupEvent, MapOptionsChangedEvent, SelectedUnitsChangedEvent, ShortcutsChangedEvent } from "./events";
import { OlympusConfig, ProfileOptions } from "./interfaces";
import { AWACSController } from "./controllers/awacs";
import { SessionDataManager } from "./sessiondata";

export var VERSION = "{{OLYMPUS_VERSION_NUMBER}}";
export var IP = window.location.toString();

export class OlympusApp {
  /* Global data */
  #latestVersion: string | undefined = undefined;
  #config: OlympusConfig;
  #state: OlympusState = OlympusState.NOT_INITIALIZED;
  #subState: OlympusSubState = NO_SUBSTATE;
  #infoMessages: string[] = [];

  /* Main leaflet map, extended by custom methods */
  #map: Map;

  /* Managers */
  #missionManager: MissionManager;
  #serverManager: ServerManager;
  #shortcutManager: ShortcutManager;
  #unitsManager: UnitsManager;
  #weaponsManager: WeaponsManager;
  #audioManager: AudioManager;
  #sessionDataManager: SessionDataManager;
  //#pluginsManager: // TODO

  /* Controllers */
  #AWACSController: AWACSController;

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
    return this.#serverManager;
  }

  getShortcutManager() {
    return this.#shortcutManager;
  }

  getUnitsManager() {
    return this.#unitsManager;
  }

  getWeaponsManager() {
    return this.#weaponsManager;
  }

  getMissionManager() {
    return this.#missionManager;
  }

  getAudioManager() {
    return this.#audioManager;
  }

  getSessionDataManager() {
    return this.#sessionDataManager;
  }

  /* TODO
    getPluginsManager() {
        return null //  this.#pluginsManager as PluginsManager;
    }
    */

  getAWACSController() {
    return this.#AWACSController;
  }

  getExpressAddress() {
    return `${window.location.href.split("?")[0].replace("vite/", "").replace("vite", "")}express`;
  }

  getBackendAddress() {
    return `${window.location.href.split("?")[0].replace("vite/", "").replace("vite", "")}olympus`;
  }

  start() {
    /* Initialize base functionalitites */
    this.#shortcutManager = new ShortcutManager(); /* Keep first */
    this.#sessionDataManager = new SessionDataManager();

    this.#map = new Map("map-container");

    this.#missionManager = new MissionManager();
    this.#serverManager = new ServerManager();
    this.#unitsManager = new UnitsManager();
    this.#weaponsManager = new WeaponsManager();
    this.#audioManager = new AudioManager();

    /* Controllers */
    this.#AWACSController = new AWACSController();

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
    const configRequest = new Request(this.getExpressAddress() + "/resources/config", {
      headers: {
        'Cache-Control': 'no-cache',
      }
    });

    fetch(configRequest)
      .then((response) => {
        if (response.status === 200)
          return new Promise((res: ([OlympusConfig, Headers]) => void, rej) => {
            response
              .json()
              .then((result) => res([result, response.headers]))
              .catch((error) => rej(error));
          });
        else throw new Error("Error retrieving config file");
      })
      .then(([result, headers]) => {
        this.#config = result;
        if (this.#config.frontend.customAuthHeaders.enabled) {
          if (headers.has(this.#config.frontend.customAuthHeaders.username) && headers.has(this.#config.frontend.customAuthHeaders.group)) {
            this.getServerManager().setUsername(headers.get(this.#config.frontend.customAuthHeaders.username));
            this.setState(OlympusState.LOGIN, LoginSubState.COMMAND_MODE);
          }
        }
        if (this.getState() !== OlympusState.LOGIN) {
          this.setState(OlympusState.LOGIN, LoginSubState.CREDENTIALS);
        }
        ConfigLoadedEvent.dispatch(this.#config as OlympusConfig);
      })
      .catch((error) => console.error);

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

  saveProfile() {
    const username = this.getServerManager()?.getUsername();
    if (username) {
      let profile = {};
      profile["mapOptions"] = this.#map?.getOptions();
      profile["shortcuts"] = this.#shortcutManager?.getShortcutsOptions();

      const requestOptions = {
        method: "PUT", // Specify the request method
        headers: { "Content-Type": "application/json" }, // Specify the content type
        body: JSON.stringify(profile), // Send the data in JSON format
      };

      fetch(this.getExpressAddress() + `/resources/profile/${username}`, requestOptions)
        .then((response) => {
          if (response.status === 200) {
            console.log(`Profile for ${username} saved correctly`);
          } else {
            this.addInfoMessage("Error saving profile");
            throw new Error("Error saving profile");
          }
        }) // Parse the response as JSON
        .catch((error) => console.error(error)); // Handle errors
    }
  }

  resetProfile() {
    const username = this.getServerManager().getUsername();
    if (username) {
      const requestOptions = {
        method: "PUT", // Specify the request method
        headers: { "Content-Type": "application/json" }, // Specify the content type
        body: "", // Send the data in JSON format
      };

      fetch(this.getExpressAddress() + `/resources/profile/reset/${username}`, requestOptions)
        .then((response) => {
          if (response.status === 200) {
            console.log(`Profile for ${username} reset correctly`);
            location.reload();
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

    fetch(this.getExpressAddress() + `/resources/profile/delete/all`, requestOptions)
      .then((response) => {
        if (response.status === 200) {
          console.log(`All profiles reset correctly`);
          location.reload();
        } else {
          this.addInfoMessage("Error resetting profiles");
          throw new Error("Error resetting profiles");
        }
      }) // Parse the response as JSON
      .catch((error) => console.error(error)); // Handle errors
  }

  getProfile() {
    const username = this.getServerManager().getUsername();
    if (username && this.#config?.profiles && username in this.#config.profiles) return this.#config?.profiles[username];
    else return null;
  }

  loadProfile() {
    const username = this.getServerManager().getUsername();
    const profile = this.getProfile();
    if (username && profile) {
      this.#map?.setOptions(profile.mapOptions);
      this.#shortcutManager?.setShortcutsOptions(profile.shortcuts);
      this.addInfoMessage("Profile loaded correctly");
      console.log(`Profile for ${username} loaded correctly`);
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
