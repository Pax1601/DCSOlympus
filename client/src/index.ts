import { Map } from "./map/map"
import { UnitsManager } from "./unit/unitsmanager";
import { UnitInfoPanel } from "./panels/unitinfopanel";
import { ConnectionStatusPanel } from "./panels/connectionstatuspanel";
import { MissionHandler } from "./mission/missionhandler";
import { UnitControlPanel } from "./panels/unitcontrolpanel";
import { MouseInfoPanel } from "./panels/mouseinfopanel";
import { AIC } from "./aic/aic";
import { ATC } from "./atc/atc";
import { FeatureSwitches } from "./features/featureswitches";
import { LogPanel } from "./panels/logpanel";
import { getConfig, getPaused, setAddress, setCredentials, setPaused, startUpdate, toggleDemoEnabled } from "./server/server";
import { UnitDataTable } from "./atc/unitdatatable";
import { keyEventWasInInput } from "./other/utils";
import { Popup } from "./popups/popup";
import { Dropdown } from "./controls/dropdown";
import { HotgroupPanel } from "./panels/hotgrouppanel";
import { SVGInjector } from "@tanem/svg-injector";
import { BLUE_COMMANDER, GAME_MASTER, RED_COMMANDER } from "./constants/constants";
import { ServerStatusPanel } from "./panels/serverstatuspanel";
import { WeaponsManager } from "./weapon/weaponsmanager";
import { IndexApp } from "./indexapp";
import { ShortcutKeyboard } from "./shortcut/shortcut";
import { ShortcutManager } from "./shortcut/shortcutmanager";
import { OlympusApp } from "./olympusapp";

var map: Map;

var unitsManager: UnitsManager;
var weaponsManager: WeaponsManager;
var missionHandler: MissionHandler;

var aic: AIC;
var atc: ATC;

var unitInfoPanel: UnitInfoPanel;
var connectionStatusPanel: ConnectionStatusPanel;
var serverStatusPanel: ServerStatusPanel;
var unitControlPanel: UnitControlPanel;
var mouseInfoPanel: MouseInfoPanel;
var logPanel: LogPanel;
var hotgroupPanel: HotgroupPanel;

var infoPopup: Popup;

var activeCoalition: string = "blue";

var unitDataTable: UnitDataTable;

var featureSwitches;

function setup() {
    featureSwitches = new FeatureSwitches();

    /* Initialize base functionalitites */
    unitsManager = new UnitsManager();
    weaponsManager = new WeaponsManager();
    map = new Map('map-container');
    missionHandler = new MissionHandler();

    /* Panels */
    unitInfoPanel = new UnitInfoPanel("unit-info-panel");
    unitControlPanel = new UnitControlPanel("unit-control-panel");
    connectionStatusPanel = new ConnectionStatusPanel("connection-status-panel");
    serverStatusPanel = new ServerStatusPanel("server-status-panel");
    mouseInfoPanel = new MouseInfoPanel("mouse-info-panel");
    hotgroupPanel = new HotgroupPanel("hotgroup-panel");
    logPanel = new LogPanel("log-panel");
    
    /* Popups */
    infoPopup = new Popup("info-popup");

    /* Controls */
    new Dropdown("app-icon", () => { });

    /* Unit data table */
    unitDataTable = new UnitDataTable("unit-data-table");

    /* AIC */
    let aicFeatureSwitch = featureSwitches.getSwitch("aic");
    if (aicFeatureSwitch?.isEnabled()) {
        aic = new AIC();
    }

    /* ATC */
    let atcFeatureSwitch = featureSwitches.getSwitch("atc");
    if (atcFeatureSwitch?.isEnabled()) {
        atc = new ATC();
        atc.startUpdates();
    }

    /* Load the config file */
    getConfig(readConfig);

    /*
        This is done like this for now as a way to make it work in the new and old world.
        Over time/at some point, we'll need to start migrating the pre-existing code to an "app" format
    */

    const indexApp = new IndexApp({
        "featureSwitches": featureSwitches,
        "map": map,
        "missionHandler": missionHandler,
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
        "unitDataTable": unitDataTable,
        "unitsManager": unitsManager
    });

    /* Setup event handlers */
    setupEvents( indexApp );

}

function readConfig(config: any) {
    if (config && config["address"] != undefined && config["port"] != undefined) {
        const address = config["address"];
        const port = config["port"];
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
    .add( "toggleUnitDataTable", new ShortcutKeyboard({
            "callback": () => {
                unitDataTable.toggle();
            },
            "code": "Quote"
        })
    )
    .add( "togglePause", new ShortcutKeyboard({
            "callback": () => {
                setPaused(!getPaused());
            },
            "code": "space"
        })
    );

    [ "KeyW", "KeyA", "KeyS", "KeyD", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown" ].forEach( code => {
        shortcutManager.add( `pan${code}keydown`, new ShortcutKeyboard({
            "callback": ( ev:KeyboardEvent ) => {
                getMap().handleMapPanning(ev);
            },
            "code": code,
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



    document.addEventListener("closeDialog", (ev: CustomEventInit) => {
        ev.detail._element.closest(".ol-dialog").classList.add("hide");
    });

    document.addEventListener("toggleElements", (ev: CustomEventInit) => {
        document.querySelectorAll(ev.detail.selector).forEach(el => {
            el.classList.toggle("hide");
        })
    });

    document.addEventListener("tryConnection", () => {
        const form = document.querySelector("#splash-content")?.querySelector("#authentication-form");
        const username = (<HTMLInputElement>(form?.querySelector("#username"))).value;
        const password = (<HTMLInputElement>(form?.querySelector("#password"))).value;
        setCredentials(username, password);

        /* Start periodically requesting updates */
        startUpdate();

        setLoginStatus("connecting");
    })

    document.addEventListener("reloadPage", () => {
        location.reload();
    })

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

export function getMap() {
    return map;
}

export function getUnitDataTable() {
    return unitDataTable;
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

export function setActiveCoalition(newActiveCoalition: string) {
    if (getMissionHandler().getCommandModeOptions().commandMode == GAME_MASTER)
        activeCoalition = newActiveCoalition;
}

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

export function setLoginStatus(status: string) {
    const el = document.querySelector("#login-status") as HTMLElement;
    if (el)
        el.dataset["status"] = status;
}

export function getInfoPopup() {
    return infoPopup;
}

window.onload = setup;

