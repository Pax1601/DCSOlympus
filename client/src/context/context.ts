import { ShortcutManager } from "../shortcut/shortcutmanager";


export interface ContextInterface {

}

export class Context {

    #shortcutManager: ShortcutManager;

    constructor( config:ContextInterface ) {

        this.#shortcutManager = new ShortcutManager();

    }

    getShortcutManager() {
        return this.#shortcutManager;
    }

}