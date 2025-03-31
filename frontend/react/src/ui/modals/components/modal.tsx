import React, { useEffect, useState } from "react";
import { ModalEvent } from "../../../events";
import { FaXmark } from "react-icons/fa6";
import { getApp } from "../../../olympusapp";
import { OlympusState } from "../../../constants/constants";

export function Modal(props: {
  open: boolean;
  children?: JSX.Element | JSX.Element[];
  className?: string;
  size?: "sm" | "md" | "lg" | "full";
  disableClose?: boolean;
}) {
  const [splash, setSplash] = useState(Math.ceil(Math.random() * 7));

  useEffect(() => {
    ModalEvent.dispatch(props.open);
  }, [props.open]);

  return (
    <>
      {props.open && (
        <>
          <div
            className={`fixed left-0 top-0 z-30 h-full w-full bg-[#111111]/95`}
          ></div>
          <div
            className={`
              fixed left-[50%] top-[50%] z-40 inline-flex translate-x-[-50%]
              translate-y-[-50%] rounded-xl border-[1px] border-solid
              border-gray-700 bg-olympus-800 drop-shadow-md
              max-md:rounded-none max-md:border-none
              ${
                props.size === "lg"
                  ? `
                    h-[700px] w-[1100px]
                    max-xl:h-full max-xl:w-full
                  `
                  : ""
              }
              ${
                props.size === "md"
                  ? `
                    h-[600px] w-[950px]
                    max-lg:h-full max-lg:w-full
                  `
                  : ""
              }
              ${
                props.size === "sm"
                  ? `
                    h-[500px] w-[800px]
                    max-md:h-full max-md:w-full
                  `
                  : ""
              }
              ${props.size === "full" ? "h-full w-full" : ""}
            `}
          >
            <img
              src={`images/splash/${splash}.jpg`}
              className={`contents-center w-full object-cover opacity-[4%]`}
            ></img>
            <div className="fixed left-0 top-0 h-full w-full">
              <div
                className={`
                  absolute h-full w-full bg-gradient-to-r from-blue-200/25
                  to-transparent
                `}
              ></div>
              <div
                className={`
                  absolute h-full w-full bg-gradient-to-t from-olympus-800
                  to-transparent
                `}
              ></div>
              <div
                className={`
                  absolute flex h-full max-h-full w-full flex-col gap-8
                  overflow-y-auto scroll-smooth p-16
                  max-lg:p-8
                `} 
              >
                {props.children}
                {!props.disableClose && (
                  <div
                    className={`
                      absolute right-5 top-5 cursor-pointer text-xl text-white
                    `}
                  >
                    <FaXmark
                      onClick={() => {
                        getApp().setState(OlympusState.IDLE);
                      }}
                    />{" "}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
