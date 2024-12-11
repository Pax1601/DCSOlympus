import React, { useEffect } from "react";
import { ModalEvent } from "../../../events";

export function Modal(props: { open: boolean; children?: JSX.Element | JSX.Element[]; className?: string }) {
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
              ${props.className}
              fixed left-[50%] top-[50%] z-40 translate-x-[-50%]
              translate-y-[-50%] rounded-xl border-[1px] border-solid
              border-gray-700 drop-shadow-md
            `}
          >
            {props.children}
          </div>
        </>
      )}
    </>
  );
}
