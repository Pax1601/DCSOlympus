import { ShortcutChangedEvent, ShortcutsChangedEvent } from "../events";
import { ShortcutOptions } from "../interfaces";
import { keyEventWasInInput } from "../other/utils";

export class Shortcut {
  #id: string;
  #options: ShortcutOptions;

  constructor(id, options: ShortcutOptions) {
    this.#id = id;
    this.#options = options;

    /* Key up event is mandatory */
    document.addEventListener("keyup", (ev: any) => {
      if (keyEventWasInInput(ev) || options.code !== ev.code) return;
      if (
        (typeof options.altKey !== "boolean" || (typeof options.altKey === "boolean" && ev.altKey === options.altKey)) &&
        (typeof options.ctrlKey !== "boolean" || (typeof options.ctrlKey === "boolean" && ev.ctrlKey === options.ctrlKey)) &&
        (typeof options.shiftKey !== "boolean" || (typeof options.shiftKey === "boolean" && ev.shiftKey === options.shiftKey))
      )
        options.keyUpCallback(ev);
    });

    /* Key down event is optional */
    if (options.keyDownCallback) {
      document.addEventListener("keydown", (ev: any) => {
        if (keyEventWasInInput(ev) || options.code !== ev.code) return;
        if (
          (typeof options.altKey !== "boolean" || (typeof options.altKey === "boolean" && ev.altKey === options.altKey)) &&
          (typeof options.ctrlKey !== "boolean" || (typeof options.ctrlKey === "boolean" && ev.ctrlKey === options.ctrlKey)) &&
          (typeof options.shiftKey !== "boolean" || (typeof options.shiftKey === "boolean" && ev.shiftKey === options.shiftKey))
        )
          if (options.keyDownCallback) options.keyDownCallback(ev);
      });
    }
  }

  getOptions() {
    return this.#options;
  }

  setOptions(options: ShortcutOptions) {
    this.#options = { ...options };
  }

  getId() {
    return this.#id;
  }
}
