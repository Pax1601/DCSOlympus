import { Map } from "./map/map"
import { getDataFromDCS } from "./dcs/dcs"
import { SelectionWheel } from "./controls/selectionwheel";
import { UnitsManager } from "./units/unitsmanager";
import { UnitInfoPanel } from "./panels/unitinfopanel";
import { SelectionScroll } from "./controls/selectionscroll";
import { Dropdown } from "./controls/dropdown";
import { ConnectionStatusPanel } from "./panels/connectionstatuspanel";
import { Button } from "./controls/button";
import { MissionData } from "./missiondata/missiondata";
import { UnitControlPanel } from "./panels/unitcontrolpanel";
import { MouseInfoPanel } from "./panels/mouseInfoPanel";
import { Slider } from "./controls/slider";
import { VisibilityControlPanel } from "./panels/visibilitycontrolpanel";

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

var scenarioDropdown: Dropdown;
var mapSourceDropdown: Dropdown;

var slowButton: Button;
var fastButton: Button;
var climbButton: Button;
var descendButton: Button;

var altitudeSlider: Slider;
var airspeedSlider: Slider;

var connected: boolean;
var activeCoalition: string;

function setup() {
    /* Initialize */
    map = new Map('map-container');
    unitsManager = new UnitsManager();

    selectionWheel = new SelectionWheel("selection-wheel");
    selectionScroll = new SelectionScroll("selection-scroll");
   
    unitInfoPanel = new UnitInfoPanel("unit-info-panel");
    unitControlPanel = new UnitControlPanel("unit-control-panel");
    connectionStatusPanel = new ConnectionStatusPanel("connection-status-panel");
    mouseInfoPanel = new MouseInfoPanel("mouse-info-panel");
    visibilityControlPanel = new VisibilityControlPanel("visibility-control-panel");

    scenarioDropdown = new Dropdown("scenario-dropdown", ["Caucasus", "Syria", "Marianas", "Nevada", "South Atlantic", "The channel"], () => { });
    mapSourceDropdown = new Dropdown("map-source-dropdown", map.getLayers(), (option: string) => map.setLayer(option));

    missionData = new MissionData();

    /* Unit control buttons */
    slowButton = new Button("slow-button", ["images/buttons/slow.svg"], () => { getUnitsManager().selectedUnitsChangeSpeed("slow"); });
    fastButton = new Button("fast-button", ["images/buttons/fast.svg"], () => { getUnitsManager().selectedUnitsChangeSpeed("fast"); });
    climbButton = new Button("climb-button", ["images/buttons/climb.svg"], () => { getUnitsManager().selectedUnitsChangeAltitude("climb"); });
    descendButton = new Button("descend-button", ["images/buttons/descend.svg"], () => { getUnitsManager().selectedUnitsChangeAltitude("descend"); });

    /* Unit control sliders */
    altitudeSlider = new Slider("altitude-slider", 0, 100, "ft", (value: number) => getUnitsManager().selectedUnitsSetAltitude(value * 0.3048));
    airspeedSlider = new Slider("airspeed-slider", 0, 100, "kts", (value: number) => getUnitsManager().selectedUnitsSetSpeed(value / 1.94384));

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
    unitsManager.update(data);
    missionData.update(data);
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