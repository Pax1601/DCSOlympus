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
  const [shiftKey, setShiftKey] = useState(false);
  const [ctrlKey, setCtrlKey] = useState(false);
  const [altKey, setAltKey] = useState(false);

  useEffect(() => {
    ShortcutsChangedEvent.on((shortcuts) => setShortcuts({ ...shortcuts }));
    BindShortcutRequestEvent.on((shortcut) => setShortcut(shortcut));

    document.addEventListener("keydown", (ev) => {
      setCode(ev.code);
      if (!(ev.code.indexOf("Shift") >= 0 || ev.code.indexOf("Alt") >= 0 || ev.code.indexOf("Control") >= 0)) {
        setShiftKey(ev.shiftKey);
        setAltKey(ev.altKey);
        setCtrlKey(ev.ctrlKey);
      }
    });
  }, []);

  let available: null | boolean = code ? true : null;
  let inUseShortcut: null | Shortcut = null;
  for (let id in shortcuts) {
    if (
      code === shortcuts[id].getOptions().code &&
      shiftKey === (shortcuts[id].getOptions().shiftKey ?? false) &&
      altKey === (shortcuts[id].getOptions().altKey ?? false) &&
      ctrlKey === (shortcuts[id].getOptions().shiftKey ?? false)
    ) {
      available = false;
      inUseShortcut = shortcuts[id];
    }
  }

  return (
    <>
      {props.open && (
        <>
          <Modal
            className={`
              inline-flex h-fit w-[600px] overflow-y-auto scroll-smooth bg-white
              p-10
              dark:bg-olympus-800
              max-md:h-full max-md:max-h-full max-md:w-full max-md:rounded-none
              max-md:border-none
            `}
          >
            <div className="flex h-full w-full flex-col gap-4">
              <div className={`flex flex-col items-start gap-2`}>
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
                    dark:text-gray-500
                  `}
                >
                  Press the key you want to bind to this event
                </span>
              </div>
              <div className="w-full text-center text-white">
                {ctrlKey ? "Ctrl + " : ""}
                {shiftKey ? "Shift + " : ""}
                {altKey ? "Alt + " : ""}

                {code}
              </div>
              <div className="text-white">
                {available === true && <div className="text-green-600">Keybind is free!</div>}
                {available === false && (
                  <div>
                    Keybind is already in use:{" "}
                    <span
                      className={`font-bold text-red-600`}
                    >
                      {inUseShortcut?.getOptions().label}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                {available && shortcut && (
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
                      rounded-sm bg-blue-700 px-5 py-2.5 text-sm font-medium
                      text-white
                      dark:bg-blue-600 dark:hover:bg-blue-700
                      dark:focus:ring-blue-800
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
                    border-[1px] bg-blue-700 px-5 py-2.5 text-sm font-medium
                    text-white
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
          <div className={`fixed left-0 top-0 z-30 h-full w-full bg-[#111111]/95`}></div>
        </>
      )}
    </>
  );
}
