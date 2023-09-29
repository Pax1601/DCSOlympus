import { Map } from "./map/map";
import { MissionManager } from "./mission/missionmanager";
import { ConnectionStatusPanel } from "./panels/connectionstatuspanel";
import { HotgroupPanel } from "./panels/hotgrouppanel";
import { LogPanel } from "./panels/logpanel";
import { MouseInfoPanel } from "./panels/mouseinfopanel";
import { ServerStatusPanel } from "./panels/serverstatuspanel";
import { UnitControlPanel } from "./panels/unitcontrolpanel";
import { UnitInfoPanel } from "./panels/unitinfopanel";
import { PluginsManager } from "./plugin/pluginmanager";
import { Popup } from "./popups/popup";
import { ShortcutManager } from "./shortcut/shortcutmanager";
import { CommandModeToolbar } from "./toolbars/commandmodetoolbar";
import { PrimaryToolbar } from "./toolbars/primarytoolbar";
import { UnitsManager } from "./unit/unitsmanager";
import { WeaponsManager } from "./weapon/weaponsmanager";
import { Manager } from "./other/manager";
import { ShortcutKeyboard } from "./shortcut/shortcut";
import { SVGInjector } from "@tanem/svg-injector";
import { ServerManager } from "./server/servermanager";

import { BLUE_COMMANDER, GAME_MASTER, RED_COMMANDER } from "./constants/constants";
import { aircraftDatabase } from "./unit/databases/aircraftdatabase";
import { helicopterDatabase } from "./unit/databases/helicopterdatabase";
import { groundUnitDatabase } from "./unit/databases/groundunitdatabase";
import { navyUnitDatabase } from "./unit/databases/navyunitdatabase";
import { ConfigurationOptions } from "./interfaces";

export class OlympusApp {
    /* Global data */
    #activeCoalition: string = "blue";

    /* Main leaflet map, extended by custom methods */
    #map: Map | null = null;

    /* Managers */
    #serverManager: ServerManager | null = null;
    #unitsManager: UnitsManager | null = null;
    #weaponsManager: WeaponsManager | null = null;
    #missionManager: MissionManager | null = null;
    #pluginsManager: PluginsManager | null = null;
    #panelsManager: Manager | null = null;
    #popupsManager: Manager | null = null;
    #toolbarsManager: Manager | null = null;
    #shortcutManager: ShortcutManager | null = null;

    constructor() {

    }

    // TODO add checks on null
    getMap() {
        return this.#map as Map;
    }

    getServerManager() {
        return this.#serverManager as ServerManager;
    }

    getPanelsManager() {
        return this.#panelsManager as Manager;
    }

    getPopupsManager() {
        return this.#popupsManager as Manager;
    }

