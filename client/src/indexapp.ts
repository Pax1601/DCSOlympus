import { FeatureSwitches } from "./features/featureswitches";
import { MissionHandler } from "./mission/missionhandler";
import { IOlympusApp, OlympusApp } from "./olympusapp";
import { ConnectionStatusPanel } from "./panels/connectionstatuspanel";
import { HotgroupPanel } from "./panels/hotgrouppanel";
import { LogPanel } from "./panels/logpanel";
import { MouseInfoPanel } from "./panels/mouseinfopanel";
import { Panel } from "./panels/panel";
import { ServerStatusPanel } from "./panels/serverstatuspanel";
import { UnitControlPanel } from "./panels/unitcontrolpanel";
import { UnitInfoPanel } from "./panels/unitinfopanel";
import { Popup } from "./popups/popup";
import { UnitsManager } from "./unit/unitsmanager";

export interface IIndexApp extends IOlympusApp {
    "featureSwitches": FeatureSwitches,
    "missionHandler": MissionHandler,
    "panels": IIndexAppPanels,
    "unitsManager": UnitsManager
}

export interface IIndexAppPanels {
    "connectionStatus": ConnectionStatusPanel,
    "hotgroup": HotgroupPanel,
    "infoPopup": Popup,
    "log": LogPanel,
    "mouseInfo": MouseInfoPanel,
    "serverStatus": ServerStatusPanel,
    "unitControl": UnitControlPanel,
    "unitInfo": UnitInfoPanel
}

export class IndexApp extends OlympusApp {

    constructor( config:IIndexApp ) {
        
        super( config );

        //  Panels
        this.getPanelsManager()
            .add( "connectionStatus", config.panels.connectionStatus )
            .add( "hotgroup", config.panels.hotgroup )
            .add( "log", config.panels.log )
            .add( "mouseInfo", config.panels.mouseInfo )
            .add( "serverStatus", config.panels.serverStatus )
            .add( "unitControl", config.panels.unitControl )
            .add( "unitInfo", config.panels.unitInfo );
        
        //  Popup
        this.getPanelsManager().add( "unitPopup", config.panels.infoPopup );

        //  Retrofitting
        Object.values( this.getPanelsManager().getAll() ).forEach( ( panel:Panel ) => {
            panel.setOlympusApp( this );
        });
    }


    start() {

        super.start();

    }
    
}