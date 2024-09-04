import React, { useEffect, useState } from "react";
import { Menu } from "./components/menu";
import { getApp } from "../../olympusapp";
import { FaQuestionCircle } from "react-icons/fa";
import { AudioSourcePanel } from "./components/audiosourcepanel";
import { AudioSource } from "../../audio/audiosource";

export function AudioMenu(props: { open: boolean; onClose: () => void; children?: JSX.Element | JSX.Element[] }) {
  const [sources, setSources] = useState([] as AudioSource[]);

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
  }, []);


  return (
    <Menu title="Audio sources" open={props.open} showBackButton={false} onClose={props.onClose}>
      <div className="p-4 text-sm text-gray-400">The audio source panel allows you to add and manage audio sources.</div>
      <div className="mx-6 flex rounded-lg bg-olympus-400 p-4 text-sm">
        <div>
          <FaQuestionCircle className="my-4 ml-2 mr-6 text-gray-400" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-gray-100">Use the controls to apply effects and start/stop the playback of an audio source.</div>
          <div className="text-gray-400">Sources can be connected to your radios, or attached to a unit to be played on loudspeakers.</div>
        </div>
      </div>
      <div
        className={`
          flex flex-col gap-2 p-5 font-normal text-gray-800
          dark:text-white
        `}
      >
        <>
          {sources
            .map((source) => {
              return <AudioSourcePanel source={source} />;
            })}
        </>
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
      </div>
    </Menu>
  );
}
