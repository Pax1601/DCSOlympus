import {MissionData} from './Other/MissionData.js'
import {UnitsManager} from './Units/UnitsManager.js'
import {UnitControlPanel} from './Panels/UnitControlPanel.js'
import {UnitInfoPanel} from './Panels/UnitInfoPanel.js'
import {FormationControlPanel} from './Panels/FormationControlPanel.js'
import {SettingsPanel} from './Panels/SettingsPanel.js'
import {Map} from './Map/Map.js'

declare global {
    var missionData: MissionData;
    var settingsPanel: SettingsPanel;
    var unitsManager: UnitsManager;
    var unitInfoPanel: UnitInfoPanel;
    var unitControlPanel: UnitControlPanel;
    var formationControlPanel: FormationControlPanel;
    var map: Map;
    var RESTaddress: string;
}