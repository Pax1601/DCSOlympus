import { getApp } from "..";
import { ShortcutKeyboardOptions, ShortcutMouseOptions, ShortcutOptions } from "../interfaces";

export abstract class Shortcut {
    #config: ShortcutOptions

    constructor(config: ShortcutOptions) {
        this.#config = config;
    }

    getConfig() {
        return this.#config;
    }
}

export class ShortcutKeyboard extends Shortcut {
    constructor(config: ShortcutKeyboardOptions) {
        config.event = config.event || "keyup";
        super(config);

        document.addEventListener(config.event, (ev: any) => {
            if ( typeof config.context === "string" && !getApp().getContextManager().currentContextIs( config.context ) ) {
                return;
            }

            if (ev instanceof KeyboardEvent === false || getApp().getUtilities().keyEventWasInInput(ev)) {
                return;
            }

            if (config.code !== ev.code) {
                return;
            }

            if (((typeof config.altKey !== "boolean") || (typeof config.altKey === "boolean" && ev.altKey === config.altKey))
                && ((typeof config.ctrlKey !== "boolean") || (typeof config.ctrlKey === "boolean" && ev.ctrlKey === config.ctrlKey))
                && ((typeof config.shiftKey !== "boolean") || (typeof config.shiftKey === "boolean" && ev.shiftKey === config.shiftKey))) {
                config.callback(ev);
            }
        });
    }
}

export class ShortcutMouse extends Shortcut {
    constructor(config: ShortcutMouseOptions) {
        super(config);
    }
}