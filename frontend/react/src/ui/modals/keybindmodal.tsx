import React, { useEffect, useState } from "react";
import { Modal } from "./components/modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { getApp } from "../../olympusapp";
import { OlympusState } from "../../constants/constants";
import { Shortcut } from "../../shortcut/shortcut";
import { BindShortcutRequestEvent, ShortcutsChangedEvent } from "../../events";

export function KeybindModal(props: { open: boolean }) {
  const [shortcuts, setShortcuts] = useState({} as { [key: string]: Shortcut });
  const [shortcut, setShortcut] = useState(null as null | Shortcut);
  const [code, setCode] = useState(null as null | string);
  const [shiftKey, setShiftKey] = useState(false as boolean | undefined);
  const [ctrlKey, setCtrlKey] = useState(false as boolean | undefined);
  const [altKey, setAltKey] = useState(false as boolean | undefined);

  useEffect(() => {
    ShortcutsChangedEvent.on((shortcuts) => setShortcuts({ ...shortcuts }));
    BindShortcutRequestEvent.on((shortcut) => setShortcut(shortcut));

    document.addEventListener("keydown", (ev) => {
      if (ev.code) {
        setCode(ev.code);
        if (ev.code.indexOf("Control") < 0) setCtrlKey(ev.ctrlKey);
        else setCtrlKey(false);
        if (ev.code.indexOf("Shift") < 0) setShiftKey(ev.shiftKey);
        else setShiftKey(false);
        if (ev.code.indexOf("Alt") < 0) setAltKey(ev.altKey);
        else setAltKey(false);
      }
    });
  }, []);

  useEffect(() => {
    setCode(shortcut?.getOptions().code ?? null);
    setShiftKey(shortcut?.getOptions().shiftKey);
    setAltKey(shortcut?.getOptions().altKey);
    setCtrlKey(shortcut?.getOptions().ctrlKey);
  }, [shortcut]);

  let available: null | boolean = code ? true : null;
  let inUseShortcuts: Shortcut[] = [];
  for (let id in shortcuts) {
    if (
      id !== shortcut?.getId() &&
      code === shortcuts[id].getOptions().code &&
      ((shiftKey === undefined && shortcuts[id].getOptions().shiftKey !== undefined) ||
        (shiftKey !== undefined && shortcuts[id].getOptions().shiftKey === undefined) ||
        shiftKey === shortcuts[id].getOptions().shiftKey) &&
      ((altKey === undefined && shortcuts[id].getOptions().altKey !== undefined) ||
        (altKey !== undefined && shortcuts[id].getOptions().altKey === undefined) ||
        altKey === shortcuts[id].getOptions().altKey) &&
      ((ctrlKey === undefined && shortcuts[id].getOptions().ctrlKey !== undefined) ||
        (ctrlKey !== undefined && shortcuts[id].getOptions().ctrlKey === undefined) ||
        ctrlKey === shortcuts[id].getOptions().ctrlKey)
    ) {
      available = false;
      inUseShortcuts.push(shortcuts[id]);
    }
  }

  return (
    <Modal open={props.open} size={"sm"}>
      <div className="flex flex-col gap-4 h-full w-full">
      <div className={`flex flex-col gap-2`}>
        <span
          className={`
            text-gray-800 text-md
            dark:text-white
          `}
        >
          {shortcut?.getOptions().label}
        </span>
        <span
          className={`
            text-gray-800 text-md
            dark:text-gray-400
          `}
        >
          Press the key you want to bind to this event
        </span>
      </div>
      <div className="w-full text-center text-white">
        {ctrlKey && "Ctrl + "}
        {altKey && "Alt + "}
        {shiftKey && "Shift + "}
        {code}
      </div>
      <div className="text-white">
        {available === true && <div className="text-green-600">Keybind is free!</div>}
        {available === false && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              Keybind is already in use:{" "}
              <div
                className={`flex flex-wrap gap-2 font-bold text-orange-600`}
              >
                {inUseShortcuts.map((shortcut) => (
                  <span>{shortcut.getOptions().label}</span>
                ))}
              </div>
            </div>
            <div className="text-gray-400">A key combination can be assigned to multiple actions, and all bound actions will fire</div>
          </div>
        )}
      </div>
      <div className="flex justify-end mt-auto ">
        {shortcut && (
          <button
            type="button"
            onClick={() => {
              if (shortcut && code) {
                let options = shortcut.getOptions();
                options.code = code;
                options.altKey = altKey;
                options.shiftKey = shiftKey;
                options.ctrlKey = ctrlKey;
                getApp().getShortcutManager().setShortcutOption(shortcut.getId(), options);

                getApp().setState(OlympusState.OPTIONS);
              }
            }}
            className={`
              mb-2 me-2 ml-auto flex content-center items-center gap-2
              rounded-sm bg-blue-700 px-5 py-2.5 text-sm font-medium text-white
              dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
              focus:outline-none focus:ring-4 focus:ring-blue-300
              hover:bg-blue-800
            `}
          >
            Continue
            <FontAwesomeIcon icon={faArrowRight} />
          </button>
        )}
        <button
          type="button"
          onClick={() => getApp().setState(OlympusState.OPTIONS)}
          className={`
            mb-2 me-2 flex content-center items-center gap-2 rounded-sm
            border-[1px] bg-blue-700 px-5 py-2.5 text-sm font-medium text-white
            dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400
            dark:hover:bg-gray-700 dark:focus:ring-blue-800
            focus:outline-none focus:ring-4 focus:ring-blue-300
            hover:bg-blue-800
          `}
        >
          Back
        </button>
      </div>
      </div>
    </Modal>
  );
}
