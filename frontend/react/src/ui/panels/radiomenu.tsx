import React, { useEffect, useState } from "react";
import { Menu } from "./components/menu";
import { OlCheckbox } from "../components/olcheckbox";
import { OlRangeSlider } from "../components/olrangeslider";
import { OlNumberInput } from "../components/olnumberinput";
import { MapOptions } from "../../types/types";
import { getApp } from "../../olympusapp";
import { OlFrequencyInput } from "../components/olfrequencyinput";
import { OlStateButton } from "../components/olstatebutton";
import { faEarListen, faMicrophoneLines } from "@fortawesome/free-solid-svg-icons";
import { OlLabelToggle } from "../components/ollabeltoggle";
import { FaVolumeHigh } from "react-icons/fa6";

export function RadioMenu(props: { open: boolean; onClose: () => void; children?: JSX.Element | JSX.Element[] }) {
  const [frequency1, setFrequency1] = useState(124000000);
  const [ptt1, setPTT1] = useState(false);
  const [frequency2, setFrequency2] = useState(251000000);
  const [frequency3, setFrequency3] = useState(243000000);
  const [frequency4, setFrequency4] = useState(11200000);

  useEffect(() => {
    if (getApp()) {
      let settings = getApp().getAudioManager().getRadioSettings();
      settings[0].frequency = frequency1;
      settings[0].ptt = ptt1;
      getApp().getAudioManager().setRadioSettings(settings);
    }
  });

  return (
    <Menu title="Radio" open={props.open} showBackButton={false} onClose={props.onClose}>
      <div
        className={`
          flex flex-col gap-2 p-5 font-normal text-gray-800
          dark:text-white
        `}
      >
        <div
          className={`
            flex flex-col content-center justify-between gap-2 rounded-md
            bg-olympus-200/30 py-3 pl-4 pr-5
          `}
        >
          Radio 1
          <OlFrequencyInput
            value={frequency1}
            onChange={(value) => {
              setFrequency1(value);
            }}
          />
          <div className="flex gap-4 py-2">
            <FaVolumeHigh className="h-8 w-8 p-1" />
            <OlRangeSlider value={50} onChange={() => {}} className="my-auto" />
            <span className="my-auto">50</span>
          </div>
          <div className="flex flex-row gap-2">
            <OlLabelToggle leftLabel="AM" rightLabel="FM" toggled={false} onClick={() => {}}></OlLabelToggle>
            <OlStateButton
              className="ml-auto"
              checked={ptt1}
              icon={faMicrophoneLines}
              onClick={() => {
                setPTT1(!ptt1);
              }}
              tooltip="Talk on frequency"
            ></OlStateButton>
            <OlStateButton checked={false} icon={faEarListen} onClick={() => {}} tooltip="Tune to radio"></OlStateButton>
          </div>
        </div>
      </div>
    </Menu>
  );
}
