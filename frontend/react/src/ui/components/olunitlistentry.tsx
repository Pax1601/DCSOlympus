import React  from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export function OlUnitEntryList(props) {
    return <div {...props} className="relative text-sm cursor-pointer select-none flex justify-between items-center dark:text-gray-300 dark:hover:bg-white dark:hover:bg-opacity-10 px-2 py-1 rounded-sm mr-2">
        <FontAwesomeIcon icon={props.icon} className="text-sm"></FontAwesomeIcon>
        <div className="font-normal text-left flex-1 px-2">{props.blueprint.label}</div>
        <div className="bg-black bg-opacity-20 dark:text-gray-400 rounded-full px-2 py-0.5 text-xs">{props.blueprint.era === "WW2" ? "WW2" : props.blueprint.era.split(" ").map((word) => {
            return word.charAt(0).toLocaleUpperCase();
        })}</div>
    </div>
}
