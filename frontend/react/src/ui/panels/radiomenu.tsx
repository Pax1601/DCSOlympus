import React, { useEffect, useState } from "react";
import { Menu } from "./components/menu";
import { getApp } from "../../olympusapp";
import { RadioPanel } from "./components/radiopanel";
import { FaQuestionCircle } from "react-icons/fa";
import { RadioSink } from "../../audio/radiosink";
import { FaVolumeHigh } from "react-icons/fa6";

export function RadioMenu(props: { open: boolean; onClose: () => void; children?: JSX.Element | JSX.Element[] }) {
  const [radios, setRadios] = useState([] as RadioSink[]);
  const [audioManagerEnabled, setAudioManagerEnabled] = useState(false);

  useEffect(() => {
    /* Force a rerender */
    document.addEventListener("audioSinksUpdated", () => {
      setRadios(
        getApp()
          ?.getAudioManager()
          .getSinks()
          .filter((sink) => sink instanceof RadioSink)
          .map((radio) => radio)
      );
    });

    document.addEventListener("audioManagerStateChanged", () => {
      setAudioManagerEnabled(getApp().getAudioManager().isRunning());
    });
  }, []);

  return (
    <Menu title="Radio" open={props.open} showBackButton={false} onClose={props.onClose}>
      <div className="p-4 text-sm text-gray-400">The radio menu allows you to talk on radio to the players online using SRS.</div>
      <div className="mx-6 flex rounded-lg bg-olympus-400 p-4 text-sm">
        {audioManagerEnabled && (
          <>
            <div>
              <FaQuestionCircle className="my-4 ml-2 mr-6 text-gray-400" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-gray-100">Use the radio controls to tune to a frequency, then click on the PTT button to talk. </div>
              <div className="text-gray-400">You can add up to 10 radios. Use the audio effects menu to play audio tracks or to add background noises.</div>
            </div>
          </>
        )}
        {!audioManagerEnabled && (
          <>
            <div>
              <FaQuestionCircle className="my-4 ml-2 mr-6 text-gray-400" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-gray-100">
                To enable the radio menu, first start the audio backend with the{" "}
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

      <div
        className={`
          flex flex-col gap-2 p-5 font-normal text-gray-800
          dark:text-white
        `}
      >
        {radios.map((radio) => {
          return <RadioPanel radio={radio}></RadioPanel>;
        })}
        {audioManagerEnabled && radios.length < 10 && (
          <button
            type="button"
            className={`
              mb-2 me-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium
              text-white
              dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
              focus:outline-none focus:ring-4 focus:ring-blue-300
              hover:bg-blue-800
            `}
            onClick={() => getApp().getAudioManager().addRadio()}
          >
            Add radio
          </button>
        )}
      </div>
    </Menu>
  );
}
