import React from "react";

export function OlToggle(props: { toggled: boolean | undefined; onClick: () => void }) {
  return (
    <div className="inline-flex cursor-pointer items-center" onClick={props.onClick}>
      <button className="peer sr-only" />
      <div
        data-toggled={props.toggled === true? 'true': props.toggled === undefined? 'undefined': 'false'}
        className={`
          peer relative h-7 w-14 rounded-full bg-gray-200
          after:absolute after:start-[4px] after:top-0.5 after:h-6 after:w-6
          after:rounded-full after:border after:border-gray-300 after:bg-white
          after:transition-all after:content-['']
          dark:border-gray-600 dark:peer-focus:ring-blue-800
          dark:data-[toggled='true']:bg-blue-500
          data-[toggled='false']:bg-gray-500
          data-[toggled='true']:after:translate-x-full
          data-[toggled='true']:after:border-white
          data-[toggled='undefined']:bg-gray-800
          data-[toggled='undefined']:after:translate-x-[50%]
          peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300
          rtl:data-[toggled='true']:after:-translate-x-full
        `}
      ></div>
    </div>
  );
}
