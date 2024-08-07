import React, { ChangeEvent } from "react";

export function OlStringInput(props: { value: string; className?: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div
      className={`
        ${props.className ?? ""}
        min-w-32
      `}
    >
      <div className="relative flex max-w-[8rem] items-center">
        <input
          type="text"
          onChange={props.onChange}
          className={`
            block h-10 w-full rounded-md border-[2px] bg-gray-50 py-2.5
            text-center text-sm text-gray-900
            dark:border-gray-700 dark:bg-olympus-600 dark:text-white
            dark:placeholder-gray-400 dark:focus:border-blue-700
            dark:focus:ring-blue-700
            focus:border-blue-700 focus:ring-blue-500
          `}
          value={props.value}
        />
      </div>
    </div>
  );
}
