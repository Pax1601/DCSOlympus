import { ShortcutChangedEvent, ShortcutsChangedEvent } from "../events";
import { ShortcutOptions } from "../interfaces";
import { Shortcut } from "./shortcut";

export class ShortcutManager {
  #shortcuts: { [key: string]: Shortcut } = {};

  constructor() {
    //  Stop ctrl+digits from sending the browser to another tab
    document.addEventListener("keydown", (ev: KeyboardEvent) => {
      if (ev.code.indexOf("Digit") >= 0 && ev.ctrlKey === true && ev.altKey === false && ev.shiftKey === false) {
        ev.preventDefault();
      }
    });
  }

  addShortcut(id: string, shortcutOptions: ShortcutOptions) {
    this.#shortcuts[id] = new Shortcut(id, shortcutOptions);
    ShortcutsChangedEvent.dispatch(this.#shortcuts);
    return this;
  }

  getShortcutsOptions() {
    let shortcutsOptions = {};
    for (let id in this.#shortcuts) {
      shortcutsOptions[id] = this.#shortcuts[id].getOptions();
    }
    return shortcutsOptions;
  }

  setShortcutsOptions(shortcutOptions: { [key: string]: ShortcutOptions }) {
    for (let id in shortcutOptions) {
      this.#shortcuts[id].setOptions(shortcutOptions[id]);
    }
    ShortcutsChangedEvent.dispatch(this.#shortcuts);
  }

  setShortcutOption(id: string, shortcutOptions: ShortcutOptions) {
    this.#shortcuts[id].setOptions(shortcutOptions);
    ShortcutsChangedEvent.dispatch(this.#shortcuts);
  }

  checkShortcuts() {
    for (let id in this.#shortcuts) {
      const shortcut = this.#shortcuts[id];
      for (let otherid in this.#shortcuts) {
        if (id != otherid) {
          const otherShortcut = this.#shortcuts[otherid];
          if (shortcut.getOptions().code === otherShortcut.getOptions().code) {
            if (
              (shortcut.getOptions().altKey ?? false) === (otherShortcut.getOptions().altKey ?? false) &&
              (shortcut.getOptions().ctrlKey ?? false) === (otherShortcut.getOptions().ctrlKey ?? false) &&
              (shortcut.getOptions().shiftKey ?? false) === (otherShortcut.getOptions().shiftKey ?? false) 
            ) {
              console.error("Duplicate shortcut: " + shortcut.getOptions().label + " and " + otherShortcut.getOptions().label)
            }
          }
        }
      }
    }
  }
}
