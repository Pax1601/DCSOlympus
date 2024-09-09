import React, { useEffect, useState } from "react";
import { OlStateButton } from "../../components/olstatebutton";
import { faPause, faPlay, faRepeat, faStop } from "@fortawesome/free-solid-svg-icons";
import { getApp } from "../../../olympusapp";
import { AudioSource } from "../../../audio/audiosource";
import { FaArrowRight, FaTrash, FaVolumeHigh } from "react-icons/fa6";
import { OlRangeSlider } from "../../components/olrangeslider";
import { FaUnlink } from "react-icons/fa";
import { OlDropdown, OlDropdownItem } from "../../components/oldropdown";
import { FileSource } from "../../../audio/filesource";
import { MicrophoneSource } from "../../../audio/microphonesource";

export function AudioSourcePanel(props: { source: AudioSource }) {
  const [meterLevel, setMeterLevel] = useState(0);

  useEffect(() => {
    setInterval(() => {
      setMeterLevel(props.source.getMeter().getPeaks().current[0]);
    }, 50);
  }, []);

  let availabileSinks = getApp()
    .getAudioManager()
    .getSinks()
    .filter((sink) => !props.source.getConnectedTo().includes(sink));

  return (
    <div
      className={`
        flex flex-col content-center justify-between gap-2 rounded-md
        bg-olympus-200/30 py-3 pl-4 pr-5
      `}
    >
      <div className="flex justify-between gap-2">
        <span className="break-all">{props.source.getName()}</span>
        {!(props.source instanceof MicrophoneSource) && (
          <div
            className={`
              mb-auto aspect-square cursor-pointer rounded-md bg-red-800 p-2
            `}
            onClick={() => {
              getApp().getAudioManager().removeSource(props.source);
            }}
          >
            <FaTrash className={`text-gray-50`}></FaTrash>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-md bg-olympus-400 p-2">
        {props.source instanceof FileSource && (
          <div className="flex gap-4">
            <OlStateButton
              checked={false}
              icon={props.source.getPlaying() ? faPause : faPlay}
              onClick={() => {
                if (props.source instanceof FileSource) props.source.getPlaying() ? props.source.stop() : props.source.play();
              }}
              tooltip="Play file"
            ></OlStateButton>
            <OlRangeSlider
              value={props.source.getDuration() > 0 ? (props.source.getCurrentPosition() / props.source.getDuration()) * 100 : 0}
              onChange={(ev) => {
                if (props.source instanceof FileSource) props.source.setCurrentPosition(parseFloat(ev.currentTarget.value));
              }}
              className="my-auto"
            />
            <OlStateButton
              checked={props.source.getLooping()}
              icon={faRepeat}
              onClick={() => {
                if (props.source instanceof FileSource) props.source.setLooping(!props.source.getLooping());
              }}
              tooltip="Loop"
            ></OlStateButton>
          </div>
        )}
        <div className="flex gap-4">
          <div className="h-[40px] min-w-[40px] p-2">
            <FaVolumeHigh className="h-full w-full" />
          </div>
          <div className="relative flex w-full flex-col gap-3">
            <div
              className={`
                absolute top-[18px] flex h-2 min-w-full translate-y-[-5px]
                flex-row border-gray-500
              `}
            >
              <div style={{ minWidth: `${meterLevel * 100}%` }} className={`
                rounded-full bg-gray-200
              `}></div>
            </div>
            <OlRangeSlider
              value={props.source.getVolume() * 100}
              onChange={(ev) => {
                props.source.setVolume(parseFloat(ev.currentTarget.value) / 100);
              }}
              className="absolute top-[18px]"
            />
          </div>
          <div className="h-[40px] min-w-[40px] p-2">
            <span>{Math.round(props.source.getVolume() * 100)}</span>
          </div>
        </div>
      </div>

      <span className="text-sm">Connected to:</span>
      <div className="flex flex-col gap-1">
        {props.source.getConnectedTo().map((sink) => {
          return (
            <div
              className={`
                flex justify-start gap-2 rounded-full bg-olympus-400 px-4 py-1
                text-sm
              `}
            >
              <FaArrowRight className="my-auto"></FaArrowRight>
              {sink.getName()}
              <FaUnlink className="my-auto ml-auto cursor-pointer text-red-400" onClick={() => props.source.disconnect(sink)}></FaUnlink>
            </div>
          );
        })}
      </div>
      {availabileSinks.length > 0 && (
        <OlDropdown label="Connect to:">
          {availabileSinks.map((sink) => {
            return (
              <OlDropdownItem
                onClick={() => {
                  props.source.connect(sink);
                }}
              >
                {sink.getName()}
              </OlDropdownItem>
            );
          })}
        </OlDropdown>
      )}
    </div>
  );
}
