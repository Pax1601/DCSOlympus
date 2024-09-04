import React, { useEffect, useState } from "react";
import { OlStateButton } from "../../components/olstatebutton";
import { faPlay, faRepeat } from "@fortawesome/free-solid-svg-icons";
import { getApp } from "../../../olympusapp";
import { AudioSource } from "../../../audio/audiosource";
import { FaTrash, FaVolumeHigh } from "react-icons/fa6";
import { OlRangeSlider } from "../../components/olrangeslider";
import { FaUnlink } from "react-icons/fa";
import { OlDropdown, OlDropdownItem } from "../../components/oldropdown";

export function AudioSourcePanel(props: { source: AudioSource }) {
  return (
    <div
      className={`
        flex flex-col content-center justify-between gap-2 rounded-md
        bg-olympus-200/30 py-3 pl-4 pr-5
      `}
    >
      <span>{props.source.getName()}</span>
      {props.source.getName() != "Microphone" && (
        <div className="flex gap-4 py-2">
          <OlStateButton
            checked={false}
            icon={faPlay}
            onClick={() => {
              props.source.play();
            }}
            tooltip="Play file"
          ></OlStateButton>
          <OlRangeSlider
            value={50}
            onChange={(ev) => {
              //let setting = props.setting;
              //setting.volume = parseFloat(ev.currentTarget.value) / 100;
              //props.updateSetting(setting);
            }}
            className="my-auto"
          />
          <OlStateButton checked={false} icon={faRepeat} onClick={() => {}} tooltip="Loop"></OlStateButton>
        </div>
      )}
      <span className="text-sm">Connected to:</span>
      <div className="flex flex-col gap-2">
        {props.source.getConnectedTo().map((sink) => {
          return (
            <div className="flex justify-between text-sm">
              {sink.getName()}
              <FaUnlink></FaUnlink>
            </div>
          );
        })}
        <OlDropdown label="Connect to:">
          {getApp()
            .getAudioManager()
            .getSinks()
            .filter((sink) => !props.source.getConnectedTo().includes(sink))
            .map((sink) => {
              return <OlDropdownItem onClick={() => {
                props.source.connect(sink);
              }}>{sink.getName()}</OlDropdownItem>;
            })}
        </OlDropdown>
      </div>
    </div>
  );
}
