import React from "react";
import { Modal } from "./components/modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { Unit } from "../../unit/unit";
import { FaLock } from "react-icons/fa6";
import { getApp } from "../../olympusapp";
import { OlympusState } from "../../constants/constants";

export function ProtectionPrompt(props: { }) {
  return (
    <Modal
      className={`
        inline-flex h-fit w-[600px] overflow-y-auto scroll-smooth bg-white p-10
        dark:bg-olympus-800
        max-md:h-full max-md:max-h-full max-md:w-full max-md:rounded-none
        max-md:border-none
      `}
    >
      <div className="flex h-full w-full flex-col gap-12">
        <div className={`flex flex-col items-start gap-2`}>
          <span
            className={`
              text-gray-800 text-md
              dark:text-white
            `}
          >
            Your selection contains protected units, are you sure you want to continue?
          </span>
          <span
            className={`
              text-gray-800 text-md
              dark:text-gray-500
            `}
          >
            Pressing "Continue" will cause all DCS controlled units in the current selection to abort their mission and start following Olympus commands only.
          </span>
          <span
            className={`
              text-gray-800 text-md
              dark:text-gray-500
            `}
          >
            If you are trying to delete a human player unit, they will be killed and de-slotted. Be careful!
          </span>
          <span
            className={`
              text-gray-800 text-md
              dark:text-gray-500
            `}
          >
            To disable this warning, press on the <span className={`
              inline-block translate-y-3 rounded-full border-[1px]
              border-gray-900 bg-red-500 p-2 text-olympus-900
            `}><FaLock/></span> button
          </span>
        </div>
        <div className="flex">
          <button
            type="button"
            onClick={() => getApp().getUnitsManager().executeProtectionCallback()}
            className={`
              mb-2 me-2 ml-auto flex content-center items-center gap-2
              rounded-sm bg-blue-700 px-5 py-2.5 text-sm font-medium text-white
              dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
              focus:outline-none focus:ring-4 focus:ring-blue-300
              hover:bg-blue-800
            `}
          >
            Continue
            <FontAwesomeIcon className={`my-auto`} icon={faArrowRight} />
          </button>
          <button
            type="button"
            onClick={() => getApp().setState(OlympusState.UNIT_CONTROL)}
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
