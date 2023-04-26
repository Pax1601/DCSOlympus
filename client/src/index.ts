import { Map } from "./map/map"
import { UnitsManager } from "./units/unitsmanager";
import { UnitInfoPanel } from "./panels/unitinfopanel";
import { ConnectionStatusPanel } from "./panels/connectionstatuspanel";
import { MissionHandler } from "./missionhandler/missionhandler";
import { UnitControlPanel } from "./panels/unitcontrolpanel";
import { MouseInfoPanel } from "./panels/mouseinfopanel";
import { AIC } from "./aic/aic";
import { ATC } from "./atc/atc";
import { FeatureSwitches } from "./featureswitches";
import { LogPanel } from "./panels/logpanel";
import { getAirbases, getBullseye as getBullseyes, getConfig, getMission, getUnits, setAddress, toggleDemoEnabled } from "./server/server";
import { UnitDataTable } from "./units/unitdatatable";
import { keyEventWasInInput } from "./other/utils";
import { Popup } from "./popups/popup";
import { Dropdown } from "./controls/dropdown";

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

var infoPopup: Popup;

var connected: boolean = false;
var paused: boolean = false;
var activeCoalition: string = "blue";

var sessionHash: string | null = null;
var unitDataTable: UnitDataTable;

var featureSwitches;

function setup() {

    featureSwitches = new FeatureSwitches();

    /* Initialize base functionalitites*/
    map = new Map('map-container');
    unitsManager = new UnitsManager();
    missionHandler = new MissionHandler();

    /* Panels */
    unitInfoPanel = new UnitInfoPanel("unit-info-panel");
    unitControlPanel = new UnitControlPanel("unit-control-panel");
    connectionStatusPanel = new ConnectionStatusPanel("connection-status-panel");
    mouseInfoPanel = new MouseInfoPanel("mouse-info-panel");
    //logPanel = new LogPanel("log-panel");

    /* Popups */
    infoPopup = new Popup("info-popup");

    unitDataTable = new UnitDataTable("unit-data-table");

    /* AIC */
    let aicFeatureSwitch = featureSwitches.getSwitch("aic");
    if (aicFeatureSwitch?.isEnabled()) {
        aic = new AIC();
        // TODO: add back buttons
    }

    /* ATC */
    let atcFeatureSwitch = featureSwitches.getSwitch("atc");
    if (atcFeatureSwitch?.isEnabled()) {
        atc = new ATC();
        atc.startUpdates();
    }


    new Dropdown( "app-icon", () => {} );

    /* Setup event handlers */
    setupEvents();

    getConfig(readConfig)
}

function readConfig(config: any)
{
    if (config && config["server"] != undefined && config["server"]["address"] != undefined && config["server"]["port"] != undefined)
    {
        const address = config["server"]["address"];
        const port = config["server"]["port"];
        if (typeof address === 'string' && typeof port == 'number')
            setAddress(address == "*"? window.location.hostname: address, <number>port);

        /* On the first connection, force request of full data */
        getAirbases((data: AirbasesData) => getMissionData()?.update(data));
        getBullseyes((data: BullseyesData) => getMissionData()?.update(data));
        getMission((data: any) => {getMissionData()?.update(data)});
        getUnits((data: UnitsData) => getUnitsManager()?.update(data), true /* Does a full refresh */);

        /* Start periodically requesting updates */
        startPeriodicUpdate();
    }
    else {
        throw new Error('Could not read configuration file!');
    }    
}

function startPeriodicUpdate() {
    requestUpdate();
    requestRefresh();
}

function requestUpdate() {
    /* Main update rate = 250ms is minimum time, equal to server update time. */
    getUnits((data: UnitsData) => {
        if (!getPaused()){
            getUnitsManager()?.update(data);
            checkSessionHash(data.sessionHash);
        }
    }, false);
    window.setTimeout(() => requestUpdate(), getConnected() ? 250 : 1000);

    getConnectionStatusPanel()?.update(getConnected());
}

function requestRefresh() {
    /* Main refresh rate = 5000ms. */
    getUnits((data: UnitsData) => {
        if (!getPaused()){
            getUnitsManager()?.update(data);
            getAirbases((data: AirbasesData) => getMissionData()?.update(data));
            getBullseyes((data: BullseyesData) => getMissionData()?.update(data));
            getMission((data: any) => {
                getMissionData()?.update(data)
            });

            // Update the list of existing units
            getUnitDataTable()?.update();
            
            checkSessionHash(data.sessionHash);
        }
    }, true);
    window.setTimeout(() => requestRefresh(), 5000);
}

function checkSessionHash(newSessionHash: string) {
    if (sessionHash != null) {
        if (newSessionHash != sessionHash)
            location.reload();
    }
    else
        sessionHash = newSessionHash;
}

function setupEvents() {
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

        if ( keyEventWasInInput( ev ) ) {
            return;
        }
        
        switch (ev.code) {
            case "KeyL":
                document.body.toggleAttribute("data-hide-labels");
                break;
            case "KeyD":
                toggleDemoEnabled();
                break;
            case "Quote":
                unitDataTable.toggle();
                break
            case "Space":
                setPaused(!getPaused());
                break;
        }
    });

    /*
    const unitName = document.getElementById( "unit-name" );
    if ( unitName instanceof HTMLInputElement ) {
        unitName.addEventListener( "change", ev => {
            unitName.setAttribute( "disabled", "true" );
            unitName.setAttribute( "readonly", "true" );
            
            //  Do something with this:
        });

        document.addEventListener( "editUnitName", ev => {
            unitName.removeAttribute( "disabled" );
            unitName.removeAttribute( "readonly" );
            unitName.focus();
        });
    }
    //*/

    document.addEventListener( "closeDialog", (ev: CustomEventInit) => {
        ev.detail._element.closest( ".ol-dialog" ).classList.add( "hide" );
    });

    document.addEventListener( "toggleElements", (ev: CustomEventInit) => {
        document.querySelectorAll( ev.detail.selector ).forEach( el => {
            el.classList.toggle( "hide" );
        })
    });

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

export function setActiveCoalition(newActiveCoalition: string) {
    activeCoalition = newActiveCoalition;
    document.querySelectorAll('[data-active-coalition]').forEach((element: any) => { element.setAttribute("data-active-coalition", activeCoalition) });
}

export function getActiveCoalition() {
    return activeCoalition;
}

export function setConnected(newConnected: boolean) {
    if (connected != newConnected)
        newConnected? getInfoPopup().setText("Connected to DCS Olympus server"): getInfoPopup().setText("Disconnected from DCS Olympus server");
    connected = newConnected;
}

export function getConnected() {
    return connected;
}

export function setPaused(newPaused: boolean) {
    paused = newPaused;
    paused? getInfoPopup().setText("Paused"): getInfoPopup().setText("Unpaused");
}

export function getPaused() {
    return paused;
}

export function getInfoPopup() {
    return infoPopup;
}

window.onload = setup;