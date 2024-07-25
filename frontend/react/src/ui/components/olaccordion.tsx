import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowCircleDown } from "@fortawesome/free-solid-svg-icons";

export function OlAccordion(props: {
  title: string;
  children?: JSX.Element | JSX.Element[];
  showArrows?: boolean;
}) {
  var [open, setOpen] = useState(false);
  var [scrolledUp, setScrolledUp] = useState(true);
  var [scrolledDown, setScrolledDown] = useState(false);

  var contentRef = useRef(null);

  useEffect(() => {
    contentRef.current &&
      (contentRef.current as HTMLElement).children[0]?.addEventListener(
        "scroll",
        (e: any) => {
          if (e.target.clientHeight < e.target.scrollHeight) {
            setScrolledDown(
              e.target.scrollTop ===
                e.target.scrollHeight - e.target.offsetHeight
            );
            setScrolledUp(e.target.scrollTop === 0);
          }
        }
      );
  });

  return (
    <div
      className={`
        bg-white text-gray-900
        dark:bg-transparent dark:text-white
      `}
    >
      <h3>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`
            flex w-full items-center justify-between gap-3 border-gray-200 py-2
            text-gray-700
            dark:border-gray-700 dark:text-white
            hover:dark:underline hover:dark:underline-offset-4
            hover:dark:underline-gray-700
            rtl:text-right
          `}
        >
          <span className="font-normal">{props.title}</span>
          <svg
            data-open={open}
            className={`
              h-3 w-3 shrink-0 -rotate-180 transition-transform
              dark:text-olympus-50
              data-[open='false']:-rotate-90
            `}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 10 6"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5 5 1 1 5"
            />
          </svg>
        </button>
      </h3>
      <div className={open ? "" : "hidden"}>
        {props.showArrows && (
          <div className="rotate-180">
            {" "}
            {!scrolledUp && (
              <FontAwesomeIcon
                icon={faArrowCircleDown}
                className={`
                  absolute w-full animate-bounce text-white opacity-20
                `}
              />
            )}
          </div>
        )}
        <div
          ref={contentRef}
          className={`
            border-gray-200 py-2
            dark:border-gray-700
          `}
        >
          {props.children}
        </div>
        {props.showArrows && (
          <div>
            {!scrolledDown && (
              <FontAwesomeIcon
                icon={faArrowCircleDown}
                className={`
                  absolute w-full animate-bounce text-white opacity-20
                `}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
