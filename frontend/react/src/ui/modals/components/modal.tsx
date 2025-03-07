import React, { useEffect, useState } from "react";
import { ModalEvent } from "../../../events";
import { FaXmark } from "react-icons/fa6";
import { getApp, OlympusApp } from "../../../olympusapp";
import { OlympusState } from "../../../constants/constants";

export function Modal(props: { open: boolean; children?: JSX.Element | JSX.Element[]; className?: string }) {
  const [splash, setSplash] = useState(Math.ceil(Math.random() * 7));

  useEffect(() => {
    ModalEvent.dispatch(props.open);
  }, [props.open]);

  return (
    <>
      {props.open && (
        <>
          <div className={`fixed left-0 top-0 z-30 h-full w-full bg-[#111111]/95`}></div>
          <div
            className={`
              fixed left-[50%] top-[50%] z-40 inline-flex h-[75%] max-h-[600px]
              w-[80%] max-w-[1100px] translate-x-[-50%] translate-y-[-50%]
              overflow-y-auto scroll-smooth rounded-xl border-[1px] border-solid
              border-gray-700 bg-white drop-shadow-md
              dark:bg-olympus-800
              max-md:h-full max-md:max-h-full max-md:w-full max-md:rounded-none
              max-md:border-none
            `}
          >
            <img
              src={`images/splash/${splash}.jpg`}
              className={`contents-center w-full object-cover opacity-[7%]`}
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
                  absolute flex h-full w-full flex-col gap-8 p-16
                  max-lg:p-8
                `}
              >
                {props.children}
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
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
