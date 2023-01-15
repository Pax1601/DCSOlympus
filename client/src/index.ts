import { Map } from "./map/map"
import { getDataFromDCS } from "./dcs/dcs"
import { SelectionWheel } from "./controls/selectionwheel";
import { UnitsManager } from "./units/unitsmanager";
import { UnitInfoPanel } from "./panels/unitinfopanel";
import { SelectionScroll } from "./controls/selectionscroll";

var map: Map;
var selectionWheel: SelectionWheel;
var selectionScroll: SelectionScroll;
var unitsManager: UnitsManager;
var unitInfoPanel: UnitInfoPanel;
var activeCoalition: string

function setup()
{
    /* Initialize */
    map = new Map('olympus-map-container');
    selectionWheel = new SelectionWheel("selection-wheel");
    selectionScroll = new SelectionScroll("selection-scroll");
    unitsManager = new UnitsManager();
    unitInfoPanel = new UnitInfoPanel("olympus-unit-info-panel");

    /* Main update rate = 250ms is minimum time, equal to server update time. */
    setInterval(() => getDataFromDCS(update), 250);
}

function update(data: JSON)
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

export function setActiveCoalition(coalition: string)
{
    activeCoalition = coalition;
}

export function getActiveCoalition()
{
    return activeCoalition;
}

window.onload = setup;