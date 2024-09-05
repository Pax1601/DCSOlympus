import React, { useEffect, useState } from "react";
import { OlStateButton } from "../../components/olstatebutton";
import { faPause, faPlay, faRepeat, faStop } from "@fortawesome/free-solid-svg-icons";
import { getApp } from "../../../olympusapp";
import { AudioSource } from "../../../audio/audiosource";
import { FaTrash, FaVolumeHigh } from "react-icons/fa6";
import { OlRangeSlider } from "../../components/olrangeslider";
import { FaUnlink } from "react-icons/fa";
import { OlDropdown, OlDropdownItem } from "../../components/oldropdown";
import { FileSource } from "../../../audio/filesource";

export function AudioSourcePanel(props: { source: AudioSource }) {
  const [meterLevel, setMeterLevel] = useState(0);

  useEffect(() => {
    setInterval(() => {
      // TODO apply to all sources
      if (props.source instanceof FileSource) {
        setMeterLevel(props.source.getMeter().getPeaks().current[0]);
      }
    }, 50);
  }, []);

  return (
    <div
      className={`
        flex flex-col content-center justify-between gap-2 rounded-md
        bg-olympus-200/30 py-3 pl-4 pr-5
      `}
    >
      <span>{props.source.getName()}</span>
      {props.source instanceof FileSource && (
        <div className="flex flex-col gap-2">
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
              value={(props.source.getCurrentPosition() / props.source.getDuration()) * 100}
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
                <div
                  style={{ minWidth: `${meterLevel * 100}%` }}
                  className={`rounded-full bg-gray-200`}
                ></div>
              </div>
              <OlRangeSlider
                value={props.source.getVolume() * 100}
                onChange={(ev) => {
                  if (props.source instanceof FileSource) props.source.setVolume(parseFloat(ev.currentTarget.value) / 100);
                }}
                className="absolute top-[18px]"
              />
            </div>
            <div className="h-[40px] min-w-[40px] p-2">
              <span>{Math.round(props.source.getVolume() * 100)}</span>
            </div>
          </div>
        </div>
      )}
      <span className="text-sm">Connected to:</span>
      <div className="flex flex-col gap-2">
        {props.source.getConnectedTo().map((sink) => {
          return (
            <div className="flex justify-between text-sm">
              {sink.getName()}
              <FaUnlink className="cursor-pointer" onClick={() => props.source.disconnect(sink)}></FaUnlink>
            </div>
          );
        })}
        <OlDropdown label="Connect to:">
          {getApp()
            .getAudioManager()
            .getSinks()
            .filter((sink) => !props.source.getConnectedTo().includes(sink))
            .map((sink) => {
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
      </div>
    </div>
  );
}
