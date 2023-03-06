import { Map } from "./map/map"
import { UnitsManager } from "./units/unitsmanager";
import { UnitInfoPanel } from "./panels/unitinfopanel";
import { ContextMenu } from "./controls/contextmenu";
import { ConnectionStatusPanel } from "./panels/connectionstatuspanel";
import { MissionHandler } from "./missionhandler/missionhandler";
import { UnitControlPanel } from "./panels/unitcontrolpanel";
import { MouseInfoPanel } from "./panels/mouseinfopanel";
import { AIC } from "./aic/aic";
import { ATC } from "./atc/ATC";
import { FeatureSwitches } from "./FeatureSwitches";
import { LogPanel } from "./panels/logpanel";
import { getAirbases, getBulllseye, getUnits } from "./server/server";

var map: Map;
var contextMenu: ContextMenu;

var unitsManager: UnitsManager;
var missionHandler: MissionHandler;
 
var aic: AIC;
var atc: ATC;

var unitInfoPanel: UnitInfoPanel;
var connectionStatusPanel: ConnectionStatusPanel;
var unitControlPanel: UnitControlPanel;
var mouseInfoPanel: MouseInfoPanel;
var logPanel: LogPanel;

var connected: boolean = false;
var activeCoalition: string = "blue";

var featureSwitches;

function setup() {

    featureSwitches = new FeatureSwitches();

    /* Initialize */
    map = new Map('map-container');
    unitsManager = new UnitsManager();
    missionHandler = new MissionHandler();

    contextMenu = new ContextMenu("contextmenu");
   
    unitInfoPanel = new UnitInfoPanel("unit-info-panel");
    unitControlPanel = new UnitControlPanel("unit-control-panel");
    connectionStatusPanel = new ConnectionStatusPanel("connection-status-panel");
    mouseInfoPanel = new MouseInfoPanel("mouse-info-panel");
    //logPanel = new LogPanel("log-panel");

    missionHandler = new MissionHandler();

    /* AIC */
    let aicFeatureSwitch = featureSwitches.getSwitch( "aic" );
    if ( aicFeatureSwitch?.isEnabled() ) {
        aic = new AIC();
        // TODO: add back buttons
    }

    /* Generic clicks */
    document.addEventListener( "click", ( ev ) => {
        if ( ev instanceof PointerEvent && ev.target instanceof HTMLElement ) {
            if ( ev.target.classList.contains( "olympus-dialog-close" ) ) {
                ev.target.closest( "div.olympus-dialog" )?.classList.add( "hide" );
            }
        }
    });

    /* ATC */
    let atcFeatureSwitch = featureSwitches.getSwitch( "atc" );
    if ( atcFeatureSwitch?.isEnabled() ) {
        atc = new ATC();
        // TODO: add back buttons
    }

    /* On the first connection, force request of full data */
    getAirbases((data: AirbasesData) => getMissionData()?.update(data));
    getBulllseye((data: BullseyesData) => getMissionData()?.update(data));
    getUnits((data: UnitsData) => getUnitsManager()?.update(data), true /* Does a full refresh */);
    
    /* Start periodically requesting updates */
    requestUpdate(true /* Start looping */);
}

function requestUpdate(loop: boolean) {
    /* Main update rate = 250ms is minimum time, equal to server update time. */
    getUnits((data: UnitsData) => getUnitsManager()?.update(data))
    setTimeout(() => requestUpdate(loop), getConnected() ? 250 : 1000);

    getConnectionStatusPanel()?.update(getConnected());
}

export function getMap() {
    return map;
}

export function getMissionData() {
    return missionHandler;
}

export function getContextMenu() {
    return contextMenu;
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
}

export function getActiveCoalition() {
    return activeCoalition;
}

export function setConnected(newConnected: boolean) {
    connected = newConnected
}

export function getConnected() {
    return connected;
}

window.onload = setup;