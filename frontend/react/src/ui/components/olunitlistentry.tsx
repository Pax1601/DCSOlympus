import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { UnitBlueprint } from "../../interfaces";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons/faArrowRight";
import { mode } from "../../other/utils";

export function OlUnitListEntry(props: {
  icon?: IconProp;
  silhouette?: string;
  blueprint: UnitBlueprint;
  showCost: boolean;
  cost: number;
  onClick: () => void;
}) {
  let pillString = "" as string | undefined;
  if (props.showCost) pillString = `${props.cost} points`;
  else {
    if (["aircraft", "helicopter"].includes(props.blueprint.category)) {
      let roles = props.blueprint.loadouts?.flatMap((loadout) => loadout.roles).filter((role) => role !== "No task");
      if (roles !== undefined) {
        let uniqueRoles = roles?.reduce((acc, current) => {if (!acc.includes(current)) {acc.push(current)} return acc}, [] as string[])
        let mainRole = mode(roles);
        pillString = uniqueRoles.length > 6 ? "Multirole" : mainRole;
      }
    } else {
      if (props.blueprint.category)
      pillString = props.blueprint.type;
    }
  }
  return (
    <div
      onClick={props.onClick}
      className={`
        group relative mr-2 flex cursor-pointer select-none items-center
        justify-between rounded-sm px-2 py-2 text-sm
        dark:text-gray-300 dark:hover:bg-olympus-500
      `}
    >
      {props.icon && <FontAwesomeIcon icon={props.icon} className="text-sm"></FontAwesomeIcon>}
      {props.silhouette && (
        <div className={`
          mr-2 flex h-6 w-6 rotate-90 content-center justify-center opacity-50
          invert
        `}>
        <img
          src={`public./images/units/${props.silhouette}`}
          className="my-auto max-h-full max-w-full"
        />
        </div>
      )}
      <div className="flex-1 px-2 text-left font-normal">{props.blueprint.label}</div>
      {pillString && (
        <div
          className={`
            rounded-full bg-olympus-800 px-2 py-0.5 text-xs font-bold
            dark:text-olympus-50
          `}
        >
          {pillString}
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
