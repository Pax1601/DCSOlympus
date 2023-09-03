import { FeatureSwitches } from "./features/featureswitches";
import { Map } from "./map/map";
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
import { PluginManager } from "./plugin/pluginmanager";
import { PluginHelloWorld } from "./plugins/helloworld/pluginhelloworld";
import { Popup } from "./popups/popup";
import { UnitsManager } from "./unit/unitsmanager";

export interface IIndexApp extends IOlympusApp {
    "featureSwitches": FeatureSwitches,
    "map": Map,
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

    #pluginManager!: PluginManager;

    constructor( config:IIndexApp ) {
        
        super( config );

        // this.setMap( config.map );

        //  Panels
        this.getPanelsManager().add( "connectionStatus", config.panels.connectionStatus );
        this.getPanelsManager().add( "hotgroup", config.panels.hotgroup );
        this.getPanelsManager().add( "log", config.panels.log );
        this.getPanelsManager().add( "mouseInfo", config.panels.mouseInfo );
        this.getPanelsManager().add( "serverStatus", config.panels.serverStatus );
        this.getPanelsManager().add( "unitControl", config.panels.unitControl );
        this.getPanelsManager().add( "unitInfo", config.panels.unitInfo );
        
        //  Popup
        this.getPanelsManager().add( "unitPopup", config.panels.infoPopup );

        //  Retrofitting
        Object.values( this.getPanelsManager().getAll() ).forEach( ( panel:Panel ) => {
            panel.setOlympusApp( this );
        });

        //  Plugins
        this.#pluginManager = new PluginManager( this );

        //  Manual loading for now
        this.#pluginManager.add( "helloWorld", new PluginHelloWorld( this ) );
    }


    start() {

        super.start();

    }
    
}