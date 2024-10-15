import React, { ForwardedRef, forwardRef, useEffect, useState } from "react";
import { OlStateButton } from "../../components/olstatebutton";
import { faPause, faPlay, faRepeat, faStop } from "@fortawesome/free-solid-svg-icons";
import { getApp } from "../../../olympusapp";
import { AudioSource } from "../../../audio/audiosource";
import { FaChevronUp, FaVolumeHigh, FaXmark } from "react-icons/fa6";
import { OlRangeSlider } from "../../components/olrangeslider";
import { FileSource } from "../../../audio/filesource";
import { MicrophoneSource } from "../../../audio/microphonesource";

export const AudioSourcePanel = forwardRef((props: { source: AudioSource; onExpanded: () => void }, ref: ForwardedRef<HTMLDivElement>) => {
  const [meterLevel, setMeterLevel] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (props.onExpanded) props.onExpanded();
  }, [expanded])

  useEffect(() => {
    setInterval(() => {
      setMeterLevel(Math.min(1, props.source.getMeter().getPeaks().current[0]));
    }, 50);
  }, []);

  return (
    <div
      className={`
        flex flex-col content-center justify-between gap-2 rounded-md
        bg-olympus-200/30 px-4 py-3
      `}
      ref={ref}
    >
      <div className="flex justify-between gap-2">
        <div
          className={`h-fit w-fit cursor-pointer rounded-sm py-2`}
          onClick={() => {
            setExpanded(!expanded);
          }}
        >
          <FaChevronUp
            className={`
              text-gray-500 transition-transform
              data-[expanded='false']:rotate-180
            `}
            data-expanded={expanded}
          />
        </div>
        <div className="flex w-full overflow-hidden">
          <span
            className={`my-auto truncate`}
          >
            {props.source.getName()}
          </span>
        </div>
        {!(props.source instanceof MicrophoneSource) && (
          <div
            className={`
              mb-auto aspect-square cursor-pointer rounded-md p-2
              hover:bg-white/10
            `}
            onClick={() => {
              getApp().getAudioManager().removeSource(props.source);
            }}
          >
            <FaXmark className={`my-auto text-gray-500`}></FaXmark>
          </div>
        )}
      </div>
      {expanded && (
        <>
          {props.source instanceof FileSource && (
            <div className="flex flex-col gap-2 rounded-md bg-olympus-400 p-2">
              <div className="flex gap-4">
                <OlStateButton
                  checked={false}
                  icon={props.source.getPlaying() ? faPause : faPlay}
                  onClick={() => {
                    if (props.source instanceof FileSource) props.source.getPlaying() ? props.source.pause() : props.source.play();
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
            </div>
          )}

          <div className="flex gap-4 pr-2">
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
                min={0}
                max={200}
                onChange={(ev) => {
                  props.source.setVolume(parseFloat(ev.currentTarget.value) / 100);
                }}
                className="absolute top-[18px]"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
});
