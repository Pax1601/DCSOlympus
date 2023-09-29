import { ShortcutKeyboardOptions, ShortcutMouseOptions, ShortcutOptions } from "../interfaces";
import { keyEventWasInInput } from "../other/utils";

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
            if (ev instanceof KeyboardEvent === false || keyEventWasInInput(ev)) {
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