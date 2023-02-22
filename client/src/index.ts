import { Map } from "./map/map"
import { getDataFromDCS } from "./dcs/dcs"
import { SelectionWheel } from "./controls/selectionwheel";
import { UnitsManager } from "./units/unitsmanager";
import { UnitInfoPanel } from "./panels/unitinfopanel";
import { SelectionScroll } from "./controls/selectionscroll";
import { Dropdown } from "./controls/dropdown";
import { ConnectionStatusPanel } from "./panels/connectionstatuspanel";
import { MissionData } from "./missiondata/missiondata";
import { UnitControlPanel } from "./panels/unitcontrolpanel";
import { MouseInfoPanel } from "./panels/mouseInfoPanel";
import { Slider } from "./controls/slider";
import { AIC } from "./aic/AIC";

import { VisibilityControlPanel } from "./panels/visibilitycontrolpanel";
import { ATC } from "./atc/ATC";
import { FeatureSwitches } from "./FeatureSwitches";
import { LogPanel } from "./panels/logpanel";
import { Button } from "./controls/button";

/* TODO: should this be a class? */
var map: Map;
var selectionWheel: SelectionWheel;
var selectionScroll: SelectionScroll;

var unitsManager: UnitsManager;
var missionData: MissionData;

var unitInfoPanel: UnitInfoPanel;
var connectionStatusPanel: ConnectionStatusPanel;
var unitControlPanel: UnitControlPanel;
var mouseInfoPanel: MouseInfoPanel;
var visibilityControlPanel: VisibilityControlPanel;
var logPanel: LogPanel;

var mapSourceDropdown: Dropdown;

var slowButton: Button;
var fastButton: Button;
var climbButton: Button;
var descendButton: Button;

var aic: AIC;
var aicToggleButton: Button;
var aicHelpButton: Button;


var atc: ATC;
var atcToggleButton: Button;

var altitudeSlider: Slider;
var airspeedSlider: Slider;

var connected: boolean;
var activeCoalition: string;

var featureSwitches;

function setup() {

    featureSwitches = new FeatureSwitches();

    /* Initialize */
    map = new Map('map-container');
    unitsManager = new UnitsManager();
    missionData = new MissionData();

    selectionWheel = new SelectionWheel("selection-wheel");
    selectionScroll = new SelectionScroll("selection-scroll");
   
    unitInfoPanel = new UnitInfoPanel("unit-info-panel");
    unitControlPanel = new UnitControlPanel("unit-control-panel");
    //scenarioDropdown = new Dropdown("scenario-dropdown", ["Caucasus", "Marianas", "Nevada", "South Atlantic", "Syria", "The Channel"], () => { });
    mapSourceDropdown = new Dropdown("map-source-dropdown", map.getLayers(), (option: string) => map.setLayer(option));
    connectionStatusPanel = new ConnectionStatusPanel("connection-status-panel");
    mouseInfoPanel = new MouseInfoPanel("mouse-info-panel");
    visibilityControlPanel = new VisibilityControlPanel("visibility-control-panel");
    logPanel = new LogPanel("log-panel");

    missionData = new MissionData();

    /* Unit control buttons */
    slowButton = new Button("slow-button", ["images/buttons/slow.svg"], () => { getUnitsManager().selectedUnitsChangeSpeed("slow"); });
    fastButton = new Button("fast-button", ["images/buttons/fast.svg"], () => { getUnitsManager().selectedUnitsChangeSpeed("fast"); });
    climbButton = new Button("climb-button", ["images/buttons/climb.svg"], () => { getUnitsManager().selectedUnitsChangeAltitude("climb"); });
    descendButton = new Button("descend-button", ["images/buttons/descend.svg"], () => { getUnitsManager().selectedUnitsChangeAltitude("descend"); });

    /* Unit control sliders */
    altitudeSlider = new Slider("altitude-slider", 0, 100, "ft", (value: number) => getUnitsManager().selectedUnitsSetAltitude(value * 0.3048));
    airspeedSlider = new Slider("airspeed-slider", 0, 100, "kts", (value: number) => getUnitsManager().selectedUnitsSetSpeed(value / 1.94384));

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

export function update(data: JSON) {
    console.log( data );
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

export function getSelectionWheel() {
    return selectionWheel;
}

export function getSelectionScroll() {
    return selectionScroll;
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

export function getUnitControlSliders() {
    return {altitude: altitudeSlider, airspeed: airspeedSlider}
}


window.onload = setup;