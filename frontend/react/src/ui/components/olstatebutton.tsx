import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faExternalLink, faLock, faLockOpen, faUnlock, faUnlockAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useRef, useState } from "react";
import { OlTooltip } from "./oltooltip";

export function OlStateButton(props: {
  className?: string;
  buttonColor?: string | null;
  checked: boolean;
  icon?: IconProp;
  tooltip: string;
  onClick: () => void;
  onMouseUp?: () => void;
  onMouseDown?: () => void;
  children?: JSX.Element | JSX.Element[];
}) {
  const [hover, setHover] = useState(false);
  var buttonRef = useRef(null);

  const className =
    (props.className ?? "") +
    `
      h-[40px] w-[40px] flex-none rounded-md text-lg font-medium
      dark:bg-olympus-600 dark:text-gray-300
    `;

  let textColor = "white";
  if ((props.checked || hover) && props.buttonColor == "white") {
    textColor = "#243141";
  }

  const opacity = (hover && !props.checked) ? "AA" : "FF";

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => {
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
          background: props.checked || hover ? (props.buttonColor ? props.buttonColor : "#3b82f6" + opacity) : "#243141" + opacity,
        }}
        onMouseEnter={() => {
          setHover(true);
        }}
        onMouseLeave={() => {
          setHover(false);
        }}
      >
        <div className="m-auto flex w-fit content-center justify-center gap-2">
          {props.icon && <FontAwesomeIcon icon={props.icon} className="m-auto" style={{ color: textColor }} />}
          {props.children}
        </div>
      </button>
      {hover && <OlTooltip buttonRef={buttonRef} content={props.tooltip} />}
    </>
  );
}

export function OlRoundStateButton(props: { className?: string; checked: boolean; icon: IconProp; tooltip: string; onClick: () => void }) {
  const [hover, setHover] = useState(false);
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
        onClick={() => {
          props.onClick();
          setHover(false);
        }}
        data-checked={props.checked}
        type="button"
        className={className}
        onMouseEnter={() => {
          setHover(true);
        }}
        onMouseLeave={() => {
          setHover(false);
        }}
      >
        <FontAwesomeIcon className="pt-[3px]" icon={props.icon} />
      </button>
      {hover && <OlTooltip buttonRef={buttonRef} content={props.tooltip} />}
    </>
  );
}

export function OlLockStateButton(props: { className?: string; checked: boolean; tooltip: string; onClick: () => void }) {
  const [hover, setHover] = useState(false);
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
          setHover(true);
        }}
        onMouseLeave={() => {
          setHover(false);
        }}
      >
        <FontAwesomeIcon className="pt-[3px]" icon={props.checked == true ? faUnlockAlt : faLock} />
      </button>
      {hover && <OlTooltip buttonRef={buttonRef} content={props.tooltip} />}
    </>
  );
}
