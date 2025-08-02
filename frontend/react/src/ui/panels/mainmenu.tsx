import React from "react";
import { Menu } from "./components/menu";
import { faArrowRightLong, faCheckCircle, faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getApp, VERSION } from "../../olympusapp";
import { ImportExportSubstate, OlympusState } from "../../constants/constants";

export function MainMenu(props: { open: boolean; onClose: () => void; children?: JSX.Element | JSX.Element[] }) {
  return (
    <Menu title="Main Menu" open={props.open} showBackButton={false} onClose={props.onClose} wikiDisabled={true}>
      <div
        className={`
          flex flex-col gap-1 p-5 font-normal text-gray-900
          dark:text-white
        `}
      >
        <div className="mb-1">
          <div
            className={`
              mb-2 flex select-none content-center gap-2 rounded-sm text-lg
              font-bold text-green-700
              dark:text-green-400
            `}
          >
            <FontAwesomeIcon icon={faCheckCircle} className={`my-auto`} />
            Olympus Version {VERSION}
          </div>
          <div className="text-sm text-gray-400">You can use the Olympus Manager to update port, passwords or other settings.</div>
        </div>

        <div
          className={`
            group flex cursor-pointer select-none content-center gap-3
            rounded-md p-2
            dark:hover:bg-olympus-500
            hover:bg-gray-900/10
          `}
          onClick={() => window.open("https://github.com/Pax1601/DCSOlympus")}
        >
          {/*<FontAwesomeIcon icon={faGithub} className="my-auto w-4 text-gray-800 dark:text-gray-500" />*/}
          View GitHub Repo
          <FontAwesomeIcon
            icon={faExternalLinkAlt}
            className={`
              my-auto w-4 text-sm text-gray-800
              dark:text-gray-500
            `}
          />
          <div className={`ml-auto flex items-center`}>
            <FontAwesomeIcon
              icon={faArrowRightLong}
              className={`
                my-auto px-2 text-right text-gray-800 transition-transform
                dark:text-olympus-50
                group-hover:translate-x-2
              `}
            />
          </div>
        </div>
        <div
          className={`
            group flex cursor-pointer select-none content-center gap-3
            rounded-md p-2
            dark:hover:bg-olympus-500
            hover:bg-gray-900/10
          `}
          onClick={() => window.open("https://github.com/Pax1601/DCSOlympus/wiki")}
        >
          {/*<FontAwesomeIcon icon={faFile} className="my-auto w-4  text-gray-800 dark:text-gray-500" />*/}
          View User Guide
          <FontAwesomeIcon
            icon={faExternalLinkAlt}
            className={`
              my-auto w-4 text-sm text-gray-800
              dark:text-gray-500
            `}
          />
          <div className={`ml-auto flex items-center`}>
            <FontAwesomeIcon
              icon={faArrowRightLong}
              className={`
                my-auto px-2 text-right text-gray-800 transition-transform
                dark:text-olympus-50
                group-hover:translate-x-2
              `}
            />
          </div>
        </div>
        <hr
          className={`
            m-2 my-1 w-auto border-[1px] bg-gray-700
            dark:border-olympus-500
          `}
        ></hr>

        <div
          className={`
            group flex cursor-pointer select-none content-center gap-3
            rounded-md p-2
            dark:hover:bg-olympus-500
            hover:bg-gray-900/10
          `}
          onClick={() => {
            getApp().setState(OlympusState.IMPORT_EXPORT, ImportExportSubstate.EXPORT);
          }}
        >
          {/*<FontAwesomeIcon icon={faFileExport} className="my-auto w-4 text-gray-800 dark:text-gray-500" />*/}
          Export to file
          <div className={`ml-auto flex items-center`}>
            <FontAwesomeIcon
              icon={faArrowRightLong}
              className={`
                my-auto px-2 text-right text-gray-800 transition-transform
                dark:text-olympus-50
                group-hover:translate-x-2
              `}
            />
          </div>
        </div>
        <div
          className={`
            group flex cursor-pointer select-none content-center gap-3
            rounded-md p-2
            dark:hover:bg-olympus-500
            hover:bg-gray-900/10
          `}

          onClick={() => {
            getApp().setState(OlympusState.IMPORT_EXPORT, ImportExportSubstate.IMPORT);
          }}
        >
          {/*<FontAwesomeIcon icon={faFileImport} className="my-auto w-4 text-gray-800 dark:text-gray-500" />*/}
          Import from file
          <div className={`ml-auto flex items-center`}>
            <FontAwesomeIcon
              icon={faArrowRightLong}
              className={`
                my-auto px-2 text-right text-gray-800 transition-transform
                dark:text-olympus-50
                group-hover:translate-x-2
              `}
            />
          </div>
        </div>
      </div>
    </Menu>
  );
}
