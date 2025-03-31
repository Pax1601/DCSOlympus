import { faArrowLeft, faCircleQuestion, faClose, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import { FaChevronRight } from "react-icons/fa6";

export function Menu(props: {
  title: string;
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
  children?: JSX.Element | JSX.Element[];
  autohide?: boolean;
  wiki?: () => JSX.Element | JSX.Element[];
  wikiDisabled?: boolean;
}) {
  const [hide, setHide] = useState(true);
  const [wiki, setWiki] = useState(false);

  useEffect(() => {
    if (props.autohide) {
      if (window.innerWidth > 640) setHide(false);
      if (!props.open) setHide(true);
    } else {
      setHide(false);
    }
  }, [props.open]);

  return (
    <div
      data-open={props.open}
      data-wiki={wiki}
      className={`
        pointer-events-none absolute left-16 right-0 top-[58px] z-10 flex
        h-[calc(100vh-58px)] transition-all ol-panel-container
        data-[open='false']:-translate-x-full
        data-[wiki='true']:w-[calc(100%-58px)] data-[wiki='true']:lg:w-[800px]
        sm:w-[400px]
      `}
      tabIndex={-1}
    >
      {props.open && (
        <div className="absolute flex h-full w-[30px]">
          <div
            className={`
              pointer-events-auto my-auto flex h-[80px] w-full cursor-pointer
              justify-center rounded-r-lg bg-olympus-800/90 backdrop-blur-lg
              backdrop-grayscale
              hover:bg-olympus-400/90
            `}
            onClick={() => setHide(!hide)}
          >
            <FaChevronRight className={`my-auto text-gray-400`} />
          </div>
        </div>
      )}
      <div
        data-hide={hide}
        className={`
          pointer-events-auto h-[calc(100vh-58px)] w-full backdrop-blur-lg
          backdrop-grayscale transition-transform
          dark:bg-olympus-800/90
          data-[hide='true']:-translate-x-full
        `}
      >
        <h5
          className={`
            inline-flex h-12 w-full items-center px-5 py-3 pb-2 font-semibold
            text-gray-800 shadow-lg
            dark:text-gray-400
          `}
        >
          {props.showBackButton && (
            <FontAwesomeIcon
              onClick={props.onBack ?? (() => {})}
              icon={faArrowLeft}
              className={`
                mr-1 h-4 cursor-pointer rounded-md p-2
                dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-white
              `}
            />
          )}
          {props.title}
          {!(props.wikiDisabled === true) && (
            <FontAwesomeIcon
              onClick={() => setWiki(!wiki)}
              icon={faCircleQuestion}
              className={`
                ml-auto flex cursor-pointer items-center justify-center
                rounded-md p-2 text-lg
                dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-white
                hover:bg-gray-200
              `}
            />
          )}
          <FontAwesomeIcon
            onClick={() => setHide(true)}
            icon={faEyeSlash}
            className={`
              flex cursor-pointer items-center justify-center rounded-md p-2
              text-lg
              dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-white
              hover:bg-gray-200
              ${props.wikiDisabled ? "ml-auto" : ""}
            `}
          />
          <FontAwesomeIcon
            onClick={props.onClose}
            icon={faClose}
            className={`
              flex cursor-pointer items-center justify-center rounded-md p-2
              text-lg
              dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-white
              hover:bg-gray-200
            `}
          />
        </h5>
        <div
          className={`
            flex h-[calc(100%-3rem)] w-full flex-col
            sm:flex-row
          `}
        >
          <div
            data-wiki={wiki}
            className={`
              h-0 w-0 overflow-hidden transition-all
              data-[wiki='true']:min-h-[50%] data-[wiki='true']:min-w-full
              sm:data-[wiki='true']:min-h-full sm:data-[wiki='true']:min-w-[50%]
            `}
          >
            {props.wiki ? props.wiki() : <div className={`p-4 text-gray-200`}>Work in progress</div>}
          </div>
          <div
            data-wiki={wiki}
            className={`
              relative overflow-y-auto overflow-x-hidden no-scrollbar
              sm:w-[400px]
            `}
          >
            {props.children}
          </div>
        </div>
      </div>
    </div>
  );
}
