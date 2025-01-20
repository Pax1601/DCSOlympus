import React, { ForwardedRef, forwardRef, useEffect, useState } from "react";
import { FaChevronUp, FaXmark } from "react-icons/fa6";
import { getApp } from "../../../olympusapp";
import { UnitSink } from "../../../audio/unitsink";
import { OlStateButton } from "../../components/olstatebutton";
import { faMicrophoneLines } from "@fortawesome/free-solid-svg-icons";
import { OlRangeSlider } from "../../components/olrangeslider";

export const UnitSinkPanel = forwardRef((props: { sink: UnitSink; shortcutKeys: string[]; onExpanded: () => void }, ref: ForwardedRef<HTMLDivElement>) => {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (props.onExpanded) props.onExpanded();
  }, [expanded]);

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
        {props.shortcutKeys && (
          <>
            <kbd
              className={`
                my-auto ml-auto text-nowrap rounded-lg border border-gray-200
                bg-gray-100 px-2 py-1.5 text-xs font-semibold text-gray-800
                dark:border-gray-500 dark:bg-gray-600 dark:text-gray-100
              `}
            >
              {props.shortcutKeys.flatMap((key, idx, array) => [key, idx < array.length - 1 ? " + " : ""])}
            </kbd>
          </>
        )}
        <div className="flex w-full overflow-hidden">
          <span className="my-auto truncate"> {props.sink.getName()}</span>
        </div>
        <div
          className={`
            mb-auto aspect-square cursor-pointer rounded-md p-2
            hover:bg-white/10
          `}
          onClick={() => {
            getApp().getAudioManager().removeSink(props.sink);
          }}
        >
          <FaXmark className={`my-auto text-gray-500`}></FaXmark>
        </div>
      </div>
      {expanded && (
        <div className="flex flex-row gap-2">
          <span className="my-auto">Near</span>
          <OlRangeSlider
            value={((props.sink.getMaxDistance() - 100) / (1852 - 100)) * 100}
            min={0}
            max={100}
            onChange={(ev) => {
              props.sink.setMaxDistance((parseFloat(ev.currentTarget.value) / 100) * (1852 - 100) + 100);
            }}
            className="my-auto h-16"
          />
          <span className="my-auto">Far</span>
          <OlStateButton
            checked={props.sink.getPtt()}
            icon={faMicrophoneLines}
            onClick={() => {
              props.sink.setPtt(!props.sink.getPtt());
            }}
            tooltip="Talk on frequency"
          ></OlStateButton>
        </div>
      )}
    </div>
  );
});
