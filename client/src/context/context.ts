import { ContextMenuManager, contextMenuManagerConfig, contextMenuTypes } from "./contextmenumanager";

export type contextConfig = {
    allowUnitCopying?: boolean;
    allowUnitPasting?: boolean;
    contextMenus?: contextMenuManagerConfig;
    onSet?: CallableFunction;
    onUnset?: CallableFunction;
    useMouseInfoPanel?: boolean;
    useUnitControlPanel?: boolean;
    useUnitInfoPanel?: boolean;
}

export class Context {
    #allowUnitCopying: boolean;
    #allowUnitPasting: boolean;
    #contextMenuManager: ContextMenuManager;
    #onSet: CallableFunction;
    #onUnset: CallableFunction;
    #useMouseInfoPanel: boolean;
    #useUnitControlPanel: boolean;
    #useUnitInfoPanel: boolean;

    constructor(config: contextConfig) {
        this.#allowUnitCopying = (config.allowUnitCopying !== false);
        this.#allowUnitPasting = (config.allowUnitPasting !== false);
        this.#onSet = config.onSet || function () { };
        this.#onUnset = config.onUnset || function () { };
        this.#useMouseInfoPanel = (config.useMouseInfoPanel !== false);
        this.#useUnitControlPanel = (config.useUnitControlPanel !== false);
        this.#useUnitInfoPanel = (config.useUnitInfoPanel !== false);

        this.#contextMenuManager = new ContextMenuManager(config.contextMenus)
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

    getUseMouseInfoPanel() {
        return this.#useMouseInfoPanel;
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