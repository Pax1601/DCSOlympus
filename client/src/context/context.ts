import { getApp } from "..";
import { Panel } from "../panels/panel";
import { ContextMenuManager, contextMenuManagerConfig } from "./contextmenumanager";

export type contextConfig = {
    allowUnitCopying?: boolean;
    allowUnitPasting?: boolean;
    contextMenus?: contextMenuManagerConfig;
    onSet?: CallableFunction;
    onUnset?: CallableFunction;
    panels?: { [key: string]: boolean };
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
    #panels: { [key: string]: boolean };
    #useMouseInfoPanel: boolean;
    #useUnitControlPanel: boolean;
    #useUnitInfoPanel: boolean;

    constructor(config: contextConfig) {
        this.#allowUnitCopying = (config.allowUnitCopying !== false);
        this.#allowUnitPasting = (config.allowUnitPasting !== false);
        this.#onSet = config.onSet || function () { };
        this.#onUnset = config.onUnset || function () { };
        this.#panels = config.panels || {};
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
        const allPanels = getApp().getPanelsManager().getAll();
        const panels = this.#panels;
        for (let [panelName, panel] of Object.entries(allPanels)) {
            panel = panel as Panel;
            let bool = (typeof panels[panelName] !== "boolean") ? panel.getShowByDefault() : panels[panelName];
            panel.toggle(bool);
        }

        this.#onSet();
    }

    onUnset() {
        this.#onUnset();
    }

}