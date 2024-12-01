import React, { useEffect, useState } from "react";
import { Modal } from "./components/modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faCheck, faUpload } from "@fortawesome/free-solid-svg-icons";
import { getApp } from "../../olympusapp";
import { OlympusState } from "../../constants/constants";
import { SessionDataLoadedEvent } from "../../events";

export function FileSourceLoadPrompt(props: { open: boolean }) {
  const [files, setFiles] = useState([] as { filename: string; volume: number }[]);
  const [loaded, setLoaded] = useState([] as boolean[]);

  useEffect(() => {
    SessionDataLoadedEvent.on((sessionData) => {
      if (getApp().getState() === OlympusState.LOAD_FILES) return; // TODO don't like this, is hacky Should avoid reading state directly
      if (sessionData.fileSources) {
        setFiles([...sessionData.fileSources]);
        setLoaded(
          sessionData.fileSources.map((file) => {
            return false;
          })
        );
      }
    });
  }, []);

  return (
    <Modal
      open={props.open}
      className={`
        inline-flex h-fit max-h-[800px] w-[600px] overflow-y-auto scroll-smooth
        bg-white p-10
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
            Please, select the files for the following audio sources
          </span>
          <span
            className={`
              text-gray-800 text-md
              dark:text-gray-500
            `}
          >
            Browsers can't automatically load files from your computer, therefore you must click on the following buttons to select the original files for each
            audio file source.
          </span>
          <span
            className={`
              text-gray-800 text-md
              dark:text-gray-500
            `}
          >
            If you don't want to reload your audio sources, press "Skip".
          </span>
          <div className="mt-4 w-full">
            {files.map((fileData, idx) => {
              return (
                <div
                  className={`flex w-full content-center justify-between gap-4`}
                >
                  <span className={`my-auto truncate text-white`}>{fileData.filename}</span>
                  <button
                    type="button"
                    disabled={loaded[idx] === true || (idx > 0 && loaded[idx - 1] == false)}
                    data-disabled={loaded[idx] === true || (idx > 0 && loaded[idx - 1] == false)}
                    onClick={() => {
                      var input = document.createElement("input");
                      input.type = "file";
                      input.click();
                      input.onchange = (e: Event) => {
                        let target = e.target as HTMLInputElement;
                        if (target && target.files) {
                          var file = target.files[0];
                          getApp().getAudioManager().addFileSource(file).setVolume(fileData.volume);
                          loaded[idx] = true;
                          setLoaded([...loaded]);
                          if (idx === loaded.length - 1) getApp().setState(OlympusState.IDLE);
                        }
                      };
                    }}
                    className={`
                      mb-2 me-2 ml-auto flex cursor-pointer content-center
                      items-center gap-2 rounded-sm bg-blue-600 px-5 py-2.5
                      text-sm font-medium text-white
                      data-[disabled="true"]:bg-blue-800
                      focus:outline-none focus:ring-4 focus:ring-blue-800
                      hover:bg-blue-700
                    `}
                  >
                    {loaded[idx] ? "Loaded" : "Load"}
                    <FontAwesomeIcon className={`my-auto`} icon={loaded[idx] ? faCheck : faUpload} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex">
          <button
            type="button"
            onClick={() => {getApp().setState(OlympusState.IDLE)}}
            className={`
              mb-2 me-2 ml-auto flex content-center items-center gap-2
              rounded-sm border-[1px] bg-blue-700 px-5 py-2.5 text-sm
              font-medium text-white
              dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400
              dark:hover:bg-gray-700 dark:focus:ring-blue-800
              focus:outline-none focus:ring-4 focus:ring-blue-300
              hover:bg-blue-800
            `}
          >
            Skip
            <FontAwesomeIcon className={`my-auto`} icon={faArrowRight} />
          </button>
        </div>
      </div>
    </Modal>
  );
}
