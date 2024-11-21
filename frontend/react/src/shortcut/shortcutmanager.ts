import { ShortcutChangedEvent, ShortcutsChangedEvent } from "../events";
import { ShortcutOptions } from "../interfaces";
import { Shortcut } from "./shortcut";

export class ShortcutManager {
  #shortcuts: { [key: string]: Shortcut } = {};

  constructor() {}

  addShortcut(id: string, shortcutOptions: ShortcutOptions) {
    this.#shortcuts[id] = new Shortcut(id, shortcutOptions);
    ShortcutsChangedEvent.dispatch(this.#shortcuts);
    return this;
  }

  getShortcut(id) {
    return this.#shortcuts[id];
  }

  getShortcuts() {
    return this.#shortcuts;
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
              shortcut.getOptions().code === otherShortcut.getOptions().code &&
              ((shortcut.getOptions().shiftKey === undefined && otherShortcut.getOptions().shiftKey !== undefined) ||
                (shortcut.getOptions().shiftKey !== undefined && otherShortcut.getOptions().shiftKey === undefined) ||
                shortcut.getOptions().shiftKey === otherShortcut.getOptions().shiftKey) &&
              ((shortcut.getOptions().altKey === undefined && otherShortcut.getOptions().altKey !== undefined) ||
                (shortcut.getOptions().altKey !== undefined && otherShortcut.getOptions().altKey === undefined) ||
                shortcut.getOptions().altKey === otherShortcut.getOptions().altKey) &&
              ((shortcut.getOptions().ctrlKey === undefined && otherShortcut.getOptions().ctrlKey !== undefined) ||
                (shortcut.getOptions().ctrlKey !== undefined && otherShortcut.getOptions().ctrlKey === undefined) ||
                shortcut.getOptions().ctrlKey === otherShortcut.getOptions().ctrlKey)
            ) {
              console.error("Duplicate shortcut: " + shortcut.getOptions().label + " and " + otherShortcut.getOptions().label);
            }
          }
        }
      }
    }
  }
}
