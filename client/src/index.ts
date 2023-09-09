import { Map } from "./map/map"
import { UnitsManager } from "./unit/unitsmanager";
import { UnitInfoPanel } from "./panels/unitinfopanel";
import { ConnectionStatusPanel } from "./panels/connectionstatuspanel";
import { MissionManager } from "./mission/missionhandler";
import { UnitControlPanel } from "./panels/unitcontrolpanel";
import { MouseInfoPanel } from "./panels/mouseinfopanel";
import { LogPanel } from "./panels/logpanel";
import { getConfig, getPaused, setAddress, setCredentials, setPaused, startUpdate, toggleDemoEnabled } from "./server/server";
import { keyEventWasInInput } from "./other/utils";
import { Popup } from "./popups/popup";
import { HotgroupPanel } from "./panels/hotgrouppanel";
import { SVGInjector } from "@tanem/svg-injector";
import { BLUE_COMMANDER, GAME_MASTER, RED_COMMANDER } from "./constants/constants";
import { ServerStatusPanel } from "./panels/serverstatuspanel";
import { WeaponsManager } from "./weapon/weaponsmanager";
import { ConfigParameters } from "./@types/dom";
import { CommandModeToolbar } from "./toolbars/commandmodetoolbar";
import { PrimaryToolbar } from "./toolbars/primarytoolbar";

/* Global data */
var activeCoalition: string = "blue";

/* Main leaflet map, extended by custom methods */
var map: Map;

/* Managers */
var unitsManager: UnitsManager;
var weaponsManager: WeaponsManager;
var missionHandler: MissionManager;

/* UI Panels */
var unitInfoPanel: UnitInfoPanel;
var connectionStatusPanel: ConnectionStatusPanel;
var serverStatusPanel: ServerStatusPanel;
var unitControlPanel: UnitControlPanel;
var mouseInfoPanel: MouseInfoPanel;
var logPanel: LogPanel;
var hotgroupPanel: HotgroupPanel;

/* UI Toolbars */
var primaryToolbar: PrimaryToolbar;
var commandModeToolbar: CommandModeToolbar;

/* Popups */
var infoPopup: Popup;

function setup() {

    /* Initialize base functionalitites */
    map = new Map('map-container');

    unitsManager = new UnitsManager();
    weaponsManager = new WeaponsManager();
    missionHandler = new MissionManager();

    /* Panels */
    unitInfoPanel = new UnitInfoPanel("unit-info-panel");
    unitControlPanel = new UnitControlPanel("unit-control-panel");
    connectionStatusPanel = new ConnectionStatusPanel("connection-status-panel");
    serverStatusPanel = new ServerStatusPanel("server-status-panel");
    mouseInfoPanel = new MouseInfoPanel("mouse-info-panel");
    hotgroupPanel = new HotgroupPanel("hotgroup-panel");
    logPanel = new LogPanel("log-panel");
    
    /* Toolbars */
    primaryToolbar = new PrimaryToolbar("primary-toolbar");
    commandModeToolbar = new CommandModeToolbar("command-mode-toolbar");

    /* Popups */
    infoPopup = new Popup("info-popup");

    /* Setup event handlers */
    setupEvents();

    /* Load the config file from the app server*/
    getConfig((config: ConfigParameters) => readConfig(config));
}

/** Loads the configuration parameters
 * 
 * @param config ConfigParameters, defines the address and port of the Olympus REST server
 */
function readConfig(config: ConfigParameters) {
    if (config && config.address != undefined && config.port != undefined) {
        const address = config.address;
        const port = config.port;
        if (typeof address === 'string' && typeof port == 'number')
            setAddress(address == "*" ? window.location.hostname : address, <number>port);
    }
    else {
        throw new Error('Could not read configuration file');
    }
}


/** Setup the global window events
 * 
 */
