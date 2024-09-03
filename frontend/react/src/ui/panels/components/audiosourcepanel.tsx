import React, { useEffect, useState } from "react";
import { OlStateButton } from "../../components/olstatebutton";
import { faPlay, faRepeat } from "@fortawesome/free-solid-svg-icons";
import { getApp } from "../../../olympusapp";
import { AudioSource } from "../../../audio/audiosource";
import { FaVolumeHigh } from "react-icons/fa6";
import { OlRangeSlider } from "../../components/olrangeslider";

export function AudioSourcePanel(props: { index: number; source: AudioSource }) {
  return (
    <div
      className={`
        flex flex-col content-center justify-between gap-2 rounded-md
        bg-olympus-200/30 py-3 pl-4 pr-5
      `}
    >
      Source: {props.source.getName()}
      <div className="flex gap-4 py-2">
        <OlStateButton
          checked={false}
          icon={faPlay}
          onClick={() => {
            let sources = getApp().getAudioManager().getSources();
            sources[props.index].play();
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
        <OlStateButton
          checked={false}
          icon={faRepeat}
          onClick={() => {
            
          }}
          tooltip="Loop"
        ></OlStateButton>
      </div>

    </div>
  );
}
