import { AppStateChangedEvent, ShortcutChangedEvent, ShortcutsChangedEvent } from "../events";
import { ShortcutOptions } from "../interfaces";
import { keyEventWasInInput } from "../other/utils";

export class Shortcut {
  #id: string;
  #options: ShortcutOptions;
  #keydown: boolean = false;

  constructor(id, options: ShortcutOptions) {
    this.#id = id;
    this.#options = options;

    AppStateChangedEvent.on(() => this.#keydown = false)
    
    /* Key up event is mandatory */
    document.addEventListener("keyup", (ev: any) => {
      this.#keydown = false;
      if (keyEventWasInInput(ev) || options.code !== ev.code) return;
      if (
        ev.altKey === (options.altKey ?? ev.code.indexOf("Alt") >= 0) &&
        ev.ctrlKey === (options.ctrlKey ?? ev.code.indexOf("Ctrl") >= 0) &&
        ev.shiftKey === (options.shiftKey ?? ev.code.indexOf("Shift") >= 0)
      )
        options.keyUpCallback(ev);
    });

    /* Key down event is optional */
    if (options.keyDownCallback) {
      document.addEventListener("keydown", (ev: any) => {
        if (this.#keydown || keyEventWasInInput(ev) || options.code !== ev.code) return;
        this.#keydown = true;
        if (
          ev.altKey === (options.altKey ?? ev.code.indexOf("Alt") >= 0) &&
          ev.ctrlKey === (options.ctrlKey ?? ev.code.indexOf("Control") >= 0) &&
          ev.shiftKey === (options.shiftKey ?? ev.code.indexOf("Shift") >= 0)
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
