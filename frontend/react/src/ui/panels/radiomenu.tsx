import React, { useEffect, useState } from "react";
import { Menu } from "./components/menu";
import { getApp } from "../../olympusapp";
import { OlToggle } from "../components/oltoggle";
import { RadioPanel } from "./components/radiopanel";
import { FaQuestionCircle } from "react-icons/fa";
import { SRSRadioSetting } from "../../interfaces";

export function RadioMenu(props: { open: boolean; onClose: () => void; children?: JSX.Element | JSX.Element[] }) {
  const [radioEnabled, setRadioEnabled] = useState(false);
  const [radioSettings, setRadioSettings] = useState([] as SRSRadioSetting[]);

  useEffect(() => {
    /* Force a rerender */
    document.addEventListener("radiosUpdated", () => {
      setRadioSettings(
        getApp()
          ?.getAudioManager()
          .getRadios()
          .map((radio) => radio.getSetting())
      );
    });
  }, []);

  return (
    <Menu title="Radio" open={props.open} showBackButton={false} onClose={props.onClose}>
      <div className="p-4 text-sm text-gray-400">The radio menu allows you to talk on radio to the players online using SRS.</div>
      <div className="mx-6 flex rounded-lg bg-olympus-400 p-4 text-sm">
        <div>
          <FaQuestionCircle className="my-4 ml-2 mr-6 text-gray-400" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-gray-100">Use the radio controls to tune to a frequency, then click on the PTT button to talk. </div>
          <div className="text-gray-400">You can add up to 10 radios. Use the audio effects menu to play audio tracks or to add background noises.</div>
        </div>
      </div>
      <div
        className={`
          flex flex-col gap-2 p-5 font-normal text-gray-800
          dark:text-white
        `}
      >
        <div className="flex justify-between">
          <span>Enable radio:</span>
          <OlToggle
            toggled={radioEnabled}
            onClick={() => {
              radioEnabled ? getApp().getAudioManager().stop() : getApp().getAudioManager().start();
              setRadioEnabled(!radioEnabled);
            }}
          />
        </div>
        {radioEnabled && radioSettings.map((setting, idx) => {
          return (
            <RadioPanel
              index={idx}
              setting={setting}
              onSettingUpdate={(setting) => {
                getApp().getAudioManager().getRadios()[idx].setSetting(setting);
              }}
            ></RadioPanel>
          );
        })}
        {radioEnabled && radioSettings.length < 10 && (
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

/* 
{refreshSources >= 0 &&
          getApp()
            ?.getAudioManager()
            .getSources()
            .map((source, idx) => {
              return <AudioSourcePanel index={idx} source={source} />;
            })}
<button
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
        </button> */
