import React, { useState, useEffect, useRef, MutableRefObject } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { OlTooltip } from "./oltooltip";

export function OlDropdown(props: {
  disableAutoClose?: boolean;
  className?: string;
  leftIcon?: IconProp;
  rightIcon?: IconProp;
  label?: string;
  children?: JSX.Element | JSX.Element[];
  buttonRef?: MutableRefObject<null> | null;
  open?: boolean;
  tooltip?: string | (() => JSX.Element | JSX.Element[]);
  tooltipPosition?: string;
  tooltipRelativeToParent?: boolean;
}) {
  const [open, setOpen] = props.open !== undefined ? [props.open, () => {}] : useState(false);
  const [hover, setHover] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState(null as number | null);
  var contentRef = useRef(null);
  var buttonRef = props.buttonRef !== undefined ? props.buttonRef : useRef(null);

  useEffect(() => {
    window.addEventListener("click", (e) => {
      setHover(false);
    });
  }, []);

  function setPosition(content: HTMLDivElement, button: HTMLButtonElement) {
    /* Reset the position of the content */
    content.style.left = "0px";
    content.style.top = "0px";
    content.style.height = "";

    /* Get the position and size of the button and the content elements */
    let [cxl, cyt, cxr, cyb, cw, ch] = [
      content.getBoundingClientRect().x,
      content.getBoundingClientRect().y,
      content.getBoundingClientRect().x + content.clientWidth,
      content.getBoundingClientRect().y + content.clientHeight,
      content.clientWidth,
      content.clientHeight,
    ];
    let [bxl, byt, bxr, byb, bbw, bh] = [
      button.getBoundingClientRect().x,
      button.getBoundingClientRect().y,
      button.getBoundingClientRect().x + button.clientWidth,
      button.getBoundingClientRect().y + button.clientHeight,
      button.clientWidth,
      button.clientHeight,
    ];

    /* Limit the maximum height */
    if (ch > 400) {
      ch = 400;
      content.style.height = `${ch}px`;
    }

    /* Compute the horizontal position of the center of the button and the content */
    var cxc = (cxl + cxr) / 2;
    var bxc = (bxl + bxr) / 2;

    /* Compute the x and y offsets needed to align the button and element horizontally, and to put the content below the button */
    var offsetX = bxc - cxc;
    var offsetY = byb - cyt + 8;

    /* Compute the new position of the left and right margins of the content */
    cxl += offsetX;
    cxr += offsetX;
    cyb += offsetY;

    /* Try and move the content so it is inside the screen */
    if (cxl < 0) offsetX -= cxl;
    if (cxr > window.innerWidth) offsetX -= cxr - window.innerWidth;
    if (cyb > window.innerHeight) offsetY -= bh + ch + 16;

    /* Apply the offset */
    content.style.left = `${offsetX}px`;
    content.style.top = `${offsetY}px`;
    content.style.width = `${bbw}px`;
  }

  useEffect(() => {
    if (contentRef.current && buttonRef?.current) {
      const content = contentRef.current as HTMLDivElement;
      const button = buttonRef.current as HTMLButtonElement;

      setPosition(content, button);

      /* Register click events to automatically close the dropdown when clicked anywhere outside of it */
      document.addEventListener("click", function (event) {
        const target = event.target;
        if (target && !content.contains(target as HTMLElement) && !button.contains(target as HTMLElement)) {
          setOpen(false);
        }
      });
    }
  });

  return (
    <>
      <div className={props.className ?? ""}>
        {props.buttonRef === undefined && (
          <button
            ref={buttonRef}
            onClick={() => {
              setOpen(!open);
            }}
            className={`
              inline-flex w-full items-center justify-between rounded-lg border
              bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white
              dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100
              dark:hover:bg-gray-600
              hover:bg-blue-800
            `}
            type="button"
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
            {props.leftIcon && <FontAwesomeIcon icon={props.leftIcon} className={`
              mr-3
            `} />}
            <span className="overflow-hidden text-ellipsis text-nowrap">{props.label ?? ""}</span>
            <svg
              className={`
                ml-auto ms-3 h-2.5 w-2.5 flex-none transition-transform
                data-[open='true']:-scale-y-100
              `}
              data-open={open}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 10 6"
            >
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
            </svg>
          </button>
        )}

        <div
          ref={contentRef}
          data-open={open}
          className={`
            absolute z-40 divide-y divide-gray-100 overflow-y-scroll
            no-scrollbar rounded-lg bg-white p-2 shadow
            dark:bg-gray-700
            data-[open='false']:hidden
          `}
        >
          <div
            className={`
              h-fit w-full text-sm text-gray-700
              dark:text-gray-200
            `}
            onClick={() => {
              props.disableAutoClose !== true && setOpen(false);
            }}
          >
            {props.children}
          </div>
        </div>
      </div>
      {hover && !open && buttonRef && props.tooltip && (
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

/* Conveniency Component for dropdown elements */
export function OlDropdownItem(props: { onClick?: () => void; className?: string; borderColor?: string; children?: string | JSX.Element | JSX.Element[] }) {
  return (
    <button
      onClick={props.onClick ?? (() => {})}
      className={`
        ${props.className ?? ""}
        flex w-full cursor-pointer select-none flex-row content-center
        rounded-md px-4 py-2
        dark:hover:bg-gray-600 dark:hover:text-white
        hover:bg-gray-100
      `}
      style={{
        border: props.borderColor ? `2px solid ${props.borderColor}` : "2px solid transparent",
      }}
    >
      {props.children}
    </button>
  );
}
