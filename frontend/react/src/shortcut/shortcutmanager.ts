import { RadioSink } from "../audio/radiosink";
import { DEFAULT_CONTEXT } from "../constants/constants";
import { ShortcutKeyboardOptions, ShortcutMouseOptions } from "../interfaces";
import { getApp } from "../olympusapp";
import { ShortcutKeyboard, ShortcutMouse } from "./shortcut";

export class ShortcutManager {
  #items: { [key: string]: any } = {};
  #keysBeingHeld: string[] = [];
  #keyDownCallbacks: CallableFunction[] = [];
  #keyUpCallbacks: CallableFunction[] = [];

  constructor() {
    document.addEventListener("keydown", (ev: KeyboardEvent) => {
      if (this.#keysBeingHeld.indexOf(ev.code) < 0) {
        this.#keysBeingHeld.push(ev.code);
      }
      this.#keyDownCallbacks.forEach((callback) => callback(ev));
    });

    document.addEventListener("keyup", (ev: KeyboardEvent) => {
      this.#keysBeingHeld = this.#keysBeingHeld.filter((held) => held !== ev.code);
      this.#keyUpCallbacks.forEach((callback) => callback(ev));
    });

    this.addKeyboardShortcut("togglePause", {
      altKey: false,
      callback: () => {
        getApp().getServerManager().setPaused(!getApp().getServerManager().getPaused());
      },
      code: "Space",
      context: DEFAULT_CONTEXT,
      ctrlKey: false,
    })
      .addKeyboardShortcut("deselectAll", {
        callback: (ev: KeyboardEvent) => {
          getApp().getUnitsManager().deselectAllUnits();
        },
        code: "Escape",
        context: DEFAULT_CONTEXT,
      })
      .addKeyboardShortcut("toggleUnitLabels", {
        altKey: false,
        callback: () => {
          getApp().getMap().setOption("showUnitLabels", !getApp().getMap().getOptions().showUnitLabels);
        },
        code: "KeyL",
        context: DEFAULT_CONTEXT,
        ctrlKey: false,
        shiftKey: false,
      })
      .addKeyboardShortcut("toggleAcquisitionRings", {
        altKey: false,
        callback: () => {
          getApp().getMap().setOption("showUnitsAcquisitionRings", !getApp().getMap().getOptions().showUnitsAcquisitionRings);
        },
        code: "KeyE",
        context: DEFAULT_CONTEXT,
        ctrlKey: false,
        shiftKey: false,
      })
      .addKeyboardShortcut("toggleEngagementRings", {
        altKey: false,
        callback: () => {
          getApp().getMap().setOption("showUnitsEngagementRings", !getApp().getMap().getOptions().showUnitsEngagementRings);
        },
        code: "KeyQ",
        context: DEFAULT_CONTEXT,
        ctrlKey: false,
        shiftKey: false,
      })
      .addKeyboardShortcut("toggleHideShortEngagementRings", {
        altKey: false,
        callback: () => {
          getApp().getMap().setOption("hideUnitsShortRangeRings", !getApp().getMap().getOptions().hideUnitsShortRangeRings);
        },
        code: "KeyR",
        context: DEFAULT_CONTEXT,
        ctrlKey: false,
        shiftKey: false,
      })
      .addKeyboardShortcut("toggleDetectionLines", {
        altKey: false,
        callback: () => {
          getApp().getMap().setOption("showUnitTargets", !getApp().getMap().getOptions().showUnitTargets);
        },
        code: "KeyF",
        context: DEFAULT_CONTEXT,
        ctrlKey: false,
        shiftKey: false,
      })
      .addKeyboardShortcut("toggleGroupMembers", {
        altKey: false,
        callback: () => {
          getApp().getMap().setOption("hideGroupMembers", !getApp().getMap().getOptions().hideGroupMembers);
        },
        code: "KeyG",
        context: DEFAULT_CONTEXT,
        ctrlKey: false,
        shiftKey: false,
      })
      .addKeyboardShortcut("increaseCameraZoom", {
        altKey: true,
        callback: () => {
          //getApp().getMap().increaseCameraZoom();
        },
        code: "Equal",
        context: DEFAULT_CONTEXT,
        ctrlKey: false,
        shiftKey: false,
      })
      .addKeyboardShortcut("decreaseCameraZoom", {
        altKey: true,
        callback: () => {
          //getApp().getMap().decreaseCameraZoom();
        },
        code: "Minus",
        context: DEFAULT_CONTEXT,
        ctrlKey: false,
        shiftKey: false,
      });

    let PTTKeys = ["KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM", "KeyK", "KeyL"];
    PTTKeys.forEach((key, idx) => {
      this.addKeyboardShortcut(`PTT${idx}Active`, {
        altKey: false,
        callback: () => {
          getApp()
            .getAudioManager()
            .getSinks()
            .filter((sink) => {
              return sink instanceof RadioSink;
            })
            [idx]?.setPtt(true);
        },
        code: key,
        context: DEFAULT_CONTEXT,
        ctrlKey: false,
        shiftKey: false,
        event: "keydown",
      }).addKeyboardShortcut(`PTT${idx}Active`, {
        altKey: false,
        callback: () => {
          getApp()
            .getAudioManager()
            .getSinks()
            .filter((sink) => {
              return sink instanceof RadioSink;
            })
            [idx]?.setPtt(false);
        },
        code: key,
        context: DEFAULT_CONTEXT,
        ctrlKey: false,
        shiftKey: false,
        event: "keyup",
      });
    });

    let panKeys = ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
    panKeys.forEach((code) => {
      this.addKeyboardShortcut(`pan${code}keydown`, {
        altKey: false,
        callback: (ev: KeyboardEvent) => {
          //getApp().getMap().handleMapPanning(ev);
        },
        code: code,
        context: DEFAULT_CONTEXT,
        ctrlKey: false,
        event: "keydown",
      });

      this.addKeyboardShortcut(`pan${code}keyup`, {
        callback: (ev: KeyboardEvent) => {
          //getApp().getMap().handleMapPanning(ev);
        },
        code: code,
        context: DEFAULT_CONTEXT,
      });
    });

    const digits = ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9"];

    digits.forEach((code) => {
      this.addKeyboardShortcut(`hotgroup${code}`, {
        altKey: false,
        callback: (ev: KeyboardEvent) => {
          if (ev.ctrlKey && ev.shiftKey)
            getApp()
              .getUnitsManager()
              .selectUnitsByHotgroup(parseInt(ev.code.substring(5)), false);
          //  "Select hotgroup X in addition to any units already selected"
          else if (ev.ctrlKey && !ev.shiftKey)
            getApp()
              .getUnitsManager()
              .setHotgroup(parseInt(ev.code.substring(5)));
          //  "These selected units are hotgroup X (forget any previous membership)"
          else if (!ev.ctrlKey && ev.shiftKey)
            getApp()
              .getUnitsManager()
              .addToHotgroup(parseInt(ev.code.substring(5)));
          //  "Add (append) these units to hotgroup X (in addition to any existing members)"
          else
            getApp()
              .getUnitsManager()
              .selectUnitsByHotgroup(parseInt(ev.code.substring(5))); //  "Select hotgroup X, deselect any units not in it."
        },
        code: code,
      });

      //  Stop hotgroup controls sending the browser to another tab
      document.addEventListener("keydown", (ev: KeyboardEvent) => {
        if (ev.code === code && ev.ctrlKey === true && ev.altKey === false && ev.shiftKey === false) {
          ev.preventDefault();
        }
      });
    });
  }

  addKeyboardShortcut(name: string, shortcutKeyboardOptions: ShortcutKeyboardOptions) {
    this.#items[name] = new ShortcutKeyboard(shortcutKeyboardOptions);
    return this;
  }

  addMouseShortcut(name: string, shortcutMouseOptions: ShortcutMouseOptions) {
    this.#items[name] = new ShortcutMouse(shortcutMouseOptions);
    return this;
  }

  getKeysBeingHeld() {
    return this.#keysBeingHeld;
  }

  keyComboMatches(combo: string[]) {
    const heldKeys = this.getKeysBeingHeld();
    if (combo.length !== heldKeys.length) {
      return false;
    }

    return combo.every((key) => heldKeys.indexOf(key) > -1);
  }

  onKeyDown(callback: CallableFunction) {
    this.#keyDownCallbacks.push(callback);
  }

  onKeyUp(callback: CallableFunction) {
    this.#keyUpCallbacks.push(callback);
  }
}
