export interface ContextInterface {
    allowUnitCopying?: boolean;
    allowUnitPasting?: boolean;
    useSpawnMenu?: boolean;
    useUnitControlPanel?: boolean;
    useUnitInfoPanel?: boolean;
}

export class Context {
    #allowUnitCopying: boolean;
    #allowUnitPasting: boolean;
    #useSpawnMenu: boolean;
    #useUnitControlPanel: boolean;
    #useUnitInfoPanel: boolean;

    constructor(config: ContextInterface) {
        this.#allowUnitCopying = (config.allowUnitCopying !== false);
        this.#allowUnitPasting = (config.allowUnitPasting !== false);
        this.#useSpawnMenu = (config.useSpawnMenu !== false);
        this.#useUnitControlPanel = (config.useUnitControlPanel !== false);
        this.#useUnitInfoPanel = (config.useUnitInfoPanel !== false);
    }

    getAllowUnitCopying() {
        return this.#allowUnitCopying;
    }

    getAllowUnitPasting() {
        return this.#allowUnitPasting;
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