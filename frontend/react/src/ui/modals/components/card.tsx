import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

export function Card(props: { children?: JSX.Element | JSX.Element[]; className?: string }) {
  return (
    <div
      className={`
        ${props.className}
        group flex max-h-80 w-full max-w-64 cursor-pointer flex-col
        content-start gap-3 text-pretty rounded-md border-[1px] border-black/10
        p-4 text-black drop-shadow-md
        dark:bg-olympus-400 dark:text-white dark:hover:bg-olympus-300
        max-lg:max-w-[320px]
      `}
    >
      {props.children}
      <div
        className={`
          flex flex-grow items-end justify-end pr-2 text-black
          dark:text-gray-500
        `}
      >
        <FontAwesomeIcon
          className={`
            transition-transform
            group-hover:translate-x-2
          `}
          icon={faArrowRight}
        />
      </div>
    </div>
  );
}
