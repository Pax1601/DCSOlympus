export interface ContextInterface {
    useSpawnMenu?: boolean;
    useUnitControlPanel?: boolean;
    useUnitInfoPanel?: boolean;
}

export class Context {

    #useSpawnMenu:boolean;
    #useUnitControlPanel:boolean;
    #useUnitInfoPanel:boolean;

    constructor( config:ContextInterface ) {
        this.#useSpawnMenu        = ( config.useSpawnMenu !== false );
        this.#useUnitControlPanel = ( config.useUnitControlPanel !== false );
        this.#useUnitInfoPanel    = ( config.useUnitInfoPanel !== false );
    }

    getUseSpawnMenu() {
        return this.#useSpawnMenu;
    }

    getUseUnitControlPanel() {
        return this.#useUnitControlPanel;
    }

    getUseUnitInfoPanel() {
        return this.#useUnitInfoPanel;
    }

}