    getToolbarsManager() {
        return this.#toolbarsManager as Manager;
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

    getPluginsManager() {
        return this.#pluginsManager as PluginsManager;
    }

    /** Set the active coalition, i.e. the currently controlled coalition. A game master can change the active coalition, while a commander is bound to his/her coalition 
     * 
     * @param newActiveCoalition 
     */
    setActiveCoalition(newActiveCoalition: string) {
        if (this.getMissionManager().getCommandModeOptions().commandMode == GAME_MASTER)
            this.#activeCoalition = newActiveCoalition;
    }

    /**
     * 
     * @returns The active coalition
     */
    getActiveCoalition() {
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

    /** Set a message in the login splash screen
     * 
     * @param status The message to show in the login splash screen
     */
    setLoginStatus(status: string) {
        const el = document.querySelector("#login-status") as HTMLElement;
        if (el)
            el.dataset["status"] = status;
    }

    start() {
        /* Initialize base functionalitites */
        this.#map = new Map('map-container');

        this.#serverManager = new ServerManager();
        this.#unitsManager = new UnitsManager();
        this.#weaponsManager = new WeaponsManager();
        this.#missionManager = new MissionManager();

        this.#shortcutManager = new ShortcutManager();

        this.#panelsManager = new Manager();
        this.#popupsManager = new Manager();
        this.#toolbarsManager = new Manager();

        // Panels
        this.getPanelsManager()
            .add("connectionStatus", new ConnectionStatusPanel("connection-status-panel"))
            .add("hotgroup", new HotgroupPanel("hotgroup-panel"))
            .add("mouseInfo", new MouseInfoPanel("mouse-info-panel"))
            .add("log", new LogPanel("log-panel"))
            .add("serverStatus", new ServerStatusPanel("server-status-panel"))
            .add("unitControl", new UnitControlPanel("unit-control-panel"))
            .add("unitInfo", new UnitInfoPanel("unit-info-panel"))

        // Popups
        this.getPopupsManager().add("infoPopup", new Popup("info-popup"));

        // Toolbars
        this.getToolbarsManager().add("primaryToolbar", new PrimaryToolbar("primary-toolbar"))
            .add("commandModeToolbar", new CommandModeToolbar("command-mode-toolbar"));

        this.#pluginsManager = new PluginsManager();

        /* Load the config file from the app server*/
        this.getServerManager().getConfig((config: ConfigurationOptions) => {
            if (config && config.address != undefined && config.port != undefined) {
                const address = config.address;
                const port = config.port;
                if (typeof address === 'string' && typeof port == 'number') { 
                    this.getServerManager().setAddress(address == "*" ? window.location.hostname : address, port);                    
                }
            }
            else {
                throw new Error('Could not read configuration file');
            }
        });

        /* Setup all global events */
        this.#setupEvents();
    }

    #setupEvents() {
        /* Generic clicks */
        document.addEventListener("click", (ev) => {
            if (ev instanceof MouseEvent && ev.target instanceof HTMLElement) {
                const target = ev.target;

                if (target.classList.contains("olympus-dialog-close")) {
                    target.closest("div.olympus-dialog")?.classList.add("hide");
                }

                const triggerElement = target.closest("[data-on-click]");

                if (triggerElement instanceof HTMLElement) {
                    const eventName: string = triggerElement.dataset.onClick || "";
                    let params = JSON.parse(triggerElement.dataset.onClickParams || "{}");
                    params._element = triggerElement;

                    if (eventName) {
                        document.dispatchEvent(new CustomEvent(eventName, {
                            detail: params
                        }));
                    }
                }
            }
        });

        const shortcutManager = this.getShortcutManager();
        shortcutManager.addKeyboardShortcut("toggleDemo", {
            "callback": () => {
                this.getServerManager().toggleDemoEnabled();
            },
            "code": "KeyT"
        }).addKeyboardShortcut("togglePause", {
            "altKey": false,
            "callback": () => {
                this.getServerManager().setPaused(!this.getServerManager().getPaused());
            },
            "code": "Space",
            "ctrlKey": false
        });

        ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].forEach(code => {
            shortcutManager.addKeyboardShortcut(`pan${code}keydown`, {
                "altKey": false,
                "callback": (ev: KeyboardEvent) => {
                    this.getMap().handleMapPanning(ev);
                },
                "code": code,
                "ctrlKey": false,
                "event": "keydown"
            });
        });

        ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].forEach(code => {
            shortcutManager.addKeyboardShortcut(`pan${code}keyup`, {
                "callback": (ev: KeyboardEvent) => {
                    this.getMap().handleMapPanning(ev);
                },
                "code": code
            });
        });

        ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9"].forEach(code => {
            shortcutManager.addKeyboardShortcut(`hotgroup${code}`, {
                "callback": (ev: KeyboardEvent) => {
                    if (ev.ctrlKey && ev.shiftKey)
                        this.getUnitsManager().selectedUnitsAddToHotgroup(parseInt(ev.code.substring(5)));
                    else if (ev.ctrlKey && !ev.shiftKey)
                        this.getUnitsManager().selectedUnitsSetHotgroup(parseInt(ev.code.substring(5)));
                    else
                        this.getUnitsManager().selectUnitsByHotgroup(parseInt(ev.code.substring(5)));
                },
                "code": code
            });
        });

        // TODO: move from here in dedicated class
        document.addEventListener("closeDialog", (ev: CustomEventInit) => {
            ev.detail._element.closest(".ol-dialog").classList.add("hide");
        });

        /* Try and connect with the Olympus REST server */
        document.addEventListener("tryConnection", () => {
            const form = document.querySelector("#splash-content")?.querySelector("#authentication-form");
            const username = (form?.querySelector("#username") as HTMLInputElement).value;
            const password = (form?.querySelector("#password") as HTMLInputElement).value;

            /* Update the user credentials */
            this.getServerManager().setCredentials(username, password);

            /* Start periodically requesting updates */
            this.getServerManager().startUpdate();

            this.setLoginStatus("connecting");
        })

        /* Reload the page, used to mimic a restart of the app */
        document.addEventListener("reloadPage", () => {
            location.reload();
        })

        /* Inject the svgs with the corresponding svg code. This allows to dynamically manipulate the svg, like changing colors */
        document.querySelectorAll("[inject-svg]").forEach((el: Element) => {
            var img = el as HTMLImageElement;
            var isLoaded = img.complete;
            if (isLoaded)
                SVGInjector(img);
            else
                img.addEventListener("load", () => { SVGInjector(img); });
        })
    }
}