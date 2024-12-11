import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

export function OlButtonGroup(props: { children?: JSX.Element | JSX.Element[] }) {
  return <div className="inline-flex rounded-md shadow-sm">{props.children}</div>;
}

export function OlButtonGroupItem(props: { icon: IconProp; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={props.onClick}
      type="button"
      data-active={props.active}
      className={`
        h-11 w-11 border border-gray-200 bg-white py-2 text-sm font-medium
        text-gray-900
        dark:border-gray-600 dark:bg-gray-700 dark:text-white
        dark:hover:bg-gray-500 dark:hover:text-white dark:focus:text-white
        dark:focus:ring-blue-500 dark:data-[active='true']:border-none
        dark:data-[active='true']:bg-blue-500
        first-of-type:rounded-s-md
        focus:z-10 focus:text-blue-700 focus:ring-2 focus:ring-blue-700
        hover:bg-gray-100 hover:text-blue-700
        last-of-type:rounded-e-md
      `}
    >
      <FontAwesomeIcon icon={props.icon} />
    </button>
  );
}
