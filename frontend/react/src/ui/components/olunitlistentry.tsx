import React  from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { UnitBlueprint } from "../../interfaces";
import { faArrowRightLong, faCaretRight, faCircleArrowRight, faLongArrowAltRight } from "@fortawesome/free-solid-svg-icons";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons/faArrowRight";

export function OlUnitEntryList(props: {
    icon: IconProp,
    blueprint: UnitBlueprint,
    onClick: () => void
}) {
    return <div onClick={props.onClick} className="group relative text-sm cursor-pointer select-none flex justify-between items-center dark:text-gray-300 dark:hover:bg-white dark:hover:bg-olympus-500 px-2 py-2 rounded-sm mr-2">
        <FontAwesomeIcon icon={props.icon} className="text-sm"></FontAwesomeIcon>
        <div className="font-normal text-left flex-1 px-2">{props.blueprint.label}</div>
        <div className="font-bold bg-olympus-800 dark:text-olympus-50 rounded-full px-2 py-0.5 text-xs">{props.blueprint.era === "WW2" ? "WW2" : props.blueprint.era.split(" ").map((word) => {
            return word.charAt(0).toLocaleUpperCase();
        })}</div>
        <FontAwesomeIcon icon={faArrowRight} className="px-1 dark:text-olympus-50 group-hover:translate-x-1 transition-transform"></FontAwesomeIcon>
    </div>
}
