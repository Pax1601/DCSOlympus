import { ContextMenuManager } from "./contextmenumanager";

export type TContextConfig = {
    allowUnitCopying?: boolean;
    allowUnitPasting?: boolean;
    contextMenuManager?: ContextMenuManager;
    onSet?:CallableFunction;
    onUnset?:CallableFunction;
    useUnitControlPanel?: boolean;
    useUnitInfoPanel?: boolean;
}

export class Context {
    #allowUnitCopying: boolean;
    #allowUnitPasting: boolean;
    #onSet:CallableFunction;
    #onUnset:CallableFunction;
    #contextMenuManager: ContextMenuManager;
    #useUnitControlPanel: boolean;
    #useUnitInfoPanel: boolean;

    constructor(config: TContextConfig) {
        this.#allowUnitCopying = (config.allowUnitCopying !== false);
        this.#allowUnitPasting = (config.allowUnitPasting !== false);
        this.#onSet = config.onSet || function() {};
        this.#onUnset = config.onUnset || function() {};
        this.#contextMenuManager = config.contextMenuManager || new ContextMenuManager();
        this.#useUnitControlPanel = (config.useUnitControlPanel !== false);
        this.#useUnitInfoPanel = (config.useUnitInfoPanel !== false);
    }

    getAllowUnitCopying() {
        return this.#allowUnitCopying;
    }

    getAllowUnitPasting() {
        return this.#allowUnitPasting;
    }

    getContextMenuManager() {
        return this.#contextMenuManager;
    }

    getUseUnitControlPanel() {
        return this.#useUnitControlPanel;
    }

    getUseUnitInfoPanel() {
        return this.#useUnitInfoPanel;
    }

    onSet() {
        this.#onSet();
    }

    onUnset() {
        this.#onUnset();
    }

}