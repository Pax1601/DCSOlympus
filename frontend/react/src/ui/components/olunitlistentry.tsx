import React  from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { UnitBlueprint } from "../../interfaces";

export function OlUnitEntryList(props: {
    icon: IconProp,
    blueprint: UnitBlueprint,
    onClick: () => void
}) {
    return <div onClick={props.onClick} className="relative text-sm cursor-pointer select-none flex justify-between items-center dark:text-gray-300 dark:hover:bg-white dark:hover:bg-opacity-10 px-2 py-1 rounded-md mr-2">
        <FontAwesomeIcon icon={props.icon} className="text-sm"></FontAwesomeIcon>
        <div className="font-normal text-left flex-1 px-2">{props.blueprint.label}</div>
        <div className="font-bold bg-olympus-800 dark:text-olympus-50 rounded-full px-2 py-0.5 text-xs">{props.blueprint.era === "WW2" ? "WW2" : props.blueprint.era.split(" ").map((word) => {
            return word.charAt(0).toLocaleUpperCase();
        })}</div>
    </div>
}
