import React, { useEffect, useState } from "react";
import { OlFrequencyInput } from "../../components/olfrequencyinput";
import { FaTrash } from "react-icons/fa6";
import { OlLabelToggle } from "../../components/ollabeltoggle";
import { OlStateButton } from "../../components/olstatebutton";
import { faEarListen, faMicrophoneLines } from "@fortawesome/free-solid-svg-icons";
import { RadioSink } from "../../../audio/radiosink";
import { getApp } from "../../../olympusapp";

export function RadioPanel(props: { radio: RadioSink; shortcutKey: string }) {
  return (
    <div
      className={`
        flex flex-col content-center justify-between gap-2 rounded-md
        bg-olympus-200/30 py-3 pl-4 pr-5
      `}
    >
      <div className="flex content-center justify-between">
        <span className="my-auto">{props.radio.getName()}</span>
        <div
          className="cursor-pointer rounded-md bg-red-800 p-2"
          onClick={() => {
            getApp().getAudioManager().removeSink(props.radio);
          }}
        >
          <FaTrash className={`text-gray-50`}></FaTrash>
        </div>
      </div>
      <OlFrequencyInput
        value={props.radio.getFrequency()}
        onChange={(value) => {
          props.radio.setFrequency(value);
        }}
      />
      <div className="flex flex-row gap-2">
        <OlLabelToggle
          leftLabel="AM"
          rightLabel="FM"
          toggled={props.radio.getModulation() !== 0}
          onClick={() => {
            props.radio.setModulation(props.radio.getModulation() === 1 ? 0 : 1);
          }}
        ></OlLabelToggle>

        <kbd
          className={`
            my-auto ml-auto rounded-lg border border-gray-200 bg-gray-100 px-2
            py-1.5 text-xs font-semibold text-gray-800
            dark:border-gray-500 dark:bg-gray-600 dark:text-gray-100
          `}
        >
          {props.shortcutKey}
        </kbd>

        <OlStateButton
          checked={props.radio.getPtt()}
          icon={faMicrophoneLines}
          onClick={() => {
            props.radio.setPtt(!props.radio.getPtt());
          }}
          tooltip="Talk on frequency"
        ></OlStateButton>

        <OlStateButton
          checked={props.radio.getTuned()}
          icon={faEarListen}
          onClick={() => {
            props.radio.setTuned(!props.radio.getTuned());
          }}
          tooltip="Tune to radio"
        ></OlStateButton>
      </div>
    </div>
  );
}
