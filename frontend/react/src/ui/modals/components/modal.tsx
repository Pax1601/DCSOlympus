import React from "react";

export function Modal(props: {
  grayout?: boolean;
  children?: JSX.Element | JSX.Element[];
  className?: string;
}) {
  return (
    <div
      className={`
        ${props.className}
        fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] z-ui-4
        rounded-xl border-[1px] border-solid border-gray-700 drop-shadow-md
      `}
    >
      {props.children}
    </div>
  );
}
