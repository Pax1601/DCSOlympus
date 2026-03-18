import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons/faArrowRight";

export function OlStaticListEntry(props: {
  objectName: string;
  slingload: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={props.onClick}
      className={`
        group relative mr-2 flex cursor-pointer select-none items-center
        justify-between rounded-sm px-2 py-2 text-sm
        dark:text-gray-300 dark:hover:bg-olympus-500
      `}
    >
      <div className="flex-1 px-2 text-left font-normal">{props.objectName}</div>
      {props.slingload && (
        <div
          className={`
            rounded-full bg-olympus-800 px-2 py-0.5 text-xs font-bold
            dark:text-olympus-50
          `}
        >
          Sling loadable
        </div>
      )}
      <FontAwesomeIcon
        icon={faArrowRight}
        className={`
          px-1 transition-transform
          dark:text-olympus-50
          group-hover:translate-x-1
        `}
      ></FontAwesomeIcon>
    </div>
  );
}
