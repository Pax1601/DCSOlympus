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
var missionData: MissionData;

var slowButton: Button;
var fastButton: Button;
var climbButton: Button;
var descendButton: Button;
var userVisibilityButton: Button;
var aiVisibilityButton: Button;
var weaponVisibilityButton: Button;
var deadVisibilityButton: Button;

function setup() {
    /* Initialize */
    map = new Map('map-container');
    selectionWheel = new SelectionWheel("selection-wheel");
    selectionScroll = new SelectionScroll("selection-scroll");
    unitsManager = new UnitsManager();
    unitInfoPanel = new UnitInfoPanel("unit-info-panel");
    scenarioDropdown = new Dropdown("scenario-dropdown", ["Caucasus", "Syria", "Marianas", "Nevada", "South Atlantic", "The channel"], () => { });
    mapSourceDropdown = new Dropdown("map-source-dropdown", map.getLayers(), (option: string) => map.setLayer(option));
    connectionStatusPanel = new ConnectionStatusPanel("connection-status-panel");
    missionData = new MissionData();

    /* Unit control buttons */
    slowButton = new Button("slow-button", ["images/buttons/slow.svg"], () => { getUnitsManager().selectedUnitsChangeSpeed("slow"); });
    fastButton = new Button("fast-button", ["images/buttons/fast.svg"], () => { getUnitsManager().selectedUnitsChangeSpeed("fast"); });
    climbButton = new Button("climb-button", ["images/buttons/climb.svg"], () => { getUnitsManager().selectedUnitsChangeAltitude("climb"); });
    descendButton = new Button("descend-button", ["images/buttons/descend.svg"], () => { getUnitsManager().selectedUnitsChangeAltitude("descend"); });

    /* Visibility buttons */
    userVisibilityButton = new Button("user-visibility-button", ["images/buttons/user-full.svg", "images/buttons/user-partial.svg", "images/buttons/user-none.svg", "images/buttons/user-hidden.svg"], () => { });
    aiVisibilityButton = new Button("ai-visibility-button", ["images/buttons/ai-full.svg", "images/buttons/ai-partial.svg", "images/buttons/ai-none.svg", "images/buttons/ai-hidden.svg"], () => { });
    weaponVisibilityButton = new Button("weapon-visibility-button", ["images/buttons/weapon-partial.svg", "images/buttons/weapon-none.svg", "images/buttons/weapon-hidden.svg"], () => { });
    deadVisibilityButton = new Button("dead-visibility-button", ["images/buttons/dead.svg", "images/buttons/dead-hidden.svg"], () => { });

    aiVisibilityButton.setState(1);
    weaponVisibilityButton.setState(1);
    deadVisibilityButton.setState(1);

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

export function getVisibilitySettings() {
    var visibility = {
        user: "",
        ai: "",
        weapon: "",
        dead: ""
    };

    switch (userVisibilityButton.getState()) {
        case 0:
            visibility.user = "full"; break;
        case 1:
            visibility.user = "partial"; break;
        case 2:
            visibility.user = "none"; break;
        case 3:
            visibility.user = "hidden"; break;
    }

    switch (aiVisibilityButton.getState()) {
        case 0:
            visibility.ai = "full"; break;
        case 1:
            visibility.ai = "partial"; break;
        case 2:
            visibility.ai = "none"; break;
        case 3:
            visibility.ai = "hidden"; break;
    }

    switch (weaponVisibilityButton.getState()) {
        case 0:
            visibility.weapon = "partial"; break;
        case 1:
            visibility.weapon = "none"; break;
        case 2:
            visibility.weapon = "hidden"; break;
    }

    switch (deadVisibilityButton.getState()) {
        case 0:
            visibility.dead = "none"; break;
        case 1:
            visibility.dead = "hidden"; break;
    }
    return visibility;
}

window.onload = setup;