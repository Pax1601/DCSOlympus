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
import { SVGInjector } from "@tanem/svg-injector";
import { ServerManager } from "./server/servermanager";

import { BLUE_COMMANDER, FILL_SELECTED_RING, GAME_MASTER, HIDE_UNITS_SHORT_RANGE_RINGS, RED_COMMANDER, SHOW_UNITS_ACQUISITION_RINGS, SHOW_UNITS_ENGAGEMENT_RINGS, SHOW_UNIT_LABELS } from "./constants/constants";
import { aircraftDatabase } from "./unit/databases/aircraftdatabase";
import { helicopterDatabase } from "./unit/databases/helicopterdatabase";
import { groundUnitDatabase } from "./unit/databases/groundunitdatabase";
import { navyUnitDatabase } from "./unit/databases/navyunitdatabase";
import { ConfigurationOptions } from "./interfaces";
import { UnitListPanel } from "./panels/unitlistpanel";
import { ContextManager } from "./context/contextmanager";
import { Context } from "./context/context";

export class OlympusApp {
    /* Global data */
    #activeCoalition: string = "blue";

    /* Main leaflet map, extended by custom methods */
    #map: Map | null = null;

    /* Managers */
    #contextManager!: ContextManager;
    #dialogManager!: Manager;
    #missionManager: MissionManager | null = null;
    #panelsManager: Manager | null = null;
    #pluginsManager: PluginsManager | null = null;
    #popupsManager: Manager | null = null;
    #serverManager: ServerManager | null = null;
    #shortcutManager!: ShortcutManager;
    #toolbarsManager: Manager | null = null;
    #unitsManager: UnitsManager | null = null;
    #weaponsManager: WeaponsManager | null = null;

    constructor() {

    }

    // TODO add checks on null
    getDialogManager() {
        return this.#dialogManager as Manager;
    }

    getMap() {
        return this.#map as Map;
    }

    getCurrentContext() {
        return this.getContextManager().getCurrentContext() as Context;
    }

