import { OlympusState } from "../constants/constants";
import { AppStateChangedEvent, ModalEvent, ShortcutChangedEvent, ShortcutsChangedEvent } from "../events";
import { ShortcutOptions } from "../interfaces";
import { keyEventWasInInput } from "../other/utils";

export class Shortcut {
  #id: string;
  #options: ShortcutOptions;
  #keydown: boolean = false;
  #modal: boolean = false;

  constructor(id, options: ShortcutOptions) {
    this.#id = id;
    this.#options = options;

    /* I don't know why I set this, may be a leftover from initial shortcut experiments. 
    If enabled, it will cause the keydown to be reset when the app state changes, which may 
    cause shortcuts that cause a state change (like unit selection) to remain stuck. */
    //AppStateChangedEvent.on((state, subState) => (this.#keydown = false)); 
    
    ModalEvent.on((modal) => (this.#modal = modal));

    /* On keyup, it is enough to check the code only, not the entire combination */
    window.addEventListener("keyup", (ev: any) => {
      if (this.#modal) return;
      if (this.#keydown && this.getOptions().code === ev.code) {
        console.log(`Keyup for shortcut ${this.#id}`);
        ev.preventDefault();
        this.#keydown = false;
        this.getOptions().keyUpCallback(ev);
      }
    });

    /* Forced keyup, in case the window loses focus */
    window.addEventListener("blur", (ev: any) => {
      if (this.#keydown) {
        console.log(`Keyup (forced by blur) for shortcut ${this.#id}`);
        ev.preventDefault();
        this.#keydown = false;
        this.getOptions().keyUpCallback(ev);
      }
    });

    /* On keydown, check exactly if the requested key combination is being pressed */
    window.addEventListener("keydown", (ev: any) => {
      if (this.#modal) return;
      if (
        !(this.#keydown || keyEventWasInInput(ev) || this.getOptions().code !== ev.code) &&
        (this.getOptions().altKey === undefined || ev.altKey === (this.getOptions().altKey ?? ev.code.indexOf("Alt") >= 0)) &&
        (this.getOptions().ctrlKey === undefined || ev.ctrlKey === (this.getOptions().ctrlKey ?? ev.code.indexOf("Control") >= 0)) &&
        (this.getOptions().shiftKey === undefined || ev.shiftKey === (this.getOptions().shiftKey ?? ev.code.indexOf("Shift") >= 0))
      ) {
        console.log(`Keydown event for shortcut ${this.#id}`);
        ev.preventDefault();
        this.#keydown = true;
        const keyDownCallback = this.getOptions().keyDownCallback;
        if (keyDownCallback) keyDownCallback(ev); /* Key down event is optional */
      }
    });
  }

  getOptions() {
    return this.#options;
  }

  setOptions(options: ShortcutOptions) {
    this.#options = { ...this.#options, ...options };
  }

  getId() {
    return this.#id;
  }

  toActions() {
    let actions: string[] = [];
    if (this.getOptions().shiftKey) actions.push("Shift");
    if (this.getOptions().altKey) actions.push("Alt");
    if (this.getOptions().ctrlKey) actions.push("Ctrl");
    actions.push(
      this.getOptions()
        .code.replace("Key", "")
        .replace("ControlLeft", "Left Ctrl")
        .replace("AltLeft", "Left Alt")
        .replace("ShiftLeft", "Left Shift")
        .replace("ControlRight", "Right Ctrl")
        .replace("AltRight", "Right Alt")
        .replace("ShiftRight", "Right Shift")
    );
    return actions;
  }

  #setKeydown(keydown: boolean) {
    this.#keydown = keydown;
  }
}
