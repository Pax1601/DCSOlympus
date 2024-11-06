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
import { AppStateChangedEvent, ConfigLoadedEvent, SelectedUnitsChangedEvent } from "./events";
import { OlympusConfig } from "./interfaces";

export var VERSION = "{{OLYMPUS_VERSION_NUMBER}}";
export var IP = window.location.toString();
export var connectedToServer = true; // TODO Temporary

export class OlympusApp {
  /* Global data */
  #latestVersion: string | undefined = undefined;
  #config: OlympusConfig | null = null;
  #state: OlympusState = OlympusState.NOT_INITIALIZED;
  #subState: OlympusSubState = NO_SUBSTATE;

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
      else this.getState() === OlympusState.UNIT_CONTROL && this.setState(OlympusState.IDLE)
    });
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

  start() {
    /* Initialize base functionalitites */
    this.#map = new Map("map-container");

    this.#missionManager = new MissionManager();
    this.#serverManager = new ServerManager();
    this.#shortcutManager = new ShortcutManager();
    this.#unitsManager = new UnitsManager();
    this.#weaponsManager = new WeaponsManager();
    this.#audioManager = new AudioManager();

    /* Set the address of the server */
    this.getServerManager().setAddress(window.location.href.split("?")[0].replace("vite/", ""));
    this.getAudioManager().setAddress(window.location.href.split("?")[0].replace("vite/", ""));

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
    const configRequest = new Request(window.location.href.split("?")[0].replace("vite/", "") + "resources/config");
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
  }

  getConfig() {
    return this.#config;
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
}
