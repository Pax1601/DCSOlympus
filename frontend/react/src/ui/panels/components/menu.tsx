import { faArrowLeft, faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

export function Menu(props: {
  title: string;
  open: boolean;
  onClose: () => void;
  canBeHidden?: boolean;
  onBack?: () => void;
  showBackButton?: boolean;
  children?: JSX.Element | JSX.Element[];
}) {
  const [hide, setHide] = useState(true);

  if (!props.open && hide) setHide(false);

  return (
    <div
      data-open={props.open}
      className={`
        absolute left-16 right-0 top-[58px] bg-transparent z-ui-3
        pointer-events-none h-[calc(100vh-58px)] transition-transform
        data-[open='false']:-translate-x-full
        sm:w-[400px]
      `}
      tabIndex={-1}
    >
      <div
        data-hide={hide}
        className={`
          pointer-events-auto h-[calc(100vh-58px-2rem)] overflow-y-auto
          overflow-x-hidden no-scrollbar backdrop-blur-lg backdrop-grayscale
          transition-transform
          dark:bg-olympus-800/90
          data-[hide='true']:translate-y-[calc(100vh-58px)]
        `}
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
      {props.canBeHidden == true && (
        <div className={`
          flex h-8 justify-center z-ui-4 pointer-events-auto backdrop-blur-lg
          backdrop-grayscale
          dark:bg-olympus-800/90
        `} onClick={() => setHide(!hide)}>
          {hide ? (
            <FaChevronUp className="mx-auto my-auto text-gray-400" />
          ) : (
            <FaChevronDown className="mx-auto my-auto text-gray-400" />
          )}
        </div>
      )}
    </div>
  );
}
