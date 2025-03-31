import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useRef, useState } from "react";
import { OlTooltip } from "./oltooltip";

export function OlButtonGroup(props: {
  tooltip?: string | (() => JSX.Element | JSX.Element[]);
  tooltipPosition?: string;
  tooltipRelativeToParent?: boolean;
  children?: JSX.Element | JSX.Element[];
}) {
  const [hover, setHover] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState(null as number | null);
  var buttonRef = useRef(null);

  useEffect(() => {
    window.addEventListener("click", (e) => {
      setHover(false);
    });
  }, []);

  return (
    <>
      <div
        ref={buttonRef}
        className="inline-flex rounded-md shadow-sm"
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
        {props.children}
      </div>
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

export function OlButtonGroupItem(props: { icon: IconProp; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={props.onClick}
      type="button"
      data-active={props.active}
      className={`
        h-11 w-11 border border-gray-200 bg-white py-2 text-sm font-medium
        text-gray-900
        dark:border-gray-600 dark:bg-gray-700 dark:text-white
        dark:hover:bg-gray-500 dark:hover:text-white dark:focus:text-white
        dark:focus:ring-blue-500 dark:data-[active='true']:border-none
        dark:data-[active='true']:bg-blue-500
        first-of-type:rounded-s-md
        focus:z-10 focus:text-blue-700 focus:ring-2 focus:ring-blue-700
        hover:bg-gray-100 hover:text-blue-700
        last-of-type:rounded-e-md
      `}
    >
      <FontAwesomeIcon icon={props.icon} />
    </button>
  );
}
