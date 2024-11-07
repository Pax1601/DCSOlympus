import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { UnitBlueprint } from "../../interfaces";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons/faArrowRight";

export function OlUnitListEntry(props: { icon: IconProp; blueprint: UnitBlueprint; onClick: () => void }) {
  const pillString = !["aircraft", "helicopter"].includes(props.blueprint.category) ? props.blueprint.type : props.blueprint.abilities;
  return (
    <div
      onClick={props.onClick}
      className={`
        group relative mr-2 flex cursor-pointer select-none items-center
        justify-between rounded-sm px-2 py-2 text-sm
        dark:text-gray-300 dark:hover:bg-olympus-500
      `}
    >
      <FontAwesomeIcon icon={props.icon} className="text-sm"></FontAwesomeIcon>
      <div className="flex-1 px-2 text-left font-normal">{props.blueprint.label}</div>
      {pillString && (
        <div
          className={`
            rounded-full bg-olympus-800 px-2 py-0.5 text-xs font-bold
            dark:text-olympus-50
          `}
        >
          {!["aircraft", "helicopter"].includes(props.blueprint.category) ? props.blueprint.type : props.blueprint.abilities}
        </div>
      )}
      <FontAwesomeIcon
        icon={faArrowRight}
        className={`
          px-1 transition-transform
          dark:text-olympus-50
          group-hover:translate-x-1
        `}
      ></FontAwesomeIcon>
    </div>
  );
}
