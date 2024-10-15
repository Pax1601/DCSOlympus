import React, { ForwardedRef, forwardRef, useEffect, useState } from "react";
import { OlFrequencyInput } from "../../components/olfrequencyinput";
import { FaChevronUp, FaXmark } from "react-icons/fa6";
import { OlLabelToggle } from "../../components/ollabeltoggle";
import { OlStateButton } from "../../components/olstatebutton";
import { faEarListen, faMicrophoneLines } from "@fortawesome/free-solid-svg-icons";
import { RadioSink } from "../../../audio/radiosink";
import { getApp } from "../../../olympusapp";

export const RadioSinkPanel = forwardRef((props: { radio: RadioSink; shortcutKey: string; onExpanded: () => void }, ref: ForwardedRef<HTMLDivElement>) => {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (props.onExpanded) props.onExpanded();
  }, [expanded])

  return (
    <div
      className={`
        flex flex-col content-center justify-between gap-2 rounded-md
        bg-olympus-200/30 px-4 py-3
      `}
      ref={ref}
    >
      <div className="flex content-center justify-between gap-2">
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
        {props.shortcutKey && (<>
          <kbd
            className={`
              my-auto ml-auto rounded-lg border border-gray-200 bg-gray-100 px-2
              py-1.5 text-xs font-semibold text-gray-800
              dark:border-gray-500 dark:bg-gray-600 dark:text-gray-100
            `}
          >
            {props.shortcutKey}
          </kbd>
          </>
        )}
        <span className="my-auto w-full">{props.radio.getName()} {!expanded && `: ${props.radio.getFrequency()/1e6} MHz ${props.radio.getModulation()? "FM": "AM"}`}  {} </span>
        <div
          className={`
            mb-auto ml-auto aspect-square cursor-pointer rounded-md p-2
            hover:bg-white/10
          `}
          onClick={() => {
            getApp().getAudioManager().removeSink(props.radio);
          }}
        >
          <FaXmark className={`my-auto text-gray-500`}></FaXmark>
        </div>
      </div>
      {expanded && (
        <>
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

            <OlStateButton
              className="ml-auto"
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
        </>
      )}
    </div>
  );
});