function setupEvents() {
    /* Generic clicks. The "data-on-click" html parameter is used to call a generic callback from the html code. 
    It is used by all the statically defined elements of the UI. Dynamically generated elements should directly generate the events instead.
    */
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

    /* Keyup events */
    document.addEventListener("keyup", ev => {
        if (keyEventWasInInput(ev)) {
            return;
        }
        switch (ev.code) {
            case "KeyT":
                toggleDemoEnabled();
                break;
            case "Space":
                setPaused(!getPaused());
                break;
            case "KeyW": case "KeyA": case "KeyS": case "KeyD":
            case "ArrowLeft":  case "ArrowRight": case "ArrowUp": case "ArrowDown":
                getMap().handleMapPanning(ev);
                break;
            case "Digit1": case "Digit2": case "Digit3": case "Digit4": case "Digit5": case "Digit6": case "Digit7": case "Digit8": case "Digit9":     
                /* Using the substring because the key will be invalid when pressing the Shift key */
                if (ev.ctrlKey && ev.shiftKey)
                    getUnitsManager().selectedUnitsAddToHotgroup(parseInt(ev.code.substring(5)));
                else if (ev.ctrlKey && !ev.shiftKey)
                    getUnitsManager().selectedUnitsSetHotgroup(parseInt(ev.code.substring(5)));
                else
                    getUnitsManager().selectUnitsByHotgroup(parseInt(ev.code.substring(5)));
                break;
        }
    });

    /* Keydown events */
    document.addEventListener("keydown", ev => {
        if (keyEventWasInInput(ev)) {
            return;
        }
        switch (ev.code) {
            case "KeyW": case "KeyA": case "KeyS": case "KeyD": case "ArrowLeft": case "ArrowRight": case "ArrowUp": case "ArrowDown":
                getMap().handleMapPanning(ev);
                break;
        }
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
        setCredentials(username, password);

        /* Start periodically requesting updates */
        startUpdate();

        setLoginStatus("connecting");
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
            img.addEventListener("load", () => {
                SVGInjector(img);
            });
    })
}

/* Getters */
export function getMap() {
    return map;
}

export function getUnitsManager() {
    return unitsManager;
}

export function getWeaponsManager() {
    return weaponsManager;
}

export function getMissionHandler() {
    return missionHandler;
}

export function getUnitInfoPanel() {
    return unitInfoPanel;
}

export function getUnitControlPanel() {
    return unitControlPanel;
}

export function getMouseInfoPanel() {
    return mouseInfoPanel;
}

export function getLogPanel() {
    return logPanel;
}

export function getConnectionStatusPanel() {
    return connectionStatusPanel;
}

export function getServerStatusPanel() {
    return serverStatusPanel;
}

export function getHotgroupPanel() {
    return hotgroupPanel;
}

export function getInfoPopup() {
    return infoPopup;
}

/** Set the active coalition, i.e. the currently controlled coalition. A game master can change the active coalition, while a commander is bound to his/her coalition 
 * 
 * @param newActiveCoalition 
 */
export function setActiveCoalition(newActiveCoalition: string) {
    if (getMissionHandler().getCommandModeOptions().commandMode == GAME_MASTER)
        activeCoalition = newActiveCoalition;
}

/**
 * 
 * @returns The active coalition
 */
export function getActiveCoalition() {
    if (getMissionHandler().getCommandModeOptions().commandMode == GAME_MASTER)
        return activeCoalition;
    else {
        if (getMissionHandler().getCommandModeOptions().commandMode == BLUE_COMMANDER)
            return "blue";
        else if (getMissionHandler().getCommandModeOptions().commandMode == RED_COMMANDER)
            return "red";
        else
            return "neutral";
    }
}

/** Set a message in the login splash screen
 * 
 * @param status The message to show in the login splash screen
 */
export function setLoginStatus(status: string) {
    const el = document.querySelector("#login-status") as HTMLElement;
    if (el)
        el.dataset["status"] = status;
}

window.onload = setup;

