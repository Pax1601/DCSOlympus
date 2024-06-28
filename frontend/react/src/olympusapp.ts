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

import { BLUE_COMMANDER, DEFAULT_CONTEXT, GAME_MASTER, RED_COMMANDER } from "./constants/constants";
import { aircraftDatabase } from "./unit/databases/aircraftdatabase";
import { helicopterDatabase } from "./unit/databases/helicopterdatabase";
import { groundUnitDatabase } from "./unit/databases/groundunitdatabase";
import { navyUnitDatabase } from "./unit/databases/navyunitdatabase";
import { Coalition, Context } from "./types/types";

export var VERSION = "{{OLYMPUS_VERSION_NUMBER}}";
export var IP = window.location.toString();
export var connectedToServer = true;    // Temporary

export class OlympusApp {
    /* Global data */
    #activeCoalition: Coalition = "blue";
    #latestVersion: string|undefined = undefined;
    #config: any = {};

    /* Main leaflet map, extended by custom methods */
    #map: Map | null = null;

    /* Managers */
    #missionManager: MissionManager | null = null;
    #serverManager: ServerManager | null = null;
    #shortcutManager: ShortcutManager | null = null;
    #unitsManager: UnitsManager | null = null;
    #weaponsManager: WeaponsManager | null = null;
    //#pluginsManager: // TODO

    /* Current context */
    #context: Context = DEFAULT_CONTEXT;

    constructor() {
    }

    getCurrentContext() {
        return this.#context;
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

    /* TODO
    getPluginsManager() {
        return null //  this.#pluginsManager as PluginsManager;
    }
    */

    /** Set the active coalition, i.e. the currently controlled coalition. A game master can change the active coalition, while a commander is bound to his/her coalition 
     * 
     * @param newActiveCoalition 
     */
    setActiveCoalition(newActiveCoalition: Coalition) {
        if (this.getMissionManager().getCommandModeOptions().commandMode == GAME_MASTER) {
            this.#activeCoalition = newActiveCoalition;
            document.dispatchEvent(new CustomEvent("activeCoalitionChanged"));
        }
    }

    /**
     * 
     * @returns The active coalition
     */
    getActiveCoalition(): Coalition {
        if (this.getMissionManager().getCommandModeOptions().commandMode == GAME_MASTER)
            return this.#activeCoalition;
        else {
            if (this.getMissionManager().getCommandModeOptions().commandMode == BLUE_COMMANDER)
                return "blue";
            else if (this.getMissionManager().getCommandModeOptions().commandMode == RED_COMMANDER)
                return "red";
            else
                return "neutral";
        }
    }

    /**
     * 
     * @returns The aircraft database
     */
    getAircraftDatabase() {
        return aircraftDatabase;
    }

    /**
     * 
     * @returns The helicopter database
     */
    getHelicopterDatabase() {
        return helicopterDatabase;
    }

    /**
     * 
     * @returns The ground unit database
     */
    getGroundUnitDatabase() {
        return groundUnitDatabase;
    }

    /**
     * 
     * @returns The navy unit database
     */
    getNavyUnitDatabase() {
        return navyUnitDatabase;
    }

    start() {
        /* Initialize base functionalitites */
        this.#map = new Map('map-container');

        this.#missionManager = new MissionManager();
        this.#serverManager = new ServerManager();
        this.#shortcutManager = new ShortcutManager();
        this.#unitsManager = new UnitsManager();
        this.#weaponsManager = new WeaponsManager();

        /* Set the address of the server */
        // Temporary forcing port 3000 for development
        this.getServerManager().setAddress(window.location.href.split('?')[0].replace('8080', '3000'));

        /* Setup all global events */
        this.#setupEvents();

        /* Check if we are running the latest version */
        const request = new Request("https://raw.githubusercontent.com/Pax1601/DCSOlympus/main/version.json");
        fetch(request).then((response) => {
            if (response.status === 200) {
                return response.json();
            } else {
                throw new Error("Error connecting to Github to retrieve latest version");
            }
        }).then((res) => {
            this.#latestVersion = res["version"];
            const latestVersionSpan = document.getElementById("latest-version") as HTMLElement;
            if (latestVersionSpan) {
                latestVersionSpan.innerHTML = this.#latestVersion ?? "Unknown";
                latestVersionSpan.classList.toggle("new-version", this.#latestVersion !== VERSION);
            }
        })

        /* Load the config file from the server */
        // Temporary forcing port 3000 for development
        const configRequest = new Request(window.location.href.split('?')[0].replace('8080', '3000') + "resources/config");
        fetch(configRequest).then((response) => {
            if (response.status === 200) {
                return response.json();
            } else {
                throw new Error("Error retrieving config file");
            }
        }).then((res) => {
            this.#config = res;
            document.dispatchEvent(new CustomEvent("configLoaded"));
        })
    }

    getConfig() {
        return this.#config;
    }

    #setupEvents() {
        /* Reload the page, used to mimic a restart of the app */
        document.addEventListener("reloadPage", () => {
            location.reload();
        })
    }
}