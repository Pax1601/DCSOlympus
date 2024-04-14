import React from "react";
import { UnitBlueprint } from "../../interfaces";
import { Coalition } from "../../types/types";

export function OlUnitSummary(props: {
    blueprint: UnitBlueprint,
    coalition: Coalition
}) {
    return <div data-coalition={props.coalition} className="relative border-l-4 flex flex-col gap-2 p-2 pt-4 pb-4 items-start shadow-lg bg-white dark:bg-olympus-600 data-[coalition='blue']:border-blue-600 data-[coalition='neutral']:border-gray-400 data-[coalition='red']:border-red-500">
            <div className="flex flex-row gap-2 content-center">
            <img className="object-cover h-7 ml-2 rounded-tl-md rotate-180 invert" src={"images/units/"+props.blueprint.filename} alt="" />  
            <div className="my-auto w-full font-semibold tracking-tight text-gray-900 dark:text-white">{props.blueprint.label}</div>
            </div>
            <div className="flex flex-col justify-between px-2 leading-normal h-fit">
                <p className="text-sm text-gray-700 dark:text-gray-400 mb-1">{props.blueprint.description}</p>
            </div>
            <div className="flex flex-row gap-1 px-2">
                {props.blueprint.abilities?.split(" ").map((tag) => {
                    return <div key={tag} className="font-bold bg-olympus-800 dark:text-olympus-50 rounded-full px-2 py-0.5 text-xs">
                        {tag}
                    </div>
                })}
            
            <div className="font-bold bg-olympus-800 dark:text-olympus-50 rounded-full px-2 py-0.5 text-xs">{props.blueprint.era === "WW2" ? "WW2" : props.blueprint.era.split(" ").map((word) => {
                return word.charAt(0).toLocaleUpperCase();
            })}</div>
            </div>
            
        </div>
}