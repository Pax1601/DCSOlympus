import React, { useEffect, useState } from "react";
import { OlFrequencyInput } from "../../components/olfrequencyinput";
import { FaTrash } from "react-icons/fa6";
import { OlLabelToggle } from "../../components/ollabeltoggle";
import { OlStateButton } from "../../components/olstatebutton";
import { faEarListen, faMicrophoneLines } from "@fortawesome/free-solid-svg-icons";
import { SRSRadio } from "../../../audio/srsradio";
import { SRSRadioSetting } from "../../../interfaces";
import { getApp } from "../../../olympusapp";

export function RadioPanel(props: { index: number; setting: SRSRadioSetting, onSettingUpdate: (SRSRadioSetting) => void }) {
  return (
    <div
      className={`
        flex flex-col content-center justify-between gap-2 rounded-md
        bg-olympus-200/30 py-3 pl-4 pr-5
      `}
    >
      <div className="flex content-center justify-between">
        <span className="my-auto">Radio {props.index + 1}</span>
        <div className="rounded-md bg-red-800 p-2" onClick={() => {getApp().getAudioManager().removeRadio(props.index);}}>
          <FaTrash className={`text-gray-50`}></FaTrash>
        </div>
      </div>
      <OlFrequencyInput
        value={props.setting.frequency}
        onChange={(value) => {
          let setting = props.setting;
          setting.frequency = value;
          props.onSettingUpdate(setting);
        }}
      />
      <div className="flex flex-row gap-2">
        <OlLabelToggle
          leftLabel="AM"
          rightLabel="FM"
          toggled={props.setting.modulation !== 0}
          onClick={() => {
            let setting = props.setting;
            setting.modulation = setting.modulation === 1 ? 0 : 1;
            props.onSettingUpdate(setting);
          }}
        ></OlLabelToggle>

        <OlStateButton
          className="ml-auto"
          checked={props.setting.ptt}
          icon={faMicrophoneLines}
          onClick={() => {
            let setting = props.setting;
            setting.ptt = !setting.ptt;
            props.onSettingUpdate(setting);
          }}
          tooltip="Talk on frequency"
        ></OlStateButton>

        <OlStateButton
          checked={props.setting.tuned}
          icon={faEarListen}
          onClick={() => {
            let setting = props.setting;
            setting.tuned = !setting.tuned;
            props.onSettingUpdate(setting);
          }}
          tooltip="Tune to radio"
        ></OlStateButton>
      </div>
    </div>
  );
}
