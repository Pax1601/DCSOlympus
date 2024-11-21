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

    AppStateChangedEvent.on(() => (this.#keydown = false));

    /* On keyup, it is enough to check the code only, not the entire combination */
    document.addEventListener("keyup", (ev: any) => {
      if (this.#keydown && options.code === ev.code) {
        ev.preventDefault();
        options.keyUpCallback(ev);
        this.#keydown = false;
      }
    });

    /* On keydown, check exactly if the requested key combination is being pressed */
    document.addEventListener("keydown", (ev: any) => {
      if (
        !(this.#keydown || keyEventWasInInput(ev) || options.code !== ev.code) &&
        (options.altKey === undefined || ev.altKey === (options.altKey ?? ev.code.indexOf("Alt") >= 0)) &&
        (options.ctrlKey === undefined || ev.ctrlKey === (options.ctrlKey ?? ev.code.indexOf("Control") >= 0)) &&
        (options.shiftKey === undefined || ev.shiftKey === (options.shiftKey ?? ev.code.indexOf("Shift") >= 0))
      ) {
        ev.preventDefault();
        this.#keydown = true;

        if (options.keyDownCallback) options.keyDownCallback(ev); /* Key down event is optional */
      }
    });
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

  toActions() {
    let actions: string[] = [];
    if (this.getOptions().shiftKey) actions.push("Shift");
    if (this.getOptions().altKey) actions.push("Alt");
    if (this.getOptions().ctrlKey) actions.push("Ctrl")
    actions.push(this.getOptions().code.replace("Key", "")
    .replace("ControlLeft", "Left Ctrl")
    .replace("AltLeft", "Left Alt")
    .replace("ShiftLeft", "Left Shift")
    .replace("ControlRight", "Right Ctrl")
    .replace("AltRight", "Right Alt")
    .replace("ShiftRight", "Right Shift"))
    return actions
  }
}
