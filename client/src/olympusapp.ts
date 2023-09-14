import { FeatureSwitches } from "./features/featureswitches";
import { Map } from "./map/map";
import { PanelsManager } from "./panels/panelsmanager";
import { ControlTips } from "./shortcut/controltips";
import { ShortcutManager } from "./shortcut/shortcutmanager";
import { UnitsManager } from "./unit/unitsmanager";


export interface IOlympusApp {
    featureSwitches: FeatureSwitches;
    map: Map,
    unitsManager: UnitsManager;
}

export abstract class OlympusApp {

    #controlTips: ControlTips;
    #featureSwitches: FeatureSwitches;
    #map: Map;
    #panelsManager: PanelsManager = new PanelsManager( this );
    #shortcutManager: ShortcutManager = new ShortcutManager( this );
    #unitsManager: UnitsManager;

    constructor( config:IOlympusApp ) {

        this.#controlTips     = new ControlTips( "control-tips-panel", this );
        this.#featureSwitches = config.featureSwitches;
        this.#map             = config.map;
        this.#unitsManager    = config.unitsManager;

        this.getMap().setOlympusApp( this );

    }

    getControlTips() {
        return this.#controlTips;
    }

    getFeatureSwitches() {
        return this.#featureSwitches;
    }

    getMap() {
        return this.#map;
    }

    getPanelsManager() {
        return this.#panelsManager;
    }

    getShortcutManager() {
        return this.#shortcutManager;
    }

    getUnitsManager() {
        return this.#unitsManager;
    }

    getWeaponsManager() {
        return this.getWeaponsManager;
    }

    start() {

        //  Start the app


    }

}