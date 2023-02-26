import { Map } from "./map/map"
import { getDataFromDCS } from "./server/server"
import { UnitsManager } from "./units/unitsmanager";
import { UnitInfoPanel } from "./panels/unitinfopanel";
import { ContextMenu } from "./controls/contextmenu";
import { Dropdown } from "./controls/dropdown";
import { ConnectionStatusPanel } from "./panels/connectionstatuspanel";
import { MissionData } from "./missiondata/missiondata";
import { UnitControlPanel } from "./panels/unitcontrolpanel";
import { MouseInfoPanel } from "./panels/mouseinfopanel";
import { Slider } from "./controls/slider";
import { AIC } from "./aic/aic";

import { VisibilityControlPanel } from "./panels/visibilitycontrolpanel";
import { ATC } from "./atc/ATC";
import { FeatureSwitches } from "./FeatureSwitches";
import { LogPanel } from "./panels/logpanel";
import { Button } from "./controls/button";

var map: Map;
var contextMenu: ContextMenu;

var unitsManager: UnitsManager;
var missionData: MissionData;

var unitInfoPanel: UnitInfoPanel;
var connectionStatusPanel: ConnectionStatusPanel;
var unitControlPanel: UnitControlPanel;
var mouseInfoPanel: MouseInfoPanel;
var visibilityControlPanel: VisibilityControlPanel;
var logPanel: LogPanel;

var mapSourceDropdown: Dropdown;

var aic: AIC;
var aicToggleButton: Button;
var aicHelpButton: Button;

var atc: ATC;
var atcToggleButton: Button;

var connected: boolean;
var activeCoalition: string;

var featureSwitches;

function setup() {

    featureSwitches = new FeatureSwitches();

    /* Initialize */
    map = new Map('map-container');
    unitsManager = new UnitsManager();
    missionData = new MissionData();

    contextMenu = new ContextMenu("selection-scroll");
   
    unitInfoPanel = new UnitInfoPanel("unit-info-panel");
    unitControlPanel = new UnitControlPanel("unit-control-panel");
    mapSourceDropdown = new Dropdown("map-source-dropdown", map.getLayers(), (option: string) => map.setLayer(option));
    connectionStatusPanel = new ConnectionStatusPanel("connection-status-panel");
    mouseInfoPanel = new MouseInfoPanel("mouse-info-panel");
    visibilityControlPanel = new VisibilityControlPanel("visibility-control-panel");
    logPanel = new LogPanel("log-panel");

    missionData = new MissionData();

    /* AIC */
    
    let aicFeatureSwitch = featureSwitches.getSwitch( "aic" );

    if ( aicFeatureSwitch?.isEnabled() ) {
        aic = new AIC();
        
        aicToggleButton = new Button( "toggle-aic-button", ["images/buttons/radar.svg"], () => {
            aic.toggleStatus();
        });

        aicHelpButton = new Button( "aic-help-button", [ "images/buttons/question-mark.svg" ], () => {
            aic.toggleHelp();
        });
    }


    /* Generic clicks */

    document.addEventListener( "click", ( ev ) => {

        if ( ev instanceof PointerEvent && ev.target instanceof HTMLElement ) {

            if ( ev.target.classList.contains( "olympus-dialog-close" ) ) {
                ev.target.closest( "div.olympus-dialog" )?.classList.add( "hide" );
            }

        }

    });


    /*** ATC ***/

    let atcFeatureSwitch = featureSwitches.getSwitch( "atc" );

    if ( atcFeatureSwitch?.isEnabled() ) {

        atc = new ATC();
    
        atcToggleButton = new Button( "atc-toggle-button", [ "images/buttons/atc.svg" ], () => {
            atc.toggleStatus();
        } );

    }

    mapSourceDropdown = new Dropdown("map-source-dropdown", map.getLayers(), (option: string) => map.setLayer(option));

    /* Default values */
    activeCoalition = "blue";
    connected = false;

    requestUpdate();
}

function requestUpdate() {
    getDataFromDCS(update);
    
    /* Main update rate = 250ms is minimum time, equal to server update time. */
    setTimeout(() => requestUpdate(), getConnected() ? 250 : 1000);

    connectionStatusPanel.update(getConnected());
}

export function update(data: ServerData) {
    unitsManager.update(data);
    missionData.update(data);
    logPanel.update(data);
}

export function getMap() {
    return map;
}

export function getMissionData() {
    return missionData;
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