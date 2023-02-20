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
import { VisibilityControlPanel } from "./panels/visibilitycontrolpanel";
import { LogPanel } from "./panels/logpanel";

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

var connected: boolean;
var activeCoalition: string;

function setup() {
    /* Initialize */
    map = new Map('map-container');
    unitsManager = new UnitsManager();
    missionData = new MissionData();

    selectionWheel = new SelectionWheel("selection-wheel");
    selectionScroll = new SelectionScroll("selection-scroll");
   
    unitInfoPanel = new UnitInfoPanel("unit-info-panel");
    unitControlPanel = new UnitControlPanel("unit-control-panel");
    connectionStatusPanel = new ConnectionStatusPanel("connection-status-panel");
    mouseInfoPanel = new MouseInfoPanel("mouse-info-panel");
    visibilityControlPanel = new VisibilityControlPanel("visibility-control-panel");
    logPanel = new LogPanel("log-panel");

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

window.onload = setup;