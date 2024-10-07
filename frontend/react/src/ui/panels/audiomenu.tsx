import React, { useEffect, useState } from "react";
import { Menu } from "./components/menu";
import { getApp } from "../../olympusapp";
import { FaQuestionCircle } from "react-icons/fa";
import { AudioSourcePanel } from "./components/sourcepanel";
import { AudioSource } from "../../audio/audiosource";
import { FaVolumeHigh, FaX } from "react-icons/fa6";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";

export function AudioMenu(props: { open: boolean; onClose: () => void; children?: JSX.Element | JSX.Element[] }) {
  const [sources, setSources] = useState([] as AudioSource[]);
  const [audioManagerEnabled, setAudioManagerEnabled] = useState(false);
  const [showTip, setShowTip] = useState(true);

  useEffect(() => {
    /* Force a rerender */
    document.addEventListener("audioSourcesUpdated", () => {
      setSources(
        getApp()
          ?.getAudioManager()
          .getSources()
          .map((source) => source)
      );
    });

    document.addEventListener("audioManagerStateChanged", () => {
      setAudioManagerEnabled(getApp().getAudioManager().isRunning());
    });
  }, []);

  return (
    <Menu title="Audio sources" open={props.open} showBackButton={false} onClose={props.onClose}>
      <div className="p-4 text-sm text-gray-400">The audio source panel allows you to add and manage audio sources.</div>
      <>
        {showTip && (
          <div className="mx-6 flex rounded-lg bg-olympus-400 p-4 text-sm">
            {audioManagerEnabled ? (
              <>
                <div className="my-auto">
                  <FaQuestionCircle className="my-auto ml-2 mr-6 text-gray-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-gray-100">Use the controls to apply effects and start/stop the playback of an audio source.</div>
                  <div className="text-gray-400">Sources can be connected to your radios, or attached to a unit to be played on loudspeakers.</div>
                </div>
                <div>
                  <FontAwesomeIcon
                    onClick={() => setShowTip(false)}
                    icon={faClose}
                    className={`
                      ml-2 flex cursor-pointer items-center justify-center
                      rounded-md p-2 text-lg
                      dark:text-gray-500 dark:hover:bg-gray-700
                      dark:hover:text-white
                      hover:bg-gray-200
                    `}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="my-auto">
                  <FaQuestionCircle className="my-auto ml-2 mr-6 text-gray-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-gray-100">
                    To enable the audio menu, first start the audio backend with the{" "}
                    <span
                      className={`
                        mx-1 mt-[-7px] inline-block translate-y-2 rounded-full
                        border-[1px] border-white p-1
                      `}
                    >
                      <FaVolumeHigh />
                    </span>{" "}
                    button on the navigation header.
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </>

      <div
        className={`
          flex flex-col gap-2 p-5 font-normal text-gray-800
          dark:text-white
        `}
      >
        <>
          {sources.map((source, idx) => {
            return <AudioSourcePanel key={idx} source={source} />;
          })}
        </>
        {audioManagerEnabled && (
          <button
            type="button"
            className={`
              mb-2 me-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium
              text-white
              dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
              focus:outline-none focus:ring-4 focus:ring-blue-300
              hover:bg-blue-800
            `}
            onClick={() => {
              var input = document.createElement("input");
              input.type = "file";
              input.click();
              input.onchange = (e: Event) => {
                let target = e.target as HTMLInputElement;
                if (target && target.files) {
                  var file = target.files[0];
                  getApp().getAudioManager().addFileSource(file);
                }
              };
            }}
          >
            Add audio source
          </button>
        )}
      </div>
    </Menu>
  );
}
