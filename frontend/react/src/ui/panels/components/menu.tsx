import { faArrowLeft, faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

export function Menu(props: {
  title: string;
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
  children?: JSX.Element | JSX.Element[];
}) {
  return (
    <div
      data-open={props.open}
      className={`
        absolute left-16 right-0 top-[58px] bg-gray-200 backdrop-grayscale
        z-ui-3 h-screen overflow-y-auto backdrop-blur-lg transition-transform
        dark:bg-olympus-800/90
        data-[open='false']:-translate-x-full
        sm:w-[400px]
      `}
      tabIndex={-1}
    >
      <h5
        className={`
          inline-flex w-full items-center px-5 py-3 pb-2 font-semibold
          text-gray-800 shadow-lg
          dark:text-gray-400
        `}
      >
        {props.showBackButton && (
          <FontAwesomeIcon
            onClick={props.onBack ?? (() => {})}
            icon={faArrowLeft}
            className={`
              mr-1 cursor-pointer rounded-md p-2
              dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-white
            `}
          />
        )}{" "}
        {props.title}
        <FontAwesomeIcon
          onClick={props.onClose}
          icon={faClose}
          className={`
            ml-auto flex cursor-pointer items-center justify-center rounded-md
            p-2 text-lg
            dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-white
            hover:bg-gray-200
          `}
        />
      </h5>
      {props.children}
    </div>
  );
}
