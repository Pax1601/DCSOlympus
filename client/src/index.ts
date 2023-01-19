import { Map } from "./map/map"
import { getDataFromDCS } from "./dcs/dcs"
import { SelectionWheel } from "./controls/selectionwheel";
import { UnitsManager } from "./units/unitsmanager";
import { UnitInfoPanel } from "./panels/unitinfopanel";
import { SelectionScroll } from "./controls/selectionscroll";
import { Dropdown } from "./controls/dropdown";
import { ConnectionStatusPanel } from "./panels/connectionstatuspanel";
import { Button } from "./controls/button";

/* TODO: should this be a class? */
var map: Map;
var selectionWheel: SelectionWheel;
var selectionScroll: SelectionScroll;
var unitsManager: UnitsManager;
var unitInfoPanel: UnitInfoPanel;
var activeCoalition: string;
var scenarioDropdown: Dropdown;
var mapSourceDropdown: Dropdown;
var connected: boolean;
var connectionStatusPanel: ConnectionStatusPanel;
var slowButton: Button;
var fastButton: Button;
var climbButton: Button;
var descendButton: Button;

function setup()
{
    /* Initialize */
    map = new Map('map-container');
    selectionWheel = new SelectionWheel("selection-wheel");
    selectionScroll = new SelectionScroll("selection-scroll");
    unitsManager = new UnitsManager();
    unitInfoPanel = new UnitInfoPanel("unit-info-panel");
    scenarioDropdown = new Dropdown("scenario-dropdown", ["Caucasus", "Syria", "Nevada", "Marianas", "South Atlantic", "The channel"], () => {});
    mapSourceDropdown = new Dropdown("map-source-dropdown", map.getLayers(), (option: string) => map.setLayer(option));
    connectionStatusPanel = new ConnectionStatusPanel("connection-status-panel");
    slowButton = new Button("slow-button", ["images/buttons/slow.svg"], () => {});
    fastButton = new Button("fast-button", ["images/buttons/fast.svg"], () => {});
    climbButton = new Button("climb-button", ["images/buttons/climb.svg"], () => {});
    descendButton = new Button("descend-button", ["images/buttons/descend.svg"], () => {});

    /* Default values */
    activeCoalition = "blue";
    connected = false;

    requestUpdate();
}

function requestUpdate()
{
    getDataFromDCS(update);
    /* Main update rate = 250ms is minimum time, equal to server update time. */
    setTimeout(() => requestUpdate(), getConnected() ? 250: 1000);
    connectionStatusPanel.update(getConnected() );
}

export function update(data: JSON)
{
    unitsManager.update(data);
}

export function getMap()
{
    return map;
}

export function getSelectionWheel()
{
    return selectionWheel;
}

export function getSelectionScroll()
{
    return selectionScroll;
}

export function getUnitsManager()
{
    return unitsManager;
}

export function getUnitInfoPanel()
{
    return unitInfoPanel;
}

export function setActiveCoalition(newActiveCoalition: string)
{
    activeCoalition = newActiveCoalition;
}

export function getActiveCoalition()
{
    return activeCoalition;
}

export function setConnected(newConnected: boolean)
{
    connected = newConnected
}

export function getConnected()
{
    return connected;
}

window.onload = setup;