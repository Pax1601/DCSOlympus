import React, { useEffect, useState } from "react";
import { Modal } from "./components/modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { getApp } from "../../olympusapp";
import { ImportExportSubstate, NO_SUBSTATE, OlympusState } from "../../constants/constants";
import { AppStateChangedEvent, SelectedStaticsChangedEvent } from "../../events";
import { Static } from "../../mission/static";

export function StaticsImportExportModal(props: { open: boolean }) {
  const [appState, setAppState] = useState(OlympusState.NOT_INITIALIZED);
  const [appSubState, setAppSubState] = useState(NO_SUBSTATE);
  const [selectedStatics, setSelectedStatics] = useState<Static[]>([]);

  useEffect(() => {
    AppStateChangedEvent.on((appState, appSubState) => {
      setAppState(appState);
      setAppSubState(appSubState);
    });

    SelectedStaticsChangedEvent.on((statics) => {
      setSelectedStatics(statics);
    });
  }, []);

  return (
    <Modal open={props.open} className={``}>
      <div className="flex h-full w-full flex-col justify-between">
        <div className={`flex flex-col justify-between gap-2`}>
          <span
            className={`
              text-gray-800 text-md
              dark:text-white
            `}
          >
            {appSubState === ImportExportSubstate.EXPORT_STATICS ? "Export statics to file" : "Import statics from file"}
          </span>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              // TODO
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

          <button
            type="button"
            onClick={() => getApp().setState(OlympusState.IDLE)}
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
  );
}
