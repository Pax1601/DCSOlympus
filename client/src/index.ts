import { Map } from "./map/map"
import { UnitsManager } from "./units/unitsmanager";
import { UnitInfoPanel } from "./panels/unitinfopanel";
import { ConnectionStatusPanel } from "./panels/connectionstatuspanel";
import { MissionHandler } from "./missionhandler/missionhandler";
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

var map: Map;

var unitsManager: UnitsManager;
var missionHandler: MissionHandler;

var aic: AIC;
var atc: ATC;

var unitInfoPanel: UnitInfoPanel;
var connectionStatusPanel: ConnectionStatusPanel;
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
    map = new Map('map-container');
    unitsManager = new UnitsManager();
    missionHandler = new MissionHandler();

    /* Panels */
    unitInfoPanel = new UnitInfoPanel("unit-info-panel");
    unitControlPanel = new UnitControlPanel("unit-control-panel");
    connectionStatusPanel = new ConnectionStatusPanel("connection-status-panel");
    mouseInfoPanel = new MouseInfoPanel("mouse-info-panel");
    hotgroupPanel = new HotgroupPanel("hotgroup-panel");
    //logPanel = new LogPanel("log-panel");

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

    /* Setup event handlers */
    setupEvents();

    /* Load the config file */
    getConfig(readConfig);
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

function setupEvents() {
    window.onanimationiteration = console.log;

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

    /* Keyup events */
    document.addEventListener("keyup", ev => {
        if (keyEventWasInInput(ev)) {
            return;
        }
        switch (ev.code) {
            case "KeyL":
                document.body.toggleAttribute("data-hide-labels");
                break;
            case "KeyT":
                toggleDemoEnabled();
                break;
            case "Quote":
                unitDataTable.toggle();
                break
            case "Space":
                setPaused(!getPaused());
                break;
            case "KeyW": case "KeyA": case "KeyS": case "KeyD":
            case "ArrowLeft":  case "ArrowRight": case "ArrowUp": case "ArrowDown":
                getMap().handleMapPanning(ev);
                break;
            case "Digit1": case "Digit2": case "Digit3": case "Digit4": case "Digit5": case "Digit6": case "Digit7": case "Digit8": case "Digit9":     
                // Using the substring because the key will be invalid when pressing the Shift key
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
        setCredentials(username, btoa("admin" + ":" + password));

        /* Start periodically requesting updates */
        startUpdate();

        setConnectionStatus("connecting");
    })

    document.addEventListener("reloadPage", () => {
        location.reload();
    })

    document.querySelectorAll("[inject-svg]").forEach((el: Element) => {
        var img = el as HTMLImageElement;
        var isLoaded = img.complete && img.naturalHeight !== 0;
        if (isLoaded) 
            SVGInjector(img);
        else
            img.onload = () => SVGInjector(img);
    })

}

export function getMap() {
    return map;
}

export function getMissionData() {
    return missionHandler;
}

export function getUnitDataTable() {
    return unitDataTable;
}

export function getUnitsManager() {
    return unitsManager;
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

export function getHotgroupPanel() {
    return hotgroupPanel;
}

export function setActiveCoalition(newActiveCoalition: string) {
    activeCoalition = newActiveCoalition;
    document.querySelectorAll('[data-active-coalition]').forEach((element: any) => { element.setAttribute("data-active-coalition", activeCoalition) });
}

export function getActiveCoalition() {
    return activeCoalition;
}

export function setConnectionStatus(status: string) {
    const el = document.querySelector("#connection-status") as HTMLElement;
    if (el)
        el.dataset["status"] = status;
}

export function getInfoPopup() {
    return infoPopup;
}

window.onload = setup;