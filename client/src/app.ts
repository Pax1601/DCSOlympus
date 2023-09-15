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

import { BLUE_COMMANDER, GAME_MASTER, RED_COMMANDER } from "./constants/constants";
import { Manager } from "./other/manager";

export class OlympusApp {
    /* Global data */
    #activeCoalition: string = "blue";

    /* Main leaflet map, extended by custom methods */
    #map: Map | null = null;

    /* Managers */
    #unitsManager: UnitsManager | null = null;
    #weaponsManager: WeaponsManager | null = null;
    #missionManager: MissionManager | null = null;
    #pluginsManager: PluginsManager | null = null;
    #panelsManager: Manager | null = null;
    #popupsManager: Manager | null = null;
    #toolbarsManager: Manager | null = null;
    #shortcutManager: ShortcutManager | null = null;

    /* UI Toolbars */
    #primaryToolbar: PrimaryToolbar| null = null;
    #commandModeToolbar: CommandModeToolbar| null = null;

    constructor() {
        
    }

    getMap() {
        return this.#map as Map;
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
            .add("unitControl",  new UnitControlPanel("unit-control-panel"))
            .add("unitInfo", new UnitInfoPanel("unit-info-panel"))
        
        // Popups
        this.getPopupsManager().add("infoPopup", new Popup("info-popup"));

        // Toolbars
        this.getToolbarsManager().add("primaryToolbar", new PrimaryToolbar("primary-toolbar"))
        .add("commandModeToolbar", new PrimaryToolbar("command-mode-toolbar"));

        this.#pluginsManager = new PluginsManager();
    }
}