    getContextManager() {
        return this.#contextManager as ContextManager;
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
        if (this.getMissionManager().getCommandModeOptions().commandMode == GAME_MASTER) {
            this.#activeCoalition = newActiveCoalition;
            document.dispatchEvent(new CustomEvent("activeCoalitionChanged"));
        }
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

        this.#contextManager = new ContextManager();
        this.#contextManager.add( "olympus", {} );

        this.#map = new Map('map-container');

        this.#missionManager = new MissionManager();
        this.#panelsManager = new Manager();
        this.#popupsManager = new Manager();
        this.#serverManager = new ServerManager();
        this.#shortcutManager = new ShortcutManager();
        this.#toolbarsManager = new Manager();
        this.#unitsManager = new UnitsManager();
        this.#weaponsManager = new WeaponsManager();

        // Panels
        this.getPanelsManager()
            .add("connectionStatus", new ConnectionStatusPanel("connection-status-panel"))
            .add("hotgroup", new HotgroupPanel("hotgroup-panel"))
            .add("mouseInfo", new MouseInfoPanel("mouse-info-panel"))
            .add("log", new LogPanel("log-panel"))
            .add("serverStatus", new ServerStatusPanel("server-status-panel"))
            .add("unitControl", new UnitControlPanel("unit-control-panel"))
            .add("unitInfo", new UnitInfoPanel("unit-info-panel"))
            .add("unitList", new UnitListPanel("unit-list-panel", "unit-list-panel-content"))

        // Popups
        this.getPopupsManager()
            .add("infoPopup", new Popup("info-popup"));

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

        /* Set the splash background image to a random image */
        var splashScreen = document.getElementById("splash-screen");
        if (splashScreen) {
            let i = Math.round(Math.random() * 7 + 1);
            splashScreen.style.backgroundImage = `url('/resources/theme/images/splash/${i}.jpg')`;
        }
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
            "altKey": false,
            "callback": () => {
                this.getServerManager().toggleDemoEnabled();
            },
            "code": "KeyT",
            "context": "olympus",
            "ctrlKey": false,
            "shiftKey": false
        }).addKeyboardShortcut("togglePause", {
            "altKey": false,
            "callback": () => {
                this.getServerManager().setPaused(!this.getServerManager().getPaused());
            },
            "code": "Space",
            "context": "olympus",
            "ctrlKey": false
        }).addKeyboardShortcut("deselectAll", {
            "callback": (ev: KeyboardEvent) => {
                this.getUnitsManager().deselectAllUnits();
            },
            "code": "Escape",
            "context": "olympus"
        }).addKeyboardShortcut("toggleUnitLabels", {
            "altKey": false,
            "callback": () => {
                const chk = document.querySelector(`label[title="${SHOW_UNIT_LABELS}"] input[type="checkbox"]`);
                if (chk instanceof HTMLElement) {
                    chk.click();
                }
            },
            "code": "KeyL",
            "context": "olympus",
            "ctrlKey": false,
            "shiftKey": false
        }).addKeyboardShortcut("toggleAcquisitionRings", {
            "altKey": false,
            "callback": () => {
                const chk = document.querySelector(`label[title="${SHOW_UNITS_ACQUISITION_RINGS}"] input[type="checkbox"]`);
                if (chk instanceof HTMLElement) {
                    chk.click();
                }
            },
            "code": "KeyE",
            "context": "olympus",
            "ctrlKey": false,
            "shiftKey": false
        }).addKeyboardShortcut("toggleEngagementRings", {
            "altKey": false,
            "callback": () => {
                const chk = document.querySelector(`label[title="${SHOW_UNITS_ENGAGEMENT_RINGS}"] input[type="checkbox"]`);
                if (chk instanceof HTMLElement) {
                    chk.click();
                }
            },
            "code": "KeyQ",
            "context": "olympus",
            "ctrlKey": false,
            "shiftKey": false
        }).addKeyboardShortcut("toggleHideShortEngagementRings", {
            "altKey": false,
            "callback": () => {
                const chk = document.querySelector(`label[title="${HIDE_UNITS_SHORT_RANGE_RINGS}"] input[type="checkbox"]`);
                if (chk instanceof HTMLElement) {
                    chk.click();
                }
            },
            "code": "KeyR",
            "context": "olympus",
            "ctrlKey": false,
            "shiftKey": false
        }).addKeyboardShortcut("toggleFillEngagementRings", {
            "altKey": false,
            "callback": () => {
                const chk = document.querySelector(`label[title="${FILL_SELECTED_RING}"] input[type="checkbox"]`);
                if (chk instanceof HTMLElement) {
                    chk.click();
                }
            },
            "code": "KeyF",
            "context": "olympus",
            "ctrlKey": false,
            "shiftKey": false
        });

        ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].forEach(code => {
            shortcutManager.addKeyboardShortcut(`pan${code}keydown`, {
                "altKey": false,
                "callback": (ev: KeyboardEvent) => {
                    this.getMap().handleMapPanning(ev);
                },
                "code": code,
                "context": "olympus",
                "ctrlKey": false,
                "event": "keydown"
            });

            shortcutManager.addKeyboardShortcut(`pan${code}keyup`, {
                "callback": (ev: KeyboardEvent) => {
                    this.getMap().handleMapPanning(ev);
                },
                "code": code,
                "context": "olympus"
            });
        });

        const digits = ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9"];

        digits.forEach(code => {
            shortcutManager.addKeyboardShortcut(`hotgroup${code}`, {
                "altKey": false,
                "callback": (ev: KeyboardEvent) => {
                    if (ev.ctrlKey && ev.shiftKey)
                        this.getUnitsManager().selectUnitsByHotgroup(parseInt(ev.code.substring(5)), false);    //  "Select hotgroup X in addition to any units already selected"
                    else if (ev.ctrlKey && !ev.shiftKey)
                        this.getUnitsManager().selectedUnitsSetHotgroup(parseInt(ev.code.substring(5)));        //  "These selected units are hotgroup X (forget any previous membership)"
                    else if (!ev.ctrlKey && ev.shiftKey)
                        this.getUnitsManager().selectedUnitsAddToHotgroup(parseInt(ev.code.substring(5)));      //  "Add (append) these units to hotgroup X (in addition to any existing members)"
                    else
                        this.getUnitsManager().selectUnitsByHotgroup(parseInt(ev.code.substring(5)));           //  "Select hotgroup X, deselect any units not in it."
                },
                "code": code
            });

            //  Stop hotgroup controls sending the browser to another tab
            document.addEventListener("keydown", (ev: KeyboardEvent) => {
                if (ev.code === code && ev.ctrlKey === true && ev.altKey === false && ev.shiftKey === false) {
                    ev.preventDefault();
                }
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