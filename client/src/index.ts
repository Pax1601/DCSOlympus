import { Map } from "./map/map"
import { UnitsManager } from "./unit/unitsmanager";
import { UnitInfoPanel } from "./panels/unitinfopanel";
import { ConnectionStatusPanel } from "./panels/connectionstatuspanel";
import { MissionManager } from "./mission/missionmanager";
import { UnitControlPanel } from "./panels/unitcontrolpanel";
import { MouseInfoPanel } from "./panels/mouseinfopanel";
import { LogPanel } from "./panels/logpanel";
import { getConfig, getPaused, setAddress, setCredentials, setPaused, startUpdate, toggleDemoEnabled } from "./server/server";
import { Popup } from "./popups/popup";
import { HotgroupPanel } from "./panels/hotgrouppanel";
import { SVGInjector } from "@tanem/svg-injector";
import { BLUE_COMMANDER, GAME_MASTER, RED_COMMANDER } from "./constants/constants";
import { ServerStatusPanel } from "./panels/serverstatuspanel";
import { WeaponsManager } from "./weapon/weaponsmanager";
import { ConfigParameters } from "./@types/dom";
import { IndexApp } from "./indexapp";
import { FeatureSwitches } from "./features/featureswitches";
import { PrimaryToolbar } from "./toolbars/primarytoolbar";
import { CommandModeToolbar } from "./toolbars/commandmodetoolbar";
import { OlympusApp } from "./olympusapp";
import { ShortcutKeyboard } from "./shortcut/shortcut";

/* Global data */
var activeCoalition: string = "blue";

/* Main leaflet map, extended by custom methods */
var map: Map;

/* Managers */
var unitsManager: UnitsManager;
var weaponsManager: WeaponsManager;
var missionManager: MissionManager;

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
    missionManager = new MissionManager();

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

    /* Load the config file from the app server*/
    getConfig((config: ConfigParameters) => readConfig(config));

    /*
        This is done like this for now as a way to make it work in the new and old world.
        Over time/at some point, we'll need to start migrating the pre-existing code to an "app" format
    */

    const indexApp = new IndexApp({
        "featureSwitches": new FeatureSwitches(),
        "map": map,
        "panels": {
            "connectionStatus": connectionStatusPanel,
            "hotgroup": hotgroupPanel,
            "infoPopup": infoPopup,
            "log": logPanel,
            "mouseInfo": mouseInfoPanel,
            "serverStatus": serverStatusPanel,
            "unitControl": unitControlPanel,
            "unitInfo": unitInfoPanel
        },
        "unitsManager": unitsManager
    });

    /* Setup event handlers */
    setupEvents( indexApp );

    indexApp.start();

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

function setupEvents( indexApp:OlympusApp ) {

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


    const shortcutManager = indexApp.getShortcutManager();

    
    shortcutManager.add( "toggleDemo", new ShortcutKeyboard({
            "callback": () => {
                toggleDemoEnabled();
            },
            "code": "KeyT"
        })
    )
    .add( "togglePause", new ShortcutKeyboard({
            "altKey": false,
            "callback": () => {
                setPaused(!getPaused());
            },
            "code": "Space",
            "ctrlKey": false
        })
    );

    [ "KeyW", "KeyA", "KeyS", "KeyD", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown" ].forEach( code => {
        shortcutManager.add( `pan${code}keydown`, new ShortcutKeyboard({
            "altKey": false,
            "callback": ( ev:KeyboardEvent ) => {
                getMap().handleMapPanning(ev);
            },
            "code": code,
            "ctrlKey": false,
            "event": "keydown"
        }));
    });
    
    [ "KeyW", "KeyA", "KeyS", "KeyD", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown" ].forEach( code => {
        shortcutManager.add( `pan${code}keyup`, new ShortcutKeyboard({
            "callback": ( ev:KeyboardEvent ) => {
                getMap().handleMapPanning(ev);
            },
            "code": code
        }));
    });

    [ "Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9" ].forEach( code => {
        shortcutManager.add( `hotgroup${code}`, new ShortcutKeyboard({
            "callback": ( ev:KeyboardEvent ) => {
                if (ev.ctrlKey && ev.shiftKey)
                    getUnitsManager().selectedUnitsAddToHotgroup(parseInt(ev.code.substring(5)));
                else if (ev.ctrlKey && !ev.shiftKey)
                    getUnitsManager().selectedUnitsSetHotgroup(parseInt(ev.code.substring(5)));
                else
                    getUnitsManager().selectUnitsByHotgroup(parseInt(ev.code.substring(5)));
            },
            "code": code
        }));
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
    return missionManager;
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

