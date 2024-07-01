import React from "react";
import { Coalition } from "../../types/types";

export function OlCoalitionToggle(props: {
  coalition: Coalition | undefined;
  onClick: () => void;
}) {
  return (
    <div
      className="inline-flex cursor-pointer items-center"
      onClick={props.onClick}
    >
      <button className="peer sr-only" />
      <div
        data-flash={props.coalition === undefined}
        data-coalition={props.coalition ?? "blue"}
        className={`
          peer relative h-7 w-14 rounded-full bg-gray-200
          after:absolute after:start-[4px] after:top-0.5 after:h-6 after:w-6
          after:rounded-full after:border after:border-gray-300 after:bg-white
          after:transition-all after:content-['']
          dark:border-gray-600 dark:peer-focus:ring-blue-800
          data-[coalition='blue']:bg-blue-600
          data-[coalition='neutral']:bg-gray-400
          data-[coalition='neutral']:after:translate-x-[50%]
          data-[coalition='neutral']:after:border-white
          data-[coalition='red']:bg-red-500
          data-[coalition='red']:after:translate-x-full
          data-[coalition='red']:after:border-white
          peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300
          rtl:data-[coalition='neutral']:after:-translate-x-[50%]
          rtl:data-[coalition='red']:after:-translate-x-full
        `}
      ></div>
      <span
        className={`
          ms-3 text-gray-900
          dark:text-white
          data-[flash='true']:after:animate-pulse
        `}
      >
        {props.coalition
          ? `Coalition (${props.coalition[0].toLocaleUpperCase() + props.coalition.substring(1)})`
          : "Different values"}
      </span>
    </div>
  );
}
