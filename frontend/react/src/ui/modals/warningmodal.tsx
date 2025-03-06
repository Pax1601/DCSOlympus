import React, { useEffect, useState } from "react";
import { Modal } from "./components/modal";
import { FaExclamationTriangle } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { getApp } from "../../olympusapp";
import { MAP_OPTIONS_DEFAULTS, NO_SUBSTATE, OlympusState, WarningSubstate } from "../../constants/constants";
import { AppStateChangedEvent, MapOptionsChangedEvent } from "../../events";
import { OlCheckbox } from "../components/olcheckbox";

export function WarningModal(props: { open: boolean }) {
  const [appState, setAppState] = useState(OlympusState.NOT_INITIALIZED);
  const [appSubState, setAppSubState] = useState(NO_SUBSTATE);
  const [mapOptions, setMapOptions] = useState(MAP_OPTIONS_DEFAULTS);

  useEffect(() => {
    AppStateChangedEvent.on((appState, appSubState) => {
      setAppState(appState);
      setAppSubState(appSubState);
    });
    MapOptionsChangedEvent.on((mapOptions) => setMapOptions({ ...mapOptions }));
  }, []);

  let warningText;
  if (appState === OlympusState.WARNING) {
    switch (appSubState) {
      case WarningSubstate.NOT_CHROME:
        warningText = (
          <div className="flex flex-col gap-2 text-gray-400">
            <span>Non-Google Chrome Browser Detected.</span>
            <span>It appears you are using a browser other than Google Chrome.</span>
            <span>
              If you encounter any problems, we strongly suggest you use a Chrome based browser. Many features, especially advanced ones such as audio playback
              and capture, were developed specifically for Chrome based browsers.{" "}
            </span>
            <div className="mt-5 flex gap-4">
              <OlCheckbox
                checked={mapOptions.hideChromeWarning}
                onChange={() => {
                  getApp().getMap().setOption("hideChromeWarning", !mapOptions.hideChromeWarning);
                }}
              />{" "}
              <span>Don't show this warning again</span>
            </div>
          </div>
        );
        break;
      case WarningSubstate.NOT_SECURE:
      case WarningSubstate.NOT_CHROME:
        warningText = (
          <div className="flex flex-col gap-2 text-gray-400">
            <span>Your connection to DCS Olympus is not secure.</span>
            <span>To protect your personal data some advanced DCS Olympus features like the camera plugin or the audio backend have been disabled.</span>
            <span>
              To solve this issue, DCS Olympus should be served using the{" "}
              <span
                className={`italic`}
              >
                https
              </span>{" "}
              protocol.
            </span>
            <span>To do so, we suggest using a dedicated server and a reverse proxy with SSL enabled.</span>
            <div className="mt-5 flex gap-4">
              <OlCheckbox
                checked={mapOptions.hideSecureWarning}
                onChange={() => {
                  getApp().getMap().setOption("hideSecureWarning", !mapOptions.hideSecureWarning);
                }}
              />{" "}
              <span>Don't show this warning again</span>
            </div>
          </div>
        );
        break;
      default:
        break;
    }
  }

  return (
    <Modal open={props.open}>
      <div className="flex gap-2 text-xl text-white">
        <FaExclamationTriangle className={`my-auto text-4xl text-yellow-300`} />
        <div className="my-auto">Warning</div>
      </div>
      <div className="mt-10 text-white">{warningText}</div>
      <div className="ml-auto mt-auto flex">
        <button
          type="button"
          onClick={() => getApp().setState(OlympusState.IDLE)}
          className={`
            mb-2 me-2 flex content-center items-center gap-2 rounded-sm
            bg-blue-700 px-5 py-2.5 text-sm font-medium text-white
            dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
            focus:outline-none focus:ring-4 focus:ring-blue-300
            hover:bg-blue-800
          `}
        >
          Continue
          <FontAwesomeIcon className={`my-auto`} icon={faArrowRight} />
        </button>
      </div>
    </Modal>
  );
}
