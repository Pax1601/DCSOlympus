import React, { useRef, useState } from "react";
import { OlTooltip } from "./oltooltip";

export function OlLabelToggle(props: {
  toggled: boolean | undefined;
  leftLabel: string;
  rightLabel: string;
  tooltip?: string | (() => JSX.Element | JSX.Element[]);
  tooltipPosition?: string;
  tooltipRelativeToParent?: boolean;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState(null as number | null);
  var buttonRef = useRef(null);

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          props.onClick();
          setHover(false);
        }}
        className={`
          relative flex h-10 w-[120px] flex-none cursor-pointer select-none
          flex-row content-center justify-between rounded-md border px-1
          py-[5px] text-sm
          dark:border-gray-600 dark:border-transparent dark:bg-gray-700
          dark:hover:bg-gray-600 dark:focus:ring-blue-800
          focus:outline-none focus:ring-2 focus:ring-blue-300
        `}
        ref={buttonRef}
        onMouseEnter={() => {
          setHoverTimeout(
            window.setTimeout(() => {
              setHover(true);
              setHoverTimeout(null);
            }, 400)
          );
        }}
        onMouseLeave={() => {
          setHover(false);
          if (hoverTimeout) {
            window.clearTimeout(hoverTimeout);
            setHoverTimeout(null);
          }
        }}
      >
        <span
          data-flash={props.toggled === undefined}
          data-toggled={props.toggled ?? false}
          className={`
            absolute my-auto h-[28px] w-[54px] rounded-md bg-blue-500
            transition-transform
            data-[flash='true']:animate-pulse
            data-[toggled='true']:translate-x-14
          `}
        ></span>
        <span
          data-active={!(props.toggled ?? false)}
          className={`
            absolute left-[17px] top-[8px] font-normal transition-colors
            dark:data-[active='false']:text-gray-400
            dark:data-[active='true']:text-white
          `}
        >
          {props.leftLabel}
        </span>
        <span
          data-active={props.toggled ?? false}
          className={`
            absolute right-[17px] top-[8px] font-normal transition-colors
            dark:data-[active='false']:text-gray-400
            dark:data-[active='true']:text-white
          `}
        >
          {props.rightLabel}
        </span>
      </button>
      {hover && props.tooltip && (
        <OlTooltip
          buttonRef={buttonRef}
          content={typeof props.tooltip === "string" ? props.tooltip : props.tooltip()}
          position={props.tooltipPosition}
          relativeToParent={props.tooltipRelativeToParent}
        />
      )}
    </>
  );
}
