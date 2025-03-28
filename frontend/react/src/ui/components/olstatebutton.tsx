import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faLock, faUnlockAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useRef, useState } from "react";
import { OlTooltip } from "./oltooltip";
import { computeBrightness, setOpacity } from "../../other/utils";
import { colors } from "../../constants/constants";

export function OlStateButton(props: {
  className?: string;
  buttonColor?: string;
  checked: boolean;
  icon?: IconProp;
  tooltip?: string | (() => JSX.Element | JSX.Element[]);
  tooltipPosition?: string;
  tooltipRelativeToParent?: boolean;
  onClick: () => void;
  onMouseUp?: () => void;
  onMouseDown?: () => void;
  children?: JSX.Element | JSX.Element[];
}) {
  const [hover, setHover] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState(null as number | null);
  var buttonRef = useRef(null);

  const className =
    (props.className ?? "") +
    `
      pointer-events-auto h-[40px] w-[40px] flex-none rounded-md text-lg
      font-medium
      dark:bg-olympus-600 dark:text-gray-300
    `;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          props.onClick();
          props.onClick ?? setHover(false);
        }}
        onMouseUp={props.onMouseUp ?? (() => {})}
        onMouseDown={props.onMouseDown ?? (() => {})}
        data-checked={props.checked}
        type="button"
        className={className}
        style={{
          border: props.buttonColor ? "2px solid " + props.buttonColor : "0px solid transparent",
          background: setOpacity(
            props.checked || hover ? (props.buttonColor ? props.buttonColor : colors.OLYMPUS_LIGHT_BLUE) : colors.OLYMPUS_BLUE,
            !props.checked && hover ? 0.3 : 1
          ),
        }}
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
        <div className={`m-auto flex w-fit content-center justify-center gap-2`}>
          {props.icon && (
            <FontAwesomeIcon
              icon={props.icon}
              data-bright={props.buttonColor && props.checked && computeBrightness(props.buttonColor) > 200}
              className={`
                m-auto text-gray-200
                data-[bright='true']:text-gray-800
              `}
            />
          )}
          {props.children}
        </div>
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

export function OlRoundStateButton(props: {
  className?: string;
  checked: boolean;
  icon: IconProp;
  tooltip?: string | (() => JSX.Element | JSX.Element[]);
  tooltipPosition?: string;
  onClick: (event) => void;
}) {
  const [hover, setHover] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState(null as number | null);
  var buttonRef = useRef(null);

  const className =
    (props.className ?? "") +
    `
      m-auto h-8 w-8 flex-none rounded-full border-2 border-gray-900 text-sm
      font-medium
      dark:border-gray-400 dark:bg-[transparent] dark:text-gray-400
      dark:hover:bg-gray-800 dark:data-[checked='true']:border-white
      dark:data-[checked='true']:bg-white
      dark:data-[checked='true']:text-gray-900
      dark:data-[checked='true']:hover:border-gray-200
      dark:data-[checked='true']:hover:bg-gray-200
    `;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(event) => {
          props.onClick(event);
          setHover(false);
        }}
        data-checked={props.checked}
        type="button"
        className={className}
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
        <FontAwesomeIcon className="pt-[3px]" icon={props.icon} />
      </button>
      {hover && props.tooltip && (
        <OlTooltip buttonRef={buttonRef} content={typeof props.tooltip === "string" ? props.tooltip : props.tooltip()} position={props.tooltipPosition} />
      )}
    </>
  );
}

export function OlLockStateButton(props: {
  className?: string;
  checked: boolean;
  tooltip?: string | (() => JSX.Element | JSX.Element[]);
  tooltipPosition?: string;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState(null as number | null);
  var buttonRef = useRef(null);

  const className =
    (props.className ?? "") +
    `
      m-auto h-8 w-8 flex-none rounded-full border-gray-900 text-sm font-medium
      dark:bg-red-500 dark:text-olympus-900 dark:hover:bg-red-400
      dark:data-[checked='true']:bg-green-500
      dark:data-[checked='true']:text-green-900
      dark:data-[checked='true']:hover:bg-green-400
    `;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => {
          props.onClick();
          setHover(false);
        }}
        data-checked={props.checked}
        type="button"
        className={className}
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
        <FontAwesomeIcon className="pt-[3px]" icon={props.checked == true ? faUnlockAlt : faLock} />
      </button>
      {hover && props.tooltip && (
        <OlTooltip buttonRef={buttonRef} content={typeof props.tooltip === "string" ? props.tooltip : props.tooltip()} position={props.tooltipPosition} />
      )}
    </>
  );
}
